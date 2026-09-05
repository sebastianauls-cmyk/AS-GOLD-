-- V112: official Supabase anonymous sessions power a passwordless product demo.
-- Anonymous users still receive authenticated JWTs, so access remains owner-scoped
-- through the existing RLS policies. Their privileged test window is deliberately
-- short and capped to reduce abuse and cost exposure.

create or replace function private.handle_new_gold_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_guest boolean := coalesce(new.is_anonymous,false);
  v_guest_allowed boolean := true;
  v_guest_ends_at timestamptz := coalesce(new.created_at,now())+interval '2 hours';
  v_permissions jsonb;
begin
  if v_guest then
    perform pg_advisory_xact_lock(hashtext('as-workspace-gold-anonymous-test-cap'));
    select count(*)<=20 into v_guest_allowed
    from auth.users
    where is_anonymous is true and created_at>=now()-interval '24 hours';

    v_permissions := jsonb_build_object(
      'tier','business',
      'document_limit',2,
      'full_analysis',true,
      'draft_letters',true,
      'business_mode',true,
      'export_word',true,
      'export_pdf',true,
      'export_excel',true,
      'export_pptx',true,
      'export_csv',true,
      'export_txt',true,
      'payment_required',false,
      'test_phase',true,
      'test_access',v_guest_allowed,
      'guest_access',v_guest_allowed,
      'access_source','anonymous_test',
      'guest_access_ends_at',v_guest_ends_at,
      'auto_renew',false,
      'post_expiry_mode','ended'
    );
  else
    v_permissions := jsonb_build_object(
      'tier','free',
      'document_limit',3,
      'full_analysis',false,
      'draft_letters',false,
      'payment_required',false,
      'test_phase',true,
      'paid_term_days',30,
      'reminder_day_1',20,
      'reminder_day_2',28,
      'auto_renew',false,
      'post_expiry_mode','paused',
      'reactivation_months',3,
      'reactivation_by_payment',true
    );
  end if;

  insert into private.user_access (
    user_id,app_role,active,status,permissions,display_name,
    approved_at,approved_by,created_at,updated_at,last_changed_at
  ) values (
    new.id,
    'member',
    case when v_guest then v_guest_allowed else true end,
    case when v_guest and not v_guest_allowed then 'pending' else 'approved' end,
    v_permissions,
    case when v_guest then 'Synthetischer Testzugang' else nullif(coalesce(new.raw_user_meta_data->>'display_name',new.raw_user_meta_data->>'full_name'),'') end,
    case when v_guest and not v_guest_allowed then null else now() end,
    null,
    now(),
    now(),
    now()
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function private.gold_access_active()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from private.user_access ua
    where ua.user_id=auth.uid()
      and ua.active is true
      and ua.status='approved'
      and (
        (
          ua.permissions->>'access_source'='anonymous_test'
          and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) is true
          and nullif(ua.permissions->>'guest_access_ends_at','')::timestamptz>now()
        )
        or (
          ua.permissions->>'access_source' is distinct from 'anonymous_test'
          and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) is false
        )
      )
  );
$$;

create or replace function private.current_gold_access_impl()
returns table(app_role text,status text,active boolean,permissions jsonb,display_name text,organization_name text)
language sql
stable
security definer
set search_path=''
as $$
  select ua.app_role,ua.status,private.gold_access_active(),
    private.gold_effective_permissions(ua.user_id),
    ua.display_name,ua.organization_name
  from private.user_access ua
  where ua.user_id=auth.uid();
$$;

create or replace function private.gold_document_upload_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_access private.user_access%rowtype;
  v_permissions jsonb;
  v_limit integer;
begin
  if v_uid is null or not private.gold_access_active() then return false; end if;
  select * into v_access
  from private.user_access
  where user_id=v_uid and active=true and status='approved';
  if not found then return false; end if;
  if v_access.app_role='owner' then return true; end if;

  v_permissions := private.gold_effective_permissions(v_uid);
  v_limit := coalesce((v_permissions->>'document_limit')::integer,0);
  if v_limit<=0 then return true; end if;
  return (select count(*) from public.documents d where d.owner_id=v_uid)<v_limit;
end;
$$;
