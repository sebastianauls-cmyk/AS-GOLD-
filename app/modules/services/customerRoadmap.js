import { runRoadmapContinuation } from './roadmapContinuation.mjs'
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'
export { legalComparisonErrorMessage as roadmapErrorMessage } from './legalComparison'
export { authorizeLegalComparison as authorizeRoadmap } from './legalComparison'

export function listCustomerRoadmaps(supabase,caseId) {
  return supabase.from('case_roadmaps').select('*').eq('case_id',caseId).order('created_at',{ascending:false}).limit(12)
}
export function generateCustomerRoadmap(supabase,{caseId,style,outputLanguage,referenceLanguage,onProgress}) {
  return runRoadmapContinuation(options=>supabase.functions.invoke('gold-case-roadmap',options),{action:'generate',analysis_mode:'complete',case_id:caseId,style,output_language:outputLanguage,reference_language:referenceLanguage,acknowledged:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION},{onProgress,maxCalls:10})
}
export function saveRoadmapProgress(supabase,{caseId,roadmapId,stepId,done,note}) {
  return supabase.functions.invoke('gold-case-roadmap',{body:{action:'progress',case_id:caseId,roadmap_id:roadmapId,step_id:stepId,done,note}})
}
