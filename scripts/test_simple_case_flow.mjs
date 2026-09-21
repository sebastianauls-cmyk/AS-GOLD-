import assert from 'node:assert/strict'
import {prepareCaseDocuments,savePreparedCaseDocuments,preparationContext} from '../app/modules/cases/lib/casePreparation.mjs'
import {simpleCaseCopy} from '../app/modules/cases/lib/simpleCaseCopy.mjs'
import {updateDocumentRecord} from '../app/modules/services/documentRepository.js'
import {initializeDocumentReview} from '../app/modules/documents/documentAnalysisRecovery.mjs'

const item={id:'case',owner_id:'owner',home_country:'DE',target_country:'DE'}
const base={owner_id:'owner',case_id:'case',data_classification:'synthetic',updated_at:'2026-09-21T00:00:00Z'}
const docs=[{...base,id:'a',title:'One.pdf',file_path:'owner/one.pdf'},{...base,id:'b',title:'Two.pdf',file_path:'owner/two.pdf'},{...base,id:'c',title:'Three.txt',extracted_text:'Already saved original.'}]
const result={status:'completed',extracted_text:'A fictional original with no confirmed deadline.',summary:'A synthetic source.',next_step:'Ask for missing records.',assessment_reasoning:'Source review is pending.',output_language:'en',reference_language:'de',target_country:'DE'}
const options={item,documents:docs,outputLanguage:'en',referenceLanguage:'de'}
function retained(doc){
  const at='2026-09-21T00:01:00Z'
  const fresh={...doc,updated_at:at,ai_last_processed_at:at,analysis_draft:{document_id:doc.id,file_path:doc.file_path,data_classification:doc.data_classification,completed_at:at,result}}
  const {draft}=initializeDocumentReview(fresh,'en','DE')
  return {document:fresh,generated:{fields:{...draft,case_id:'wrong-suggestion'}}}
}
const cache=new Map([['a',retained(docs[0])]])
const calls=[]
const onRecover=async(doc,config)=>{assert.equal(config.includeDocument,true);calls.push(['recover',doc.id]);return cache.get(doc.id)||false}
const onAnalyze=async doc=>{calls.push(['analyze',doc.id]);assert.equal(doc.customer_copy_language,'en');assert.equal(doc.reference_copy_language,'de');cache.set(doc.id,retained(doc));return {fields:{}}}
const drafts=await prepareCaseDocuments({...options,documents:[...docs,{...docs[0],id:'other',owner_id:'someone'}],onAnalyze,onRecover})
assert.deepEqual(calls,[['recover','a'],['recover','b'],['analyze','b'],['recover','b']],'reuse complete drafts and original text; only missing documents reach AI')
assert.equal(drafts.length,2)
assert.ok(drafts.every(entry=>entry.draft.case_id===item.id),'model suggestions never reassign documents')
assert.ok(drafts.every(entry=>!entry.draft.source_reviewed),'preparation never asserts human verification')
const writes=[]
const saved=await savePreparedCaseDocuments({drafts,onSave:async(id,draft,config)=>{writes.push({id,config});return {...docs.find(doc=>doc.id===id),...draft}}})
assert.equal(saved.length,2)
assert.deepEqual(writes[0].config,{stayInCase:true,expectedUpdatedAt:'2026-09-21T00:01:00Z',expectedCaseId:'case'})
for(const patch of [{documents:[]},{documents:[{...docs[0],data_classification:'real'}]},{documents:[{...docs[0],file_path:'owner/file.exe'}]},{documents:Array.from({length:31},(_,i)=>({...docs[0],id:String(i)}))}]){
  await assert.rejects(prepareCaseDocuments({...options,...patch,onAnalyze:()=>assert.fail('must not transmit invalid input'),onRecover:()=>assert.fail('must validate first')}))
}
await assert.rejects(prepareCaseDocuments({...options,onRecover:async doc=>({...retained(doc),document:{...doc,owner_id:'foreign'}}),onAnalyze}),{code:'changed'})
await assert.rejects(prepareCaseDocuments({...options,isCurrent:()=>false,onRecover,onAnalyze}),{code:'changed'})
let attempted=[]
await assert.rejects(savePreparedCaseDocuments({drafts,onSave:async id=>{attempted.push(id);return false}}),{code:'saving_failed'})
assert.deepEqual(attempted,['a'],'no later writes or generation after an unsuccessful conditional save')
let retried=0
await assert.rejects(prepareCaseDocuments({...options,onRecover:async()=>false,onAnalyze:async()=>{retried++;return false}}),{code:'reading_failed'})
assert.equal(retried,1,'uncertain AI calls are not silently retried')
assert.notEqual(preparationContext(item,docs,'en','de'),preparationContext(item,docs.slice(1),'en','de'))
assert.notEqual(preparationContext(item,docs,'en','de'),preparationContext(item,docs,'fa','de'))
const filters=[]
const query={update(){return this},eq(key,value){filters.push([key,value]);return this},select(){return this},single(){return {data:{}}}}
updateDocumentRecord({from:()=>query},{ownerId:'owner',documentId:'a',draft:drafts[0].draft,expectedUpdatedAt:'fresh',expectedCaseId:'case'})
assert.deepEqual(filters,[['id','a'],['owner_id','owner'],['updated_at','fresh'],['case_id','case']])
for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])for(const [key,value] of Object.entries(simpleCaseCopy(lang)))assert.ok(typeof value==='string'&&value.trim(),`${lang}.${key}`)
console.log('Simple case flow passed: scoped preparation, consent boundaries, recovery, translation, preserved originals, conditional saves, no false human review, stop-on-failure and 11-language copy.')
