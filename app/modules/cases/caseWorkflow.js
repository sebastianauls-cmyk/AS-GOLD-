import { createAssessmentRecord, createCaseRecord, createClientRecord, updateCaseRecord } from '../services/workspaceRepository'
import { emptyCase } from '../workspace/stateConfig'

const emptyClient={name:'',email:'',phone:'',notes:''}

export function normalizeCasePayload(draft){
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

export function createCaseWorkflowActions({
  supabase,
  ownerId,
  data,
  newClient,
  newCase,
  setData,
  setMessage,
  setNewClient,
  setShowClientForm,
  setSection,
  setNewCase,
  setShowCaseForm,
  setSelectedCase,
  recordLocalAction,
  recordServerAudit
}){
  async function createClient(event){
    event.preventDefault()
    setMessage('')
    const {data:created,error}=await createClientRecord(supabase,{ownerId,draft:newClient})
    if(error) return setMessage(error.message)
    recordLocalAction('client_created')
    await recordServerAudit('client_created',{},'client',created.id)
    setData(previous=>({...previous,clients:[created,...previous.clients]}))
    setNewClient(emptyClient)
    setShowClientForm(false)
    setSection('clients')
  }

  async function createCase(event){
    event.preventDefault()
    setMessage('')
    const {data:created,error}=await createCaseRecord(supabase,{ownerId,payload:normalizeCasePayload(newCase)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_created')
    await recordServerAudit('case_created',{},'case',created.id)
    setData(previous=>({...previous,cases:[created,...previous.cases]}))
    setNewCase(emptyCase)
    setShowCaseForm(false)
    setSelectedCase(created)
    return true
  }

  async function updateCase(caseId,draft){
    setMessage('')
    const {data:updated,error}=await updateCaseRecord(supabase,{ownerId,caseId,payload:normalizeCasePayload(draft)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_updated')
    await recordServerAudit('case_updated',{},'case',updated.id)
    setData(previous=>({...previous,cases:previous.cases.map(item=>item.id===updated.id?updated:item)}))
    setSelectedCase(updated)
    return true
  }

  async function createAssessment(caseId,draft){
    setMessage('')
    const currentTrafficLight=data.cases.find(item=>item.id===caseId)?.traffic_light||'green'
    const {assessment:created,updatedCase,error}=await createAssessmentRecord(supabase,{ownerId,caseId,draft,currentTrafficLight})
    if(error){setMessage(error.message);return false}
    recordLocalAction('assessment_created')
    await recordServerAudit('assessment_created',{},'case',caseId)
    setData(previous=>({...previous,assessments:[created,...previous.assessments],cases:previous.cases.map(item=>item.id===caseId?updatedCase:item)}))
    setSelectedCase(updatedCase)
    return true
  }

  return {createClient,createCase,updateCase,createAssessment}
}
