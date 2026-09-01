export function acknowledgeLegalSettings(supabase,{ownerId,privacyNoticeVersion,termsVersion}){
  const now=new Date().toISOString()
  const payload={owner_id:ownerId,privacy_notice_version:privacyNoticeVersion,privacy_notice_acknowledged_at:now,terms_version:termsVersion,terms_acknowledged_at:now,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}
  return supabase.from('account_privacy_settings').upsert(payload,{onConflict:'owner_id'}).select().single()
}

export async function authorizeDocumentAnalysis(supabase,{ownerId,documentId,privacyNoticeVersion,termsVersion}){
  const enabled=await supabase.from('account_privacy_settings').update({ai_processing_enabled:true,updated_at:new Date().toISOString()}).eq('owner_id',ownerId).eq('privacy_notice_version',privacyNoticeVersion).eq('terms_version',termsVersion).select().single()
  if(enabled.error)return {privacy:null,document:null,error:enabled.error}
  const allowed=await supabase.from('documents').update({ai_processing_allowed:true,privacy_notice_version:privacyNoticeVersion,ai_notice_version:privacyNoticeVersion,updated_at:new Date().toISOString()}).eq('id',documentId).eq('owner_id',ownerId).in('data_classification',['synthetic','anonymized']).select().single()
  if(allowed.error)return {privacy:enabled.data,document:null,error:allowed.error}
  return {privacy:enabled.data,document:allowed.data,error:null}
}
