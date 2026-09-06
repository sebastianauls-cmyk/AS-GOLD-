import { readCountryContext } from '../country/countryRegistry.mjs'

export async function invokeDocumentAnalysis({supabase,documentId,filePath,outputLanguage,referenceLanguage,privacyNoticeVersion,termsVersion,countryContext}){
  const targetCountry=countryContext||readCountryContext()
  return supabase.functions.invoke('gold-document-analysis',{
    body:{
      file_path:filePath,
      document_id:documentId,
      acknowledged:true,
      privacy_notice_version:privacyNoticeVersion,
      terms_version:termsVersion,
      output_language:outputLanguage,
      reference_language:referenceLanguage,
      target_country:targetCountry
    }
  })
}
