import assert from 'node:assert/strict'
import {runBackgroundCaseRequest} from '../app/modules/services/backgroundCaseRequest.mjs'

const caseId='synthetic-case',old={id:'old',case_id:caseId,status:'completed'}
const networkError=Object.assign(new Error('Response lost'),{name:'FunctionsFetchError'})
const result=job=>({data:job?[job]:[],error:null})
for(const status of ['queued','running','completed','failed']){
  let saved=old,calls=0
  const next={id:'new',case_id:caseId,status}
  const response=await runBackgroundCaseRequest({caseId,readLatest:async()=>result(saved),enqueue:async()=>{
    calls++;saved=next
    if(status==='running')throw networkError
    return {data:null,error:networkError}
  }})
  assert.deepEqual(response,{data:{job:next},error:null},'recover the accepted job even if it has already finished')
  assert.equal(calls,1,'lost response must never resend enqueue')
}
for(const status of ['queued','running']){
  const active={...old,status}
  const response=await runBackgroundCaseRequest({caseId,readLatest:async()=>result(active),enqueue:()=>assert.fail('active job must be reused')})
  assert.equal(response.data.job,active)
}
for(const saved of [null,old,{id:'foreign',case_id:'another-case',status:'running'}]){
  let reads=0,calls=0
  const response=await runBackgroundCaseRequest({caseId,readLatest:async()=>result(reads++?saved:old),enqueue:async()=>{calls++;return {data:null,error:networkError}}})
  assert.equal(response.error,networkError,'missing, old and foreign jobs cannot be presented as a successful new request')
  assert.equal(calls,1)
}
for(const throws of [false,true]){
  const response=await runBackgroundCaseRequest({caseId,readLatest:async()=>{if(throws)throw networkError;return {data:null,error:networkError}},enqueue:()=>assert.fail('unknown prior state must not start paid work')})
  assert.equal(response.error,networkError)
}
let reads=0,calls=0
const unresolved=await runBackgroundCaseRequest({caseId,readLatest:async()=>reads++?{data:null,error:new Error('Status unavailable')}:result(old),enqueue:async()=>{calls++;return {data:null,error:networkError}}})
assert.equal(unresolved.error,networkError,'a failed reconciliation preserves the request failure')
assert.equal(calls,1)
const accepted={data:{job:{id:'accepted',case_id:caseId,status:'queued'}},error:null}
assert.equal(await runBackgroundCaseRequest({caseId,readLatest:async()=>result(old),enqueue:async()=>accepted}),accepted)
console.log('Background start: lost/thrown responses recover the saved job, active jobs are reused, stale/foreign jobs and unavailable status never cause an automatic second enqueue. No provider calls.')
