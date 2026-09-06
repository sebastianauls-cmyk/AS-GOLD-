import { authorizeDocumentAnalysis } from '../services/complianceRepository'
import { createWorkspaceDocumentSignedUrl, updateDocumentRecord, uploadWorkspaceDocument } from '../services/documentRepository'
import { invokeDocumentAnalysis } from '../services/documentAnalysis'
import { allowedUploadExtensions, maxUploadBytes } from './uploadConfig'
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'
import { mapDocumentLanguageWorkflowResult } from '../language/documentLanguageWorkflow.mjs'
import { documentUploadReadinessMessage, parseIntakeQuality, validateDocumentUploadReadiness } from './documentUploadReadiness.mjs'

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

export function createDocumentWorkflowActions({
  supabase,
  ownerId,
  data,
  access,
  language,
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
    if(!['synthetic','anonymized'].includes(document.data_classification)){setMessage(privacyCopy.uploadRequired);return false}
    const authorization=await authorizeDocumentAnalysis(supabase,{ownerId,documentId:document.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(authorization.error){setMessage(authorization.error.message);return false}
    setPrivacySettings(authorization.privacy)
    await recordServerAudit('document_ai_transfer_authorized',{classification:document.data_classification},'document',document.id)
    const linkedCase=data.cases.find(item=>item.id===document.case_id)
    const {data:result,error}=await invokeDocumentAnalysis({supabase,documentId:document.id,filePath:document.file_path,outputLanguage,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,countryContext:linkedCase?.target_country})
    if(error){setMessage(await functionErrorMessage(error,analysisCopy.failed));return false}
    if(result?.status==='configuration_required'){setMessage(result.message||analysisCopy.failed);return false}
    const suggestedCase=data.cases.some(item=>item.id===result?.suggested_case_id)?result.suggested_case_id:null
    const generated=mapDocumentLanguageWorkflowResult(result,document,result?.output_language||outputLanguage)
    generated.fields.case_id=suggestedCase||document.case_id||''
    recordLocalAction('document_analysis_generated')
    const auditSaved=await recordServerAudit('document_analysis_generated',{status:'provisional'},'document',document.id)
    setMessage(auditSaved?analysisCopy.ready:`${analysisCopy.ready} · ${serverCopy.auditFailed}`)
    return generated
  }

  async function updateDocument(documentId,draft){
    setMessage('')
    const current=data.documents.find(item=>item.id===documentId)
    const classification=String(draft.data_classification||'')
    if(!['synthetic','anonymized'].includes(classification)){setMessage(privacyCopy.uploadRequired);return false}
    if(classification!==current?.data_classification&&!draft.test_data_confirmed){setMessage(privacyCopy.uploadRequired);return false}
    const {data:updated,error}=await updateDocumentRecord(supabase,{ownerId,documentId,draft})
    if(error){setMessage(error.message);return false}
    const eventType=draft.analysis_generated?'document_analysis_saved':'document_reviewed'
    recordLocalAction(eventType)
    const auditSaved=await recordServerAudit(eventType,{status:'saved'},'document',updated.id)
    let createdAssessment=null
    let createdSource=null
    let updatedCase=null
    if(draft.analysis_generated&&updated.case_id){
      const trafficLight=['green','yellow','red','white'].includes(draft.analysis_traffic_light)?draft.analysis_traffic_light:'yellow'
      const assessmentResult=await supabase.rpc('create_gold_assessment',{p_case_id:updated.case_id,p_title:updated.title||analysisCopy.badge,p_traffic_light:trafficLight,p_reasoning:String(draft.analysis_reasoning||updated.analysis_summary||'').trim()||null,p_next_step:updated.analysis_next_step||null})
      if(!assessmentResult.error){
        createdAssessment=assessmentResult.data?.assessment||null
        updatedCase=assessmentResult.data?.case||null
      }
      const sourceResult=await supabase.from('source_status').insert({owner_id:ownerId,case_id:updated.case_id,source_kind:'uploaded_document',source_label:updated.title,status:'PASSENDER TREFFER – ZU BESTÄTIGEN',details:String(draft.analysis_reasoning||'KI-Dokumentanalyse gespeichert; fachliche Bestätigung erforderlich.').trim(),checked_at:new Date().toISOString()}).select().single()
      if(!sourceResult.error) createdSource=sourceResult.data
    }
    setData(previous=>({
      ...previous,
      documents:previous.documents.map(item=>item.id===updated.id?updated:item),
      assessments:createdAssessment?[createdAssessment,...previous.assessments]:previous.assessments,
      sourceStatus:createdSource?[createdSource,...previous.sourceStatus]:previous.sourceStatus,
      cases:updatedCase?previous.cases.map(item=>item.id===updatedCase.id?updatedCase:item):previous.cases
    }))
    setSelectedDocument(updated)
    setMessage(auditSaved?(draft.analysis_generated?analysisCopy.savedMessage:`${caseCopy.documentReview} ✓`):serverCopy.auditFailed)
    return true
  }

  async function uploadDocument(event){
    event.preventDefault()
    setMessage('')
    const form=event.currentTarget
    let file=form.elements.file.files[0]
    if(!file&&form.elements.sample_document?.value==='synthetic-v29'){
      try{
        const response=await fetch('/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf',{cache:'no-store'})
        if(!response.ok)throw new Error('Sample document unavailable')
        file=new File([await response.blob()],'AS_Gold_Synthetischer_Testfall_V29.pdf',{type:'application/pdf'})
      }catch{
        setMessage(documentUploadReadinessMessage(language,'upload_failed'))
        return false
      }
    }
    const caseId=form.elements.case_id.value||null
    if(!file){setMessage(notices.chooseFile);return false}
    if(!privacyCurrent){setMessage(privacyCopy.required);return false}
    const dataClassification=form.elements.data_classification?.value||''
    const testDataConfirmed=!!form.elements.test_data_confirmed?.checked
    if(!['synthetic','anonymized'].includes(dataClassification)||!testDataConfirmed){setMessage(privacyCopy.uploadRequired);return false}
    const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
    if(!allowedUploadExtensions.has(extension)){setMessage(uploadCopy.unsupported);return false}
    if(file.size>maxUploadBytes){setMessage(uploadCopy.tooLarge);return false}
    const limit=Number(access?.permissions?.document_limit||0)
    if(access?.app_role!=='owner' && limit>0 && data.documents.length>=limit){setMessage(notices.docLimit.replace('{limit}',limit));return false}
    const intakeQuality=parseIntakeQuality(form.elements.intake_quality?.value)
    const source=form.elements.source?.value||'upload'
    const readiness=validateDocumentUploadReadiness({fileType:file.type,extension,source,intakeQuality})
    if(!readiness.ok){setMessage(documentUploadReadinessMessage(language,readiness.code));return false}
    setUploading(true)
    try{
      const {data:created,error}=await uploadWorkspaceDocument(supabase,{ownerId,file,caseId,dataClassification,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,documentType:form.elements.document_type?.value.trim()||extension.toUpperCase(),documentDate:form.elements.document_date?.value||null,source,sourceLanguage:form.elements.source_language?.value||null,voiceContext:form.elements.voice_context?.value.trim()||null,voiceLanguage:form.elements.voice_language?.value||null,intakeQuality})
      if(error){setMessage(error.code==='DOCUMENT_UPLOAD_NETWORK_ERROR'?documentUploadReadinessMessage(language,'upload_network'):error.message);return false}
      recordLocalAction('document_uploaded')
      await recordServerAudit('document_uploaded',{classification:dataClassification},'document',created.id)
      setData(previous=>({...previous,documents:[created,...previous.documents]}))
      form.reset()
      setSection('documents')
      setSelectedDocument(created)
      return true
    }catch(error){
      console.error('Document upload failed',error)
      setMessage(documentUploadReadinessMessage(language,'upload_failed'))
      return false
    }finally{
      setUploading(false)
    }
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
