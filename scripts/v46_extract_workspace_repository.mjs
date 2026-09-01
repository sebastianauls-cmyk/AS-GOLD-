import fs from 'node:fs'

const path='app/modules/workspace/WorkspaceApp.js'
let source=fs.readFileSync(path,'utf8')

const importLine="import { supabase } from '../services/supabaseClient'"
const repositoryImport="import { cancelDeletionRecord, createAssessmentRecord, createCaseRecord, createClientRecord, ensureRegistrationPrivacy, getWorkspaceAccess, listDeletionRequests, loadWorkspaceBundle, recordAuditEvent, requestDeletionRecord, updateCaseRecord } from '../services/workspaceRepository'"
if(!source.includes(repositoryImport)){
  if(!source.includes(importLine))throw new Error('workspace repository import anchor missing')
  source=source.replace(importLine,`${importLine}\n${repositoryImport}`)
}

function replaceFunction(startName,nextName,replacement){
  const start=`  async function ${startName}`
  const next=`\n  async function ${nextName}`
  const startIndex=source.indexOf(start)
  const nextIndex=source.indexOf(next,startIndex)
  if(startIndex<0||nextIndex<0)throw new Error(`Could not isolate ${startName}`)
  source=source.slice(0,startIndex)+replacement+source.slice(nextIndex)
}

replaceFunction('recordServerAudit','requestAccountDeletion',`  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){
    if(!user?.id) return false
    const {rows,error}=await recordAuditEvent(supabase,{ownerId:user.id,eventType,metadata,entityType,entityId})
    if(error){ console.error('record_gold_audit_event',error); return false }
    setServerAudit(rows||[])
    return true
  }
`)

replaceFunction('requestAccountDeletion','cancelAccountDeletion',`  async function requestAccountDeletion(){
    if(!user?.id || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await requestDeletionRecord(supabase,user.id)
    if(error){ setDeletionBusy(false); return setMessage(error.code==='23505'?sct.deletionPending:error.message) }
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionRequested)
  }
`)

replaceFunction('cancelAccountDeletion','loadApp',`  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(r=>r.scope==='account'&&r.status==='requested')
    if(!pending || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await cancelDeletionRecord(supabase,{ownerId:user.id,requestId:pending.id})
    if(error){setDeletionBusy(false);return setMessage(error.message)}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionCancelled)
  }
`)

replaceFunction('loadApp','refresh',`  async function loadApp(session){
    setMessage('')
    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){ setMessage(accessSnapshot.error.message); setScreen('login'); return }
    const row=accessSnapshot.access
    if(!row?.active || row?.status !== 'approved') { setMessage(accessPendingMessages[language]||accessPendingMessages.de); setScreen('login'); return }
    setAccess(row)
    setUpgrades(accessSnapshot.upgrades||[])
    const ownerId=session.user.id
    const bundle=await loadWorkspaceBundle(supabase,ownerId)
    if(bundle.error)setMessage(bundle.error.message)
    let nextPrivacy=bundle.privacy
    if(!nextPrivacy){
      const createdPrivacy=await ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta:session.user?.user_metadata||{},privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
      if(!createdPrivacy.error&&createdPrivacy.data)nextPrivacy=createdPrivacy.data
    }
    setData(bundle.data)
    setServerAudit(bundle.audit)
    setDeletionRequests(bundle.deletionRequests)
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
  }
`)

replaceFunction('createClient','createCase',`  async function createClient(e){
    e.preventDefault(); setMessage('')
    const {data:created,error}=await createClientRecord(supabase,{ownerId:user.id,draft:newClient})
    if(error) return setMessage(error.message)
    recordLocalAction('client_created'); await recordServerAudit('client_created',{},'client',created.id); setData(previous=>({...previous,clients:[created,...previous.clients]})); setNewClient({name:'',email:'',phone:'',notes:''}); setShowClientForm(false); setSection('clients')
  }
  function cleanCasePayload(draft){
    return {
      client_id:draft.client_id||null,
      title:draft.title.trim(),
      reference_no:draft.reference_no.trim()||null,
      goal:draft.goal.trim()||null,
      summary:draft.summary.trim()||null,
      deadline_at:draft.deadline_at?new Date(draft.deadline_at).toISOString():null,
      next_action:draft.next_action.trim()||null,
      status:draft.status||'open'
    }
  }
`)

replaceFunction('createCase','updateCase',`  async function createCase(e){
    e.preventDefault(); setMessage('')
    const {data:created,error}=await createCaseRecord(supabase,{ownerId:user.id,payload:cleanCasePayload(newCase)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_created'); await recordServerAudit('case_created',{},'case',created.id)
    setData(previous=>({...previous,cases:[created,...previous.cases]})); setNewCase(emptyCase); setShowCaseForm(false); setSelectedCase(created)
    return true
  }
`)

replaceFunction('updateCase','createAssessment',`  async function updateCase(caseId,draft){
    setMessage('')
    const {data:updated,error}=await updateCaseRecord(supabase,{ownerId:user.id,caseId,payload:cleanCasePayload(draft)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_updated'); await recordServerAudit('case_updated',{},'case',updated.id)
    setData(previous=>({...previous,cases:previous.cases.map(item=>item.id===updated.id?updated:item)})); setSelectedCase(updated)
    return true
  }
`)

replaceFunction('createAssessment','functionErrorMessage',`  async function createAssessment(caseId,draft){
    setMessage('')
    const currentTrafficLight=data.cases.find(item=>item.id===caseId)?.traffic_light||'green'
    const {assessment:created,updatedCase,error}=await createAssessmentRecord(supabase,{ownerId:user.id,caseId,draft,currentTrafficLight})
    if(error){setMessage(error.message);return false}
    recordLocalAction('assessment_created'); await recordServerAudit('assessment_created',{},'case',caseId)
    setData(previous=>({...previous,assessments:[created,...previous.assessments],cases:previous.cases.map(item=>item.id===caseId?updatedCase:item)})); setSelectedCase(updatedCase)
    return true
  }
`)

fs.writeFileSync(path,source)
console.log('Workspace repository extraction applied')
