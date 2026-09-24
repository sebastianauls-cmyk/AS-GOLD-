import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {uploadWorkspaceDocument} from '../app/modules/services/documentRepository.js'
import {recordCommittedAction} from '../app/modules/workspace/committedAction.mjs'
import {documentUploadReadinessMessage,parseIntakeQuality,validateDocumentUploadReadiness} from '../app/modules/documents/documentUploadReadiness.mjs'
import {currentAssessments} from '../app/modules/cases/lib/caseEvidence.mjs'
import {caseGuidanceCopy} from '../app/modules/cases/lib/caseGuidanceCopy.mjs'

// Real upload repository and UI workflow; only transport, storage and audit are
// simulated. None of these failures may trigger a model call or destroy a file.
function transport({delivery='lost',commit=true,read='ok'}={}){
  const state={delivery,commit,read,uploads:0,inserts:0,removals:0,filters:[],rows:new Map(),objects:new Set()}
  const storage={upload:async(path)=>{state.uploads++;state.objects.add(path);return {data:{path},error:null}},createSignedUrl:async path=>({data:state.objects.has(path)?{signedUrl:'https://synthetic.invalid/file'}:null,error:null}),remove:async paths=>{state.removals++;paths.forEach(path=>state.objects.delete(path));return {error:null}}}
  const client={storage:{from:()=>storage},from(table){
    assert.equal(table,'documents')
    let payload;const filters=[]
    return {select(){return this},eq(key,value){filters.push([key,value]);return this},insert(value){payload=structuredClone(value);return this},async single(){
      state.inserts++;state.beforeInsert?.(payload)
      if(state.rows.has(payload.id))return {data:null,error:{code:'23505',message:'duplicate key'}}
      if(state.delivery==='rejected')return {data:null,error:{code:'23514',message:'Test constraint rejected'}}
      if(state.commit)state.rows.set(payload.id,payload)
      if(state.delivery==='throw')throw new TypeError('Failed to fetch')
      if(state.delivery==='empty')return {data:null,error:null}
      return state.delivery==='ok'?{data:payload,error:null}:{data:null,error:{message:'TypeError: Failed to fetch',code:''},status:0}
    },async maybeSingle(){
      state.filters.push(filters)
      if(state.read==='throw')throw new TypeError('Failed to fetch')
      if(state.read==='error')return {data:null,error:{message:'Read unavailable'}}
      if(state.read==='foreign')return {data:{...state.rows.values().next().value,owner_id:'another-owner'},error:null}
      return {data:[...state.rows.values()].find(row=>filters.every(([key,value])=>row[key]===value))||null,error:null}
    }}
  }}
  return {client,state}
}
const owner='synthetic-owner'
const options=file=>({ownerId:owner,file,caseId:'synthetic-case',dataClassification:'synthetic',privacyNoticeVersion:'test',voiceContext:'Erfundene Zusatzangabe',attempt:{current:null}})
for(const [name,text] of [['Rechnung.txt','Synthetische Rechnung: 900 EUR offen.'],['Antwort.txt','Synthetische Behördenantwort: Unterlage fehlt.'],['Deposit.csv','SYNTHETIC,deposit,1250']]){
  for(const delivery of ['lost','throw','empty','ok']){
    const input=options(new File([text],name)),{client,state}=transport({delivery})
    const result=await uploadWorkspaceDocument(client,input)
    assert.equal(result.error,null,delivery+' must recover a committed upload')
    assert.equal(result.data.extracted_text,text)
    assert.equal(result.data.voice_context,input.voiceContext)
    assert.equal(state.rows.size,1);assert.equal(state.objects.size,1);assert.equal(state.removals,0)
    assert.equal(state.uploads,1);assert.equal(state.inserts,1);assert.equal(input.attempt.current,null)
    assert.ok(state.filters.every(filters=>filters.some(([key,value])=>key==='owner_id'&&value===owner)&&filters.some(([key])=>key==='id')&&filters.some(([key])=>key==='file_path')))
  }
}
for(const read of ['error','throw','foreign']){
  const input=options(new File(['SYNTHETIC'],'Source.txt')),{client,state}=transport({read})
  input.intakeQuality={state:'good',checked_at:'2026-09-24T10:00:00Z'}
  assert.equal((await uploadWorkspaceDocument(client,input)).error.code,'DOCUMENT_UPLOAD_CONFIRMATION_PENDING')
  assert.equal(state.removals,0);assert.equal(state.objects.size,1)
  // A newly rendered workflow receives the same attempt ref and selected file.
  state.read='ok'
  const restored=await uploadWorkspaceDocument(client,{...input,intakeQuality:{...input.intakeQuality,checked_at:'2026-09-24T10:01:00Z'}})
  assert.equal(restored.error,null);assert.equal(state.inserts,1);assert.equal(state.uploads,1)
}
for(const delayedCommit of [false,true]){
  const input=options(new File(['SYNTHETIC'],'Late.txt')),{client,state}=transport({commit:false})
  assert.equal((await uploadWorkspaceDocument(client,input)).error.code,'DOCUMENT_UPLOAD_CONFIRMATION_PENDING')
  const pending=structuredClone(input.attempt.current.payload)
  if(delayedCommit)state.beforeInsert=payload=>state.rows.set(payload.id,pending)
  state.delivery='ok';state.commit=true
  const completed=await uploadWorkspaceDocument(client,input)
  assert.equal(completed.error,null);assert.equal(completed.data.id,pending.id)
  assert.equal(state.rows.size,1);assert.equal(state.objects.size,1);assert.equal(state.uploads,1);assert.equal(state.removals,0)
}
{
  const input=options(new File(['SYNTHETIC'],'Rejected.txt')),{client,state}=transport({delivery:'rejected'})
  assert.equal((await uploadWorkspaceDocument(client,input)).error.code,'23514')
  assert.equal(state.rows.size,0);assert.equal(state.objects.size,0);assert.equal(state.removals,1)
}
{
  const input=options(new File(['SYNTHETIC'],'Uncertain.txt')),{client,state}=transport({commit:false})
  await uploadWorkspaceDocument(client,input)
  state.delivery='rejected'
  assert.equal((await uploadWorkspaceDocument(client,input)).error.code,'DOCUMENT_UPLOAD_CONFIRMATION_PENDING')
  assert.equal(state.removals,0,'a later rejection cannot prove that an earlier pending commit failed')
}
{
  const input=options(new File(['SYNTHETIC'],'Same.txt')),{client,state}=transport({commit:false})
  await uploadWorkspaceDocument(client,input)
  const previous=input.attempt.current.payload.id
  const next=await uploadWorkspaceDocument(client,{...input,ownerId:'new-owner'})
  assert.equal(next.error.code,'DOCUMENT_UPLOAD_CONFIRMATION_PENDING')
  assert.notEqual(input.attempt.current.payload.id,previous,'an attempt cannot cross account or input context')
  assert.equal(state.removals,0)
}

const workflowSource=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
function workflow({audit='pending',localFailure=true,metadata='ok',generated=false,failSave=false}={}){
  const row={id:'saved-document',owner_id:owner,case_id:'synthetic-case',data_classification:'synthetic',title:'Erfundene Rechnung',extracted_text:'Original gespeichert.'}
  const state={data:{documents:[{...row,extracted_text:null}],cases:[{id:row.case_id}],assessments:[],sourceStatus:[]},message:'',selected:null,uploads:0,saves:0,reset:0,audits:[],opening:0}
  const context={recordCommittedAction,documentUploadReadinessMessage,parseIntakeQuality,validateDocumentUploadReadiness,currentAssessments,caseGuidanceCopy,
    PRIVACY_NOTICE_VERSION:'test',allowedUploadExtensions:new Set(['txt']),maxUploadBytes:10000,
    uploadWorkspaceDocument:async()=>{state.uploads++;return {data:row,error:null}},
    updateDocumentRecord:async()=>{state.saves++;return failSave?{error:new Error('Actual save rejected')}:{data:row,error:null}},
    createAssessmentRecord:async()=>{if(metadata==='rejected')throw new Error('Assessment unavailable');return {assessment:{id:'assessment',case_id:row.case_id},updatedCase:{id:row.case_id,traffic_light:'yellow'},error:null}},
    createWorkspaceDocumentSignedUrl:async()=>({}),window:{},openPrivateDocument:async()=>{state.opening++;return true}}
  vm.createContext(context);vm.runInContext(workflowSource+'\nthis.create=createDocumentWorkflowActions',context)
  const actions=context.create({supabase:{from:()=>({insert(){return this},select(){return this},async single(){if(metadata==='rejected')throw new Error('Source unavailable');return {data:{id:'source'},error:null}}})},ownerId:owner,data:state.data,access:{app_role:'owner'},language:'de',privacyCurrent:true,privacyCopy:{},notices:{},analysisCopy:{savedMessage:'Gespeichert',badge:'Test'},caseCopy:{documentReview:'Dokument gespeichert'},serverCopy:{},
    setData:update=>{state.data=update(state.data)},setMessage:value=>{state.message=typeof value==='function'?value(state.message):value},setSelectedDocument:value=>{state.selected=value},setUploading(){},setSection(){},
    recordLocalAction(){if(localFailure)throw new Error('Device storage unavailable')},recordServerAudit(type){state.audits.push(type);return audit==='pending'?new Promise(()=>{}):audit==='rejected'?Promise.reject(new Error('Audit unavailable')):Promise.resolve(true)}})
  const form={elements:{file:{files:[new File(['SYNTHETIC'],'Input.txt')]},case_id:{value:row.case_id},data_classification:{value:'synthetic'},test_data_confirmed:{checked:true}},reset(){state.reset++}}
  return {actions,state,row,event:{preventDefault(){},currentTarget:form},draft:{data_classification:'synthetic',analysis_generated:generated}}
}
const bounded=promise=>Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve('TIMEOUT'),120))])
const originalWarn=console.warn;console.warn=()=>{}
try{
  for(const audit of ['pending','rejected','ok']){
    const {actions,state,event,row,draft}=workflow({audit})
    assert.equal(await bounded(actions.uploadDocument(event)),true)
    assert.equal(state.uploads,1);assert.equal(state.reset,1);assert.equal(state.selected.id,row.id)
    assert.equal(await bounded(actions.updateDocument(row.id,draft)),true)
    assert.equal(state.data.documents[0].extracted_text,row.extracted_text)
    assert.equal(state.message,'Dokument gespeichert ✓')
    assert.equal(await bounded(actions.openDocument({...row,file_path:'synthetic/file.txt'})),true)
    assert.equal(state.opening,1)
    assert.deepEqual(state.audits,['document_uploaded','document_reviewed','document_opened'])
  }
  for(const stayInCase of [false,true]){
    const {actions,state,row,draft}=workflow({metadata:'rejected',generated:true})
    const result=await bounded(actions.updateDocument(row.id,draft,{stayInCase}))
    assert.equal(stayInCase?result.id:result,stayInCase?row.id:true)
    assert.equal(state.data.documents[0].extracted_text,row.extracted_text)
    assert.equal(state.data.assessments.length,0);assert.equal(state.data.sourceStatus.length,0)
    if(!stayInCase)assert.equal(state.message,caseGuidanceCopy('de').partialSave)
  }
  const failed=workflow({failSave:true})
  assert.equal(await failed.actions.updateDocument(failed.row.id,failed.draft),false)
  assert.equal(failed.state.data.documents[0].extracted_text,null)
  assert.deepEqual(failed.state.audits,[],'a rejected original write must never be confirmed or logged as saved')
  await Promise.resolve()
}finally{console.warn=originalWarn}
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])assert.notEqual(documentUploadReadinessMessage(language,'upload_confirmation'),documentUploadReadinessMessage(language,'upload_failed'))
console.log('Document persistence: three fictional inputs; lost/empty/thrown replies; owner-bound recovery; delayed commits and explicit retries reuse one file/ID; uncertain saves never delete originals; definite rejection cleanup; audit-independent upload/save/open and visible partial metadata saves passed. No model calls.')
