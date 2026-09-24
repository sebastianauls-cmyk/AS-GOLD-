import { OUTPUT_LANGUAGES } from '../language/outputLanguage.js'

export function updateDocumentRecord(supabase,{ownerId,documentId,draft,expectedUpdatedAt,expectedCaseId}){
  const customerCopyLanguage=OUTPUT_LANGUAGES.includes(draft.customer_copy_language)?draft.customer_copy_language:null
  const referenceCopyLanguage=OUTPUT_LANGUAGES.includes(draft.reference_copy_language)?draft.reference_copy_language:null
  const referenceCopy=String(draft.reference_copy||draft.response_letter_de||'').trim()||null
  const payload={analysis_draft:null,title:String(draft.title||'').trim(),case_id:draft.case_id||null,document_type:String(draft.document_type||'').trim()||null,document_date:draft.document_date||null,extracted_text:String(draft.extracted_text||'').trim()||null,analysis_summary:String(draft.analysis_summary||'').trim()||null,analysis_next_step:String(draft.analysis_next_step||'').trim()||null,reference_copy:referenceCopy,reference_copy_language:referenceCopyLanguage,response_letter_de:referenceCopyLanguage==='de'?referenceCopy:null,customer_copy:String(draft.customer_copy||'').trim()||null,customer_copy_language:customerCopyLanguage,response_recipient:String(draft.response_recipient||'').trim()||null,response_subject:String(draft.response_subject||'').trim()||null,analysis_traffic_light:['green','yellow','red','white'].includes(draft.analysis_traffic_light)?draft.analysis_traffic_light:null,analysis_reasoning:String(draft.analysis_reasoning||'').trim()||null,analysis_confidence:String(draft.analysis_confidence||'').trim()||null,data_classification:draft.data_classification,ai_processing_allowed:false,updated_at:new Date().toISOString()}
  let query=supabase.from('documents').update(payload).eq('id',documentId).eq('owner_id',ownerId)
  if(expectedUpdatedAt)query=query.eq('updated_at',expectedUpdatedAt)
  if(expectedCaseId)query=query.eq('case_id',expectedCaseId)
  return query.select().single()
}

function isUploadNetworkError(error){
  return error?.name==='StorageUnknownError'||/failed to fetch|networkerror|network request failed|load failed/i.test(String(error?.message||''))
}

function networkUploadError(error){
  const wrapped=new Error(String(error?.message||'Document upload network request failed'))
  wrapped.name='DocumentUploadNetworkError'
  wrapped.code='DOCUMENT_UPLOAD_NETWORK_ERROR'
  wrapped.stage='storage'
  return wrapped
}

async function storedObjectExists(storage,path){
  try{
    const result=await storage.createSignedUrl(path,30)
    return !result.error&&!!result.data?.signedUrl
  }catch{return false}
}

export async function uploadPrivateObject(storage,path,file){
  let first
  try{first=await storage.upload(path,file,{upsert:false})}
  catch(error){first={data:null,error}}
  if(!first.error)return first
  if(!isUploadNetworkError(first.error))return first

  // A broken mobile connection can lose the response after Storage already
  // accepted the file. Confirm the exact private object before retrying so the
  // recovery stays idempotent and never overwrites an existing upload.
  if(await storedObjectExists(storage,path))return {data:{path,recovered:true},error:null}

  let retried
  try{retried=await storage.upload(path,file,{upsert:false})}
  catch(error){retried={data:null,error}}
  if(!retried.error)return retried
  if(await storedObjectExists(storage,path))return {data:{path,recovered:true},error:null}
  if(!isUploadNetworkError(retried.error))return retried
  return {data:null,error:networkUploadError(retried.error)}
}

function unconfirmedUpload(){
  return {data:null,error:{code:'DOCUMENT_UPLOAD_CONFIRMATION_PENDING',message:'Document upload confirmation pending',stage:'metadata'}}
}

// These explicit database rejections roll back this insert. A timeout, missing
// response or duplicate key is not evidence that the document does not exist.
const rejectedInsertCodes=new Set(['42501','23502','23503','23514','22P02','22001','PGRST204'])

export async function uploadWorkspaceDocument(supabase,{ownerId,file,caseId,dataClassification,privacyNoticeVersion,documentType,documentDate,source,sourceLanguage,voiceContext,voiceLanguage,intakeQuality,sampleDocument=null,attempt={current:null}}){
  const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
  const metadata={owner_id:ownerId,title:file.name,case_id:caseId||null,document_type:documentType||extension.toUpperCase(),document_date:documentDate||null,source:source||'upload',source_language:sourceLanguage||null,voice_context:voiceContext||null,voice_language:voiceLanguage||null,intake_quality:intakeQuality||{},data_classification:dataClassification,privacy_notice_version:privacyNoticeVersion,ai_processing_allowed:false}
  // The intake component refreshes checked_at on ordinary renders. That display
  // timestamp does not change the selected file or the confirmed quality result.
  const key=JSON.stringify([{...metadata,intake_quality:{...metadata.intake_quality,checked_at:undefined}},sampleDocument])
  let pending=attempt.current
  if(!pending||pending.file!==file||pending.key!==key){
    const id=crypto.randomUUID(),path=`${ownerId}/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    pending={file,key,path,sampleDocument,payload:{id,...metadata,file_path:path,extracted_text:null},uploaded:false,storageAttempted:false,insertStarted:false,uncertain:false}
    attempt.current=pending
  }
  const storage=supabase.storage.from('goldstandard-private')
  if(!pending.uploaded){
    if(pending.storageAttempted&&await storedObjectExists(storage,pending.path))pending.uploaded=true
    else{
      pending.storageAttempted=true
      const upload=await uploadPrivateObject(storage,pending.path,file)
      if(upload.error)return {data:null,error:upload.error}
      pending.uploaded=true
    }
    if(['txt','csv'].includes(extension)&&file.size<=2*1024*1024){
      try{pending.payload.extracted_text=(await file.text()).trim()||null}catch{}
    }
  }
  const matches=row=>row?.id===pending.payload.id&&row.owner_id===ownerId&&row.file_path===pending.path
  const complete=row=>{if(attempt.current===pending)attempt.current=null;return {data:row,error:null}}
  const read=async()=>{
    try{return await supabase.from('documents').select('*').eq('id',pending.payload.id).eq('owner_id',ownerId).eq('file_path',pending.path).maybeSingle()}
    catch(error){return {data:null,error}}
  }
  if(pending.insertStarted){
    const saved=await read()
    if(!saved.error&&matches(saved.data))return complete(saved.data)
    if(saved.error||saved.data)return unconfirmedUpload()
    // Explicit retry, same primary key and same object. Even a delayed first
    // commit cannot create a second document or overwrite the original.
  }
  pending.insertStarted=true
  let insert
  try{insert=await supabase.from('documents').insert(pending.payload).select().single()}
  catch(error){insert={data:null,error}}
  if(!insert.error&&matches(insert.data))return complete(insert.data)
  pending.uncertain ||= !rejectedInsertCodes.has(insert.error?.code)
  const saved=await read()
  if(!saved.error&&matches(saved.data))return complete(saved.data)
  if(!pending.uncertain&&!saved.error&&!saved.data){
    // Cleanup only after an explicit rollback and an owner-scoped absence read.
    try{await storage.remove([pending.path])}catch{}
    if(attempt.current===pending)attempt.current=null
    return {data:null,error:insert.error}
  }
  return unconfirmedUpload()
}

export function createWorkspaceDocumentSignedUrl(supabase,filePath,expiresIn=300){
  return supabase.storage.from('goldstandard-private').createSignedUrl(filePath,expiresIn)
}

export function recordExportEntry(supabase,{ref,type}){
  return supabase.from('exports').insert({case_id:ref.kind==='case'?ref.item.id:ref.item.case_id||null,document_id:ref.kind==='document'?ref.item.id:null,export_type:type,format:type,title:`${ref.item.title||'ASH Workspace Gold Export'} (${type.toUpperCase()})`,status:'ready'})
}
