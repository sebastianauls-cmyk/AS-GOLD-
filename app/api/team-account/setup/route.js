import { createClient } from '@supabase/supabase-js'

import { validateV29Password } from '../../../lib/v29PasswordPolicy.mjs'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../modules/services/supabaseConfig.js'
import { createMasterPasswordHash, isAllowedTeamOrigin, readBearerToken, teamResponseHeaders } from '../../../modules/team-account/serverSecurity.js'
import { createTeamAdminClient, readTeamSecurity, TEAM_SECURITY_SINGLETON } from '../../../modules/team-account/teamAccountServer.js'

export const dynamic='force-dynamic'
export const runtime='nodejs'

function json(origin,status,payload){
  return new Response(JSON.stringify(payload),{status,headers:teamResponseHeaders(origin,{authorization:true})})
}

function passwordInput(body,name){
  const value=body?.[name]
  return typeof value==='string'&&value.length<=256?value:null
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

  const userClient=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    global:{headers:{Authorization:`Bearer ${token}`}},
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
  const {data:userData,error:userError}=await userClient.auth.getUser(token)
  const user=userData?.user
  if(userError||!user||user.is_anonymous)return json(origin,401,{ok:false,code:'authentication_required'})

  const {data:accessRows,error:accessError}=await userClient.rpc('current_gold_access')
  const access=accessRows?.[0]
  if(accessError||access?.active!==true||access?.status!=='approved'||access?.app_role!=='owner'){
    return json(origin,403,{ok:false,code:'owner_required'})
  }

  let body
  try{body=await request.json()}catch{return json(origin,400,{ok:false,code:'invalid_request'})}
  const mode=body?.mode==='configure'?'configure':'status'

  const admin=createTeamAdminClient()
  if(!admin)return json(origin,503,{ok:false,code:'setup_unavailable'})
  const {data:existing,error:securityError}=await readTeamSecurity(admin)
  if(securityError)return json(origin,503,{ok:false,code:'setup_unavailable'})
  if(existing?.owner_id&&existing.owner_id!==user.id)return json(origin,403,{ok:false,code:'owner_required'})

  if(mode==='status'){
    return json(origin,200,{ok:true,configured:!!existing?.setup_completed_at})
  }
  if(existing?.setup_completed_at)return json(origin,409,{ok:false,code:'already_configured'})

  const accessPassword=passwordInput(body,'accessPassword')
  const accessPasswordRepeat=passwordInput(body,'accessPasswordRepeat')
  const masterPassword=passwordInput(body,'masterPassword')
  const masterPasswordRepeat=passwordInput(body,'masterPasswordRepeat')
  if(!accessPassword||!masterPassword||accessPassword!==accessPasswordRepeat||masterPassword!==masterPasswordRepeat){
    return json(origin,400,{ok:false,code:'passwords_invalid'})
  }
  if(accessPassword.normalize('NFKC')===masterPassword.normalize('NFKC')){
    return json(origin,400,{ok:false,code:'passwords_must_differ'})
  }

  const identity={email:user.email||'',displayName:access?.display_name||''}
  if(!validateV29Password(accessPassword,identity).valid||!validateV29Password(masterPassword,identity).valid){
    return json(origin,400,{ok:false,code:'passwords_invalid'})
  }
  const masterHash=createMasterPasswordHash(masterPassword)
  if(!masterHash)return json(origin,503,{ok:false,code:'setup_unavailable'})

  const now=new Date().toISOString()
  const reservation={
    singleton_key:TEAM_SECURITY_SINGLETON,
    owner_id:user.id,
    master_password_hash:masterHash,
    setup_completed_at:null,
    updated_at:now
  }
  const reserved=existing
    ?await admin.from('team_account_security').update(reservation).eq('singleton_key',TEAM_SECURITY_SINGLETON).eq('owner_id',user.id).is('setup_completed_at',null).select('owner_id').single()
    :await admin.from('team_account_security').insert(reservation).select('owner_id').single()
  if(reserved.error||reserved.data?.owner_id!==user.id)return json(origin,503,{ok:false,code:'setup_unavailable'})

  const {error:passwordError}=await admin.auth.admin.updateUserById(user.id,{password:accessPassword})
  if(passwordError){
    await admin.from('team_account_security').delete().eq('singleton_key',TEAM_SECURITY_SINGLETON).eq('owner_id',user.id).is('setup_completed_at',null)
    return json(origin,503,{ok:false,code:'access_password_not_saved'})
  }

  const completedAt=new Date().toISOString()
  const completed=await admin.from('team_account_security').update({
    setup_completed_at:completedAt,
    updated_at:completedAt
  }).eq('singleton_key',TEAM_SECURITY_SINGLETON).eq('owner_id',user.id).is('setup_completed_at',null).select('setup_completed_at').single()
  if(completed.error||!completed.data?.setup_completed_at)return json(origin,503,{ok:false,code:'setup_incomplete'})

  return json(origin,200,{ok:true,configured:true})
}
