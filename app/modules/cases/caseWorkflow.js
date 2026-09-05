import { createAssessmentRecord, createCaseRecord, createClientRecord, updateCaseRecord, updateClientRecord } from '../services/workspaceRepository'
import { emptyCase } from '../workspace/stateConfig'
import { normalizeCasePayload } from './casePayload.mjs'

export { normalizeCasePayload } from './casePayload.mjs'

const emptyClient={name:'',email:'',phone:'',notes:''}

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

  async function updateClient(clientId,draft){
    setMessage('')
    if(!draft.name.trim()) return false
    const {data:updated,error}=await updateClientRecord(supabase,{ownerId,clientId,draft})
    if(error){setMessage(error.message);return false}
    recordLocalAction('client_updated')
    setData(previous=>({...previous,clients:previous.clients.map(item=>item.id===updated.id?updated:item)}))
    setSelectedClient(updated)
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
    const {assessment:created,updatedCase,error}=await createAssessmentRecord(supabase,{caseId,draft})
    if(error){setMessage(error.message);return false}
    recordLocalAction('assessment_created')
    await recordServerAudit('assessment_created',{},'case',caseId)
    setData(previous=>({...previous,assessments:[created,...previous.assessments],cases:previous.cases.map(item=>item.id===caseId?updatedCase:item)}))
    setSelectedCase(updatedCase)
    return true
  }

  return {createClient,updateClient,createCase,updateCase,createAssessment}
}
