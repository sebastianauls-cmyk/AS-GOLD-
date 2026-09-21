import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
import {FunctionsHttpError,FunctionsFetchError,FunctionsRelayError} from '@supabase/functions-js'
import {advanceReviewedModel} from '../supabase/functions/_shared/modelQuality.mjs'
import {runDocumentAnalysisContinuation} from '../app/modules/services/documentAnalysisContinuation.mjs'
import {readDocumentAnalysisError,documentFailureCodes,recordDocumentAnalysisFailure} from '../app/modules/documents/documentAnalysisError.mjs'

const reference='44444444-4444-4444-8444-444444444444'
const progress={stage:'review',attempt:1,request_id:reference}
const http=(status,body)=>new FunctionsHttpError(new Response(body,{status,headers:{'Content-Type':'application/json'}}))
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  for(const [error,code] of [[http(504,'<html>gateway</html>'),'function_timeout'],[http(546,'Resource limit'),'function_resources'],[http(401,'{}'),'session_expired'],[new FunctionsFetchError(new TypeError('SECRET')),'network_error'],[new FunctionsRelayError(new Response('SECRET',{status:500})),'function_relay'],[http(502,JSON.stringify({code:'provider_token_limit',error:'SECRET',attempt_id:reference,issues:[{reason:'SECRET'}]})),'provider_token_limit']]){
    const failure=await readDocumentAnalysisError(error,'FALLBACK',language,progress)
    assert.equal(failure.metadata.code,code)
    assert.equal(failure.metadata.stage,'review')
    assert.equal(failure.metadata.request_id,reference)
    assert.ok(failure.stageLabel&&failure.detailsLabel)
    assert.doesNotMatch(failure.message+failure.technical+JSON.stringify(failure.metadata),/SECRET|FALLBACK|<html>/)
  }
}
const malicious=await readDocumentAnalysisError(http(502,JSON.stringify({code:'SECRET',error:'SECRET',provider_status:'SECRET',attempt_id:'SECRET'})),'FALLBACK','de',{stage:'SECRET',request_id:'SECRET'})
assert.doesNotMatch(JSON.stringify(malicious),/SECRET/)
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const quota=await readDocumentAnalysisError(http(502,JSON.stringify({code:'provider_quota',error:'SECRET',provider_status:429})),'FALLBACK',language,progress)
  const temporary=await readDocumentAnalysisError(http(502,JSON.stringify({code:'provider_rate_limit',error:'SECRET',provider_status:429})),'FALLBACK',language,progress)
  assert.equal(quota.metadata.code,'provider_quota')
  assert.notEqual(quota.message,temporary.message,'exhausted credits and transient throttling have different remedies')
  assert.doesNotMatch(quota.message+temporary.message,/SECRET|FALLBACK/)
}

let calls=0
const interrupted=await runDocumentAnalysisContinuation(async({body})=>{
  calls++;assert.match(body.request_id,/^[0-9a-f-]{36}$/)
  if(calls===1)return {data:{status:'processing',checkpoint:'test-token',stage:'review',attempt:1}}
  throw new TypeError('SECRET')
},{}).catch(error=>error)
const failure=await readDocumentAnalysisError(interrupted,'FALLBACK')
assert.equal(failure.metadata.stage,'review');assert.equal(failure.metadata.code,'network_error');assert.equal(calls,2,'no retry of uncertain AI request')
const invalid=await runDocumentAnalysisContinuation(async()=>({data:{}}),{}).catch(error=>error)
assert.equal((await readDocumentAnalysisError(invalid,'FALLBACK')).metadata.code,'invalid_response')
let audited
recordDocumentAnalysisFailure({rpc:async(_name,params)=>{audited=params;return {error:null}}},'doc',failure.metadata)
await new Promise(resolve=>setTimeout(resolve,0))
assert.deepEqual(audited.p_metadata,failure.metadata)
recordDocumentAnalysisFailure({rpc:()=>new Promise(()=>{})},'doc',failure.metadata)

// Actual provider boundary: malformed error bodies, incomplete reasoning output,
// and review defects remain failures, with distinct bounded machine codes.
for(const [response,code,status] of [[new Response('<html>busy</html>',{status:429}),'provider_rate_limit',429],[new Response('denied',{status:401}),'provider_auth',401],[new Response('bad gateway',{status:502}),'provider_http',502],[new Response('broken JSON'),'provider_invalid_json'],[new Response('null'),'provider_invalid_json'],[Response.json({status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}),'provider_token_limit'],[Response.json({status:'incomplete'}),'provider_incomplete'],[Response.json({status:'completed',output_text:'bad JSON'}),'provider_invalid_json']]){
  await assert.rejects(advanceReviewedModel({providerKey:'fake',request:{input:[]},reviewContent:[],validate:x=>x,fetchImpl:async()=>response}),error=>error.code===code&&(!status||error.provider_status===status))
}
await assert.rejects(advanceReviewedModel({providerKey:'fake',request:{input:[]},reviewContent:[],validate:x=>x,state:{stage:'review',attempt:1,candidate:{}},fetchImpl:async()=>Response.json({status:'completed',output_text:'{"wrong":"SECRET"}'})}),error=>error.code==='review_invalid')

// Real Postgres rules: only owner-scoped append-only diagnostics, no arbitrary
// text, JWT-shaped references, forged result fields, anonymous or expired access.
const db=await PGlite.create()
const owner='11111111-1111-4111-8111-111111111111',other='33333333-3333-4333-8333-333333333333',document='22222222-2222-4222-8222-222222222222'
try{
  await db.exec(`create role authenticated;create role anon;create schema auth;create schema private;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function private.gold_access_active() returns boolean language sql stable as $$select coalesce(current_setting('test.access',true),'true')<>'false'$$;
    grant usage on schema auth,private to authenticated;
    create table documents(id uuid primary key,owner_id uuid not null,extracted_text text,ai_processing_allowed boolean default true);
    create table audit_events(id uuid primary key default gen_random_uuid(),owner_id uuid,event_type text,entity_type text,entity_id uuid,event_data jsonb,source text);
    alter table audit_events enable row level security;
    create policy audit_owner on audit_events to authenticated using(owner_id=auth.uid());
    grant select on audit_events to authenticated;`)
  await db.exec(fs.readFileSync('supabase/migrations/20260920184000_v148_document_analysis_diagnostics.sql','utf8'))
  await db.exec(fs.readFileSync('supabase/migrations/20260921120854_v159_provider_quota_diagnostics.sql','utf8'))
  await db.query('insert into documents(id,owner_id) values($1,$2)',[document,owner])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec('set role authenticated')
  const record=metadata=>db.query('select public.record_gold_document_analysis_failure($1,$2)',[document,JSON.stringify(metadata)])
  for(const code of documentFailureCodes)await record({...progress,code})
  const count=documentFailureCodes.size
  assert.equal((await db.query('select * from audit_events')).rows.length,count)
  for(const changed of [{code:null},{code:'SECRET'},{stage:null},{attempt:null},{attempt:3},{http_status:600},{http_status:null},{provider_status:2.5},{request_id:'TOKEN.SECRET.JWT'},{attempt_id:null},{extracted_text:'SECRET'},{summary:'SECRET'}])await assert.rejects(record({...progress,code:'provider_timeout',...changed}),/Invalid/)
  assert.equal((await db.query('select * from audit_events')).rows.length,count)
  await assert.rejects(db.query("insert into audit_events(event_type) values('completed')"),/permission denied/)
  await assert.rejects(db.query('delete from audit_events'),/permission denied/)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other])
  assert.equal((await db.query('select * from audit_events')).rows.length,0)
  await assert.rejects(record({...progress,code:'network_error'}),/not accessible/)
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.query("select set_config('test.access','false',false)")
  await assert.rejects(record({...progress,code:'network_error'}),/Active access required/)
  await db.exec('reset role;set role anon')
  await assert.rejects(record({...progress,code:'network_error'}),/permission denied/)
  await db.exec('reset role')
  const row=(await db.query('select * from documents')).rows[0]
  assert.equal(row.extracted_text,null);assert.equal(row.ai_processing_allowed,true)
}finally{await db.close()}
console.log('Document failure handling passed: actual SDK errors, 11 languages, stage correlation, no automatic retry, typed provider failures, real Postgres ownership/expiry/metadata/append-only controls; no document text or results written.')
