import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../compliance/PrivacyControls'

export async function listCaseLegalComparisons(supabase,{caseId,homeCountry,targetCountry}){
  return supabase
    .from('legal_comparisons')
    .select('id,case_id,home_country,target_country,topic,question,output_language,status,overall_light,result,sources,research_method,model,source_checked_at,created_at')
    .eq('case_id',caseId)
    .eq('home_country',homeCountry)
    .eq('target_country',targetCountry)
    .order('created_at',{ascending:false})
    .limit(12)
}

export async function authorizeLegalComparison(supabase,{ownerId}){
  return supabase
    .from('account_privacy_settings')
    .update({ai_processing_enabled:true,updated_at:new Date().toISOString()})
    .eq('owner_id',ownerId)
    .eq('privacy_notice_version',PRIVACY_NOTICE_VERSION)
    .eq('terms_version',TERMS_VERSION)
    .select()
    .single()
}

export function invokeCaseLegalComparison(supabase,{caseId,topic,question,outputLanguage,dataClassification}){
  return supabase.functions.invoke('gold-legal-comparison',{
    body:{
      case_id:caseId,
      topic,
      question,
      output_language:outputLanguage,
      data_classification:dataClassification,
      acknowledged:true,
      privacy_notice_version:PRIVACY_NOTICE_VERSION,
      terms_version:TERMS_VERSION
    }
  })
}

export async function legalComparisonErrorMessage(error,fallback){
  if(!error)return fallback
  try{
    if(typeof error.context?.json==='function'){
      const payload=await error.context.json()
      return payload?.error||payload?.message||payload?.detail||error.message||fallback
    }
  }catch{}
  return error.message||fallback
}
