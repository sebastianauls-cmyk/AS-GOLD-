import assert from 'node:assert/strict'
import fs from 'node:fs'
import {transformSync} from 'next/dist/build/swc/index.js'
import * as checkpoints from '../supabase/functions/_shared/modelCheckpoint.mjs'
import * as evidence from '../supabase/functions/_shared/caseEvidenceRules.mjs'
import * as modelContext from '../supabase/functions/_shared/roadmapModelContext.mjs'
import * as complete from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import * as quality from '../supabase/functions/_shared/modelQuality.mjs'
import * as roadmap from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {runRoadmapContinuation} from '../app/modules/services/roadmapContinuation.mjs'

// Exercise the actual HTTP handler and its real validators/checkpoints. Only
// Supabase transport, identity and model transport are local synthetic doubles.
// No real accounts, credentials, provider calls or customer database are used.
const secret='synthetic-request-flow-secret-never-a-real-key'
const ownerId=roadmapTestCase.owner_id
const baseBody={action:'generate',case_id:roadmapTestCase.id,staged:true,style:{customer_name:'Nora Muster'},output_language:'de',reference_language:'de',acknowledged:true,privacy_notice_version:'2026-08-30-v1',terms_version:'2026-08-30-test-v1'}
let state,handler
function reset(){state={user:{id:ownerId,is_anonymous:false},active:true,permissions:{full_analysis:true,draft_letters:true},ai:true,cases:[structuredClone(roadmapTestCase)],documents:structuredClone(roadmapTestDocuments),assessments:[],case_roadmaps:[],modelCalls:0,extraCount:0,issues:[],reviewGate:null,enqueued:[]}}
reset()

class Query {
  constructor(table,admin){this.table=table;this.admin=admin;this.filters=[]}
  select(_fields,options){this.options=options;return this}
  eq(key,value){this.filters.push(row=>row[key]===value);return this}
  gte(key,value){this.filters.push(row=>row[key]>=value);return this}
  order(key,{ascending=true}={}){this.orderBy={key,ascending};return this}
  limit(value){this.max=value;return this}
  insert(value){assert.equal(this.admin,true);this.inserted=value;return this}
  update(value){assert.equal(this.admin,true);this.changed=value;return this}
  async execute(single=false,required=false){
    if(this.inserted){
      // Mirrors the existing database primary key; inserts never overwrite.
      if(state.case_roadmaps.some(row=>row.id===this.inserted.id))return {data:null,error:{code:'23505'}}
      const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),progress:{},events:[],...structuredClone(this.inserted)}
      state.case_roadmaps.push(row)
      return {data:single?structuredClone(row):[structuredClone(row)],error:null}
    }
    const settings={owner_id:ownerId,ai_processing_enabled:state.ai,privacy_notice_version:baseBody.privacy_notice_version,privacy_notice_acknowledged_at:'2026-09-19',terms_version:baseBody.terms_version,terms_acknowledged_at:'2026-09-19'}
    let rows=this.table==='account_privacy_settings'?[settings]:[...(state[this.table]||[])]
    if(!this.admin)rows=state.active?rows.filter(row=>!row.owner_id||row.owner_id===state.user?.id):[]
    rows=rows.filter(row=>this.filters.every(filter=>filter(row)))
    if(this.orderBy){const {key,ascending}=this.orderBy;rows.sort((a,b)=>String(a[key]).localeCompare(String(b[key]))*(ascending?1:-1))}
    if(this.max!==undefined)rows=rows.slice(0,this.max)
    if(this.changed)rows.forEach(row=>Object.assign(row,this.changed))
    if(this.options?.head)return {data:null,error:null,count:rows.length+state.extraCount}
    return {data:single?structuredClone(rows[0]||null):structuredClone(rows),error:required&&rows.length!==1?{code:'PGRST116'}:null}
  }
  maybeSingle(){return this.execute(true)}
  single(){return this.execute(true,true)}
  then(resolve,reject){return this.execute().then(resolve,reject)}
}
const createClient=(_url,key)=>({
  auth:{getUser:async()=>({data:{user:state.user},error:null})},
  from:table=>new Query(table,key===secret),
  rpc:async(name,args)=>{
    if(name==='enqueue_case_analysis_job'){
      assert.equal(key,secret);assert.equal(args.p_owner_id,state.user.id)
      state.enqueued.push(args)
      return {data:{id:crypto.randomUUID(),case_id:args.p_case_id,status:'queued',stage:'planning'},error:null}
    }
    assert.equal(name,'current_gold_access');return {data:[{permissions:state.permissions}],error:null}
  }
})
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'synthetic-publishable-key',SUPABASE_SERVICE_ROLE_KEY:secret,OPENAI_API_KEY:'synthetic-model-key'}
const dependencies={...checkpoints,...evidence,...quality,...roadmap,...complete,...modelContext,loadSource:modelContext.loadRoadmapSource}
const source=fs.readFileSync('supabase/functions/gold-case-roadmap/index.ts','utf8')
const code=transformSync(source.replace(/^import [^\n]+\n/gm,''),{filename:'roadmap-handler.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code
new Function('Deno','createClient',...Object.keys(dependencies),code)({env:{get:name=>env[name]},serve:value=>{handler=value}},createClient,...Object.values(dependencies))
assert.equal(typeof handler,'function')
const originalFetch=globalThis.fetch
globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses','unexpected external request')
  state.modelCalls++
  const request=JSON.parse(options.body)
  const generation=['ash_customer_roadmap_v136','ash_complete_outline_v166','ash_complete_plan_v157'].includes(request.text.format.name)
  if(request.text.format.name==='ash_case_scope')return new Response(JSON.stringify({id:'scope-test',status:'completed',output_text:JSON.stringify({issues:[{id:'source',title:'Auszahlung',reason:'Originale prüfen',calculation_needed:false}],research_topics:[]})}))
  if(!generation&&state.reviewGate)await state.reviewGate()
  const analysis={topics:[{id:'source',title:'Auszahlung',status:'open',conclusion:'Die Anlage fehlt.',conditions:'Anlage beschaffen.',sources:[],step_ids:[]}],calculations:[],limitations:[]}
  const output=request.text.format.name==='ash_complete_outline_v166'?{topics:analysis.topics,limitations:analysis.limitations,calculation_plan:[]}:request.text.format.name==='ash_complete_plan_v157'?{...roadmapTestResult,topic_steps:[{id:'source',step_ids:['anfragen']}]}:generation?roadmapTestResult:{issues:state.issues}
  return new Response(JSON.stringify({id:'synthetic-'+state.modelCalls,status:'completed',output_text:JSON.stringify(output)}))
}
async function call(body=baseBody){
  const response=await handler(new Request('https://synthetic.invalid/roadmap',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer synthetic-session','Origin':'https://app-gold-workspace.vercel.app'},body:JSON.stringify(body)}))
  return {status:response.status,data:await response.json()}
}
async function begin(){const result=await call();assert.equal(result.status,202);assert.equal(result.data.roadmap,undefined);assert.equal(state.case_roadmaps.length,0);return {...baseBody,checkpoint:result.data.checkpoint}}

try {
  const queued=await call({...baseBody,action:'enqueue',analysis_mode:'complete',owner_id:'77777777-7777-4777-8777-777777777777'})
  assert.equal(queued.status,202);assert.equal(queued.data.job.status,'queued');assert.equal(state.modelCalls,0)
  assert.equal(state.enqueued[0].p_owner_id,ownerId,'queued owner comes from verified authentication, never request identity')
  assert.equal(state.enqueued[0].p_request.acknowledged,true)
  assert.equal(state.enqueued[0].p_request.draft_letters,true)
  state.ai=false;assert.equal((await call({...baseBody,action:'enqueue'})).status,412)
  state.ai=true;assert.equal((await call({...baseBody,action:'enqueue',acknowledged:false})).status,412)
  state.permissions.full_analysis=false;assert.equal((await call({...baseBody,action:'enqueue'})).status,403)
  assert.equal(state.enqueued.length,1,'unapproved jobs never reach the background dispatcher')
  reset()
  const fullBody={...baseBody,analysis_mode:'complete'}
  const planned=await call(fullBody);assert.equal(planned.status,202);assert.equal(state.case_roadmaps.length,0)
  const crossMode=await call({...baseBody,checkpoint:planned.data.checkpoint});assert.equal(crossMode.status,409,'checkpoint must bind full/source-only mode')
  state.permissions.full_analysis=false;assert.equal((await call({...fullBody,checkpoint:planned.data.checkpoint})).status,403)
  state.permissions.full_analysis=true
  const generated=await call({...fullBody,checkpoint:planned.data.checkpoint});assert.equal(generated.status,202);assert.equal(state.case_roadmaps.length,0)
  const assembled=await call({...fullBody,checkpoint:generated.data.checkpoint});assert.equal(assembled.status,202);assert.equal(state.case_roadmaps.length,0,'partial calculations and plan are never saved before full review')
  let reviewing=assembled
  for(let part=0;part<3;part++){reviewing=await call({...fullBody,checkpoint:reviewing.data.checkpoint});assert.equal(reviewing.status,202);assert.equal(state.case_roadmaps.length,0)}
  const accepted=await call({...fullBody,checkpoint:reviewing.data.checkpoint});assert.equal(accepted.status,200);assert(accepted.data.roadmap.result.analysis.verification.review_response_id);assert.equal(state.case_roadmaps.length,1)
  reset();state.issues=[{code:'meaning',location:'analysis',reason:'Synthetic negative control: material unsupported conclusion.'}]
  let incomplete=await call(fullBody)
  for(let part=0;part<17;part++){assert.equal(incomplete.status,202);assert.equal(state.case_roadmaps.length,0);incomplete=await call({...fullBody,checkpoint:incomplete.data.checkpoint})}
  assert.equal(incomplete.status,202)
  const denied=await call({...fullBody,checkpoint:incomplete.data.checkpoint})
  assert.equal(denied.status,422);assert.equal(state.case_roadmaps.length,0,'three assembled candidates failing full review never save partial results');assert.equal(state.modelCalls,19,'two bounded corrections of both components and every final independent review')
  reset()
  const continuation=await begin()
  const completed=await call(continuation)
  assert.equal(completed.status,200);assert.equal(state.case_roadmaps.length,1);assert.equal(state.modelCalls,2)
  state.case_roadmaps[0].progress={frist:{done:true,note:'Synthetischer Beleg abgelegt.'}}
  const repeated=await call(continuation)
  assert.equal(repeated.status,200)
  assert.equal(repeated.data.roadmap.id,completed.data.roadmap.id,'repeating a completed request must return the same saved roadmap')
  assert.equal(state.case_roadmaps.length,1,'a lost response must not produce a duplicate saved version')
  assert.equal(state.modelCalls,2,'a completed request must not repeat the model review')
  assert.deepEqual(repeated.data.roadmap.progress,state.case_roadmaps[0].progress,'replay retains recorded progress')
  delete env.OPENAI_API_KEY
  assert.equal((await call(continuation)).status,200,'recovering a saved result requires no provider configuration')
  assert.equal((await call()).status,503,'new generation still requires the provider')
  env.OPENAI_API_KEY='synthetic-model-key'

  state.extraCount=20
  assert.equal((await call(continuation)).status,200,'a replay of an existing result consumes no new daily quota')
  assert.equal((await call()).status,429,'new runs still obey the quota')
  state.extraCount=0
  state.permissions.full_analysis=false;assert.equal((await call(continuation)).status,403)
  state.permissions.full_analysis=true;state.ai=false;assert.equal((await call(continuation)).status,412)
  state.ai=true;state.user=null;assert.equal((await call(continuation)).status,401)
  state.user={id:'77777777-7777-4777-8777-777777777777'};assert.equal((await call(continuation)).status,404)
  state.user={id:ownerId};state.active=false;assert.equal((await call(continuation)).status,404)
  state.active=true;state.documents[0].extracted_text+=' Geänderte synthetische Grundlage.'
  assert.equal((await call(continuation)).status,409,'old checkpoint cannot recover a report against changed originals')
  assert.equal(state.modelCalls,2,'denied replays never reach the model')

  reset()
  const concurrent=await begin()
  let reviews=0,release
  const bothReviews=new Promise(resolve=>{release=resolve})
  state.reviewGate=()=>{if(++reviews===2)release();return bothReviews}
  const pair=await Promise.all([call(concurrent),call(concurrent)])
  assert.deepEqual(pair.map(value=>value.status),[200,200])
  assert.equal(pair[0].data.roadmap.id,pair[1].data.roadmap.id,'concurrent completion returns one saved result')
  assert.equal(state.case_roadmaps.length,1,'the existing primary key blocks concurrent duplicate persistence')

  reset()
  const changed=await begin()
  state.documents[0].extracted_text+=' Korrigierte Unterlage.'
  assert.equal((await call(changed)).status,409)
  assert.equal(state.case_roadmaps.length,0);assert.equal(state.modelCalls,1)

  reset()
  const changedDuringReview=await begin()
  state.reviewGate=()=>{state.documents[0].extracted_text+=' Während der Prüfung geänderte Grundlage.'}
  assert.equal((await call(changedDuringReview)).status,409)
  assert.equal(state.case_roadmaps.length,0,'fresh-source check blocks a result changed during model review')

  reset()
  const beforeCorrection=await begin()
  state.issues=[{code:'meaning',location:'opening',reason:'Synthetic finding requiring one correction.'}]
  const needsCorrection=await call(beforeCorrection)
  assert.equal(needsCorrection.status,202)
  state.issues=[]
  const needsReview=await call({...baseBody,checkpoint:needsCorrection.data.checkpoint})
  assert.equal(needsReview.status,202)
  const corrected=await call({...baseBody,checkpoint:needsReview.data.checkpoint})
  assert.equal(corrected.status,200);assert.equal(state.modelCalls,4)
  assert.equal((await call(beforeCorrection)).data.roadmap.id,corrected.data.roadmap.id,'run identity survives every correction stage')
  assert.equal(state.modelCalls,4,'an older checkpoint also recovers the completed corrected result')

  reset()
  let rejected=await begin()
  state.issues=[{code:'meaning',location:'opening',reason:'Synthetic negative control: unsupported assertion.'}]
  for(let index=0;index<2;index++){const next=await call(rejected);assert.equal(next.status,202);rejected={...baseBody,checkpoint:next.data.checkpoint}}
  assert.equal((await call(rejected)).status,422)
  assert.equal(state.case_roadmaps.length,0,'failed final review never saves a roadmap')
  assert.equal(state.modelCalls,4,'one bounded correction and its final review')

  reset()
  let transportCalls=0,lostResponse=false
  const recovered=await runRoadmapContinuation(async({body})=>{
    transportCalls++
    const response=await call(body)
    assert.ok([200,202].includes(response.status))
    if(response.status===200&&!lostResponse){lostResponse=true;return {error:{name:'FunctionsFetchError'}}}
    return {data:response.data,error:null}
  },baseBody)
  assert.equal(recovered.data.roadmap.id,state.case_roadmaps[0].id)
  assert.equal(state.case_roadmaps.length,1);assert.equal(state.modelCalls,2);assert.equal(transportCalls,3)
  for(const error of [{name:'FunctionsFetchError'},{name:'FunctionsHttpError',context:{status:403}}]) {
    let calls=0
    const failed=await runRoadmapContinuation(async()=>++calls===1?{data:{status:'processing',checkpoint:'synthetic-checkpoint',stage:'review'}}:{error},{})
    assert.equal(failed.error,error)
    assert.equal(calls,error.name==='FunctionsFetchError'?3:2,'only one transport retry; no retry for rejected access')
  }
  let initialCalls=0
  await runRoadmapContinuation(async()=>{initialCalls++;return {error:{name:'FunctionsFetchError'}}},{})
  assert.equal(initialCalls,1,'an initial request without a checkpoint is not repeated automatically')
  reset()
  const progressRun=await begin()
  const progressCreated=await call(progressRun)
  const progressBody={action:'progress',case_id:baseBody.case_id,roadmap_id:progressCreated.data.roadmap.id}
  for(const step of roadmapTestResult.steps){
    const saved=await call({...progressBody,step_id:step.id,done:true,note:'Synthetischer Abschluss mit überprüftem Testbeleg.'})
    assert.equal(saved.status,200)
    assert.equal(saved.data.roadmap.progress[step.id].done,true)
  }
  const reload=await createClient('',env.SUPABASE_ANON_KEY).from('case_roadmaps').select('*').eq('id',progressBody.roadmap_id).single()
  assert.ok(roadmap.roadmapSteps(reload.data).every(step=>step.done),'a fresh read restores all saved confirmations')
  const reopened=await call({...progressBody,step_id:roadmapTestResult.steps[0].id,done:false,note:'Testbeleg geändert; Voraussetzungen erneut prüfen.'})
  assert.equal(reopened.status,200)
  assert.ok(roadmap.roadmapSteps(reopened.data.roadmap).some(step=>step.blocked),'reopening persists dependent steps as blocked')
  state.active=false
  assert.equal((await call({...progressBody,step_id:roadmapTestResult.steps[0].id,done:true,note:'Abgelaufener Testzugang darf nichts mehr ändern.'})).status,404)
  console.log('Roadmap HTTP handler: duplicate/concurrent completion, quota, live access/privacy/source rechecks and failed-review persistence guard passed. Identity, database transport and model responses are synthetic; no authenticated browser acceptance claimed.')
} finally {globalThis.fetch=originalFetch}
