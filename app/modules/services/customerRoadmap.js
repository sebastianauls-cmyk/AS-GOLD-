import { runRoadmapContinuation } from './roadmapContinuation.mjs'
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'
const roadmapFunction=process.env.NEXT_PUBLIC_ASH_REVIEW_PREVIEW==='v157'?'gold-case-roadmap-preview-v157':'gold-case-roadmap'
export { legalComparisonErrorMessage as roadmapErrorMessage } from './legalComparison'
export { authorizeLegalComparison as authorizeRoadmap } from './legalComparison'

export function listCustomerRoadmaps(supabase,caseId) {
  return supabase.from('case_roadmaps').select('*').eq('case_id',caseId).order('created_at',{ascending:false}).limit(12)
}
export function generateCustomerRoadmap(supabase,{caseId,style,outputLanguage,referenceLanguage,onProgress}) {
  return runRoadmapContinuation(options=>supabase.functions.invoke(roadmapFunction,options),{action:'generate',analysis_mode:'complete',case_id:caseId,style,output_language:outputLanguage,reference_language:referenceLanguage,acknowledged:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION},{onProgress,maxCalls:16})
}
export function saveRoadmapProgress(supabase,{caseId,roadmapId,stepId,done,note}) {
  return supabase.functions.invoke(roadmapFunction,{body:{action:'progress',case_id:caseId,roadmap_id:roadmapId,step_id:stepId,done,note}})
}
