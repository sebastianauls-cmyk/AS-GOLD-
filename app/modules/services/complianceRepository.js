import {preserveDocumentAnalysisDraft} from '../documents/documentAnalysisRecovery.mjs'

function legalSettingsPayload({ownerId,privacyNoticeVersion,termsVersion,acknowledgedAt}){
  const timestamp=acknowledgedAt||new Date().toISOString()
  return {owner_id:ownerId,privacy_notice_version:privacyNoticeVersion,privacy_notice_acknowledged_at:timestamp,terms_version:termsVersion,terms_acknowledged_at:timestamp,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}
}

async function updateExistingLegalSettings(supabase,payload){
  const {owner_id:ownerId,...changes}=payload
  return supabase.from('account_privacy_settings').update({...changes,updated_at:new Date().toISOString()}).eq('owner_id',ownerId).select().maybeSingle()
}

export async function persistLegalSettings(supabase,input){
  const payload=legalSettingsPayload(input)
  const updated=await updateExistingLegalSettings(supabase,payload)
  if(updated.error)return updated
  if(updated.data)return updated

  const inserted=await supabase.from('account_privacy_settings').insert(payload).select().single()
  if(!inserted.error)return inserted

  // Two session callbacks may initialise the same new account at once. If the
  // other callback inserted first, the guest INSERT quota correctly rejects
  // this request. Re-reading through UPDATE makes that race idempotent without
  // weakening the database policy.
  const retried=await updateExistingLegalSettings(supabase,payload)
  if(!retried.error&&retried.data)return retried
  return inserted
}

export function acknowledgeLegalSettings(supabase,{ownerId,privacyNoticeVersion,termsVersion}){
  return persistLegalSettings(supabase,{ownerId,privacyNoticeVersion,termsVersion})
}

export async function authorizeDocumentAnalysis(supabase,{ownerId,documentId,privacyNoticeVersion,termsVersion}){
  const enabled=await supabase.from('account_privacy_settings').update({ai_processing_enabled:true,updated_at:new Date().toISOString()}).eq('owner_id',ownerId).eq('privacy_notice_version',privacyNoticeVersion).eq('terms_version',termsVersion).select().single()
  if(enabled.error)return {privacy:null,document:null,error:enabled.error}
  const current=await supabase.from('documents').select('*').eq('id',documentId).eq('owner_id',ownerId).single()
  if(current.error)return {privacy:enabled.data,document:null,error:current.error}
  if(!current.data?.updated_at)return {privacy:enabled.data,document:null,error:{message:'Document is no longer available.'}}
  const updatedAt=new Date(Math.max(Date.now(),Date.parse(current.data.updated_at)+1)).toISOString()
  const allowed=await supabase.from('documents').update({analysis_draft:preserveDocumentAnalysisDraft(current.data,updatedAt),ai_processing_allowed:true,privacy_notice_version:privacyNoticeVersion,ai_notice_version:privacyNoticeVersion,updated_at:updatedAt}).eq('id',documentId).eq('owner_id',ownerId).eq('updated_at',current.data.updated_at).in('data_classification',['synthetic','anonymized']).select().single()
  if(allowed.error)return {privacy:enabled.data,document:null,error:allowed.error}
  return {privacy:enabled.data,document:allowed.data,error:null}
}
