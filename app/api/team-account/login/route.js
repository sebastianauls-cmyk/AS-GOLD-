import { createClient } from '@supabase/supabase-js'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../modules/services/supabaseConfig.js'
import { isAllowedTeamOrigin, teamResponseHeaders } from '../../../modules/team-account/serverSecurity.js'
import { createTeamAdminClient, readTeamSecurity } from '../../../modules/team-account/teamAccountServer.js'

export const dynamic='force-dynamic'
export const runtime='nodejs'

function json(origin,status,payload){
  return new Response(JSON.stringify(payload),{status,headers:teamResponseHeaders(origin)})
}

export function OPTIONS(request){
  const origin=request.headers.get('origin')
  if(!isAllowedTeamOrigin(origin))return new Response(null,{status:403,headers:{'cache-control':'no-store','vary':'Origin'}})
  return new Response(null,{status:204,headers:teamResponseHeaders(origin)})
}

export async function POST(request){
  const origin=request.headers.get('origin')
  if(!isAllowedTeamOrigin(origin))return json(origin,403,{ok:false,code:'origin_not_allowed'})

  const admin=createTeamAdminClient()
  if(!admin)return json(origin,503,{ok:false,code:'team_account_not_configured'})
  const {data:security,error:securityError}=await readTeamSecurity(admin)
  if(securityError||!security?.owner_id||!security?.setup_completed_at){
    return json(origin,503,{ok:false,code:'team_account_not_configured'})
  }
  const teamUserId=security.owner_id
  const {data:teamUserData,error:teamUserError}=await admin.auth.admin.getUserById(teamUserId)
  const teamEmail=String(teamUserData?.user?.email||'').trim().toLowerCase()
  if(teamUserError||!/^\S+@\S+\.\S+$/.test(teamEmail))return json(origin,503,{ok:false,code:'team_account_not_configured'})

  let body
  try{body=await request.json()}catch{return json(origin,400,{ok:false,code:'invalid_request'})}
  const password=typeof body?.password==='string'?body.password:''
  if(password.length<8||password.length>256)return json(origin,400,{ok:false,code:'invalid_request'})

  const authClient=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
  const {data,error}=await authClient.auth.signInWithPassword({email:teamEmail,password})
  if(error||!data?.session||data.user?.id!==teamUserId){
    if(data?.session)await authClient.auth.signOut({scope:'local'})
    const limited=['over_request_rate_limit','too_many_requests'].includes(error?.code)
    return json(origin,limited?429:401,{ok:false,code:limited?'too_many_requests':'team_credentials_invalid'})
  }

  const {data:accessRows,error:accessError}=await authClient.rpc('current_gold_access')
  const access=accessRows?.[0]
  const internalAllowed=access?.active===true&&access?.status==='approved'&&(access?.app_role==='owner'||access?.permissions?.shared_team_access===true)
  if(accessError||!internalAllowed){
    await authClient.auth.signOut({scope:'local'})
    return json(origin,403,{ok:false,code:'team_access_not_allowed'})
  }

  return json(origin,200,{
    ok:true,
    accessToken:data.session.access_token,
    refreshToken:data.session.refresh_token,
    expiresAt:data.session.expires_at
  })
}
