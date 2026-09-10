import { createClient } from '@supabase/supabase-js'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../modules/services/supabaseConfig.js'
import { isAllowedTeamOrigin, masterPasswordConfigured, readBearerToken, teamResponseHeaders, verifyMasterPassword } from '../../../modules/team-account/serverSecurity.js'
import { createTeamAdminClient, readTeamSecurity } from '../../../modules/team-account/teamAccountServer.js'

export const dynamic='force-dynamic'
export const runtime='nodejs'

const VALID_ACTIONS=new Set(['release','reject'])
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function json(origin,status,payload){
  return new Response(JSON.stringify(payload),{status,headers:teamResponseHeaders(origin,{authorization:true})})
}

export function OPTIONS(request){
  const origin=request.headers.get('origin')
  if(!isAllowedTeamOrigin(origin))return new Response(null,{status:403,headers:{'cache-control':'no-store','vary':'Origin'}})
  return new Response(null,{status:204,headers:teamResponseHeaders(origin,{authorization:true})})
}

export async function POST(request){
  const origin=request.headers.get('origin')
  if(!isAllowedTeamOrigin(origin))return json(origin,403,{ok:false,code:'origin_not_allowed'})

  const token=readBearerToken(request)
  if(!token)return json(origin,401,{ok:false,code:'authentication_required'})

  const admin=createTeamAdminClient()
  if(!admin)return json(origin,503,{ok:false,code:'master_not_configured'})
  const {data:security,error:securityError}=await readTeamSecurity(admin)
  if(securityError||!security?.owner_id||!security?.setup_completed_at||!masterPasswordConfigured(security.master_password_hash)){
    return json(origin,503,{ok:false,code:'master_not_configured'})
  }
  const teamUserId=security.owner_id

  const authenticatedClient=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    global:{headers:{Authorization:`Bearer ${token}`}},
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
  const {data:userData,error:userError}=await authenticatedClient.auth.getUser(token)
  if(userError||!userData?.user||userData.user.id!==teamUserId)return json(origin,403,{ok:false,code:'team_access_required'})

  const {data:accessRows,error:accessError}=await authenticatedClient.rpc('current_gold_access')
  const access=accessRows?.[0]
  if(accessError||access?.active!==true||access?.status!=='approved'||(access?.app_role!=='owner'&&access?.permissions?.shared_team_access!==true)){
    return json(origin,403,{ok:false,code:'team_access_required'})
  }

  let body
  try{body=await request.json()}catch{return json(origin,400,{ok:false,code:'invalid_request'})}
  const requestId=typeof body?.requestId==='string'?body.requestId:''
  const action=typeof body?.action==='string'?body.action:''
  const masterPassword=typeof body?.masterPassword==='string'?body.masterPassword:''
  if(!UUID_PATTERN.test(requestId)||!VALID_ACTIONS.has(action)||masterPassword.length>256){
    return json(origin,400,{ok:false,code:'invalid_request'})
  }

  const {data:lockState,error:lockError}=await admin.from('internal_master_auth_state')
    .select('locked_until').eq('owner_id',teamUserId).maybeSingle()
  if(lockError)return json(origin,503,{ok:false,code:'change_control_unavailable'})
  if(lockState?.locked_until&&new Date(lockState.locked_until).getTime()>Date.now()){
    return json(origin,429,{ok:false,code:'master_locked'})
  }

  if(!verifyMasterPassword(masterPassword,security.master_password_hash)){
    const {data:failureRows,error:failureError}=await admin.rpc('record_internal_master_failure',{p_owner_id:teamUserId})
    if(failureError)return json(origin,503,{ok:false,code:'change_control_unavailable'})
    const failure=Array.isArray(failureRows)?failureRows[0]:failureRows
    const locked=failure?.locked_until&&new Date(failure.locked_until).getTime()>Date.now()
    return json(origin,locked?429:401,{ok:false,code:locked?'master_locked':'master_invalid'})
  }

  const {error:clearError}=await admin.rpc('clear_internal_master_failures',{p_owner_id:teamUserId})
  if(clearError)return json(origin,503,{ok:false,code:'change_control_unavailable'})

  const actorLabel=String(process.env.TEAM_MASTER_APPROVER_LABEL||'Sebastian Auls').trim().slice(0,120)
  const {data,error}=await admin.rpc('apply_internal_change_decision',{
    p_request_id:requestId,
    p_owner_id:teamUserId,
    p_action:action,
    p_actor_label:actorLabel
  })
  if(error){
    const invalidTransition=error.code==='22023'
    const missing=error.code==='P0002'
    return json(origin,invalidTransition?409:missing?404:503,{ok:false,code:invalidTransition?'invalid_transition':missing?'request_not_found':'change_control_unavailable'})
  }

  return json(origin,200,{ok:true,request:data})
}
