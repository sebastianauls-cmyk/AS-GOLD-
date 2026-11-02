import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'

// Use a disposable Postgres instance; never mutate production customer data.
const db=await PGlite.create()
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema private;
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.cases(id uuid primary key,owner_id uuid not null);
    create table public.documents(id uuid primary key,owner_id uuid not null,case_id uuid references cases(id));
    create table public.exports(
      id uuid primary key default gen_random_uuid(),
      owner_id uuid not null,
      case_id uuid references cases(id),
      document_id uuid references documents(id),
      export_type text not null,
      status text not null
    );
    alter table public.exports enable row level security;
    create policy exports_insert_own on public.exports for insert to authenticated
      with check(owner_id=auth.uid());
    create policy exports_select_own on public.exports for select to authenticated
      using(owner_id=auth.uid());
    create policy exports_update_own on public.exports for update to authenticated
      using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    grant usage on schema auth to authenticated;
    grant select,insert,update on public.exports to authenticated;
  `)
  const owner='11111111-1111-4111-8111-111111111111'
  const other='22222222-2222-4222-8222-222222222222'
  const ownCase='33333333-3333-4333-8333-333333333333'
  const foreignCase='44444444-4444-4444-8444-444444444444'
  const ownDoc='55555555-5555-4555-8555-555555555555'
  const foreignDoc='66666666-6666-4666-8666-666666666666'
  await db.query('insert into cases values($1,$2),($3,$4)',[ownCase,owner,foreignCase,other])
  await db.query('insert into documents values($1,$2,$3),($4,$5,$6)',[ownDoc,owner,ownCase,foreignDoc,other,foreignCase])

  const migration=await readFile(new URL('../supabase/migrations/20261102114500_v160_export_owner_integrity.sql',import.meta.url),'utf8')
  await db.exec(migration)
  const trigger=await db.query("select count(*)::int as n from pg_trigger where tgname='exports_validate_owned_relation_v160' and not tgisinternal")
  assert.equal(trigger.rows[0].n,1,'ownership trigger must exist')

  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.exec('set role authenticated')
  const saved=(await db.query("insert into exports(owner_id,case_id,document_id,export_type,status) values($1,$2,$3,'docx','ready') returning id",[owner,ownCase,ownDoc])).rows[0].id
  await assert.rejects(
    db.query("insert into exports(owner_id,case_id,export_type,status) values($1,$2,'pdf','ready')",[owner,foreignCase]),
    /Export case does not belong to row owner/
  )
  await assert.rejects(
    db.query("insert into exports(owner_id,document_id,export_type,status) values($1,$2,'pdf','ready')",[owner,foreignDoc]),
    /Export document does not belong to row owner/
  )
  await assert.rejects(
    db.query('update exports set case_id=$1 where id=$2',[foreignCase,saved]),
    /Export case does not belong to row owner/
  )
  await assert.rejects(
    db.query('update exports set document_id=$1 where id=$2',[foreignDoc,saved]),
    /Export document does not belong to row owner/
  )
  const standalone=(await db.query("insert into exports(owner_id,export_type,status) values($1,'pdf','ready') returning id",[owner])).rows[0].id
  assert.ok(standalone,'standalone exports remain possible')
  assert.equal((await db.query('select count(*)::int as n from exports')).rows[0].n,2,'rejected cross-owner operations leave no rows')
  await db.exec('reset role; set role anon')
  await assert.rejects(
    db.query("insert into exports(owner_id,export_type,status) values($1,'pdf','ready')",[owner]),
    /permission denied/
  )
  await db.exec('reset role')
  console.log('V160 exports: same-owner inserts/updates, standalone exports, cross-owner insert/update rejection, RLS and anonymous denial passed.')
} finally {
  await db.close()
}
