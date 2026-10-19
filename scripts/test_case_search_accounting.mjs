import assert from 'node:assert/strict'
import {modelUsageReceipt} from '../supabase/functions/_shared/modelUsageReceipt.mjs'

// Exercise real reservation, receipt settlement, dispatch and rolling limits.
// No provider requests: receipts contain synthetic counts, never real content.
export async function testCaseSearchAccounting({db,owner,caseId,enqueue,claim,cancel,finish,stored,scalar,applyMigration}) {
  const policies=(await db.query('select * from private.case_model_budget_policy')).rows
  const jobs=[],cases=[]
  const fresh=async()=>{const job=await enqueue();jobs.push(job.id);return claim(job.id)}
  const reserve=(job,search=2)=>scalar('select public.reserve_case_model_call($1,$2,1000,1000,$3,$4)',[job.id,job.lease,search,'research'])
  const usage=(scope='global',job=null)=>scalar('select search_calls from private.case_capacity_usage($1,$2,$3)',[scope,owner,job])
  const receipt=(types=['search','search','search'])=>modelUsageReceipt({id:'synthetic-search-count',model:'gpt-5.6-sol',service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:100,input_tokens_details:{cached_tokens:20}},output:types.map(type=>({type:'web_search_call',status:'completed',action:{type}}))},{model:'gpt-5.6-sol',max_tool_calls:2})
  const settle=(job,id,evidence=receipt())=>scalar('select public.settle_case_model_call_with_receipt($1,$2,$3,100,100,20,$4)',[job.id,job.lease,id,evidence])
  const reset=async()=>{
    for(const id of jobs)await scalar('select public.cancel_case_analysis_job(owner_id,case_id,id) from public.case_analysis_jobs where id=$1',[id])
    await db.query('delete from public.case_analysis_jobs where id=any($1)',[jobs])
    await db.query('delete from private.case_model_calls where job_id=any($1)',[jobs])
    await db.query('delete from public.cases where id=any($1)',[cases])
    jobs.length=0;cases.length=0
    for(const p of policies)await db.query('update private.case_model_budget_policy set max_search_calls=$2 where scope=$1',[p.scope,p.max_search_calls])
  }
  try {
    await db.exec("update private.case_model_budget_policy set max_search_calls=2 where scope='job';update private.case_model_budget_policy set max_search_calls=4 where scope='global'")
    let job=await fresh(),reservation=await reserve(job)
    const evidence=receipt()
    assert.equal(await settle(job,reservation.reservation_id,evidence),true)
    assert.equal(await usage('job',job.id),2,'reproduce historical undercount before migration')
    if(applyMigration)await applyMigration()
    assert.equal(await usage('job',job.id),3,'three returned searches must consume three units, even if only two were reserved')
    assert.equal(await usage(),3,'an exceeded envelope cannot hide the extra search')
    assert.equal(await scalar('select search_calls from private.case_model_calls where id=$1',[reservation.reservation_id]),2,'original reservation is retained')
    assert.deepEqual(await scalar('select billing_receipt from private.case_model_calls where id=$1',[reservation.reservation_id]),evidence,'migration preserves the original receipt')
    assert.equal(await settle(job,reservation.reservation_id,evidence),true,'exact replay remains idempotent')
    assert.equal(await settle(job,reservation.reservation_id,receipt(['search','search'])),false,'conflicting evidence cannot lower usage')
    assert.equal(await usage('job',job.id),3)
    await finish(job,{status:'processing',stage:'planning',checkpoint:'synthetic-search-state'})
    job=await claim(job.id)
    assert.equal((await reserve(job,0)).limit,'job','an exceeded job stops before another model reservation')
    await cancel(job.id)
    await db.query('delete from public.case_analysis_jobs where id=$1',[job.id])
    assert.equal(await usage(),3,'cancellation and deletion cannot refund observed searches')
    const secondCase=crypto.randomUUID();cases.push(secondCase)
    await db.query('insert into public.cases values($1,$2)',[secondCase,owner])
    const next=await scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[owner,secondCase,job.source_fingerprint,job.request]);jobs.push(next.id)
    assert.equal(next.stage,'capacity','actual prior use prevents admitting an unfunded whole job')
    assert.equal(await scalar('select attempts from private.case_analysis_work where job_id=$1',[next.id]),0)
    assert.equal(await scalar("select count(*)::int from private.test_dispatch where body->>'job_id'=$1",[next.id]),0,'no worker request while waiting')
    await db.query("update private.case_model_calls set created_at=now()-interval '25 hours' where job_id=$1",[job.id])
    await scalar('select private.dispatch_case_analysis_jobs()')
    assert.equal((await stored(next.id)).stage,'planning','normal rolling expiry releases capacity')
    assert.equal(await usage('job',job.id),3,'job lifetime usage never rolls off')
    await reset()

    // A late receipt must count after cancellation; missing or smaller evidence
    // keeps the original reservation. Known browsing is not charged as search.
    const examples=[
      {types:['search','open_page','find_in_page'],expected:2},
      {types:['search','search','future_action'],expected:3},
      {types:[],expected:2},
      {types:null,expected:2},
      {types:['search','search','search'],expected:3}
    ]
    for(const example of examples){
      job=await fresh();reservation=await reserve(job)
      assert.equal(await scalar('select charged_search_calls from private.case_model_calls where id=$1',[reservation.reservation_id]),2,'unknown in-flight use retains reservation')
      await cancel(job.id)
      const late=example.types===null?modelUsageReceipt({usage:{input_tokens:100,input_tokens_details:{cached_tokens:20}}},{}):receipt(example.types)
      await db.exec('set role service_role')
      assert.equal(await settle(job,reservation.reservation_id,late),true)
      await db.exec('reset role')
      assert.equal(await usage(),example.expected)
      assert.equal((await stored(job.id)).status,'cancelled')
      await reset()
    }

    // Each of the three limits must reject the next request using actual use.
    for(const scope of ['job','owner','global']){
      await db.exec("update private.case_model_budget_policy set max_search_calls=case when scope='job' then 4 else 10 end")
      job=await fresh();reservation=await reserve(job)
      assert.equal(await settle(job,reservation.reservation_id),true)
      assert.equal(await usage(),4,'spent work and unused hold are not counted twice')
      await finish(job,{status:'processing',stage:'planning',checkpoint:'synthetic-search-state'})
      const nextLease=await claim(job.id)
      await db.query('update private.case_model_budget_policy set max_search_calls=3 where scope=$1',[scope])
      assert.equal((await reserve(nextLease,1)).limit,scope)
      assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=$1',[job.id]),1,'limit rejection creates no new model reservation')
      await reset()
    }
    for(const role of ['anon','authenticated','service_role']){
      await db.exec('set role '+role)
      await assert.rejects(db.query('select charged_search_calls from private.case_model_calls'),/permission denied/)
      await assert.rejects(db.query("select * from private.case_capacity_usage('global',null)"),/permission denied/)
      await db.exec('reset role')
    }
    console.log('Actual search accounting: historical backfill, excess use, hold conservation, job/owner/global limits, queue, cancellation/deletion, late and unknown receipts, replay and access passed. Zero external calls.')
  } finally {await db.exec('reset role');await reset()}
}
