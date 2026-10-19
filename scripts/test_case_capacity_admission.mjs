import assert from 'node:assert/strict'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {openModelCheckpoint} from '../supabase/functions/_shared/modelCheckpoint.mjs'

// Real SQL admission/dispatch/lease/ledger; no provider or production writes.
export async function testCaseCapacityAdmission({db,client,owner,caseId,secret,enqueue,claim,cancel,stored,scalar}) {
  const policies=(await db.query('select * from private.case_model_budget_policy')).rows
  const people=[],cases=[],jobs=[]
  const reserve=(job,output=9000,bytes=1000)=>scalar('select public.reserve_case_model_call($1,$2,$3,$4,0,$5)',[job.id,job.lease,output,bytes,'planning'])
  const usage=()=>scalar("select to_jsonb(u) from private.case_capacity_usage('global',null) u")
  const restore=async()=>{
    for(const id of jobs)await scalar('select public.cancel_case_analysis_job(owner_id,case_id,id) from public.case_analysis_jobs where id=$1',[id])
    await db.query('delete from public.case_analysis_jobs where id=any($1)',[jobs])
    await db.query('delete from private.case_model_calls where job_id=any($1)',[jobs])
    await db.query('delete from public.cases where id=any($1)',[cases])
    await db.query('delete from private.user_access where user_id=any($1)',[people])
    await db.query('delete from public.account_privacy_settings where owner_id=any($1)',[people])
    await db.query('delete from auth.users where id=any($1)',[people])
    for(const p of policies)await db.query('update private.case_model_budget_policy set max_calls=$2,max_output_tokens=$3,max_request_bytes=$4,max_search_calls=$5,max_input_units=$6 where scope=$1',[p.scope,p.max_calls,p.max_output_tokens,p.max_request_bytes,p.max_search_calls,p.max_input_units])
  }
  try {
    // Exactly the observed production allowances, without an increase.
    await db.exec("update private.case_model_budget_policy set max_calls=48,max_output_tokens=160000,max_request_bytes=12000000,max_search_calls=12,max_input_units=3000000 where scope='job';update private.case_model_budget_policy set max_calls=150,max_output_tokens=440000,max_request_bytes=36000000,max_search_calls=60,max_input_units=8000000 where scope='global';update private.case_model_budget_policy set max_calls=146,max_output_tokens=440000,max_request_bytes=36000000,max_search_calls=52,max_input_units=8000000 where scope='owner';")
    const sample=await enqueue();jobs.push(sample.id)
    const request=await scalar('select request from private.case_analysis_work where job_id=$1',[sample.id])
    await cancel(sample.id)
    await db.query('delete from public.case_analysis_jobs where id=$1',[sample.id])
    for(let i=0;i<20;i++){
      const person=crypto.randomUUID(),id=crypto.randomUUID();people.push(person);cases.push(id)
      await db.query('insert into auth.users(id) values($1)',[person])
      await db.query("insert into private.user_access values($1,true,'approved','{\"full_analysis\":true,\"draft_letters\":true}')",[person])
      await db.query('insert into public.cases values($1,$2)',[id,person])
      await db.query("insert into public.account_privacy_settings values($1,true,'2026-08-30-v1',now(),'2026-08-30-test-v1',now())",[person])
    }
    const accepted=await Promise.all(people.map((person,i)=>scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[person,cases[i],sample.source_fingerprint,request])))
    jobs.push(...accepted.map(j=>j.id))
    assert.equal(new Set(accepted.map(j=>j.id)).size,20)
    assert.equal(await scalar('select count(*)::int from private.case_analysis_work where capacity is not null'),2)
    assert.equal(await scalar("select count(*)::int from public.case_analysis_jobs where stage='capacity' and id=any($1)",[jobs]),18)
    assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=any($1)',[jobs]),0,'waiting and admission are not paid model requests')
    const duplicate=await scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[people[19],cases[19],sample.source_fingerprint,request])
    assert.equal(duplicate.id,accepted[19].id)
    assert.deepEqual(await usage(),{calls:96,output_tokens:320000,request_bytes:24000000,search_calls:24,input_units:6000000})
    const waiting=accepted.find(j=>j.stage==='capacity')
    assert.equal(await scalar('select public.claim_case_analysis_job($1,$2)',[waiting.id,'a'.repeat(64)]),null)
    assert.equal(await scalar('select public.reserve_case_model_call($1,$2,1,1,0,$3)',[waiting.id,crypto.randomUUID(),'planning']),null)
    const first=await claim(accepted[0].id),before=await usage()
    const reservations=await Promise.all([reserve(first),reserve(first)])
    assert.equal(reservations.filter(r=>r?.reservation_id).length,1,'single lease cannot authorize duplicate calls')
    assert.deepEqual(await usage(),before,'a request consumes its own hold without stealing another job capacity')
    const reserved=reservations.find(r=>r?.reservation_id)
    assert.equal(await scalar('select public.settle_case_model_call($1,$2,$3,100,100,20)',[first.id,first.lease,reserved.reservation_id]),true)
    assert.deepEqual(await usage(),before,'settlement frees capacity within the admitted envelope only')
    await scalar('select public.cancel_case_analysis_job($1,$2,$3)',[first.owner_id,first.case_id,first.id])
    assert.equal((await stored(waiting.id)).stage,'planning','cancellation automatically admits the oldest fitting waiting job')
    assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=any($1)',[jobs]),1)
    const after=await usage()
    assert.equal(after.calls,97,'spent charges survive cancellation in addition to two active envelopes')

    // Revoked consent never admits a waiting request; it is stopped at dispatch.
    const revoked=accepted[19]
    await db.query('update public.account_privacy_settings set ai_processing_enabled=false where owner_id=$1',[people[19]])
    await scalar('select private.dispatch_case_analysis_jobs()')
    assert.equal((await stored(revoked.id)).status,'failed')
    assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=$1',[revoked.id]),0)
    const expired=accepted[18]
    await db.query("update public.case_analysis_jobs set expires_at=now()-interval '1 second' where id=$1",[expired.id])
    await scalar('select private.dispatch_case_analysis_jobs()')
    assert.equal((await stored(expired.id)).status,'failed')

    for(const role of ['anon','authenticated','service_role']){
      await db.exec('set role '+role)
      await assert.rejects(db.query('select private.admit_case_capacity($1)',[waiting.id]),/permission denied/)
      await assert.rejects(db.query("select * from private.case_capacity_usage('global',null)"),/permission denied/)
      await db.exec('reset role')
    }
    await restore();jobs.length=0;people.length=0;cases.length=0

    // A full daily ledger queues even the first call. It never starts a job
    // merely because one request would fit. Queue time does not age checkpoints.
    await db.exec("update private.case_model_budget_policy set max_calls=39 where scope='global'")
    const delayed=await enqueue();jobs.push(delayed.id)
    assert.equal(delayed.stage,'capacity')
    assert.equal(await scalar('select count(*)::int from private.test_dispatch where body->>\'job_id\'=$1',[delayed.id]),0)
    await db.query("update public.case_analysis_jobs set created_at=now()-interval '2 hours' where id=$1",[delayed.id])
    await db.exec("update private.case_model_budget_policy set max_calls=120 where scope='global'")
    await scalar('select private.dispatch_case_analysis_jobs()')
    const job=await claim(delayed.id)
    assert(Date.parse(job.checkpoint_issued_at)>Date.parse(job.created_at)+3600000)
    await processCaseAnalysisJob({client,job,secret,providerKey:'synthetic-only',cacheNamespace:'capacity-test',advance:async()=>({status:'processing',state:{stage:'planning'}})})
    assert.equal((await stored(job.id)).status,'queued')
    const next=await claim(job.id)
    assert.equal(next.checkpoint_issued_at,job.checkpoint_issued_at,'reclaims do not reset the hour')
    const binding={workflow:'background-complete-case-v165',owner_id:job.owner_id,case_id:job.case_id,fingerprint:job.source_fingerprint,outputLanguage:job.request.output_language,referenceLanguage:job.request.reference_language,style:job.request.style,draft_letters:job.request.draft_letters}
    const checkpoint=await openModelCheckpoint({token:next.checkpoint,binding,secret})
    assert.equal(checkpoint.issuedAt,Date.parse(job.checkpoint_issued_at))
    // Input reservation must fit before dispatch, not only after overshoot.
    await db.exec("update private.case_model_budget_policy set max_input_units=10 where scope='job'")
    assert.equal((await reserve(next,1,11)).limit,'job')
    assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=$1',[job.id]),0)
    console.log('Capacity: 20 accepted, 2 admitted, 18 waiting; no paid calls; duplicate/consent/expiry/ledger/checkpoint boundaries passed.')
  } finally {await db.exec('reset role');await restore()}
}
