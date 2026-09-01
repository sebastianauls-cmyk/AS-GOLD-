import { acknowledgeLegalSettings } from '../services/complianceRepository'
import { cancelDeletionRecord, listDeletionRequests, requestDeletionRecord } from '../services/workspaceRepository'

export function createAccountWorkflowActions({
  supabase,
  ownerId,
  privacyNoticeVersion,
  termsVersion,
  deletionRequests,
  deletionBusy,
  privacyBusy,
  privacyCopy,
  serverCopy,
  setDeletionBusy,
  setPrivacyBusy,
  setDeletionRequests,
  setPrivacySettings,
  setMessage,
  recordServerAudit
}){
  async function acknowledgeCurrentLegal(){
    if(!ownerId||privacyBusy) return false
    setPrivacyBusy(true)
    setMessage('')
    const {data:stored,error}=await acknowledgeLegalSettings(supabase,{ownerId,privacyNoticeVersion,termsVersion})
    if(error){setPrivacyBusy(false);setMessage(error.message);return false}
    setPrivacySettings(stored)
    await recordServerAudit('legal_notices_acknowledged',{},'account',null)
    setPrivacyBusy(false)
    setMessage(privacyCopy.saved)
    return true
  }

  async function requestAccountDeletion(){
    if(!ownerId||deletionBusy) return false
    setDeletionBusy(true)
    setMessage('')
    const {error}=await requestDeletionRecord(supabase,ownerId)
    if(error){
      setDeletionBusy(false)
      setMessage(error.code==='23505'?serverCopy.deletionPending:error.message)
      return false
    }
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,ownerId)
    setDeletionRequests(rows||[])
    setDeletionBusy(false)
    setMessage(serverCopy.deletionRequested)
    return true
  }

  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(request=>request.scope==='account'&&request.status==='requested')
    if(!pending||deletionBusy) return false
    setDeletionBusy(true)
    setMessage('')
    const {error}=await cancelDeletionRecord(supabase,{ownerId,requestId:pending.id})
    if(error){setDeletionBusy(false);setMessage(error.message);return false}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,ownerId)
    setDeletionRequests(rows||[])
    setDeletionBusy(false)
    setMessage(serverCopy.deletionCancelled)
    return true
  }

  return {acknowledgeCurrentLegal,requestAccountDeletion,cancelAccountDeletion}
}
