import { recordExportEntry } from '../services/documentRepository'
import { createAccountDataArtifact, createWorkspaceExportArtifact, downloadExportArtifact } from '../services/exportService'
import { exportUi } from './exportUi'
import { getV24Copy } from '../cases/V24Workspace'
import { getV25ApprovalCopy } from '../cases/V25ApprovalWorkflow'

export function createExportWorkflowActions({
  supabase,
  access,
  data,
  outputLanguage,
  appCopy,
  notices,
  serverCopy,
  trustCopy,
  user,
  currentTier,
  currentPlan,
  privacySettings,
  setMessage,
  recordLocalAction,
  recordServerAudit
}){
  function canExport(type){
    if(access?.app_role==='owner') return true
    const permissions=access?.permissions||{}
    return type==='docx'?!!permissions.export_word
      :type==='pdf'?!!permissions.export_pdf
      :type==='xlsx'?!!permissions.export_excel
      :type==='pptx'?!!permissions.export_pptx
      :type==='csv'?!!permissions.export_csv
      :type==='txt'?!!permissions.export_txt
      :false
  }

  async function doExport(ref,type){
    if(!canExport(type)) return setMessage(notices.exportLocked)
    const copy={
      ex:exportUi[outputLanguage]||exportUi.de,
      core:getV24Copy(outputLanguage),
      approvalUi:getV25ApprovalCopy(outputLanguage)
    }
    try{
      const artifact=await createWorkspaceExportArtifact({ref,type,data,copy})
      downloadExportArtifact(artifact)
      const {error:exportLogError}=await recordExportEntry(supabase,{ref,type})
      if(exportLogError) throw exportLogError
      recordLocalAction('export_created')
      const auditSaved=await recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)
      setMessage(appCopy.export+': '+type.toUpperCase()+' ✓'+(auditSaved?'':' · '+serverCopy.auditFailed))
    }catch(error){
      setMessage(appCopy.export+': '+error.message)
    }
  }

  async function exportMyData(){
    const packageData={
      product:'AS Workspace Gold',
      exported_at:new Date().toISOString(),
      account:{email:user?.email||null,user_id:user?.id||null},
      access:{tier:currentTier,plan:currentPlan.name,status:access?.status||null,active:!!access?.active,payment:'disabled'},
      privacy_settings:privacySettings,
      retention_note:appCopy.pauseInfo,
      data:{
        cases:data.cases,
        clients:data.clients,
        documents:data.documents,
        assessments:data.assessments,
        source_status:data.sourceStatus,
        approvals:data.approvals
      }
    }
    downloadExportArtifact(createAccountDataArtifact(packageData))
    recordLocalAction('account_data_export')
    await recordServerAudit('account_data_export',{format:'JSON'},'account',null)
    setMessage(trustCopy.dataExport+' ✓')
  }

  return {canExport,doExport,exportMyData}
}
