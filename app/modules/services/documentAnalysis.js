import { readCountryContext } from '../country/countryRegistry.mjs'
import { runDocumentAnalysisContinuation } from './documentAnalysisContinuation.mjs'

export async function invokeDocumentAnalysis({supabase,documentId,filePath,outputLanguage,referenceLanguage,privacyNoticeVersion,termsVersion,countryContext,onProgress}){
  const targetCountry=countryContext||readCountryContext()
  return runDocumentAnalysisContinuation(options=>supabase.functions.invoke('gold-document-analysis',options),{
      file_path:filePath,
      document_id:documentId,
      acknowledged:true,
      privacy_notice_version:privacyNoticeVersion,
      terms_version:termsVersion,
      output_language:outputLanguage,
      reference_language:referenceLanguage,
      target_country:targetCountry
  },{onProgress})
}
