import assert from 'node:assert/strict'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {callModel} from '../supabase/functions/_shared/modelQuality.mjs'
import {modelUsageReceipt} from '../supabase/functions/_shared/modelUsageReceipt.mjs'

export async function testCaseModelBudget({db,client,owner,caseId,secret,enqueue,claim,cancel,finish,stored,scalar}) {
  const policies=(await db.query('select * from private.case_model_budget_policy')).rows
  const ids=[]
  const fresh=async()=>{const job=await enqueue();ids.push(job.id);return claim(job.id)}
  const reserve=(job,output=9000,bytes=1000,search=0)=>scalar('select public.reserve_case_model_call($1,$2,$3,$4,$5,$6)',[job.id,job.lease,output,bytes,search,'planning'])
  const settle=(job,id,input=100,output=100,cached=20)=>scalar('select public.settle_case_model_call($1,$2,$3,$4,$5,$6)',[job.id,job.lease,id,input,output,cached])
  const settleReceipt=(job,id,receipt,input=100,output=100,cached=20)=>scalar('select public.settle_case_model_call_with_receipt($1,$2,$3,$4,$5,$6,$7)',[job.id,job.lease,id,input,output,cached,receipt])
  const providerReceipt={id:'resp_synthetic_receipt',model:'gpt-5.6-sol',service_tier:'priority',status:'completed',usage:{input_tokens:100,output_tokens:100,input_tokens_details:{cached_tokens:20,cache_write_tokens:50}},output:[
    {type:'web_search_call',status:'completed',action:{type:'search',queries:['PRIVATE SYNTHETIC QUERY']}},
    {type:'web_search_call',status:'failed',action:{type:'search'}},
    {type:'web_search_call',status:'completed',action:{type:'open_page',url:'https://private.invalid'}},
    {type:'web_search_call',status:'completed',action:{type:'find_in_page',pattern:'PRIVATE SYNTHETIC PATTERN'}},
    {type:'web_search_call',status:'completed',action:{type:'future_action'}},
    {type:'message',content:[{type:'output_text',text:'{}'}]}
  ]}
  const receipt=modelUsageReceipt(providerReceipt,{model:'gpt-5.6-sol',service_tier:'auto'})
  const reset=async()=>{
    for(const id of ids)await cancel(id)
    await db.query('delete from public.case_analysis_jobs where id=any($1)',[ids])
    await db.query('delete from private.case_model_calls where job_id=any($1)',[ids]);ids.length=0
    for(const p of policies)await db.query('update private.case_model_budget_policy set max_calls=$2,max_output_tokens=$3,max_request_bytes=$4,max_search_calls=$5,max_input_units=$6 where scope=$1',[p.scope,p.max_calls,p.max_output_tokens,p.max_request_bytes,p.max_search_calls,p.max_input_units])
  }
  let paid=0
  const run=(job,mode='ok',rpcClient=client)=>processCaseAnalysisJob({client:rpcClient,job,secret,providerKey:'synthetic-only',cacheNamespace:'synthetic-budget-deployment',advance:async({beforeRequest,onResponse})=>{
    await callModel('synthetic-only',{model:'gpt-5.6-sol',input:'synthetic',max_output_tokens:9000},{stage:'planning',deadline:Date.now()+10000,beforeRequest,onResponse,fetchImpl:async(url,options)=>{
      paid++
      assert.equal(JSON.parse(options.body).service_tier,'auto')
      assert.equal(JSON.parse(options.body).store,false)
      if(mode==='timeout')throw new DOMException('synthetic','TimeoutError')
      if(mode==='receipt')return Response.json(providerReceipt)
      return Response.json({id:'synthetic-budget',status:'completed',...(mode==='missing_usage'?{}:{usage:{input_tokens:100,output_tokens:100,input_tokens_details:{cached_tokens:20}}}),output_text:'{}'})
    }})
    return {status:'processing',state:{stage:'planning'}}
  }})
  try {
    for(const role of ['anon','authenticated']){
      await db.exec('set role '+role)
      await assert.rejects(db.query('select * from private.case_model_calls'),/permission denied/)
      await assert.rejects(db.query('select * from private.case_model_budget_policy'),/permission denied/)
      await assert.rejects(db.query('select public.reserve_case_model_call($1,$2,1,1,0,$3)',[crypto.randomUUID(),crypto.randomUUID(),'planning']),/permission denied/)
      await assert.rejects(db.query('select public.settle_case_model_call($1,$2,$3,1,1,0)',[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()]),/permission denied/)
      await assert.rejects(db.query('select public.settle_case_model_call_with_receipt($1,$2,$3,1,1,0,$4)',[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),receipt]),/permission denied/)
      await db.exec('reset role')
    }
    // Two concurrent attempts at the same lease can authorize only one request.
    let job=await fresh()
    const reservations=await Promise.all([reserve(job),reserve(job)])
    assert.equal(reservations.filter(r=>r?.reservation_id).length,1)
    const id=reservations.find(r=>r?.reservation_id).reservation_id
    assert.equal(await settle(job,id,100,9001),false)
    assert.equal(await settle({...job,lease:crypto.randomUUID()},id),false)
    assert.equal(await settle(job,id),true)
    assert.equal(await settle(job,id),true,'settlement replay is idempotent')
    assert.equal(await settle(job,id,100,0),false,'settlement cannot be replayed to refund spend')
    await reset()

    // Real worker callback -> private SQL receipt; requested auto is distinct
    // from the actual returned tier, and browsing is distinct from searches.
    assert.deepEqual([receipt.web_search_calls,receipt.web_search_completed_calls,receipt.web_open_calls,receipt.web_find_calls,receipt.web_unknown_calls],[2,1,1,1,1])
    assert.equal(receipt.service_tier,'priority');assert.equal(receipt.requested_service_tier,'auto')
    assert(!JSON.stringify(receipt).includes('PRIVATE'));assert(!JSON.stringify(receipt).includes('private.invalid'))
    const unknown=modelUsageReceipt({},{model:'gpt-5.6-sol',service_tier:'auto'})
    for(const key of ['service_tier','cache_read_tokens','cache_write_tokens','web_search_calls'])assert.equal(unknown[key],null)
    assert.equal(modelUsageReceipt({output:[]},{}).web_search_calls,0)
    assert.equal(modelUsageReceipt({...providerReceipt,usage:{input_tokens:100,input_tokens_details:{cached_tokens:80,cache_write_tokens:50}}},{}).cache_write_tokens,null)
    job=await fresh();await run(job,'receipt')
    const saved=(await db.query('select * from private.case_model_calls where job_id=$1',[job.id])).rows[0]
    assert.deepEqual(saved.billing_receipt,receipt)
    assert.equal(saved.input_units,82,'receipt never alters cache weighting')
    assert.equal(await settleReceipt(job,saved.id,receipt),true,'exact receipt replay')
    assert.equal(await settleReceipt(job,saved.id,{...receipt,service_tier:'default'}),false,'conflicting receipt cannot replace evidence')
    assert.equal(await settleReceipt(job,saved.id,receipt,100,0),false,'receipt replay cannot refund tokens')
    assert.equal(await settle(job,saved.id),true,'legacy RPC still works without changing the receipt')
    await reset()

    job=await fresh();const pending=await reserve(job)
    assert.equal(await settleReceipt({...job,lease:crypto.randomUUID()},pending.reservation_id,receipt),false)
    for(const invalid of [null,{},[],{...receipt,prompt:'PRIVATE'}, {...receipt,cache_write_tokens:81},{...receipt,cache_read_tokens:19},{...receipt,web_search_calls:-1},{...receipt,web_search_calls:1.5},{...receipt,web_search_calls:'2'},{...receipt,web_search_calls:null},{...receipt,response_id:'x'.repeat(129)},{...receipt,web_search_completed_calls:3}]){
      assert.equal(await settleReceipt(job,pending.reservation_id,invalid),false,'invalid evidence is rejected before settlement')
    }
    assert.equal(await scalar('select charged_output_tokens from private.case_model_calls where id=$1',[pending.reservation_id]),9000)
    assert.equal(await scalar('select settled_at from private.case_model_calls where id=$1',[pending.reservation_id]),null)
    await cancel(job.id)
    await db.exec('set role service_role')
    assert.equal(await settleReceipt(job,pending.reservation_id,unknown),true,'late receipt settles through service-only RPC')
    await db.exec('reset role')
    assert.equal((await stored(job.id)).status,'cancelled')
    assert.deepEqual(await scalar('select billing_receipt from private.case_model_calls where id=$1',[pending.reservation_id]),unknown,'missing evidence remains unknown')
    await reset()

    // Separate jobs share one global allowance; neither can read the same
    // remaining slot and authorize a second paid request.
    await db.exec("update private.case_model_budget_policy set max_calls=1 where scope='global'")
    job=await fresh()
    const secondCase=crypto.randomUUID()
    await db.query('insert into public.cases(id,owner_id) values($1,$2)',[secondCase,owner])
    const second=await scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[owner,secondCase,job.source_fingerprint,job.request])
    ids.push(second.id)
    const competing=await Promise.all([reserve(job),reserve(await claim(second.id))])
    assert.equal(competing.filter(value=>value?.reservation_id).length,1)
    assert.equal(competing.filter(value=>value?.limit==='global').length,1)
    // Cancel helper is scoped to the main fixture case; remove this synthetic
    // extra case explicitly and retain its content-free accounting until reset.
    await db.query('delete from public.cases where id=$1',[secondCase])
    await reset()

    // Every hard boundary blocks before fetch, and failure is terminal.
    for(const [field,value] of [['max_calls',1],['max_output_tokens',9000],['max_request_bytes',1],['max_input_units',82]]){
      await db.query(`update private.case_model_budget_policy set ${field}=$1 where scope='job'`,[value])
      job=await fresh();const before=paid
      await run(job)
      if(field!=='max_request_bytes')await run(await claim(job.id))
      assert.equal(paid-before,field==='max_request_bytes'?0:1)
      assert.equal((await stored(job.id)).error_code,'budget_limit')
      assert.equal(await scalar('select count(*)::integer from case_roadmaps where id=$1',[job.id]),0)
      await reset()
    }
    // Real raw usage may exceed the old token stop only when actual cache reads
    // justify the lower cost. Cache writes and predicted hits receive no credit.
    job=await fresh();let weighted=await reserve(job)
    assert.equal(await settle(job,weighted.reservation_id,650000,100,600000),true)
    assert.equal(await scalar('select input_units from private.case_model_calls where id=$1',[weighted.reservation_id]),110000)
    await finish(job,{status:'processing',stage:'planning',checkpoint:'synthetic-cache-budget'})
    assert((await reserve(await claim(job.id))).reservation_id,'provider-confirmed reuse fits the unchanged allowance')
    await reset()
    job=await fresh();weighted=await reserve(job)
    assert.equal(await settle(job,weighted.reservation_id,600000,100,0),true)
    await finish(job,{status:'processing',stage:'planning',checkpoint:'synthetic-cache-budget'})
    assert.equal((await reserve(await claim(job.id))).limit,'job','uncached input still stops at 600,000')
    await reset()
    job=await fresh();weighted=await reserve(job,9000,1200)
    assert.equal(await scalar('select input_units from private.case_model_calls where id=$1',[weighted.reservation_id]),1200,'unknown input keeps request-byte reservation')
    assert.equal(await settle(job,weighted.reservation_id,19,100,9),true)
    assert.equal(await scalar('select input_units from private.case_model_calls where id=$1',[weighted.reservation_id]),11,'fractional cached units round up')
    await reset()

    // An interrupted request keeps its maximum reservation through a retry.
    await db.exec("update private.case_model_budget_policy set max_output_tokens=9000 where scope='job'")
    job=await fresh();const beforeRetry=paid;await run(job,'timeout')
    assert.equal((await stored(job.id)).status,'queued')
    assert.equal(await scalar('select charged_output_tokens from private.case_model_calls where job_id=$1',[job.id]),9000)
    await db.query('update private.case_analysis_work set available_at=now() where job_id=$1',[job.id])
    await run(await claim(job.id))
    assert.equal(paid-beforeRetry,1);assert.equal((await stored(job.id)).error_code,'budget_limit')
    await reset()

    // Missing usage/failed accounting does not silently continue or free tokens.
    job=await fresh();await run(job,'missing_usage')
    assert.equal((await stored(job.id)).error_code,'budget_unavailable')
    assert.equal(await scalar('select charged_output_tokens from private.case_model_calls where job_id=$1',[job.id]),9000)
    await reset()
    job=await fresh();const beforeUnavailable=paid
    await run(job,'ok',{...client,rpc:(name,args)=>name==='reserve_case_model_call'?{error:{message:'synthetic unavailable'}}:client.rpc(name,args)})
    assert.equal(paid,beforeUnavailable);assert.equal((await stored(job.id)).error_code,'budget_unavailable')
    await reset()

    // A deleted case job does not refund the owner/global rolling budget.
    for(const scope of ['owner','global']){
      await db.query('update private.case_model_budget_policy set max_calls=1 where scope=$1',[scope])
      job=await fresh();await reserve(job);await cancel(job.id)
      await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
      const next=await fresh();assert.equal((await reserve(next)).limit,scope)
      // An earlier day's spend ceases to count in the rolling daily window.
      await db.query("update private.case_model_calls set created_at=now()-interval '25 hours' where job_id=$1",[job.id])
      assert((await reserve(next)).reservation_id)
      await reset()
    }
    job=await fresh()
    assert.equal(await reserve(job,9000,1000,3),null)
    await db.exec("update private.case_model_budget_policy set max_search_calls=1 where scope='job'")
    assert.equal((await reserve(job,9000,1000,2)).limit,'job')
    await cancel(job.id);assert.equal(await reserve(job),null,'cancelled leases cannot spend')
    await reset()
    job=await fresh();const late=await reserve(job);await cancel(job.id)
    assert.equal(await settle(job,late.reservation_id),true,'late usage may settle without restoring a cancelled job')
    assert.equal((await stored(job.id)).status,'cancelled')
    await reset()

    // Consent revoked after claim is checked again before spending.
    job=await fresh()
    await db.query('update account_privacy_settings set ai_processing_enabled=false where owner_id=$1',[owner])
    assert.equal(await reserve(job),null)
    await db.query('update account_privacy_settings set ai_processing_enabled=true where owner_id=$1',[owner])
    await reset()
    console.log('Budget: real SQL grants, atomic reservations, hard limits, durable content-free billing receipts, actual service tier, search/browse separation, unknown usage, replay, daily limits, cancellation and consent passed; zero real provider calls.')
  } finally {await db.exec('reset role');await reset()}
}
