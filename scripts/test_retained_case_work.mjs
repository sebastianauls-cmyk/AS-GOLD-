import assert from 'node:assert/strict'
import {openRetainedCaseWork,sealRetainedCaseWork,retainedCaseWork} from '../supabase/functions/_shared/retainedCaseWork.mjs'
import {openModelCheckpoint} from '../supabase/functions/_shared/modelCheckpoint.mjs'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'

export async function testRetainedCaseWork({db,client,owner,caseId,secret,process,enqueue,claim,cancel,finish,stored,scalar,modelCalls}){
  const namespace='synthetic-retention-deployment',ids=[]
  const fresh=async(overrides={})=>{const job=await enqueue(overrides);ids.push(job.id);return job}
  const snapshot=()=>scalar('select row_to_json(s) from private.retained_case_work s where owner_id=$1 and case_id=$2',[owner,caseId])
  const run=job=>process(job,namespace)
  const cleanup=async()=>{
    for(const id of ids)await cancel(id)
    await db.query('delete from public.case_roadmaps where id=any($1)',[ids])
    await db.query('delete from public.case_analysis_jobs where id=any($1)',[ids]);ids.length=0
  }
  const stop=async job=>{
    await db.query("update public.case_analysis_jobs set expires_at=now()-interval '1 second' where id=$1",[job.id])
    await db.exec('select private.dispatch_case_analysis_jobs()')
    assert.equal((await stored(job.id)).status,'failed')
    assert.equal(await scalar('select checkpoint from private.case_analysis_work where job_id=$1',[job.id]),null)
  }
  try{
    // A real terminal lifetime stop after 11 successful paid stages. The new
    // explicit job needs only the twelfth stage and retains all review receipts.
    const before=modelCalls()
    let job=await fresh()
    for(let i=0;i<11;i++)await run(await claim(job.id))
    const encrypted=await snapshot()
    assert(encrypted?.ciphertext)
    assert.doesNotMatch(encrypted.ciphertext,/Auszahlung|Anlage|topics|reviewIds/)
    assert.equal(new Date(encrypted.expires_at)-new Date(encrypted.saved_at),24*60*60*1000)
    const originalId=job.id,originalExpiry=job.expires_at
    const originalSpend=await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[job.id])
    assert.equal(originalSpend,11)
    await stop(job)
    assert(await snapshot(),'terminal expiry preserves encrypted progress')
    assert.equal(await scalar("select count(*)::integer from public.case_analysis_jobs where owner_id=$1 and status in ('queued','running')",[owner]),0,'retention does not start another job')
    job=await fresh();assert.notEqual(job.id,originalId)
    assert.equal(new Date(job.expires_at)-new Date(job.created_at),60*60*1000)
    await run(await claim(job.id))
    assert.equal((await stored(job.id)).status,'completed')
    assert.equal(modelCalls()-before,12,'completed stages are not paid for again after terminal interruption')
    const result=await scalar('select result from public.case_roadmaps where id=$1',[job.id])
    assert.equal(result.analysis.verification.review_response_ids.length,8)
    assert.deepEqual([...new Set(result.analysis.verification.review_scopes)],['analysis','calculations','roadmap','letters'])
    assert.equal(await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[originalId]),originalSpend,'reuse never deletes or refunds original spend')
    assert.equal(await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[job.id]),1)
    assert(new Date((await stored(originalId)).expires_at)<new Date(originalExpiry),'old job is never renewed')
    assert.equal(await snapshot(),undefined,'completion deletes unfinished private work')
    await cleanup()

    // A new authorized job still shares the owner's original spend. Retention
    // must not turn a depleted daily model allowance into fresh provider calls.
    job=await fresh();await run(await claim(job.id));await stop(job)
    const ownerLimit=await scalar("select max_calls from private.case_model_budget_policy where scope='owner'")
    const used=await scalar("select count(*)::integer from private.case_model_calls where owner_id=$1 and created_at>=now()-interval '1 day'",[owner])
    await db.query("update private.case_model_budget_policy set max_calls=$1 where scope='owner'",[used])
    const limited=await fresh(),beforeLimit=modelCalls()
    await run(await claim(limited.id))
    assert.equal(modelCalls(),beforeLimit,'resuming retained work cannot bypass the remaining owner budget')
    assert.equal((await stored(limited.id)).error_code,'budget_limit')
    await db.query("update private.case_model_budget_policy set max_calls=$1 where scope='owner'",[ownerLimit])
    await cleanup()

    // Service-only storage: end users cannot read encrypted candidates or call
    // either RPC, even with a known job ID, lease or cache key.
    job=await fresh();const claimed=await claim(job.id);await run(claimed)
    const saved=await snapshot()
    for(const role of ['anon','authenticated']){
      await db.exec('set role '+role)
      await assert.rejects(db.query('select * from private.retained_case_work'),/permission denied/)
      await assert.rejects(db.query('select public.read_retained_case_work($1,$2,$3)',[job.id,claimed.lease,saved.cache_key]),/permission denied/)
      await assert.rejects(db.query('select public.save_retained_case_work($1,$2,$3,$4)',[job.id,claimed.lease,saved.cache_key,saved.ciphertext]),/permission denied/)
      await db.exec('reset role')
    }
    assert.equal(await scalar('select public.save_retained_case_work($1,$2,$3,$4)',[job.id,claimed.lease,saved.cache_key,saved.ciphertext]),false,'released lease cannot overwrite saved work')
    await stop(job)
    const newer=await fresh(),current=await claim(newer.id)
    assert.equal(await scalar('select public.read_retained_case_work($1,$2,$3)',[newer.id,crypto.randomUUID(),saved.cache_key]),null)
    assert.deepEqual(await scalar('select public.read_retained_case_work($1,$2,$3)',[newer.id,current.lease,'a'.repeat(64)]),{})
    await db.exec('set role service_role')
    assert((await scalar('select public.read_retained_case_work($1,$2,$3)',[newer.id,current.lease,saved.cache_key])).ciphertext,'authorized worker can load it')
    await db.exec('reset role')
    await cancel(newer.id)
    assert.equal(await snapshot(),undefined,'explicit cancellation clears retained work even from a previous job')
    await cleanup()

    for(const change of ['deployment','style','language','fingerprint']){
      job=await fresh();await run(await claim(job.id));await stop(job)
      const first=await snapshot()
      const next=await fresh(change==='style'?{style:{customer_name:'Andere Person',tone:'formal'}}:change==='language'?{output_language:'en'}:{})
      const nextClaim=await claim(next.id)
      const beforeChange=modelCalls()
      if(change==='fingerprint'){
        await db.query('update public.case_analysis_jobs set source_fingerprint=$2 where id=$1',[next.id,'b'.repeat(64)])
        assert.deepEqual(await scalar('select public.read_retained_case_work($1,$2,$3)',[next.id,nextClaim.lease,first.cache_key]),{})
      }else{
        await process(nextClaim,change==='deployment'?namespace+'-changed':namespace)
        assert.equal(modelCalls()-beforeChange,1)
        assert.equal((await stored(next.id)).stage,'generation','changed context starts with fresh planning')
      }
      await cleanup()
    }

    // Model instructions include the review date; changing it invalidates reuse
    // even with an identical source fingerprint, model and deployment.
    const fakeJob={id:crypto.randomUUID(),owner_id:owner,case_id:caseId,source_fingerprint:'c'.repeat(64),request:{},lease:crypto.randomUUID()}
    const keys=[]
    const fakeClient={rpc:async(name,args)=>{keys.push(args.p_cache_key);return {data:{},error:null}}}
    for(const instructions of ['Review date: 2026-09-23','Review date: 2026-09-24']){
      await (await retainedCaseWork({client:fakeClient,job:fakeJob,secret,namespace,request:{instructions},reviewContent:'same'})).restore()
    }
    assert.notEqual(keys[0],keys[1])

    // Both authenticated encryption and database expiry enforce retention.
    const now=Date.now(),originJobId=crypto.randomUUID(),binding='d'.repeat(64)
    const token=await sealRetainedCaseWork({state:{stage:'analysis',modelState:{attempt:3,reviewIds:['already-reviewed']}},binding,secret,originJobId,now})
    assert.equal((await openRetainedCaseWork({token,binding,secret,originJobId,now})).modelState.attempt,3,'correction history is preserved')
    for(const override of [{binding:'e'.repeat(64)},{secret:secret+'changed'},{originJobId:crypto.randomUUID()},{token:token.slice(0,-2)+'aa'},{now:now-1},{now:now+24*60*60*1000}]){
      await assert.rejects(openRetainedCaseWork({token,binding,secret,originJobId,now,...override}))
    }
    await assert.rejects(openModelCheckpoint({token,binding:{workflow:'background-complete-case-v165'},secret}),'retained data cannot become a job capability')
    job=await fresh();await run(await claim(job.id));await stop(job)
    await db.exec("update private.retained_case_work set saved_at=now()-interval '25 hours',expires_at=now()-interval '1 hour';update private.case_analysis_config set enabled=false")
    await db.exec('select private.dispatch_case_analysis_jobs()')
    assert.equal(await snapshot(),undefined,'minute dispatcher purges expired ciphertext while processing is paused')
    await assert.rejects(fresh(),/unavailable/)
    await db.exec('update private.case_analysis_config set enabled=true')
    await cleanup()

    for(const change of ['consent','access','ban','source_failure','review_failure']){
      job=await fresh();await run(await claim(job.id));assert(await snapshot())
      if(change==='consent')await db.query('update public.account_privacy_settings set ai_processing_enabled=false where owner_id=$1',[owner])
      else if(change==='access')await db.query('update private.user_access set active=false where user_id=$1',[owner])
      else if(change==='ban')await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1",[owner])
      else await finish(await claim(job.id),{status:'failed',code:change==='source_failure'?'source_changed':'review_failed'})
      assert.equal(await snapshot(),undefined,change+' deletes retained candidates')
      await db.query('update public.account_privacy_settings set ai_processing_enabled=true where owner_id=$1',[owner])
      await db.query('update private.user_access set active=true where user_id=$1',[owner])
      await db.query('update auth.users set banned_until=null where id=$1',[owner])
      await cleanup()
    }

    // Unavailable persistence stops before a provider call; no silently repeated
    // work. Actual provider budget tests run separately against real limits.
    job=await fresh();const beforeUnavailable=modelCalls()
    await processCaseAnalysisJob({client,job:await claim(job.id),secret,providerKey:'synthetic-only'})
    assert.equal(modelCalls(),beforeUnavailable)
    assert.equal((await stored(job.id)).error_code,'retained_work_unavailable')
    await cleanup()
    console.log('Retained work: terminal interruption resumes 11 completed stages with only 1 remaining model call; 8 required reviews, unchanged accounting, private access, expiry, context binding and deletion verified. All provider responses simulated.')
  }finally{await db.exec('reset role');await cleanup()}
}
