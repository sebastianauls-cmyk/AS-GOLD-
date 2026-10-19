import assert from 'node:assert/strict'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {caseResponseCache} from '../supabase/functions/_shared/caseResponseCache.mjs'
import {sealRetainedCaseWork} from '../supabase/functions/_shared/retainedCaseWork.mjs'

export async function testCaseResponseCache({db,client,owner,caseId,secret,enqueue,claim,cancel,finish,stored,scalar,modelCalls}){
  const ids=[],requests=[],fetchModel=globalThis.fetch
  globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return fetchModel(url,options)}
  const fresh=async(overrides={})=>{const job=await enqueue(overrides);ids.push(job.id);return job}
  const run=(job,deployment='cache-test-deployment-a',overrides={})=>processCaseAnalysisJob({client,job,secret,providerKey:'synthetic-only',cacheNamespace:deployment,reuseValidatedResponses:true,...overrides})
  const rows=()=>db.query('select * from private.case_response_cache where owner_id=$1 and case_id=$2 order by saved_at,cache_key',[owner,caseId]).then(result=>result.rows)
  const cleanup=async()=>{for(const id of ids)await cancel(id);await db.query('delete from public.case_roadmaps where id=any($1)',[ids]);await db.query('delete from public.case_analysis_jobs where id=any($1)',[ids]);ids.length=0;requests.length=0}
  try{
    let first=await fresh(),before=modelCalls()
    for(let i=0;i<8;i++)await run(await claim(first.id))
    assert.equal(modelCalls()-before,8)
    const entries=await rows()
    assert.equal(entries.length,5,'five validated generation stages are available; independent reviews are excluded')
    assert(entries.every(row=>!row.ciphertext.includes('Auszahlung')&&!row.ciphertext.includes('output_text')))
    const firstSpend=await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[first.id])
    await finish(await claim(first.id),{status:'failed',code:'review_unresolved',issues:[{code:'meaning',location:'letters',reason:'Synthetic later-stage defect'}]})
    assert.equal((await rows()).length,5,'a later review defect does not erase previously validated drafts')
    const next=await fresh(),started=modelCalls()
    for(let i=0;i<15&&(await stored(next.id)).status!=='completed';i++)await run(await claim(next.id),'cache-test-deployment-b')
    assert.equal((await stored(next.id)).status,'completed')
    assert.equal(modelCalls()-started,4,'restart after deployment reuses all five generation stages; all four independent reviews run')
    assert.equal(await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[next.id]),4,'replay makes no reservation and is never charged again')
    assert.equal(await scalar('select count(*)::integer from private.case_model_calls where job_id=$1',[first.id]),firstSpend,'original spend is retained')
    assert.equal((await scalar('select result from public.case_roadmaps where id=$1',[next.id])).analysis.verification.review_response_ids.length,4)
    assert.equal((await rows()).length,0,'successful delivery removes unfinished response storage')
    console.log('Response cache: identical restart after a later defect/new deployment uses 4 instead of 9 simulated provider calls; all four independent reviews remain mandatory.')
    await cleanup()

    // Fresh source/request/options are checked independently of deployment.
    first=await fresh();await run(await claim(first.id))
    const saved=(await rows())[0],originalRequest=requests[0]
    await finish(await claim(first.id),{status:'failed',code:'provider_quota'})
    const retry=await fresh(),lease=await claim(retry.id)
    const cache=caseResponseCache({client,job:lease,secret})
    assert((await cache.read(originalRequest,'planning'))?.parsed)
    for(const changed of [{...originalRequest,instructions:originalRequest.instructions+' Changed rule.'},{...originalRequest,model:'different-model'},{...originalRequest,input:[{role:'user',content:[{type:'input_text',text:'different original'}]}]}])assert.equal(await cache.read(changed,'planning'),null)
    for(const field of ['owner_id','case_id','source_fingerprint'])assert.equal(await caseResponseCache({client,job:{...lease,[field]:field==='source_fingerprint'?'a'.repeat(64):crypto.randomUUID()},secret}).read(originalRequest,'planning'),null)
    assert.equal(await caseResponseCache({client,job:{...lease,request:{...lease.request,output_language:'en'}},secret}).read(originalRequest,'planning'),null)
    const denyClient={rpc:async()=>{throw Error('excluded stage must never access cache')}}
    for(const stage of ['research','research_recovery','review','correction'])assert.equal(await caseResponseCache({client:denyClient,job:lease,secret}).read(originalRequest,stage),null)
    assert.equal(await caseResponseCache({client:denyClient,job:lease,secret}).read({...originalRequest,tools:[{type:'web_search'}]},'planning'),null)
    for(const role of ['anon','authenticated']){
      await db.exec('set role '+role)
      await assert.rejects(db.query('select * from private.case_response_cache'),/permission denied/)
      await assert.rejects(db.query('select public.read_case_response_cache($1,$2,$3)',[retry.id,lease.lease,saved.cache_key]),/permission denied/)
      await assert.rejects(db.query('select public.save_case_response_cache($1,$2,$3,$4,$5,$6)',[retry.id,lease.lease,saved.cache_key,'planning',saved.response_id,saved.ciphertext]),/permission denied/)
      await db.exec('reset role')
    }
    assert.equal(await scalar('select public.read_case_response_cache($1,$2,$3)',[retry.id,crypto.randomUUID(),saved.cache_key]),null)
    assert.equal(await scalar('select public.save_case_response_cache($1,$2,$3,$4,$5,$6)',[retry.id,lease.lease,'b'.repeat(64),'planning','unbilled',saved.ciphertext]),false,'cannot save without matching settled provider receipt')
    assert.equal(await scalar('select public.save_case_response_cache($1,$2,$3,$4,$5,$6)',[retry.id,lease.lease,'b'.repeat(64),'review',saved.response_id,saved.ciphertext]),false,'SQL independently rejects review caching')
    const oldSavedAt=saved.saved_at
    await run(lease,'different-deployment')
    assert.equal(new Date((await rows())[0].saved_at).getTime(),new Date(oldSavedAt).getTime(),'replay cannot extend lifetime')
    await cancel(retry.id);assert.equal((await rows()).length,0,'explicit cancellation discards cached drafts')
    await cleanup()

    // A cached response is still subject to current validators. Invalid newly
    // generated scope must never be committed merely because JSON parsed.
    first=await fresh();const paidFetch=globalThis.fetch
    globalThis.fetch=async()=>Response.json({id:'invalid-scope',status:'completed',usage:{input_tokens:100,output_tokens:100},output_text:JSON.stringify({issues:[],research_topics:[]})})
    await run(await claim(first.id))
    assert.equal((await stored(first.id)).error_code,'scope_invalid')
    assert.equal((await rows()).length,0)
    globalThis.fetch=paidFetch
    await cleanup()

    // A response accepted under an earlier validator is still only a draft.
    // Simulate a newly rejected scope inside an authentic encrypted envelope.
    first=await fresh();await run(await claim(first.id))
    const prior=(await rows())[0]
    await finish(await claim(first.id),{status:'failed',code:'provider_quota'})
    const oldDraft={parsed:{issues:[],research_topics:[]},response_id:prior.response_id,model:'gpt-5.6-sol',response:{id:prior.response_id,status:'completed'}}
    const oldCiphertext=await sealRetainedCaseWork({state:oldDraft,binding:'ash-validated-case-response-v1:'+prior.cache_key,secret,originJobId:prior.origin_job_id})
    await db.query('update private.case_response_cache set ciphertext=$1 where cache_key=$2',[oldCiphertext,prior.cache_key])
    const revalidate=await fresh(),beforeRevalidation=modelCalls()
    await run(await claim(revalidate.id),'changed-validator-deployment')
    assert.equal((await stored(revalidate.id)).error_code,'scope_invalid','current validation cannot be bypassed with an older cached draft')
    assert.equal(modelCalls(),beforeRevalidation)
    assert.equal(await scalar('select count(*)::integer from public.case_roadmaps where id=$1',[revalidate.id]),0)
    await cleanup()

    // Successful cached drafts cannot fund a fresh paid independent review.
    first=await fresh();for(let i=0;i<4;i++)await run(await claim(first.id))
    await finish(await claim(first.id),{status:'failed',code:'provider_quota'})
    const limit=await scalar("select max_calls from private.case_model_budget_policy where scope='owner'")
    const used=await scalar("select count(*)::integer from private.case_model_calls where owner_id=$1 and created_at>=now()-interval '1 day'",[owner])
    await db.query("update private.case_model_budget_policy set max_calls=$1 where scope='owner'",[used])
    const limited=await fresh(),beforeLimit=modelCalls()
    for(let i=0;i<5;i++)await run(await claim(limited.id),'third-deployment')
    assert.equal((await stored(limited.id)).error_code,'budget_limit')
    assert.equal(modelCalls(),beforeLimit,'four cached stages cost zero new calls; genuine review stops at unchanged budget')
    await db.query("update private.case_model_budget_policy set max_calls=$1 where scope='owner'",[limit])
    await cleanup()

    for(const change of ['consent','privacy_version','access','ban','expiry','corruption']){
      first=await fresh();await run(await claim(first.id));assert.equal((await rows()).length,1)
      if(change==='consent')await db.query('update public.account_privacy_settings set ai_processing_enabled=false where owner_id=$1',[owner])
      if(change==='privacy_version')await db.query("update public.account_privacy_settings set privacy_notice_version='changed' where owner_id=$1",[owner])
      if(change==='access')await db.query('update private.user_access set active=false where user_id=$1',[owner])
      if(change==='ban')await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1",[owner])
      if(change==='expiry'){
        await db.exec("update private.case_response_cache set saved_at=now()-interval '25 hours',expires_at=now()-interval '1 hour';update private.case_analysis_config set enabled=false;select private.dispatch_case_analysis_jobs()")
        await db.exec('update private.case_analysis_config set enabled=true')
      }
      if(change==='corruption'){
        await finish(await claim(first.id),{status:'failed',code:'provider_quota'})
        await db.exec("update private.case_response_cache set ciphertext='corrupted.ciphertext'")
        const corrupt=await fresh(),beforeCorrupt=modelCalls()
        await run(await claim(corrupt.id),'fourth-deployment')
        assert.equal((await stored(corrupt.id)).error_code,'retained_work_invalid')
        assert.equal(modelCalls(),beforeCorrupt,'corruption stops before a paid replacement')
      }else assert.equal((await rows()).length,0,change+' purges cached private data')
      await db.query("update public.account_privacy_settings set ai_processing_enabled=true,privacy_notice_version='2026-08-30-v1' where owner_id=$1",[owner])
      await db.query('update private.user_access set active=true where user_id=$1',[owner])
      await db.query('update auth.users set banned_until=null where id=$1',[owner])
      await cleanup()
    }
    console.log('Response cache: source/options/model/prompt isolation, current validation, unchanged budgets, receipts, service-only access, cancellation, consent, expiry and tamper protection passed. Zero external requests.')
  }finally{globalThis.fetch=fetchModel;await db.exec('reset role');await cleanup()}
}
