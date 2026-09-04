import { authorizeDocumentAnalysis } from '../services/complianceRepository'
import { createWorkspaceDocumentSignedUrl, updateDocumentRecord, uploadWorkspaceDocument } from '../services/documentRepository'
import { invokeDocumentAnalysis } from '../services/documentAnalysis'
import { allowedUploadExtensions, maxUploadBytes } from './uploadConfig'
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'
import { mapDocumentLanguageWorkflowResult } from '../language/documentLanguageWorkflow.mjs'

async function functionErrorMessage(error,fallback){
  if(!error) return fallback
  try{
    if(typeof error.context?.json==='function'){
      const payload=await error.context.json()
      return payload?.error||payload?.message||payload?.detail||error.message||fallback
    }
  }catch{}
  return error.message||fallback
}

function parseIntakeQuality(value){
  if(!value) return {}
  try{return JSON.parse(value)}catch{return {state:'unknown'}}
}

export function createDocumentWorkflowActions({
  supabase,
  ownerId,
  data,
  access,
  privacyCurrent,
  outputLanguage,
  privacyCopy,
  notices,
  uploadCopy,
  analysisCopy,
  caseCopy,
  serverCopy,
  setData,
  setMessage,
  setPrivacySettings,
  setUploading,
  setSection,
  setSelectedDocument,
  recordLocalAction,
  recordServerAudit
}){
  async function analyzeDocument(document){
    if(!document?.file_path) return false
    setMessage('')
    if(!privacyCurrent){setMessage(privacyCopy.required);return false}
    const authorization=await authorizeDocumentAnalysis(supabase,{ownerId,documentId:document.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(authorization.error){setMessage(authorization.error.message);return false}
    setPrivacySettings(authorization.privacy)
    await recordServerAudit('document_ai_transfer_authorized',{classification:document.data_classification},'document',document.id)
    const {data:result,error}=await invokeDocumentAnalysis({supabase,documentId:document.id,filePath:document.file_path,outputLanguage,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(error){setMessage(await functionErrorMessage(error,analysisCopy.failed));return false}
    if(result?.status==='configuration_required'){setMessage(result.message||analysisCopy.failed);return false}
    const suggestedCase=data.cases.some(item=>item.id===result?.suggested_case_id)?result.suggested_case_id:null
    const generated=mapDocumentLanguageWorkflowResult(result,document,result?.output_language||outputLanguage)
    generated.fields.case_id=suggestedCase||document.case_id||''
    recordLocalAction('document_analysis_generated')
    const auditSaved=await recordServerAudit('document_analysis_generated',{status:'provisional',output_language:result?.output_language||outputLanguage,bilingual_response:!!result?.response_letter_de},'document',document.id)
    setMessage(auditSaved?analysisCopy.ready:`${analysisCopy.ready} · ${serverCopy.auditFailed}`)
    return generated
  }

  async function updateDocument(documentId,draft){
    setMessage('')
    const {data:updated,error}=await updateDocumentRecord(supabase,{ownerId,documentId,draft})
    if(error){setMessage(error.message);return false}
    const eventType=draft.analysis_generated?'document_analysis_saved':'document_reviewed'
    recordLocalAction(eventType)
    const auditSaved=await recordServerAudit(eventType,{status:'saved'},'document',updated.id)
    setData(previous=>({...previous,documents:previous.documents.map(item=>item.id===updated.id?updated:item)}))
    setSelectedDocument(updated)
    setMessage(auditSaved?(draft.analysis_generated?analysisCopy.savedMessage:`${caseCopy.documentReview} ✓`):serverCopy.auditFailed)
    return true
  }

  async function uploadDocument(event){
    event.preventDefault()
    setMessage('')
    const form=event.currentTarget
    const file=form.elements.file.files[0]
    const caseId=form.elements.case_id.value||null
    if(!file) return setMessage(notices.chooseFile)
    if(!privacyCurrent) return setMessage(privacyCopy.required)
    const dataClassification=form.elements.data_classification?.value||'personal'
    const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
    if(!allowedUploadExtensions.has(extension)) return setMessage(uploadCopy.unsupported)
    if(file.size>maxUploadBytes) return setMessage(uploadCopy.tooLarge)
    const limit=Number(access?.permissions?.document_limit||0)
    if(access?.app_role!=='owner' && limit>0 && data.documents.length>=limit) return setMessage(notices.docLimit.replace('{limit}',limit))
    setUploading(true)
    const intakeQuality=parseIntakeQuality(form.elements.intake_quality?.value)
    const {data:created,error}=await uploadWorkspaceDocument(supabase,{ownerId,file,caseId,dataClassification,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,documentType:form.elements.document_type?.value.trim()||extension.toUpperCase(),documentDate:form.elements.document_date?.value||null,source:form.elements.source?.value||'upload',sourceLanguage:form.elements.source_language?.value||null,voiceContext:form.elements.voice_context?.value.trim()||null,voiceLanguage:form.elements.voice_language?.value||null,intakeQuality})
    if(error){setUploading(false);return setMessage(error.message)}
    recordLocalAction('document_uploaded')
    await recordServerAudit('document_uploaded',{classification:dataClassification,source_language:created.source_language||null,voice_context:!!created.voice_context,intake_quality:created.intake_quality||{}},'document',created.id)
    setData(previous=>({...previous,documents:[created,...previous.documents]}))
    setUploading(false)
    form.reset()
    setSection('documents')
    setSelectedDocument(created)
  }

  async function openDocument(document){
    if(!document.file_path) return
    const {data:signed,error}=await createWorkspaceDocumentSignedUrl(supabase,document.file_path,300)
    if(error) return setMessage(error.message)
    recordLocalAction('document_opened')
    await recordServerAudit('document_opened',{},'document',document.id)
    window.open(signed.signedUrl,'_blank','noopener')
  }

  return {analyzeDocument,updateDocument,uploadDocument,openDocument}
}
