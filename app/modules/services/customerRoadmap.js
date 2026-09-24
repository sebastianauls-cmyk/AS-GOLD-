import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'
import { runBackgroundCaseRequest } from './backgroundCaseRequest.mjs'
export { legalComparisonErrorMessage as roadmapErrorMessage } from './legalComparison'
export { authorizeLegalComparison as authorizeRoadmap } from './legalComparison'

export function listCustomerRoadmaps(supabase,caseId) {
  return supabase.from('case_roadmaps').select('*').eq('case_id',caseId).order('created_at',{ascending:false}).limit(12)
}
export function generateCustomerRoadmap(supabase,{caseId,style,outputLanguage,referenceLanguage}) {
  return runBackgroundCaseRequest({caseId,readLatest:()=>latestCustomerRoadmapJob(supabase,caseId),
    enqueue:()=>supabase.functions.invoke('gold-case-roadmap',{body:{action:'enqueue',analysis_mode:'complete',case_id:caseId,style,output_language:outputLanguage,reference_language:referenceLanguage,acknowledged:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION}})})
}
export function latestCustomerRoadmapJob(supabase,caseId) {
  return supabase.from('case_analysis_jobs').select('id,case_id,status,stage,roadmap_id,error_code,error_message,issues,created_at,updated_at').eq('case_id',caseId).order('created_at',{ascending:false}).limit(1)
}
export function cancelCustomerRoadmapJob(supabase,{caseId,jobId}) {
  return supabase.functions.invoke('gold-case-roadmap',{body:{action:'cancel',case_id:caseId,job_id:jobId}})
}
export function saveRoadmapProgress(supabase,{caseId,roadmapId,stepId,done,note}) {
  return supabase.functions.invoke('gold-case-roadmap',{body:{action:'progress',case_id:caseId,roadmap_id:roadmapId,step_id:stepId,done,note}})
}
