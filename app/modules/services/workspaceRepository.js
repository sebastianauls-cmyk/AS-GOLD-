export async function getWorkspaceAccess(supabase){
  const accessResult=await supabase.rpc('current_gold_access')
  if(accessResult.error)return {access:null,upgrades:[],error:accessResult.error}
  const access=accessResult.data?.[0]||null
  const upgradesResult=await supabase.rpc('gold_available_upgrades')
  return {access,upgrades:upgradesResult.data||[],error:upgradesResult.error||null}
}

export async function loadWorkspaceBundle(supabase,ownerId){
  const results=await Promise.all([
    supabase.from('cases').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
    supabase.from('clients').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
    supabase.from('documents').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
    supabase.from('approvals').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
    supabase.from('assessments').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
    supabase.from('source_status').select('*').eq('owner_id',ownerId).order('checked_at',{ascending:false}),
    supabase.from('audit_events').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(20),
    supabase.from('deletion_requests').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
    supabase.from('account_privacy_settings').select('*').eq('owner_id',ownerId).maybeSingle()
  ])
  const [cases,clients,documents,approvals,assessments,sourceStatus,auditRows,deletionRows,privacyRow]=results
  return {
    data:{cases:cases.data||[],clients:clients.data||[],documents:documents.data||[],approvals:approvals.data||[],assessments:assessments.data||[],sourceStatus:sourceStatus.data||[]},
    audit: auditRows.data||[],
    deletionRequests: deletionRows.data||[],
    privacy: privacyRow.data||null,
    error: results.find(result=>result.error)?.error||null
  }
}

export async function ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta,privacyNoticeVersion,termsVersion}){
  if(registrationMeta?.privacy_notice_version!==privacyNoticeVersion||registrationMeta?.terms_version!==termsVersion||registrationMeta?.test_data_only!==true)return {data:null,error:null}
  const acknowledgedAt=registrationMeta.legal_acknowledged_at||new Date().toISOString()
  return supabase.from('account_privacy_settings').insert({owner_id:ownerId,privacy_notice_version:privacyNoticeVersion,privacy_notice_acknowledged_at:acknowledgedAt,terms_version:termsVersion,terms_acknowledged_at:acknowledgedAt,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}).select().single()
}

export async function recordAuditEvent(supabase,{ownerId,eventType,metadata={},entityType=null,entityId=null}){
  const {error}=await supabase.rpc('record_gold_audit_event',{p_event_type:eventType,p_entity_type:entityType,p_entity_id:entityId,p_metadata:metadata})
  if(error)return {rows:null,error}
  const list=await supabase.from('audit_events').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(20)
  return {rows:list.data||[],error:list.error||null}
}

export function listDeletionRequests(supabase,ownerId){
  return supabase.from('deletion_requests').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false})
}

export function requestDeletionRecord(supabase,ownerId){
  return supabase.from('deletion_requests').insert({owner_id:ownerId,scope:'account',reason:'requested_in_app'})
}

export function cancelDeletionRecord(supabase,{ownerId,requestId}){
  return supabase.from('deletion_requests').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',requestId).eq('owner_id',ownerId)
}

export function createClientRecord(supabase,{ownerId,draft}){
  const payload={owner_id:ownerId,name:draft.name.trim(),email:draft.email.trim()||null,phone:draft.phone.trim()||null,notes:draft.notes.trim()||null}
  return supabase.from('clients').insert(payload).select().single()
}

export function createCaseRecord(supabase,{ownerId,payload}){
  return supabase.from('cases').insert({...payload,owner_id:ownerId,traffic_light:'yellow'}).select().single()
}

export function updateCaseRecord(supabase,{ownerId,caseId,payload}){
  return supabase.from('cases').update({...payload,updated_at:new Date().toISOString()}).eq('id',caseId).eq('owner_id',ownerId).select().single()
}

export async function createAssessmentRecord(supabase,{ownerId,caseId,draft,currentTrafficLight='green'}){
  const payload={owner_id:ownerId,case_id:caseId,title:draft.title.trim(),traffic_light:draft.traffic_light,reasoning:draft.reasoning.trim()||null,next_step:draft.next_step.trim()||null}
  const assessment=await supabase.from('assessments').insert(payload).select().single()
  if(assessment.error)return {assessment:null,updatedCase:null,error:assessment.error}
  const ranking={green:1,yellow:2,red:3}
  const overall=ranking[assessment.data.traffic_light]>ranking[currentTrafficLight]?assessment.data.traffic_light:currentTrafficLight
  const caseResult=await supabase.from('cases').update({traffic_light:overall,updated_at:new Date().toISOString()}).eq('id',caseId).eq('owner_id',ownerId).select().single()
  return {assessment:assessment.data,updatedCase:caseResult.data||null,error:caseResult.error||null}
}
