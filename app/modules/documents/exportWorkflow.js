import { recordExportEntry } from '../services/documentRepository'
import { createAccountDataArtifact, createWorkspaceExportArtifact, downloadExportArtifact } from '../services/exportService'
import { exportUi } from './exportUi'
import { getV24Copy } from '../cases/V24Workspace'
import { getV25ApprovalCopy } from '../cases/V25ApprovalWorkflow'
import { loadAccountExportData, loadCaseExportData } from '../services/workspaceExportData.mjs'
import { outputLanguageLabels } from '../language/outputLanguage.js'

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

  function exportCopy(outputLanguage){
    return {
      ex:exportUi[outputLanguage]||exportUi.de,
      core:getV24Copy(outputLanguage),
      approvalUi:getV25ApprovalCopy(outputLanguage)
    }
  }

  async function doExport(ref,type){
    if(!canExport(type)) return setMessage(notices.exportLocked)
    try{
      const saved=ref.kind==='case'?await loadCaseExportData(supabase,{ownerId:user?.id,caseId:ref.item.id,language:outputLanguage}):{ref,data,outputLanguage}
      const artifact=await createWorkspaceExportArtifact({...saved,type,copy:exportCopy(saved.outputLanguage)})
      downloadExportArtifact(artifact)
      const success=appCopy.export+': '+type.toUpperCase()+' · '+outputLanguageLabels[saved.outputLanguage]+' ✓'
      setMessage(success)
      try{recordLocalAction('export_created')}catch{}
      // Download has already succeeded. Optional logging must not turn it into
      // an apparent failure or keep the user's action waiting indefinitely.
      void Promise.all([
        Promise.resolve().then(()=>recordExportEntry(supabase,{ref,type})).then(({error})=>{if(error)throw error}),
        Promise.resolve().then(()=>recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)).then(saved=>{if(!saved)throw new Error('Audit unavailable')})
      ]).catch(()=>setMessage(current=>current===success?success+' · '+serverCopy.auditFailed:current))
      return true
    }catch(error){
      setMessage(appCopy.export+': '+error.message)
      return false
    }
  }

  async function exportMyData(){
    try{
      const savedData=await loadAccountExportData(supabase,user?.id)
      const packageData={
        product:'ASH Workspace Gold',
        exported_at:new Date().toISOString(),
        output_language:outputLanguage,
        account:{email:user?.email||null,user_id:user?.id||null},
        access:{tier:currentTier,plan:currentPlan.name,status:access?.status||null,active:!!access?.active,payment:'disabled'},
        privacy_settings:privacySettings,
        retention_note:appCopy.pauseInfo,
        data:savedData
      }
      downloadExportArtifact(createAccountDataArtifact(packageData))
      const success=trustCopy.dataExport+' ✓'
      setMessage(success)
      try{recordLocalAction('account_data_export')}catch{}
      void Promise.resolve().then(()=>recordServerAudit('account_data_export',{format:'JSON'},'account',null))
        .then(saved=>{if(!saved)throw new Error('Audit unavailable')})
        .catch(()=>setMessage(current=>current===success?success+' · '+serverCopy.auditFailed:current))
      return true
    }catch(error){setMessage(trustCopy.dataExport+': '+error.message);return false}
  }

  return {canExport,doExport,exportMyData}
}
