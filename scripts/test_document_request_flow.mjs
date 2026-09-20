import assert from 'node:assert/strict'
import fs from 'node:fs'
import {transformSync} from 'next/dist/build/swc/index.js'
import * as quality from '../supabase/functions/_shared/modelQuality.mjs'
import * as checkpoints from '../supabase/functions/_shared/modelCheckpoint.mjs'
import * as documentCheckpoints from '../supabase/functions/_shared/documentCheckpoint.mjs'
import * as evidence from '../supabase/functions/_shared/caseEvidenceRules.mjs'
import {runDocumentAnalysisContinuation} from '../app/modules/services/documentAnalysisContinuation.mjs'
import {documentAnalysisProgressCopy,documentAnalysisProgressLabel,documentReviewAreas} from '../app/modules/documents/documentAnalysisProgress.mjs'

// Real handler, schema, review gates and sealed checkpoints; synthetic transports.
const ownerId='11111111-1111-4111-8111-111111111111',documentId='22222222-2222-4222-8222-222222222222'
const original='Synthetische Notiz: Für Kind A sind 20,12 EUR und für Kind B 21,17 EUR monatlich festgesetzt. Der Zugang ist nicht dokumentiert.'
const secret='synthetic-document-secret-not-a-real-credential'
const baseBody={document_id:documentId,file_path:ownerId+'/test.txt',staged:true,acknowledged:true,privacy_notice_version:'2026-08-30-v1',terms_version:'2026-08-30-test-v1',output_language:'de',reference_language:'de',target_country:'DE'}
const candidate={source_language:'de',extracted_text:original,document_translation:original,document_type:'Synthetische Notiz',summary:'Laut der Notiz sind für Kind A 20,12 EUR und für Kind B 21,17 EUR monatlich festgesetzt.',next_step:'Bitte das unbekannte Zugangsdatum klären. Wenn du ein Antwortschreiben möchtest, kläre Absenderrolle, Empfänger und Zweck.',reference_copy:'',customer_copy:'',response_sender:null,response_role_evidence:'',response_recipient:null,response_subject:'',traffic_light:'yellow',assessment_reasoning:'Das Zugangsdatum fehlt.',document_date:null,sender_or_author:null,recipient:null,reference_numbers:[],deadlines:[],monetary_amounts:['20,12 EUR','21,17 EUR'],confidence:'hoch'}
let state,handler
let clock=Date.now()
function reset(){state={user:{id:ownerId},settings:{owner_id:ownerId,privacy_notice_version:baseBody.privacy_notice_version,privacy_notice_acknowledged_at:'2026-09-20',terms_version:baseBody.terms_version,terms_acknowledged_at:'2026-09-20',ai_processing_enabled:true},document:{id:documentId,owner_id:ownerId,file_path:baseBody.file_path,data_classification:'synthetic',privacy_notice_version:baseBody.privacy_notice_version,ai_processing_allowed:true,source_language:'de',voice_context:null,voice_language:null,updated_at:'2026-09-20T12:00:00Z'},file:original,modelCalls:0,updates:0,issues:[],hook:null,failModel:false}}
reset()
class Query {
  constructor(table){this.table=table;this.filters=[]}
  select(){return this}
  eq(key,value){this.filters.push(row=>row[key]===value);return this}
  update(value){this.changed=value;return this}
  async maybeSingle(){
    const row=this.table==='documents'?state.document:state.settings
    if(!row||row.owner_id!==state.user?.id||!this.filters.every(f=>f(row)))return {data:null,error:null}
    if(this.changed){Object.assign(row,this.changed);state.updates++}
    return {data:structuredClone(row),error:null}
  }
}
const createClient=()=>({
  auth:{getUser:async()=>({data:{user:state.user},error:null})},
  from:table=>new Query(table),
  storage:{from:bucket=>{
    assert.equal(bucket,'goldstandard-private')
    return {download:async path=>({data:path===state.document.file_path?new Blob([state.file],{type:'text/plain'}):null,error:null})}
  }}
})
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'synthetic-public',SUPABASE_SERVICE_ROLE_KEY:secret,OPENAI_API_KEY:'synthetic-provider'}
const dependencies={...quality,...checkpoints,...documentCheckpoints,...evidence}
const source=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const code=transformSync(source.replace(/^import [^\n]+\n/gm,''),{filename:'document-handler.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code
new Function('Deno','createClient',...Object.keys(dependencies),code)({env:{get:key=>env[key]},serve:value=>{handler=value}},createClient,...Object.values(dependencies))
const originalFetch=globalThis.fetch,originalNow=Date.now
Date.now=()=>clock
globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses')
  state.modelCalls++
  if(state.failModel)throw Object.assign(new Error('synthetic timeout'),{name:'TimeoutError'})
  const request=JSON.parse(options.body),review=request.text.format.name==='ash_evidence_review_v139'
  if(review)await state.hook?.()
  clock+=50000 // Four model stages exceed the former shared 130-second budget.
  return new Response(JSON.stringify({id:'synthetic-'+state.modelCalls,status:'completed',model:'mock',output_text:JSON.stringify(review?{issues:state.issues}:candidate)}))
}
async function call(body=baseBody){const response=await handler(new Request('https://synthetic.invalid/document',{method:'POST',headers:{Authorization:'Bearer synthetic-session',Origin:'https://app-gold-workspace.vercel.app','Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:response.status,data:await response.json()}}
async function begin(){const r=await call();assert.equal(r.status,202);assert.equal(r.data.extracted_text,undefined);assert.equal(r.data.summary,undefined);assert.equal(state.updates,0);assert.equal(state.document.ai_processing_allowed,true);return {...baseBody,checkpoint:r.data.checkpoint}}
try {
  const next=await begin(),complete=await call(next)
  assert.equal(complete.status,200);assert.equal(complete.data.extracted_text,original);assert.equal(state.modelCalls,2);assert.equal(state.updates,1)
  assert.equal(state.document.ai_processing_allowed,false)
  assert.equal(state.document.extracted_text,undefined,'reviewed draft still requires deliberate user saving')
  assert.equal((await call(next)).status,403,'consumed document consent must not be reused')

  reset()
  let step=await begin()
  const defect={code:'meaning',location:'summary',reason:'Synthetischer Testbefund zur Zuordnung.'}
  state.issues=[defect]
  const repair=await call(step);assert.equal(repair.status,202);assert.equal(repair.data.stage,'correction')
  const reviewed=await call({...baseBody,checkpoint:repair.data.checkpoint});assert.equal(reviewed.status,202)
  state.issues=[]
  const fixed=await call({...baseBody,checkpoint:reviewed.data.checkpoint})
  assert.equal(fixed.status,200);assert.equal(state.modelCalls,4,'all four independent 50-second stages finish')
  assert.equal(state.updates,1)

  reset()
  step=await begin();state.issues=[defect]
  for(let i=0;i<2;i++){const r=await call(step);assert.equal(r.status,202);step={...baseBody,checkpoint:r.data.checkpoint}}
  const rejected=await call(step)
  assert.equal(rejected.status,422);assert.equal(rejected.data.code,'review_unresolved');assert.deepEqual(rejected.data.issues,[defect]);assert.equal(state.updates,0)
  assert.equal(state.document.ai_processing_allowed,true,'rejection never marks an analysis complete')

  for(const change of [()=>{state.file+=' Geändert.'},()=>{state.document.voice_context='Neue Rolle'},()=>{state.document.updated_at='2026-09-20T12:10:00Z'}]) {
    reset();step=await begin();change();assert.equal((await call(step)).status,409);assert.equal(state.modelCalls,1);assert.equal(state.updates,0)
  }
  for(const overrides of [{output_language:'pl'},{reference_language:'en'},{target_country:'FR'},{checkpoint:'tampered.token'}]) {
    reset();step=await begin();assert.equal((await call({...step,...overrides})).status,409);assert.equal(state.modelCalls,1)
  }
  for(const change of [()=>{state.document.ai_processing_allowed=false},()=>{state.user={id:'33333333-3333-4333-8333-333333333333'}}]) {
    reset();step=await begin();change();assert.equal((await call(step)).status,403);assert.equal(state.modelCalls,1)
  }
  reset();step=await begin();state.settings.ai_processing_enabled=false;assert.equal((await call(step)).status,412);assert.equal(state.modelCalls,1)
  reset();state.document.data_classification='personal';assert.equal((await call()).status,412);assert.equal(state.modelCalls,0)
  reset();state.user=null;assert.equal((await call()).status,401);assert.equal(state.modelCalls,0)
  for(const [hook,status] of [[()=>{state.file+=' Während der Prüfung geändert.'},409],[()=>{state.document.updated_at='2026-09-20T12:11:00Z'},409],[()=>{state.settings.ai_processing_enabled=false},412]]) {
    reset();step=await begin();state.hook=hook;assert.equal((await call(step)).status,status);assert.equal(state.updates,0)
  }
  reset();state.failModel=true;const timeout=await call();assert.equal(timeout.status,502);assert.equal(timeout.data.code,'provider_timeout');assert.equal(state.updates,0)
  reset();const legacy=await call({...baseBody,staged:false});assert.equal(legacy.status,200,'old clients remain compatible for rollout')

  reset();const progress=[]
  const throughClient=await runDocumentAnalysisContinuation(async({body})=>{const r=await call(body);return r.status<400?{data:r.data}:{error:{name:'FunctionsHttpError',context:{json:async()=>r.data}}}},baseBody,{onProgress:value=>progress.push(value)})
  assert.equal(throughClient.data.status,'completed');assert.deepEqual(progress,[{stage:'generation',attempt:1},{stage:'review',attempt:1}])
  for(const failure of [{error:{name:'FunctionsFetchError'}},{data:{status:'completed'}},{data:{status:'processing',checkpoint:'opaque',stage:'review',attempt:1}}]) {
    let calls=0
    const invoke=async()=>{calls++;return failure}
    if(failure.error)assert.equal((await runDocumentAnalysisContinuation(invoke,{})).error,failure.error)
    else await assert.rejects(runDocumentAnalysisContinuation(invoke,{}))
    assert.equal(calls,failure.data?.status==='processing'?4:1,'bounded calls and no automatic transport retries')
  }
  for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']) {
    const copy=documentAnalysisProgressCopy(language)
    assert.ok(documentAnalysisProgressLabel(copy,{stage:'review',attempt:2}))
    const fields=documentReviewAreas([{location:'summary',reason:'UNTRUSTED RAW REASON'},{location:'reference_copy'},{location:'summary'},{location:'<script>untrusted</script>'}],copy.areas)
    assert.deepEqual(fields,[copy.areas[1],copy.areas[3],copy.areas[5]])
    assert.ok(!fields.join(' ').includes('UNTRUSTED'))
  }
  console.log('Document HTTP flow: staged time budgets, bounded correction, mandatory review, caller/source/privacy binding, source changes during review, safe progress, rejection details, no false completion and legacy compatibility passed. Synthetic transports; no live browser acceptance claimed.')
}finally{globalThis.fetch=originalFetch;Date.now=originalNow}
