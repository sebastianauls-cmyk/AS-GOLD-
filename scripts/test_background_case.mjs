import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {roadmapFingerprint,roadmapSource,roadmapStyle} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'

// Real Postgres semantics, real migrations, real worker/state machine, validators
// and encrypted checkpoints. Only dispatch transport and model responses are fake.
const db=await PGlite.create(),owner=roadmapTestCase.owner_id,caseId=roadmapTestCase.id,other='77777777-7777-4777-8777-777777777777'
const secret='synthetic-background-job-secret-never-a-real-key'
let documents=structuredClone(roadmapTestDocuments),modelCalls=0,reviewIssues=[]
const oldFetch=globalThis.fetch
try {
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create schema private;create schema net;
    create table auth.users(id uuid primary key,is_anonymous boolean default false,banned_until timestamptz,deleted_at timestamptz);
    create table private.user_access(user_id uuid primary key,active boolean,status text,permissions jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function private.gold_access_active() returns boolean language sql stable security definer as $$select exists(select 1 from private.user_access where user_id=auth.uid() and active and status='approved')$$;
    create function private.gold_effective_permissions(id uuid) returns jsonb language sql stable security definer as $$select permissions from private.user_access where user_id=id$$;
    grant usage on schema auth,private to authenticated;
    create table public.cases(id uuid primary key,owner_id uuid references auth.users(id));
    grant select on public.cases to authenticated;
    alter table public.cases enable row level security;
    create policy own_cases on public.cases for select to authenticated using(owner_id=auth.uid());
    create table public.account_privacy_settings(owner_id uuid primary key,ai_processing_enabled boolean,privacy_notice_version text,privacy_notice_acknowledged_at timestamptz,terms_version text,terms_acknowledged_at timestamptz);
    create table private.test_dispatch(id serial primary key,body jsonb);
    create function net.http_post(url text,body jsonb,params jsonb default '{}',headers jsonb default '{}',timeout_milliseconds integer default 2000) returns bigint language plpgsql as $$declare v_id bigint;begin insert into private.test_dispatch(body) values(body) returning id into v_id;return v_id;end$$;`)
  await db.exec(await readFile('supabase/migrations/20260918123931_v136_customer_roadmaps.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260921222858_durable_case_analysis_jobs.sql','utf8'))
  await db.query('insert into auth.users(id) values($1),($2)',[owner,other])
  await db.query("insert into private.user_access values($1,true,'approved','{\"full_analysis\":true,\"draft_letters\":true}'),($2,true,'approved','{\"full_analysis\":true}')",[owner,other])
  await db.query('insert into public.cases values($1,$2)',[caseId,owner])
  await db.query("insert into public.account_privacy_settings values($1,true,'2026-08-30-v1',now(),'2026-08-30-test-v1',now())",[owner])
  await db.exec("insert into private.case_analysis_config values(true,'https://synthetic.supabase.co/functions/v1/gold-case-worker',true)")
  const input={style:roadmapStyle({customer_name:'Nora Muster'}),output_language:'de',reference_language:'de',draft_letters:true,acknowledged:true,privacy_notice_version:'2026-08-30-v1',terms_version:'2026-08-30-test-v1'}
  const fingerprint=()=>roadmapFingerprint(roadmapSource(roadmapTestCase,documents,[]))
  const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0]||{})[0]
  const enqueue=async(overrides={})=>scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[owner,caseId,await fingerprint(),{...input,...overrides}])
  const stored=async id=>(await db.query('select * from public.case_analysis_jobs where id=$1',[id])).rows[0]
  const dispatch=async id=>scalar("select body from private.test_dispatch where body->>'job_id'=$1 order by id desc limit 1",[id])
  const claim=async id=>{const body=await dispatch(id);return scalar('select public.claim_case_analysis_job($1,$2)',[id,body.token])}
  const cancel=async id=>scalar('select public.cancel_case_analysis_job($1,$2,$3)',[owner,caseId,id])
  const finish=async(job,outcome)=>scalar('select public.finish_case_analysis_job($1,$2,$3)',[job.id,job.lease,outcome])
  class Query {
    constructor(table){this.table=table;this.filters=[]}
    select(){return this} eq(key,value){this.filters.push(row=>row[key]===value);return this} order(){return this} limit(){return this}
    async execute(single=false){const values=this.table==='cases'?[roadmapTestCase]:this.table==='documents'?documents:[];const rows=values.filter(row=>this.filters.every(f=>f(row)));return {data:single?rows[0]||null:rows,error:null}}
    maybeSingle(){return this.execute(true)} then(resolve,reject){return this.execute().then(resolve,reject)}
  }
  const client={from:table=>new Query(table),rpc:async(name,args)=>{
    assert.equal(name,'finish_case_analysis_job')
    try{return {data:await scalar('select public.finish_case_analysis_job($1,$2,$3)',[args.p_job_id,args.p_lease,args.p_outcome]),error:null}}catch(error){return {data:null,error}}
  }}
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');modelCalls++
    const request=JSON.parse(options.body),name=request.text.format.name
    const analysis={topics:[{id:'source',title:'Auszahlung',status:'open',conclusion:'Die Anlage fehlt.',conditions:'Anlage beschaffen.',sources:[],step_ids:[]}],calculations:[],limitations:[]}
    const output=name==='ash_case_scope'?{issues:[{id:'source',title:'Auszahlung',reason:'Originale prüfen',calculation_needed:false}],research_topics:[]}
      :name==='ash_complete_numbers_v157'?analysis:name==='ash_complete_plan_v157'?{...roadmapTestResult,topic_steps:[{id:'source',step_ids:['anfragen']}]}:{issues:reviewIssues}
    return new Response(JSON.stringify({id:'synthetic-'+modelCalls,status:'completed',output_text:JSON.stringify(output)}))
  }
  const process=job=>processCaseAnalysisJob({client,job,secret,providerKey:'synthetic-only'})
  const drain=async id=>{for(let n=0;n<16;n++){const j=await stored(id);if(!['queued','running'].includes(j.status))return j;const claimed=await claim(id);assert(claimed,'each queued checkpoint has a fresh dispatch');await process(claimed)}throw Error('unbounded worker')}

  await assert.rejects(enqueue({acknowledged:false}),/authorization/)
  await assert.rejects(enqueue({output_language:null}),/authorization/)
  let job=await enqueue()
  assert.equal((await enqueue()).id,job.id,'double submission returns the same active job')
  await assert.rejects(scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[other,caseId,await fingerprint(),input]),/authorization/)
  assert.equal(await scalar('select public.claim_case_analysis_job($1,$2)',[job.id,'f'.repeat(64)]),null,'guessed capability is denied')
  let claimed=await claim(job.id)
  assert.equal(await claim(job.id),null,'capability replay cannot acquire a second lease')
  await process(claimed)
  assert.equal((await stored(job.id)).status,'queued');assert.equal(modelCalls,1)
  const beforeCrash=await claim(job.id)
  await db.query("update private.case_analysis_work set lease_until=now()-interval '1 second' where job_id=$1",[job.id])
  await db.exec('select private.dispatch_case_analysis_jobs()')
  assert.equal(await finish(beforeCrash,{status:'failed',message:'stale worker'}),null,'expired worker cannot overwrite resumed state')
  const complete=await drain(job.id)
  assert.equal(complete.status,'completed');assert.equal(complete.roadmap_id,job.id)
  assert.equal(modelCalls,6,'page closure and worker restart do not repeat completed model stages')
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),1)
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null,'terminal jobs erase private candidates')
  assert.equal((await scalar('select result from case_roadmaps where id=$1',[job.id])).analysis.verification.review_response_ids.length,3)

  // Actual RLS/execute privileges, not a string assertion or mocked access check.
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec('set role authenticated')
  assert.equal((await db.query('select * from case_analysis_jobs')).rows.length,1)
  await assert.rejects(db.query('select * from private.case_analysis_work'),/permission denied/)
  await assert.rejects(db.query("update case_analysis_jobs set status='completed'"),/permission denied/)
  await assert.rejects(db.query('select public.claim_case_analysis_job($1,$2)',[job.id,'f'.repeat(64)]),/permission denied/)
  await assert.rejects(db.query('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[owner,caseId,await fingerprint(),input]),/permission denied/)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other])
  assert.equal((await db.query('select * from case_analysis_jobs')).rows.length,0)
  await db.exec('reset role;set role anon')
  await assert.rejects(db.query('select * from case_analysis_jobs'),/permission denied/)
  await db.exec('reset role')

  job=await enqueue();claimed=await claim(job.id)
  await assert.rejects(finish(claimed,{status:'completed',result:{},workflow_version:'test'}),/Invalid reviewed result/)
  await cancel(job.id)
  const callsBeforeCancel=modelCalls
  assert.equal(await claim(job.id),null)
  assert.equal(await finish(claimed,{status:'failed',message:'late'}),null,'cancellation invalidates an in-flight lease')
  assert.equal(modelCalls,callsBeforeCancel)

  job=await enqueue();claimed=await claim(job.id)
  documents[0].extracted_text+=' Geänderte synthetische Grundlage.'
  const beforeSourceChange=modelCalls;await process(claimed)
  assert.equal((await stored(job.id)).error_code,'source_changed');assert.equal(modelCalls,beforeSourceChange)
  documents=structuredClone(roadmapTestDocuments)

  job=await enqueue();claimed=await claim(job.id)
  await db.query('update account_privacy_settings set ai_processing_enabled=false where owner_id=$1',[owner])
  const stopped=await finish(claimed,{status:'processing',checkpoint:'not-a-real-checkpoint',stage:'review'})
  assert.equal(stopped.status,'failed');assert.equal(stopped.error_code,'access_changed')
  await assert.rejects(enqueue(),/authorization/)
  await db.query('update account_privacy_settings set ai_processing_enabled=true where owner_id=$1',[owner])

  job=await enqueue()
  await db.query('update private.user_access set active=false where user_id=$1',[owner])
  assert.equal(await claim(job.id),null,'revoked access cannot start a model step')
  await db.query("update private.case_analysis_work set dispatch_until=now()-interval '1 second' where job_id=$1",[job.id])
  await db.exec('select private.dispatch_case_analysis_jobs()')
  assert.equal((await stored(job.id)).status,'failed')
  await db.query('update private.user_access set active=true where user_id=$1',[owner])

  job=await enqueue();claimed=await claim(job.id)
  assert.equal((await finish(claimed,{status:'failed',code:'provider_network',retry:true})).status,'queued')
  await db.query("update private.case_analysis_work set available_at=now() where job_id=$1",[job.id])
  claimed=await claim(job.id)
  assert.equal((await finish(claimed,{status:'failed',code:'provider_network',retry:true})).status,'failed','transport retries are bounded across the whole job')

  job=await enqueue();claimed=await claim(job.id)
  await db.query("update public.case_analysis_jobs set expires_at=now()-interval '1 second' where id=$1",[job.id])
  assert.equal((await finish(claimed,{status:'processing',checkpoint:'opaque',stage:'review'})).status,'failed','lease/continuation never renews original job lifetime')

  reviewIssues=[{code:'meaning',location:'analysis',reason:'Synthetic negative control: unsupported conclusion.'}]
  job=await enqueue();const rejected=await drain(job.id)
  assert.equal(rejected.status,'failed');assert.equal(rejected.error_code,'review_unresolved')
  assert.ok(rejected.issues.some(issue=>issue.reason.includes('unsupported conclusion')))
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0,'content rejection never becomes a customer result')
  assert.equal((await stored(job.id)).issues.length,3,'the three scoped findings survive page closure')
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)

  await db.query('update auth.users set banned_until=now()+interval \'1 day\' where id=$1',[owner]);await assert.rejects(enqueue(),/authorization/)
  await db.query('update auth.users set banned_until=null where id=$1',[owner])
  await db.query('update auth.users set is_anonymous=true where id=$1',[owner]);await assert.rejects(enqueue(),/authorization/)
  await db.query('update auth.users set is_anonymous=false where id=$1',[owner])
  await db.query("insert into case_analysis_jobs(owner_id,case_id,source_fingerprint,status) select $1,$2,$3,'failed' from generate_series(1,20)",[owner,caseId,await fingerprint()])
  await assert.rejects(enqueue(),/daily limit/)
  await db.query('delete from cases where id=$1',[caseId])
  assert.equal(await scalar('select count(*)::integer from private.case_analysis_work'),0,'case deletion erases job payloads and checkpoints')
  console.log('Durable analysis: real SQL ownership/privileges, one-use dispatch, page-independent completion, crash recovery, stale-lease rejection, cancellation, consent/access/source guards, bounded retries, all three reviews, persisted failures, quota and deletion passed. Model and network responses are simulated; no live Sarah acceptance claimed.')
}finally{globalThis.fetch=oldFetch;await db.close()}
