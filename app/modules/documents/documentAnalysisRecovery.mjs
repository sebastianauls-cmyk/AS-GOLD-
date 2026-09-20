import { mapDocumentLanguageWorkflowResult, readableDocumentSummary } from '../language/documentLanguageWorkflow.mjs'

export function initializeDocumentReview(item,outputLanguage='de',country='DE'){
  const baseline={title:item.title||'',case_id:item.case_id||'',document_type:item.document_type||'',document_date:item.document_date||'',extracted_text:item.extracted_text||'',analysis_summary:readableDocumentSummary(item.analysis_summary,item.extracted_text),analysis_next_step:item.analysis_next_step||'',reference_copy:item.reference_copy||item.response_letter_de||'',reference_copy_language:item.reference_copy_language||'de',customer_copy:item.customer_copy||'',customer_copy_language:item.customer_copy_language||outputLanguage,response_recipient:item.response_recipient||'',response_subject:item.response_subject||'',analysis_traffic_light:item.analysis_traffic_light||'yellow',analysis_reasoning:item.analysis_reasoning||'',analysis_confidence:item.analysis_confidence||'',data_classification:['synthetic','anonymized'].includes(item.data_classification)?item.data_classification:'',test_data_confirmed:false}
  const recovered=restoreDocumentAnalysis(item,{outputLanguage:baseline.customer_copy_language,referenceLanguage:baseline.reference_copy_language,country})
  return {baseline,draft:recovered?applyDocumentAnalysis(baseline,recovered):baseline,recovered:!!recovered}
}

export function completedDocumentAnalysis(result){
  return result?.status==='completed'&&typeof result.extracted_text==='string'&&!!result.extracted_text.trim()&&
    ['summary','next_step','assessment_reasoning'].every(key=>typeof result[key]==='string')
}

export function restoreDocumentAnalysis(document,{outputLanguage='de',referenceLanguage='de',country='DE'}={}){
  const saved=document?.analysis_draft,result=saved?.result
  if(!completedDocumentAnalysis(result)||saved.document_id!==document.id||saved.file_path!==document.file_path||
    saved.data_classification!==document.data_classification||
    (saved.voice_context||'')!==(document.voice_context||'')||(saved.voice_language||'')!==(document.voice_language||'')||
    result.output_language!==outputLanguage||result.reference_language!==referenceLanguage||result.target_country!==country)return null
  const completed=Date.parse(saved.completed_at)
  if(!Number.isFinite(completed)||completed!==Date.parse(document.ai_last_processed_at)||completed!==Date.parse(document.updated_at))return null
  const generated=mapDocumentLanguageWorkflowResult(result,document,outputLanguage,referenceLanguage)
  generated.fields.case_id=document.case_id||''
  return generated
}

export function applyDocumentAnalysis(draft,result){
  const fields=result.fields||{}
  return {...draft,
    extracted_text:fields.extracted_text||draft.extracted_text,
    document_type:fields.document_type||draft.document_type,
    document_date:fields.document_date||draft.document_date,
    case_id:fields.case_id||draft.case_id,
    analysis_summary:fields.analysis_summary||draft.analysis_summary,
    analysis_next_step:fields.analysis_next_step||draft.analysis_next_step,
    reference_copy:fields.reference_copy??draft.reference_copy,
    reference_copy_language:fields.reference_copy_language||draft.reference_copy_language,
    customer_copy:fields.customer_copy??draft.customer_copy,
    customer_copy_language:fields.customer_copy_language||draft.customer_copy_language,
    response_recipient:fields.response_recipient??'',response_subject:fields.response_subject??'',
    analysis_traffic_light:fields.analysis_traffic_light||draft.analysis_traffic_light,
    analysis_reasoning:fields.analysis_reasoning||draft.analysis_reasoning,
    analysis_confidence:fields.analysis_confidence||draft.analysis_confidence,analysis_generated:true}
}
