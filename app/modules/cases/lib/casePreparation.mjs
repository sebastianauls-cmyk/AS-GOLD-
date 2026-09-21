import { initializeDocumentReview, applyDocumentAnalysis } from '../../documents/documentAnalysisRecovery.mjs'

export function caseDocuments(item, documents=[]) {
  return documents.filter(doc=>doc.case_id===item.id&&(!item.owner_id||doc.owner_id===item.owner_id)).sort((a,b)=>a.id.localeCompare(b.id))
}

export function preparationContext(item,documents,outputLanguage,referenceLanguage) {
  return JSON.stringify([item.id,item.home_country,item.target_country,outputLanguage,referenceLanguage,
    caseDocuments(item,documents).map(doc=>[doc.id,doc.file_path,doc.updated_at,doc.data_classification,doc.extracted_text])])
}

export function preparationError(code,document) {
  const error=new Error(code)
  error.code=code
  error.document=document
  return error
}

// One explicitly consented case pass. Existing originals are reused. Completed
// server drafts are recovered before requesting AI. The start consent explicitly
// covers saving machine-read text; it never records a human source review.
export async function prepareCaseDocuments({item,documents,outputLanguage,referenceLanguage,onAnalyze,onRecover,onProgress=()=>{},isCurrent=()=>true}) {
  const docs=caseDocuments(item,documents)
  if(!docs.length)throw preparationError('no_documents')
  if(docs.length>30)throw preparationError('too_many_documents')
  if(docs.some(doc=>!['synthetic','anonymized'].includes(doc.data_classification)))throw preparationError('test_data_required')
  const pending=docs.filter(doc=>!String(doc.extracted_text||'').trim())
  for(const doc of pending) {
    if(!doc.file_path||!(/\.(pdf|jpe?g|png|webp|gif|txt|csv|rtf|docx|xlsx|pptx|odt|ods|odp|eml)$/i).test(doc.file_path))throw preparationError('unreadable_file',doc)
  }
  const drafts=[]
  for(const [index,original] of pending.entries()) {
    if(!isCurrent())throw preparationError('changed')
    const requested={...original,customer_copy_language:outputLanguage,reference_copy_language:referenceLanguage}
    onProgress({index:index+1,total:pending.length,document:original})
    let retained=await onRecover(requested,{quiet:true,includeDocument:true})
    if(!isCurrent())throw preparationError('changed')
    if(!retained) {
      const generated=await onAnalyze(requested,{silent:true})
      if(!isCurrent())throw preparationError('changed')
      if(!generated)throw preparationError('reading_failed',original)
      retained=await onRecover(requested,{quiet:true,includeDocument:true})
    }
    if(!isCurrent())throw preparationError('changed')
    const fresh=retained?.document
    if(!fresh||!retained.generated||fresh.id!==original.id||fresh.owner_id!==original.owner_id||fresh.case_id!==item.id||fresh.file_path!==original.file_path||fresh.data_classification!==original.data_classification)throw preparationError('changed',original)
    const {baseline}=initializeDocumentReview(fresh,outputLanguage,item.target_country||'DE')
    const draft=applyDocumentAnalysis(baseline,retained.generated)
    // A suggested assignment must never move a document out of this case.
    draft.case_id=item.id
    drafts.push({document:fresh,draft})
  }
  return drafts
}

// Part of the explicitly consented preparation, not professional verification.
// Stop on failure. Conditional writes preserve concurrent edits and prior saves.
export async function savePreparedCaseDocuments({drafts,onSave,isCurrent=()=>true,onProgress=()=>{}}) {
  const saved=[]
  for(const [index,entry] of drafts.entries()) {
    if(!isCurrent())throw preparationError('changed')
    if(!String(entry.draft.extracted_text||'').trim())throw preparationError('empty_text',entry.document)
    onProgress({index:index+1,total:drafts.length,document:entry.document})
    const updated=await onSave(entry.document.id,entry.draft,{stayInCase:true,expectedUpdatedAt:entry.document.updated_at,expectedCaseId:entry.document.case_id})
    if(!updated||updated.id!==entry.document.id)throw preparationError('saving_failed',entry.document)
    saved.push(updated)
  }
  return saved
}
