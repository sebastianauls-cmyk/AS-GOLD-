-- Public electronic withdrawal intake. All reads stay private; writes are only
-- accepted through the origin-checked Edge Function using the service role.

create table if not exists private.electronic_withdrawals (
  id uuid primary key default gen_random_uuid(),
  consumer_name text not null check (char_length(consumer_name) between 2 and 160),
  contract_reference text not null check (char_length(contract_reference) between 3 and 200),
  confirmation_channel text not null default 'download' check (confirmation_channel='download'),
  declaration text not null,
  request_fingerprint text not null,
  status text not null default 'received' check (status in ('received','reviewed','completed','rejected')),
  received_at timestamptz not null default now(),
  retention_until timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table private.electronic_withdrawals is
  'Evidence of electronic withdrawals submitted through gold-withdrawal. Not exposed through the Data API.';

create index if not exists electronic_withdrawals_received_at_idx on private.electronic_withdrawals(received_at desc);
create index if not exists electronic_withdrawals_rate_limit_idx on private.electronic_withdrawals(request_fingerprint,received_at desc);
alter table private.electronic_withdrawals enable row level security;
revoke all on private.electronic_withdrawals from anon,authenticated;
grant select,insert,update on private.electronic_withdrawals to service_role;

create or replace function public.gold_record_electronic_withdrawal(
  p_consumer_name text,
  p_contract_reference text,
  p_confirmation_channel text,
  p_declaration text,
  p_request_fingerprint text,
  p_retention_until timestamptz
)
returns table(id uuid,received_at timestamptz)
language plpgsql
security definer
set search_path=pg_catalog,public,private
as $$
begin
  if p_confirmation_channel <> 'download' then raise exception 'invalid confirmation channel'; end if;
  if char_length(trim(p_consumer_name)) not between 2 and 160 then raise exception 'invalid name'; end if;
  if char_length(trim(p_contract_reference)) not between 3 and 200 then raise exception 'invalid reference'; end if;
  if (select count(*) from private.electronic_withdrawals w where w.request_fingerprint=p_request_fingerprint and w.received_at>=now()-interval '1 hour') >= 5 then
    raise exception using errcode='P0001',message='rate limit exceeded';
  end if;
  return query
    insert into private.electronic_withdrawals(consumer_name,contract_reference,confirmation_channel,declaration,request_fingerprint,retention_until)
    values(trim(p_consumer_name),trim(p_contract_reference),p_confirmation_channel,p_declaration,p_request_fingerprint,p_retention_until)
    returning electronic_withdrawals.id,electronic_withdrawals.received_at;
end $$;

revoke all on function public.gold_record_electronic_withdrawal(text,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.gold_record_electronic_withdrawal(text,text,text,text,text,timestamptz) to service_role;
