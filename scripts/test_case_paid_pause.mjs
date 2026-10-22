import assert from 'node:assert/strict'
import {caseModelBudget} from '../supabase/functions/_shared/caseModelBudget.mjs'
import {callModel} from '../supabase/functions/_shared/modelQuality.mjs'

export async function testCasePaidPause({db,client,enqueue,claim,cancel,scalar}){
  const submitted=await enqueue(),job=await claim(submitted.id)
  try{
    await db.exec('update private.case_analysis_config set enabled=false where singleton')
    await assert.rejects(enqueue(),/Background service unavailable/)
    let providerCalls=0
    const budget=caseModelBudget({client,job})
    await assert.rejects(callModel('synthetic-only',{model:'gpt-5.6-sol',input:'synthetic',max_output_tokens:100},{stage:'planning',deadline:Date.now()+10000,beforeRequest:budget.beforeRequest,onResponse:budget.onResponse,fetchImpl:async()=>{providerCalls++;throw Error('Provider must not be reached')}}),error=>error.code==='budget_limit'&&error.message.includes('pausiert'))
    assert.equal(providerCalls,0,'a lease obtained before the stop cannot spend afterward')
    assert.equal(await scalar('select count(*)::int from private.case_model_calls where job_id=$1',[job.id]),0)
    console.log('Paid pause: new submissions and already claimed leases blocked before provider transport; zero new reservations or model calls.')
  }finally{
    await cancel(submitted.id)
    await db.query('delete from public.case_analysis_jobs where id=$1',[submitted.id])
    await db.exec('update private.case_analysis_config set enabled=true where singleton')
  }
}
