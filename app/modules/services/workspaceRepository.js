import { persistLegalSettings } from './complianceRepository.js'

export async function getWorkspaceAccess(supabase){
  const accessResult=await supabase.rpc('current_gold_access')
  if(accessResult.error)return {access:null,upgrades:[],error:accessResult.error}
  const access=accessResult.data?.[0]||null
  const upgradesResult=await supabase.rpc('gold_available_upgrades')
  return {access,upgrades:upgradesResult.data||[],error:null}
}

export async function loadWorkspaceBundle(supabase,ownerId){
  const modules=['cases','clients','documents','approvals','assessments','source_status','audit_events','deletion_requests','privacy_settings']
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
  const failed=results.map((result,index)=>result.error?`${modules[index]}: ${result.error.message}`:null).filter(Boolean)
  return {
    data:{cases:cases.data||[],clients:clients.data||[],documents:documents.data||[],approvals:approvals.data||[],assessments:assessments.data||[],sourceStatus:sourceStatus.data||[]},
    audit:auditRows.data||[],
    deletionRequests:deletionRows.data||[],
    privacy:privacyRow.data||null,
    error:failed.length?new Error(`Arbeitsbereich unvollständig geladen · ${failed.join(' · ')}`):null
  }
}

export async function ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta,privacyNoticeVersion,termsVersion}){
  if(registrationMeta?.privacy_notice_version!==privacyNoticeVersion||registrationMeta?.terms_version!==termsVersion||registrationMeta?.test_data_only!==true)return {data:null,error:null}
  const acknowledgedAt=registrationMeta.legal_acknowledged_at||new Date().toISOString()
  return persistLegalSettings(supabase,{ownerId,privacyNoticeVersion,termsVersion,acknowledgedAt})
}

export async function recordAuditEvent(supabase,{ownerId,eventType,metadata={},entityType=null,entityId=null}){
  const {error}=await supabase.rpc('record_gold_audit_event',{p_event_type:eventType,p_entity_type:entityType,p_entity_id:entityId,p_metadata:metadata})
  if(error)return {rows:null,error}
  const list=await supabase.from('audit_events').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(20)
  return {rows:list.data||[],error:null}
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

export function updateClientRecord(supabase,{ownerId,clientId,draft}){
  const payload={name:draft.name.trim(),email:draft.email.trim()||null,phone:draft.phone.trim()||null,notes:draft.notes.trim()||null,updated_at:new Date().toISOString()}
  return supabase.from('clients').update(payload).eq('id',clientId).eq('owner_id',ownerId).select().single()
}

export function createCaseRecord(supabase,{ownerId,payload}){
  return supabase.from('cases').insert({...payload,owner_id:ownerId,traffic_light:'yellow'}).select().single()
}

export function updateCaseRecord(supabase,{ownerId,caseId,payload}){
  return supabase.from('cases').update({...payload,updated_at:new Date().toISOString()}).eq('id',caseId).eq('owner_id',ownerId).select().single()
}

export async function createAssessmentRecord(supabase,{caseId,draft}){
  const result=await supabase.rpc('create_gold_assessment',{
    p_case_id:caseId,
    p_title:draft.title.trim(),
    p_traffic_light:draft.traffic_light,
    p_reasoning:draft.reasoning.trim()||null,
    p_next_step:draft.next_step.trim()||null
  })
  if(result.error)return {assessment:null,updatedCase:null,error:result.error}
  return {assessment:result.data?.assessment||null,updatedCase:result.data?.case||null,error:null}
}
