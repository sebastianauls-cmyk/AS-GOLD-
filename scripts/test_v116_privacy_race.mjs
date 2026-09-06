import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { persistLegalSettings } from '../app/modules/services/complianceRepository.js'
import { uploadPrivateObject } from '../app/modules/services/documentRepository.js'

function mockSupabase({updates,inserts}){
  const calls=[]
  return {
    calls,
    from(table){
      assert.equal(table,'account_privacy_settings')
      return {
        update(payload){
          calls.push({operation:'update',payload})
          return {
            eq(column,value){
              calls.at(-1).filter={column,value}
              return {select(){return {maybeSingle:async()=>updates.shift()}}}
            }
          }
        },
        insert(payload){
          calls.push({operation:'insert',payload})
          return {select(){return {single:async()=>inserts.shift()}}}
        }
      }
    }
  }
}

const input={ownerId:'guest-1',privacyNoticeVersion:'privacy-v1',termsVersion:'terms-v1',acknowledgedAt:'2026-09-06T15:00:00.000Z'}

const existing=mockSupabase({updates:[{data:{owner_id:'guest-1'},error:null}],inserts:[]})
const existingResult=await persistLegalSettings(existing,input)
assert.equal(existingResult.error,null)
assert.deepEqual(existing.calls.map(call=>call.operation),['update'],'an existing privacy row must never enter the INSERT quota path')

const newAccount=mockSupabase({updates:[{data:null,error:null}],inserts:[{data:{owner_id:'guest-1'},error:null}]})
const insertedResult=await persistLegalSettings(newAccount,input)
assert.equal(insertedResult.error,null)
assert.deepEqual(newAccount.calls.map(call=>call.operation),['update','insert'],'a new account must insert only after an empty update')

const concurrent=mockSupabase({
  updates:[{data:null,error:null},{data:{owner_id:'guest-1'},error:null}],
  inserts:[{data:null,error:{code:'42501',message:'new row violates row-level security policy'}}]
})
const recoveredResult=await persistLegalSettings(concurrent,input)
assert.equal(recoveredResult.error,null)
assert.deepEqual(concurrent.calls.map(call=>call.operation),['update','insert','update'],'a concurrent initialisation must recover through the existing row')

const complianceSource=fs.readFileSync(new URL('../app/modules/services/complianceRepository.js',import.meta.url),'utf8')
const workspaceSource=fs.readFileSync(new URL('../app/modules/services/workspaceRepository.js',import.meta.url),'utf8')
const documentIntakeSource=fs.readFileSync(new URL('../app/modules/documents/DocumentFileIntake.js',import.meta.url),'utf8')
const documentWorkflowSource=fs.readFileSync(new URL('../app/modules/documents/documentWorkflow.js',import.meta.url),'utf8')
assert.doesNotMatch(complianceSource,/\.upsert\([^\n]*account_privacy_settings|account_privacy_settings'\)\.upsert/,'privacy persistence must not use the guest-blocked upsert path')
assert.match(workspaceSource,/persistLegalSettings/,'registration and manual acknowledgement must share the idempotent persistence path')
assert.match(documentIntakeSource,/name="sample_document"/,'the document intake must expose the built-in synthetic sample without a local file picker')
assert.match(documentIntakeSource,/required=\{!sampleSelected\}/,'a selected sample must satisfy native form validation')
assert.match(documentWorkflowSource,/fetch\('\/testdaten\/AS_Gold_Synthetischer_Testfall_V29\.pdf'/,'the upload workflow must load the real same-origin sample bytes')
assert.equal(APP_RELEASE.number,116)
assert.equal(APP_VERSION,'V116')

const file={name:'synthetic.pdf'}
const acceptedStorage={upload:async()=>({data:{path:'guest/synthetic.pdf'},error:null})}
assert.equal((await uploadPrivateObject(acceptedStorage,'guest/synthetic.pdf',file)).error,null)

let recoveredUploads=0
const responseLostStorage={
  upload:async()=>{recoveredUploads+=1;return {data:null,error:{name:'StorageUnknownError',message:'Failed to fetch'}}},
  createSignedUrl:async()=>({data:{signedUrl:'https://signed.invalid/object'},error:null})
}
assert.equal((await uploadPrivateObject(responseLostStorage,'guest/synthetic.pdf',file)).error,null)
assert.equal(recoveredUploads,1,'a lost response must not duplicate a file already stored')

let retryUploads=0
const transientStorage={
  upload:async()=>{retryUploads+=1;return retryUploads===1?{data:null,error:{name:'StorageUnknownError',message:'Failed to fetch'}}:{data:{path:'guest/synthetic.pdf'},error:null}},
  createSignedUrl:async()=>({data:null,error:{message:'Object not found'}})
}
assert.equal((await uploadPrivateObject(transientStorage,'guest/synthetic.pdf',file)).error,null)
assert.equal(retryUploads,2,'a missing object must be retried exactly once after a network interruption')

console.log('V116 regression passed: guest privacy is idempotent under RLS and interrupted private uploads recover without overwriting files.')
