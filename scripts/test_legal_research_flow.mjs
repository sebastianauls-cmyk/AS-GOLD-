import assert from 'node:assert/strict'
import fs from 'node:fs'
import {transformSync} from 'next/dist/build/swc/index.js'
import * as research from '../supabase/functions/_shared/verifiedResearch.mjs'
import * as quality from '../supabase/functions/_shared/modelQuality.mjs'
import * as checkpoints from '../supabase/functions/_shared/modelCheckpoint.mjs'
const owner='11111111-1111-4111-8111-111111111111',caseId='22222222-2222-4222-8222-222222222222'
const urls=['https://verwaltung.bund.de/leistungsverzeichnis/de/rechte-und-pflichten/102837988','https://entreprendre.service-public.gouv.fr/vosdroits/F38586']
const candidate={title:'Synthetic official comparison',overall_status:'yellow',overall_summary:'A comparison of two official information pages.',applicable_law:{status:'unclear',explanation:'No concrete case supplied.',missing_factors:[],source_urls:[]},rows:[{issue:'Scope',difference_status:'same',home:{explanation:'German authority information.',source_urls:[urls[0]]},target:{explanation:'French authority information.',source_urls:[urls[1]]},practical_meaning:'Read each page within its scope.',confidence:'medium'}],open_questions:[],next_steps:[],customer_explanation:'Both pages are authority information.',sources:urls.map((url,index)=>({url,title:'Official source',publisher:'Official authority',country:index?'FR':'DE',source_type:'authority'})),professional_review_required:true}
let handler,state
function reset(){state={owned:true,readable:true,searchCompleted:true,issues:[],saved:[],fetched:[],reviews:0,title:'Synthetic case',count:0}}
reset()
class Query {
  constructor(table){this.table=table;this.filters=[]}
  select(_fields,options){this.options=options;return this}eq(key,value){this.filters.push(row=>row[key]===value);return this}gte(){return this}in(){return this}order(){return this}limit(){return this}
  insert(row){this.row=row;return this}
  execute(){
    if(this.row){if(state.saved.some(row=>row.id===this.row.id))return {data:null,error:{code:'23505'}};const saved={id:crypto.randomUUID(),...this.row};state.saved.push(saved);return {data:saved,error:null}}
    if(this.table==='legal_comparisons')return this.options?.head?{count:state.count,data:null,error:null}:{data:state.saved.find(row=>this.filters.every(filter=>filter(row)))||null,error:null}
    if(this.table==='cases')return {data:state.owned?{id:caseId,title:state.title,home_country:'DE',target_country:'FR'}:null,error:null}
    if(this.table==='documents')return {data:[],error:null}
    if(this.table==='account_privacy_settings')return {data:{privacy_notice_version:'2026-08-30-v1',privacy_notice_acknowledged_at:'2026-09-20',terms_version:'2026-08-30-test-v1',terms_acknowledged_at:'2026-09-20',ai_processing_enabled:true},error:null}
    return {count:0,data:[],error:null}
  }
  maybeSingle(){return Promise.resolve(this.execute())}single(){return Promise.resolve(this.execute())}then(resolve,reject){return Promise.resolve(this.execute()).then(resolve,reject)}
}
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-admin-key-at-least-thirty-two-characters',OPENAI_API_KEY:'synthetic-provider'}
const createClient=()=>({auth:{getUser:async()=>({data:{user:{id:owner,is_anonymous:false}},error:null})},from:table=>new Query(table)})
const dependencies={...research,...quality,...checkpoints}
const source=fs.readFileSync('supabase/functions/gold-legal-comparison/index.ts','utf8')
const code=transformSync(source.replace(/^import [^\n]+\n/gm,''),{filename:'research-handler.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code
new Function('Deno','createClient','console',...Object.keys(dependencies),code)({env:{get:key=>env[key]},serve:value=>{handler=value}},createClient,{info(){},warn(){},error(){},log(){}},...Object.values(dependencies))
const originalFetch=globalThis.fetch
globalThis.fetch=async(url,options)=>{
  if(url==='https://api.openai.com/v1/responses'){
    const request=JSON.parse(options.body)
    if(request.tools||request.text.format.name==='ash_research_correction_v141')return new Response(JSON.stringify({id:'synthetic-search',status:'completed',output_text:JSON.stringify(candidate),output:[{type:'web_search_call',status:state.searchCompleted?'completed':'failed',action:{type:'open_page',url:urls[0]}}]}))
    state.reviews++;return new Response(JSON.stringify({id:'synthetic-review',status:'completed',output_text:JSON.stringify({issues:state.issues})}))
  }
  assert.ok(urls.includes(url),'only exact approved official destinations may be fetched')
  state.fetched.push(url)
  return state.readable?new Response('Synthetic official body text for controlled transport testing. '.repeat(5),{headers:{'content-type':'text/plain'}}):new Response('Denied',{status:403})
}
async function call(extra={}){const response=await handler(new Request('https://synthetic.invalid/research',{method:'POST',headers:{Authorization:'Bearer synthetic-session',Origin:'https://app-gold-workspace.vercel.app','Content-Type':'application/json'},body:JSON.stringify({case_id:caseId,topic:'claims_payments',question:'Synthetic comparison of official authority information.',output_language:'en',data_classification:'synthetic',acknowledged:true,privacy_notice_version:'2026-08-30-v1',terms_version:'2026-08-30-test-v1',...extra})}));return {status:response.status,body:await response.json()}}
try{
  const positive=await call();assert.equal(positive.status,200,JSON.stringify(positive.body));assert.equal(state.saved.length,1);assert.equal(state.reviews,1)
  assert.deepEqual(state.fetched,urls,'the second proposed URL is fetched even if the search log only lists the first')
  assert.equal(positive.body.comparison.sources.length,2)
  assert.ok(positive.body.comparison.sources.every(source=>source.source_text&&source.content_sha256))
  assert.equal(positive.body.comparison.result.source_verification.review_passed,true)
  reset();state.readable=false;const unavailable=await call();assert.equal(unavailable.status,422);assert.equal(unavailable.body.code,'no_verified_sources');assert.equal(state.saved.length,0);assert.equal(state.reviews,0)
  reset();state.issues=[{code:'meaning',location:'rows[0]',reason:'Controlled unsupported assertion.'}];const rejected=await call();assert.equal(rejected.status,422);assert.equal(rejected.body.code,'source_review_unresolved');assert.equal(state.saved.length,0)
  reset();state.searchCompleted=false;assert.equal((await call()).status,502);assert.equal(state.fetched.length,0);assert.equal(state.saved.length,0)
  reset();state.owned=false;assert.equal((await call()).status,404);assert.equal(state.fetched.length,0);assert.equal(state.saved.length,0)
  reset();let pending=await call({staged:true});assert.equal(pending.status,202);assert.equal(state.saved.length,0);assert.equal(state.reviews,0)
  const firstToken=pending.body.checkpoint
  state.issues=[{code:'meaning',location:'rows[0]',reason:'Correct this controlled defect.'}]
  pending=await call({staged:true,checkpoint:firstToken});assert.equal(pending.status,202);assert.equal(pending.body.stage,'correction');assert.equal(state.saved.length,0)
  state.issues=[];pending=await call({staged:true,checkpoint:pending.body.checkpoint});assert.equal(pending.status,202);assert.equal(pending.body.stage,'review');assert.equal(state.saved.length,0)
  const finalToken=pending.body.checkpoint
  const complete=await call({staged:true,checkpoint:finalToken});assert.equal(complete.status,200);assert.equal(state.saved.length,1);assert.equal(state.reviews,2)
  state.count=20;const replay=await call({staged:true,checkpoint:firstToken});assert.equal(replay.status,200);assert.equal(replay.body.comparison.id,complete.body.comparison.id);assert.equal(state.saved.length,1);assert.equal(state.reviews,2)
  assert.equal((await call({staged:true})).status,429)
  state.title='Changed original case';assert.equal((await call({staged:true,checkpoint:firstToken})).status,409)
  reset();pending=await call({staged:true});assert.equal((await call({staged:true,checkpoint:pending.body.checkpoint+'x'})).status,409)
  state.issues=[{code:'meaning',location:'rows[0]',reason:'Unresolved controlled defect.'}]
  for(let step=0;step<2;step++){pending=await call({staged:true,checkpoint:pending.body.checkpoint});assert.equal(pending.status,202)}
  const blocked=await call({staged:true,checkpoint:pending.body.checkpoint});assert.equal(blocked.status,422);assert.equal(blocked.body.code,'review_unresolved');assert.equal(state.saved.length,0)
  console.log('Research HTTP handler: verified bodies plus independent review required before persistence; denied sources, unsupported claims, failed search and inaccessible cases never save. Transport, identity and database are controlled test doubles.')
}finally{globalThis.fetch=originalFetch}
