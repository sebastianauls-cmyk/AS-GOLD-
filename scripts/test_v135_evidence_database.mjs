import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Run the real migration in disposable Postgres, never against customer data.
const db=await PGlite.create()
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    create table public.cases(id uuid primary key default gen_random_uuid(),owner_id uuid not null,traffic_light text,updated_at timestamptz default now());
    create table public.documents(id uuid primary key default gen_random_uuid(),owner_id uuid not null,case_id uuid references public.cases(id),title text,extracted_text text,updated_at timestamptz default now());
    create table public.assessments(id uuid primary key default gen_random_uuid(),owner_id uuid not null,case_id uuid references public.cases(id),title text,traffic_light text,reasoning text,next_step text,created_at timestamptz default now());
    alter table public.cases enable row level security;
    alter table public.documents enable row level security;
    alter table public.assessments enable row level security;
    create policy cases_owner on public.cases to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    create policy documents_owner on public.documents to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    create policy assessments_owner on public.assessments to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    grant select,insert,update,delete on all tables in schema public to authenticated;
  `)
  await db.exec(await readFile(new URL('../supabase/migrations/20260918111307_v135_assessment_document_evidence.sql',import.meta.url),'utf8'))
  const legacyMigration=await readFile(new URL('../supabase/migrations/20260905170000_v109_customer_workflow_corrections.sql',import.meta.url),'utf8')
  await db.exec(legacyMigration.slice(legacyMigration.indexOf('create or replace function public.create_gold_assessment('),legacyMigration.indexOf('comment on column public.cases.target_country')))
  const owner='11111111-1111-4111-8111-111111111111'
  const other='22222222-2222-4222-8222-222222222222'
  const caseId=(await db.query('insert into cases(owner_id) values($1) returning id',[owner])).rows[0].id
  const secondCase=(await db.query('insert into cases(owner_id) values($1) returning id',[owner])).rows[0].id
  const otherCase=(await db.query('insert into cases(owner_id) values($1) returning id',[other])).rows[0].id
  const docId=(await db.query("insert into documents(owner_id,case_id,title,extracted_text) values($1,$2,'Musterbrief','Bitte reichen Sie die Unterlagen ein.') returning id",[owner,caseId])).rows[0].id
  const otherDoc=(await db.query("insert into documents(owner_id,case_id,title,extracted_text) values($1,$2,'Fremdes Muster','Text') returning id",[other,otherCase])).rows[0].id
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.exec('set role authenticated')
  const create=async({case_id=caseId,source=docId,quote='reichen Sie die Unterlagen ein.',checked=true,previous=null}={})=>(await db.query('select public.create_gold_assessment_v135($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as result',[case_id,'Unterlagen','yellow','Testbegründung','Unterlagen prüfen',source,'Seite 1',quote,'inference',checked,previous])).rows[0].result
  const saved=await create()
  assert.equal(saved.assessment.source_title_snapshot,'Musterbrief')
  assert.ok(saved.assessment.source_reviewed_at)
  assert.equal(saved.case.traffic_light,'yellow')
  await assert.rejects(create({quote:'erfundene Passage'}),/exact quote/)
  await assert.rejects(create({case_id:secondCase}),/Source document not accessible/)
  await assert.rejects(create({source:otherDoc}),/Source document not accessible/)
  await assert.rejects(create({case_id:otherCase}),/Case not accessible/)
  await assert.rejects(create({source:null}),/Checked source document required/)
  const provisional=await create({checked:false,quote:'',previous:saved.assessment.id})
  assert.equal(provisional.assessment.source_reviewed_at,null)
  assert.equal(provisional.assessment.supersedes_assessment_id,saved.assessment.id)
  await assert.rejects(create({previous:saved.assessment.id}),/unique constraint/)
  assert.equal((await db.query('select count(*)::int as n from assessments')).rows[0].n,2,'failed saves are atomic and history stays intact')
  await db.query('delete from documents where id=$1',[docId])
  assert.equal((await db.query('select source_reviewed_at from assessments where id=$1',[saved.assessment.id])).rows[0].source_reviewed_at,null)
  const legacy=(await db.query("select public.create_gold_assessment($1,'V134 compatibility','yellow','Previous client','Continue') as result",[caseId])).rows[0].result
  assert.equal(legacy.assessment.statement_kind,'unknown','V134 clients keep working after the additive migration')
  assert.equal(legacy.assessment.source_reviewed_at,null)
  await db.exec('reset role; set role anon')
  await assert.rejects(create(),/permission denied/)
  console.log('V135 database: real migration, exact quotes, ownership/RLS, case isolation, atomic replacement, deletion and anonymous access passed.')
} finally { await db.close() }
