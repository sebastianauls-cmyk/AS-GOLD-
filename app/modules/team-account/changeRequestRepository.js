function normalizeError(code,message='Change-control request failed'){
  return {code,message}
}

export function listInternalChangeRequests(supabase,ownerId){
  return supabase.from('internal_change_requests').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false})
}

export function createInternalChangeRequest(supabase,{ownerId,draft}){
  const payload={
    owner_id:ownerId,
    requester_name:draft.requesterName.trim(),
    product_area:draft.productArea.trim(),
    title:draft.title.trim(),
    requested_change:draft.requestedChange.trim(),
    reason:draft.reason.trim(),
    preparation_notes:draft.preparationNotes.trim()||null,
    priority:draft.priority,
    status:'requested'
  }
  return supabase.from('internal_change_requests').insert(payload).select().single()
}

export async function decideInternalChangeRequest(supabase,{requestId,action,masterPassword}){
  const {data:{session},error:sessionError}=await supabase.auth.getSession()
  if(sessionError||!session?.access_token)return {data:null,error:normalizeError('authentication_required')}
  try{
    const response=await fetch('/api/internal-change-control/decision',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},
      cache:'no-store',
      body:JSON.stringify({requestId,action,masterPassword})
    })
    const payload=await response.json().catch(()=>({}))
    if(!response.ok)return {data:null,error:normalizeError(payload.code||'decision_failed')}
    return {data:payload.request,error:null}
  }catch{
    return {data:null,error:normalizeError('change_control_unavailable')}
  }
}
