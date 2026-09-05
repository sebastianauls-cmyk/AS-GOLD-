export function updateDocumentRecord(supabase,{ownerId,documentId,draft}){
  const payload={title:String(draft.title||'').trim(),case_id:draft.case_id||null,document_type:String(draft.document_type||'').trim()||null,document_date:draft.document_date||null,extracted_text:String(draft.extracted_text||'').trim()||null,analysis_summary:String(draft.analysis_summary||'').trim()||null,analysis_next_step:String(draft.analysis_next_step||'').trim()||null,response_letter_de:String(draft.response_letter_de||'').trim()||null,customer_copy:String(draft.customer_copy||'').trim()||null,response_recipient:String(draft.response_recipient||'').trim()||null,response_subject:String(draft.response_subject||'').trim()||null,analysis_traffic_light:['green','yellow','red','white'].includes(draft.analysis_traffic_light)?draft.analysis_traffic_light:null,analysis_reasoning:String(draft.analysis_reasoning||'').trim()||null,analysis_confidence:String(draft.analysis_confidence||'').trim()||null,data_classification:draft.data_classification,ai_processing_allowed:false,updated_at:new Date().toISOString()}
  return supabase.from('documents').update(payload).eq('id',documentId).eq('owner_id',ownerId).select().single()
}

export async function uploadWorkspaceDocument(supabase,{ownerId,file,caseId,dataClassification,privacyNoticeVersion,documentType,documentDate,source,sourceLanguage,voiceContext,voiceLanguage,intakeQuality}){
  const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
  const path=`${ownerId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
  const upload=await supabase.storage.from('goldstandard-private').upload(path,file,{upsert:false})
  if(upload.error)return {data:null,error:upload.error}
  let extractedText=null
  if(['txt','csv'].includes(extension)&&file.size<=2*1024*1024){
    try{extractedText=(await file.text()).trim()||null}catch{extractedText=null}
  }
  const insert=await supabase.from('documents').insert({owner_id:ownerId,title:file.name,file_path:path,case_id:caseId,document_type:documentType||extension.toUpperCase(),document_date:documentDate||null,source:source||'upload',source_language:sourceLanguage||null,voice_context:voiceContext||null,voice_language:voiceLanguage||null,intake_quality:intakeQuality||{},extracted_text:extractedText,data_classification:dataClassification,privacy_notice_version:privacyNoticeVersion,ai_processing_allowed:false}).select().single()
  if(insert.error){await supabase.storage.from('goldstandard-private').remove([path]);return {data:null,error:insert.error}}
  return {data:insert.data,error:null}
}

export function createWorkspaceDocumentSignedUrl(supabase,filePath,expiresIn=300){
  return supabase.storage.from('goldstandard-private').createSignedUrl(filePath,expiresIn)
}

export function recordExportEntry(supabase,{ref,type}){
  return supabase.from('exports').insert({case_id:ref.kind==='case'?ref.item.id:ref.item.case_id||null,document_id:ref.kind==='document'?ref.item.id:null,export_type:type,title:`${ref.item.title||'AS Workspace Gold Export'} (${type.toUpperCase()})`,status:'ready'})
}
