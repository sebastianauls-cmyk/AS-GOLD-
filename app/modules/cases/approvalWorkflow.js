import { approveApprovalRecord, createApprovalRecord, rejectApprovalRecord, updateApprovalRecord } from '../services/approvalRepository'

export function createApprovalWorkflowActions({
  supabase,
  ownerId,
  data,
  approvalUi,
  setData,
  setMessage,
  setApprovalDefaults,
  setSelectedApproval,
  setSelectedDocument,
  setSelectedCase,
  setSection,
  recordLocalAction,
  recordServerAudit
}){
  async function createApproval(draft){
    setMessage('')
    if(!draft.case_id){setMessage(approvalUi.caseRequired);return false}
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(draft.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const linkedDocument=draft.document_id?data.documents.find(item=>item.id===draft.document_id):null
    if(linkedDocument?.case_id!==draft.case_id&&draft.document_id){setMessage(approvalUi.documentMismatch);return false}
    const {data:created,error}=await createApprovalRecord(supabase,{ownerId,draft,linkedDocument})
    if(error){setMessage(error.message);return false}
    recordLocalAction('approval_created')
    await recordServerAudit('approval_created',{revision:Number(created.preview_revision)},'approval',created.id)
    setData(previous=>({...previous,approvals:[created,...previous.approvals]}))
    setApprovalDefaults({caseId:'',documentId:''})
    setSelectedApproval(created)
    setMessage(approvalUi.created)
    return created
  }

  async function updateApproval(approvalId,draft){
    setMessage('')
    const current=data.approvals.find(item=>item.id===approvalId)
    if(!current) return false
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(current.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const {data:updated,error,invalidated}=await updateApprovalRecord(supabase,{ownerId,approvalId,current,draft})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    const eventType=invalidated?'approval_invalidated':'approval_updated'
    recordLocalAction(eventType)
    await recordServerAudit(eventType,{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(item=>item.id===updated.id?updated:item)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.saved)
    return updated
  }

  async function approveApproval(item){
    setMessage('')
    const {data:updated,error}=await approveApprovalRecord(supabase,{ownerId,item})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_approved')
    await recordServerAudit('approval_approved',{revision:Number(updated.approved_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.approvedMessage)
    return updated
  }

  async function rejectApproval(item){
    setMessage('')
    const {data:updated,error}=await rejectApprovalRecord(supabase,{ownerId,item})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_rejected')
    await recordServerAudit('approval_rejected',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.rejectedMessage)
    return updated
  }

  function prepareDocumentApproval(document){
    setSelectedDocument(null)
    setSelectedCase(null)
    setSelectedApproval(null)
    setApprovalDefaults({caseId:document.case_id||'',documentId:document.id})
    setSection('approvals')
  }

  return {createApproval,updateApproval,approveApproval,rejectApproval,prepareDocumentApproval}
}
