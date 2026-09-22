import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {roadmapFingerprint,roadmapSource,roadmapStyle} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {completeReviewCoverage} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'

// Real Postgres semantics, real migrations, real worker/state machine, validators
// and encrypted checkpoints. Only dispatch transport and model responses are fake.
const db=await PGlite.create(),owner=roadmapTestCase.owner_id,caseId=roadmapTestCase.id,other='77777777-7777-4777-8777-777777777777'
const secret='synthetic-background-job-secret-never-a-real-key'
let documents=structuredClone(roadmapTestDocuments),modelCalls=0,reviewIssues=[],failLettersOnce=false,failStepsOnce=false
const transientStages=new Set()
const httpStages=new Map()
const reviewedParts=[]
let numericFixture=null,numericTimedOut=false,numericFailure='timeout'
const numericRequests=[]
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
  await db.exec(await readFile('supabase/migrations/20260922091000_scoped_case_reviews.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922101000_separate_case_corrections.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922104000_batched_case_reviews.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922111500_percentage_input_repairs.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922115500_complete_case_correction.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922121500_bounded_step_retries.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922140000_provider_http_recovery.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922182000_batched_case_generation.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922184000_batched_case_topics.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922191500_provider_envelope_recovery.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/20260922200500_bounded_roadmap_letter_reviews.sql','utf8'))
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
    if(transientStages.delete(name))throw new DOMException('Synthetic independent stage timeout','TimeoutError')
    if(httpStages.has(name)){const response=httpStages.get(name);httpStages.delete(name);return response}
    let issues=reviewIssues
    if(name==='ash_evidence_review_v139'){
      const payloads=request.input[0].content.map(item=>{try{return JSON.parse(item.text)}catch{return null}}).filter(Boolean)
      const part=payloads.find(item=>item.candidate)?.candidate
      reviewedParts.push({part,related:payloads.find(item=>item.related_output)?.related_output})
      assert.equal(request.reasoning.effort,'high')
      if(failLettersOnce&&part.letters?.some(letter=>letter.id===roadmapTestResult.letters.at(-1).id)){
        failLettersOnce=false
        throw new DOMException('Synthetic final-review transport timeout','TimeoutError')
      }
      if(failStepsOnce&&part.steps?.some(step=>step.id===roadmapTestResult.steps.at(-1).id)){failStepsOnce=false;throw new DOMException('Synthetic later action-review timeout','TimeoutError')}
      if(typeof reviewIssues==='function')issues=reviewIssues(part)
    }
    const analysis=numericFixture||{topics:[{id:'source',title:'Auszahlung',status:'open',conclusion:'Die Anlage fehlt.',conditions:'Anlage beschaffen.',sources:[],step_ids:[]}],calculations:[],limitations:[]}
    if(name==='ash_complete_numbers_v157'){
      const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations.map(item=>item.id)
      numericRequests.push(assigned)
      assert(assigned.length<=6)
      if(assigned[0]==='number_6'&&!numericTimedOut){
        numericTimedOut=true
        if(numericFailure==='format')return new Response('PRIVATE BROKEN PROVIDER ENVELOPE',{status:200})
        throw new DOMException('Synthetic second numeric batch timeout','TimeoutError')
      }
      return Response.json({id:'synthetic-'+modelCalls,status:'completed',output_text:JSON.stringify({calculations:analysis.calculations.filter(item=>assigned.includes(item.id))})})
    }
    const output=name==='ash_case_scope'?{issues:[{id:'source',title:'Auszahlung',reason:'Originale prüfen',calculation_needed:!!numericFixture}],research_topics:[]}
      :name==='ash_complete_topics_v167'?{topics:analysis.topics,limitations:analysis.limitations}:name==='ash_complete_outline_v166'?{calculation_plan:analysis.calculations.map(item=>({id:item.id,title:item.title,topic_ids:item.topic_ids,purpose:item.explanation,depends_on:item.inputs.filter(input=>input.kind==='calculation').map(input=>input.calculation_id)}))}:name==='ash_complete_plan_v157'?{...roadmapTestResult,topic_steps:[{id:'source',step_ids:['anfragen']}]}:{issues}
    return new Response(JSON.stringify({id:'synthetic-'+modelCalls,status:'completed',output_text:JSON.stringify(output)}))
  }
  const process=job=>processCaseAnalysisJob({client,job,secret,providerKey:'synthetic-only'})
  const drain=async id=>{for(let n=0;n<117;n++){const j=await stored(id);if(!['queued','running'].includes(j.status))return j;if(await scalar('select failures>0 from private.case_analysis_work where job_id=$1',[id]))await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[id]);const claimed=await claim(id);assert(claimed,'each queued checkpoint has a fresh dispatch');await process(claimed)}throw Error('unbounded worker')}

  const legacyJob=await enqueue()
  assert.equal(new Date(legacyJob.expires_at)-new Date(legacyJob.created_at),45*60*1000)
  await db.exec(await readFile('supabase/migrations/20260922134000_complete_review_lifetime.sql','utf8'))
  assert.equal(new Date((await stored(legacyJob.id)).expires_at).getTime(),new Date(legacyJob.expires_at).getTime(),'migration never extends an existing job')
  await cancel(legacyJob.id)
  await db.query('delete from public.case_analysis_jobs where id=$1',[legacyJob.id])

  await assert.rejects(enqueue({acknowledged:false}),/authorization/)
  await assert.rejects(enqueue({output_language:null}),/authorization/)
  let job=await enqueue()
  assert.equal(new Date(job.expires_at)-new Date(job.created_at),60*60*1000,'only new jobs have the fixed one-hour lifetime')
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
  assert.equal(new Date(complete.expires_at).getTime(),new Date(job.expires_at).getTime(),'processing never slides the original deadline')
  assert.equal(modelCalls,12,'page closure and worker restart do not repeat completed model stages')
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),1)
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null,'terminal jobs erase private candidates')
  assert.equal((await scalar('select result from case_roadmaps where id=$1',[job.id])).analysis.verification.review_response_ids.length,8)
  const acceptedResult=await scalar('select result from case_roadmaps where id=$1',[job.id])
  const auditedRoadmap={...reviewedParts[2].part,...Object.fromEntries(['facts','open_questions','steps'].map(key=>[key,reviewedParts.flatMap(({part})=>part[key]||[])]))}
  const {letters:expectedLetters,...expectedRoadmap}=roadmapTestResult
  assert.deepEqual(auditedRoadmap,expectedRoadmap,'every non-letter field is audited exactly once across overview, records and bounded action batches')
  assert.deepEqual(reviewedParts.flatMap(({part})=>part.letters||[]),expectedLetters,'every whole letter and complete translation has its own required review')
  for(const item of reviewedParts.filter(({part})=>part.steps||part.letters))assert.deepEqual(item.related.steps,roadmapTestResult.steps,'action and letter review retain every complete action for dependency/consistency checks')

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
  for(const verification of [
    {...acceptedResult.analysis.verification,review_response_ids:['a','b','c']},
    {...acceptedResult.analysis.verification,review_response_ids:['a','b','c','c']},
    {...acceptedResult.analysis.verification,review_response_ids:['a','b','c','']},
    {...acceptedResult.analysis.verification,review_scopes:['analysis','calculations','roadmap']},
    {...acceptedResult.analysis.verification,review_coverage:undefined},
    {...acceptedResult.analysis.verification,review_coverage:[{scope:'analysis',topic_ids:['unreviewed-topic'],calculation_ids:[]},...acceptedResult.analysis.verification.review_coverage.slice(1)]},
    {...acceptedResult.analysis.verification,version:'unknown'},
  ])await assert.rejects(finish(claimed,{status:'completed',result:{...acceptedResult,analysis:{...acceptedResult.analysis,verification}},workflow_version:'test'}),/Invalid reviewed result/,'SQL rejects incomplete, duplicate or mislabeled review coverage')
  const legacy=structuredClone(acceptedResult)
  const legacyCoverage=[...legacy.analysis.verification.review_coverage.filter(item=>['analysis','calculations'].includes(item.scope)),...['roadmap','letters'].map(scope=>({scope,topic_ids:[],calculation_ids:[]}))]
  legacy.analysis.verification={...legacy.analysis.verification,version:'v164',review_coverage:legacyCoverage,review_scopes:legacyCoverage.map(item=>item.scope),review_response_ids:legacyCoverage.map((_,i)=>'legacy_'+i)}
  assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[legacy]),true,'previously completed v164 results keep their original review contract')
  legacy.analysis.verification.version='v168'
  assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[legacy]),false,'legacy whole-plan receipts cannot stand in for v168 per-part reviews')
  const empty=structuredClone(acceptedResult)
  empty.facts=[];empty.open_questions=[];empty.letters=[]
  const emptyCoverage=completeReviewCoverage(empty)
  assert(!emptyCoverage.some(item=>item.part==='records'))
  assert.deepEqual(emptyCoverage.filter(item=>item.scope==='letters'),[{scope:'letters',topic_ids:[],calculation_ids:[],letter_ids:[]}])
  empty.analysis.verification={...empty.analysis.verification,review_coverage:emptyCoverage,review_scopes:emptyCoverage.map(item=>item.scope),review_response_ids:emptyCoverage.map((_,i)=>'empty_'+i)}
  assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[empty]),true,'empty record lists omit no work and an empty letter list still receives its completeness audit')
  for(const key of ['review_coverage','review_scopes','review_response_ids'])empty.analysis.verification[key].pop()
  assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[empty]),false,'an absent letter-completeness review is never accepted')
  const maximum=structuredClone(acceptedResult)
  maximum.facts=Array.from({length:24},()=>structuredClone(acceptedResult.facts[0]))
  maximum.open_questions=Array.from({length:24},()=>structuredClone(acceptedResult.open_questions[0]))
  maximum.steps=Array.from({length:12},(_,i)=>({...structuredClone(acceptedResult.steps[0]),id:'step_'+i}))
  maximum.letters=Array.from({length:6},(_,i)=>({...structuredClone(acceptedResult.letters[0]),id:'letter_'+i}))
  maximum.analysis.topics=Array.from({length:10},(_,i)=>({...acceptedResult.analysis.topics[0],id:'topic_'+i}))
  maximum.analysis.calculations=Array.from({length:24},(_,i)=>({id:'calculation_'+i}))
  const maximumCoverage=completeReviewCoverage(maximum)
  assert.equal(maximumCoverage.length,25)
  maximum.analysis.verification={...maximum.analysis.verification,review_response_ids:maximumCoverage.map((_,i)=>'review_'+i),review_scopes:maximumCoverage.map(item=>item.scope),review_coverage:maximumCoverage}
  assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[maximum]),true,'SQL independently agrees with all 25 required batches at maximum supported size')
  for(const broken of [
    {...maximum.analysis.verification,review_response_ids:maximum.analysis.verification.review_response_ids.slice(1)},
    {...maximum.analysis.verification,review_coverage:maximumCoverage.map((item,i)=>i===5?{...item,calculation_ids:item.calculation_ids.slice(1)}:item)},
    {...maximum.analysis.verification,review_coverage:[maximumCoverage[1],maximumCoverage[0],...maximumCoverage.slice(2)]},
    ...['fact_indexes','question_indexes','step_ids','letter_ids'].map(key=>({...maximum.analysis.verification,review_coverage:maximumCoverage.map(item=>item[key]?.length?{...item,[key]:item[key].slice(1)}:item)})),
  ])assert.equal(await scalar('select private.case_analysis_review_coverage_valid($1)',[{...maximum,analysis:{...maximum.analysis,verification:broken}}]),false,'missing or reordered topic/calculation coverage cannot be published')
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
  assert.equal((await finish(claimed,{status:'failed',code:'provider_network',retry:true})).status,'failed','a second transport failure within the same interrupted step still stops')

  // The live failure happened in different stages. Each interrupted stage can
  // recover once; successful work and every required review remain mandatory.
  job=await enqueue();const independentCalls=modelCalls,independentParts=reviewedParts.length
  transientStages.add('ash_complete_plan_v157');failStepsOnce=true
  assert.equal((await drain(job.id)).status,'completed')
  assert.equal(modelCalls-independentCalls,14,'only the two independently interrupted stages repeat')
  assert.deepEqual(reviewedParts.slice(independentParts).filter(({part})=>part.steps).map(({part})=>part.steps.map(item=>item.id)),[roadmapTestResult.steps.slice(0,3).map(item=>item.id),[roadmapTestResult.steps.at(-1).id],[roadmapTestResult.steps.at(-1).id]],'only the later interrupted action review repeats, not earlier actions')
  assert.equal(await scalar('select transport_retries from private.case_analysis_work where job_id=$1',[job.id]),2)
  assert.equal(await scalar('select failures from private.case_analysis_work where job_id=$1',[job.id]),0)
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])

  // An actual HTTP 503 at the provider boundary resumes only the interrupted
  // step, observes Retry-After, and still needs all reviews before persistence.
  job=await enqueue();const httpCalls=modelCalls
  httpStages.set('ash_case_scope',Response.json({error:{code:'server_is_overloaded',message:'PRIVATE PROVIDER BODY'}},{status:503,headers:{'retry-after':'95'}}))
  claimed=await claim(job.id);await process(claimed)
  assert.equal((await stored(job.id)).status,'queued')
  assert.ok(await scalar("select available_at>=now()+interval '90 seconds' from private.case_analysis_work where job_id=$1",[job.id]),'database does not dispatch before Retry-After')
  assert.equal((await drain(job.id)).status,'completed')
  assert.equal(modelCalls-httpCalls,13,'only the rejected request repeats')
  assert.equal(await scalar('select transport_retries from private.case_analysis_work where job_id=$1',[job.id]),1)
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  for(const status of [500,502,504]){
    job=await enqueue();httpStages.set('ash_case_scope',new Response('PRIVATE PROVIDER BODY',{status}))
    await process(await claim(job.id));assert.equal((await stored(job.id)).status,'queued')
    await cancel(job.id);await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  }
  for(const [status,providerCode,expected] of [[400,'invalid_value','provider_http'],[401,'invalid_api_key','provider_auth'],[403,'permission_denied','provider_auth'],[429,'project_spend_limit_exceeded','provider_quota'],[429,'rate_limit_exceeded','provider_rate_limit'],[501,'secret_customer_name','provider_http']]){
    job=await enqueue();const before=modelCalls
    httpStages.set('ash_case_scope',Response.json({error:{code:providerCode,message:'PRIVATE PROVIDER BODY'}},{status}))
    await process(await claim(job.id));const failed=await stored(job.id)
    assert.equal(failed.status,'failed');assert.equal(failed.error_code,expected);assert.equal(modelCalls-before,1)
    assert.match(failed.issues[0].reason,new RegExp('HTTP '+status))
    assert.doesNotMatch(JSON.stringify(failed),/PRIVATE PROVIDER BODY|secret_customer_name/)
    assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
    await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  }
  for(const outcome of [
    {code:'provider_http',provider_status:400},{code:'provider_http',provider_status:'503'},
    {code:'provider_http',provider_status:503,retry_after:7200},{code:'provider_quota',provider_status:503},
    {code:'provider_invalid_json'},{code:'provider_token_limit'},{code:'review_invalid'},{code:'source_unresolved'},
  ]){
    job=await enqueue();claimed=await claim(job.id)
    assert.equal((await finish(claimed,{status:'failed',retry:true,...outcome})).status,'failed','SQL independently rejects non-transient, mislabeled or beyond-expiry retries')
    await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  }

  // A successful stage resets the consecutive count, never the total budget.
  job=await enqueue();claimed=await claim(job.id)
  for(let retry=1;retry<=3;retry++){
    assert.equal((await finish(claimed,{status:'failed',code:['provider_timeout','provider_response_format','provider_network'][retry-1],retry:true})).status,'queued')
    await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[job.id])
    claimed=await claim(job.id)
    assert.equal((await finish(claimed,{status:'processing',checkpoint:'synthetic-step-'+retry,stage:'review'})).status,'queued')
    assert.equal(await scalar('select transport_retries from private.case_analysis_work where job_id=$1',[job.id]),retry)
    claimed=await claim(job.id)
  }
  assert.equal((await finish(claimed,{status:'failed',code:'provider_response_format',retry:true})).status,'failed','a fourth independent interruption cannot exceed the whole-job retry budget')
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])

  // A new background job beyond minute 45 must survive the real encrypted
  // checkpoint path; its original created_at remains fixed through every step.
  job=await enqueue()
  await db.query("update public.case_analysis_jobs set created_at=now()-interval '46 minutes',expires_at=now()+interval '14 minutes' where id=$1",[job.id])
  const originalJobStart=(await stored(job.id)).created_at
  assert.equal((await drain(job.id)).status,'completed','background checkpoint expiry agrees with the existing database job lifetime')
  assert.equal(new Date((await stored(job.id)).created_at).getTime(),new Date(originalJobStart).getTime())
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])

  job=await enqueue();claimed=await claim(job.id)
  await db.query("update public.case_analysis_jobs set expires_at=now()-interval '1 second' where id=$1",[job.id])
  assert.equal((await finish(claimed,{status:'processing',checkpoint:'opaque',stage:'review'})).status,'failed','lease/continuation never renews original job lifetime')

  // Reproduce the live interruption at the final scope, after all prior work
  // was checkpointed. Resumption must invoke only that scope, not start over.
  job=await enqueue();const callsBeforeTimeout=modelCalls,partsBeforeTimeout=reviewedParts.length
  for(let n=0;n<11;n++)await process(await claim(job.id))
  failLettersOnce=true;await process(await claim(job.id))
  assert.equal((await stored(job.id)).status,'queued')
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
  await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[job.id])
  assert.equal((await drain(job.id)).status,'completed')
  assert.equal(modelCalls-callsBeforeTimeout,13,'only the timed-out final review is repeated')
  assert.deepEqual(reviewedParts.slice(partsBeforeTimeout).map(({part})=>Object.hasOwn(part,'letters')), [false,false,false,false,false,false,true,true,true])

  // A repeated failure still stops, with a content-free diagnostic identifying
  // the interrupted review instead of losing its scope with the checkpoint.
  job=await enqueue()
  for(let n=0;n<9;n++)await process(await claim(job.id))
  failStepsOnce=true;await process(await claim(job.id))
  assert.equal((await stored(job.id)).status,'queued')
  await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[job.id])
  failStepsOnce=true;await process(await claim(job.id))
  const failedReview=await stored(job.id)
  assert.equal(failedReview.status,'failed');assert.equal(failedReview.error_code,'provider_timeout')
  assert.deepEqual(failedReview.issues,[{code:'review_stage',location:'review.roadmap.steps',reason:'Prüfabschnitt 6 von 8; keine geprüfte Antwort dieses Abschnitts gespeichert.'}])
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])

  // The largest batch/correction path and one transport retry remain bounded.
  // The final review is still required at the last allowed claim.
  job=await enqueue();claimed=await claim(job.id)
  await db.query('update private.case_analysis_work set steps=112,attempts=116 where job_id=$1',[job.id])
  assert.equal((await finish(claimed,{status:'processing',checkpoint:'synthetic-limit-check',stage:'review'})).status,'queued')
  claimed=await claim(job.id)
  assert.equal(await scalar('select attempts from private.case_analysis_work where job_id=$1',[job.id]),117)
  assert.equal((await finish(claimed,{status:'completed',result:acceptedResult,model:'test',source_documents:[],workflow_version:'test'})).status,'completed')

  job=await enqueue();claimed=await claim(job.id)
  await db.query('update private.case_analysis_work set steps=113 where job_id=$1',[job.id])
  assert.equal((await finish(claimed,{status:'processing',checkpoint:'over-limit',stage:'review'})).status,'failed','a one-hundred-fifteenth successful stage is not allowed')

  reviewIssues=part=>part.letters?.some(letter=>letter.id===roadmapTestResult.letters.at(-1).id)?[{code:'meaning',location:'letters[0].body',reason:'Synthetic negative control: letter invents a payment suspension.'}]:[]
  job=await enqueue();const badLetter=await drain(job.id)
  assert.equal(badLetter.error_code,'review_unresolved')
  assert.deepEqual(badLetter.issues.map(issue=>issue.location),['letters[0].body'])
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0,'a defect in the new final scope still prevents result publication')

  reviewIssues=[{code:'meaning',location:'analysis',reason:'Synthetic negative control: unsupported conclusion.'}]
  job=await enqueue();const rejected=await drain(job.id)
  assert.equal(rejected.status,'failed');assert.equal(rejected.error_code,'review_unresolved')
  assert.ok(rejected.issues.some(issue=>issue.reason.includes('unsupported conclusion')))
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0,'content rejection never becomes a customer result')
  assert.equal((await stored(job.id)).issues.length,8,'all eight scoped findings survive page closure')
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)

  // Actual worker + encrypted checkpoints + SQL: a later numeric call fails,
  // while the first six checked calculations survive without being repeated.
  reviewIssues=[]
  const amountQuote='Die einmalige Kapitalzahlung beträgt 18.000 EUR brutto und 17.000 EUR netto.'
  for(const failureKind of ['timeout','format']){
    numericFailure=failureKind;numericTimedOut=false;numericRequests.length=0
    numericFixture={topics:[{id:'source',title:'Auszahlung',status:'open',conclusion:'Die Berechnungsanlage fehlt; die Differenz ist rechnerisch prüfbar.',conditions:'Anlage beschaffen.',sources:[],step_ids:[]}],limitations:[],calculations:Array.from({length:7},(_,i)=>({id:'number_'+i,title:'Kontrollwert '+i,topic_ids:['source'],inputs:i?[{name:'previous',label:'Geprüfte Differenz',value:'1000.00',kind:'calculation',calculation_id:'number_0'}]:[{name:'gross',label:'Brutto',value:'18000',kind:'document',document_id:documents[0].id,quote:amountQuote},{name:'net',label:'Netto',value:'17000',kind:'document',document_id:documents[0].id,quote:amountQuote}],expression:i?'previous':'gross-net',decimal_places:2,unit:'EUR',conditions:'',explanation:'Rein synthetischer Kontrollwert zur abschnittsweisen Verarbeitung.'}))}
    job=await enqueue();const numericCallsBefore=modelCalls
    for(let i=0;i<4;i++)await process(await claim(job.id))
    assert.equal(await scalar('select steps from private.case_analysis_work where job_id=$1',[job.id]),4)
    const numericCheckpoint=await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id])
    assert.equal((await stored(job.id)).roadmap_id,null,'partial arithmetic is private, not a saved customer result')
    await process(await claim(job.id))
    assert.equal((await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]))===numericCheckpoint,true,'a failed later provider response cannot erase the sealed earlier calculations')
    assert.equal((await drain(job.id)).status,'completed')
    assert.equal(modelCalls-numericCallsBefore,16,'one topic batch, one manifest, two numeric batches, plan and all nine reviews; only the failed provider call repeats')
    assert.deepEqual(numericRequests,[Array.from({length:6},(_,i)=>'number_'+i),['number_6'],['number_6']])
    const numericResult=await scalar('select result from case_roadmaps where id=$1',[job.id])
    assert.equal(numericResult.analysis.calculations.length,7)
    assert(numericResult.analysis.calculations.every(item=>item.result==='1000.00'),'cross-batch dependencies retain exact checked values')
    assert.equal(numericResult.analysis.verification.analysis_response_ids.length,4)
    assert.equal(numericResult.analysis.verification.review_response_ids.length,9)
    assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)
    assert.equal(new Date((await stored(job.id)).expires_at).getTime(),new Date(job.expires_at).getTime())
    numericFixture=null
    await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  }

  // A second unreadable envelope in the same step exhausts its existing
  // retry. Generated invalid JSON/refusals/token limits are never classified
  // as transport failures, and no raw provider payload enters diagnostics.
  job=await enqueue();const repeatedFormatCalls=modelCalls
  for(let attempt=0;attempt<2;attempt++){
    httpStages.set('ash_case_scope',new Response('PRIVATE BROKEN PROVIDER ENVELOPE',{status:200}))
    await process(await claim(job.id))
    if(attempt===0){
      assert.equal((await stored(job.id)).status,'queued')
      await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[job.id])
    }
  }
  const repeatedFormat=await stored(job.id)
  assert.equal(repeatedFormat.status,'failed');assert.equal(repeatedFormat.error_code,'provider_response_format')
  assert.equal(modelCalls-repeatedFormatCalls,2)
  assert.equal(await scalar('select transport_retries from private.case_analysis_work where job_id=$1',[job.id]),1)
  assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)
  assert.doesNotMatch(JSON.stringify(repeatedFormat),/PRIVATE BROKEN PROVIDER ENVELOPE/)
  assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
  await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  for(const [response,code] of [
    [{id:'bad-json',status:'completed',output_text:'PRIVATE MALFORMED OUTPUT'},'provider_invalid_json'],
    [{id:'refusal',status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'PRIVATE REFUSAL'}]}]},'provider_invalid_json'],
    [{id:'token-limit',status:'incomplete',incomplete_details:{reason:'max_output_tokens'}},'provider_token_limit'],
  ]){
    job=await enqueue();const before=modelCalls
    httpStages.set('ash_case_scope',Response.json(response));await process(await claim(job.id))
    const failed=await stored(job.id)
    assert.equal(failed.status,'failed');assert.equal(failed.error_code,code);assert.equal(modelCalls-before,1)
    assert.equal(await scalar('select transport_retries from private.case_analysis_work where job_id=$1',[job.id]),0)
    assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
    assert.doesNotMatch(JSON.stringify(failed),/PRIVATE MALFORMED OUTPUT|PRIVATE REFUSAL/)
    await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
  }

  await db.query('update auth.users set banned_until=now()+interval \'1 day\' where id=$1',[owner]);await assert.rejects(enqueue(),/authorization/)
  await db.query('update auth.users set banned_until=null where id=$1',[owner])
  await db.query('update auth.users set is_anonymous=true where id=$1',[owner]);await assert.rejects(enqueue(),/authorization/)
  await db.query('update auth.users set is_anonymous=false where id=$1',[owner])
  await db.query("insert into case_analysis_jobs(owner_id,case_id,source_fingerprint,status) select $1,$2,$3,'failed' from generate_series(1,20)",[owner,caseId,await fingerprint()])
  await assert.rejects(enqueue(),/daily limit/)
  await db.query('delete from cases where id=$1',[caseId])
  assert.equal(await scalar('select count(*)::integer from private.case_analysis_work'),0,'case deletion erases job payloads and checkpoints')
  console.log('Durable analysis: real SQL ownership/privileges, one-use dispatch, page-independent completion, crash recovery, stale-lease rejection, cancellation, consent/access/source guards, bounded retries, all four reviews, persisted failures, quota and deletion passed. Model and network responses are simulated; no live Sarah acceptance claimed.')
}finally{globalThis.fetch=oldFetch;await db.close()}
