import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
const db=await PGlite.create()
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create schema private;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function private.gold_access_active() returns boolean language sql stable as $$ select coalesce(nullif(current_setting('test.active',true),''),'true')::boolean $$;
    grant usage on schema auth,private to authenticated;
    create table public.cases(id uuid primary key,owner_id uuid references auth.users(id));
    grant select on public.cases to authenticated;
    alter table public.cases enable row level security;
    create policy own_cases on public.cases for select to authenticated using(owner_id=auth.uid());`)
  await db.exec(await readFile(new URL('../supabase/migrations/20260918123931_v136_customer_roadmaps.sql',import.meta.url),'utf8'))
  const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',caseId='33333333-3333-4333-8333-333333333333'
  await db.query('insert into auth.users values($1),($2)',[owner,other])
  await db.query('insert into cases values($1,$2)',[caseId,owner])
  await db.query("insert into case_roadmaps(owner_id,case_id,output_language,reference_language,style,result,source_fingerprint,source_documents,model,workflow_version) values($1,$2,'de','de','{}','{}',$3,'[]','test','v136')",[owner,caseId,'a'.repeat(64)])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.exec('set role authenticated')
  assert.equal((await db.query('select * from case_roadmaps')).rows.length,1)
  await assert.rejects(db.query("update case_roadmaps set progress='{}'"),/permission denied/)
  await assert.rejects(db.query("delete from case_roadmaps"),/permission denied/)
  await assert.rejects(db.query("insert into case_roadmaps default values"),/permission denied/)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other])
  assert.equal((await db.query('select * from case_roadmaps')).rows.length,0)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.exec("select set_config('test.active','false',false)")
  assert.equal((await db.query('select * from case_roadmaps')).rows.length,0,'expired access cannot read reports')
  await db.exec('reset role;set role anon')
  await assert.rejects(db.query('select * from case_roadmaps'),/permission denied/)
  await db.exec('reset role')
  await db.query('delete from cases where id=$1',[caseId])
  assert.equal((await db.query('select * from case_roadmaps')).rows.length,0,'case deletion removes linked reports')
  console.log('V136 database: owner-only reads, expired and anonymous access, immutable generated reports and cascade deletion passed.')
}finally{await db.close()}
