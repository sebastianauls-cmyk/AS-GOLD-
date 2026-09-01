export async function invokeDocumentAnalysis({supabase,documentId,filePath,outputLanguage,privacyNoticeVersion,termsVersion}){
  return supabase.functions.invoke('gold-ocr-v28',{
    body:{
      file_path:filePath,
      document_id:documentId,
      acknowledged:true,
      privacy_notice_version:privacyNoticeVersion,
      terms_version:termsVersion,
      output_language:outputLanguage
    }
  })
}
