import { createClient } from '@supabase/supabase-js'
import { AUTH_REDIRECT_URL } from '../../../modules/services/authRepository.js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../modules/services/supabaseConfig.js'

export const dynamic='force-dynamic'

const ALLOWED_ORIGINS=new Set([
  AUTH_REDIRECT_URL,
  'http://localhost:3000'
])

export function isAllowedResetOrigin(origin){
  return typeof origin==='string'&&ALLOWED_ORIGINS.has(origin)
}

function responseHeaders(origin){
  const headers={
    'cache-control':'no-store',
    'content-type':'application/json; charset=utf-8',
    'vary':'Origin'
  }
  if(isAllowedResetOrigin(origin)){
    headers['access-control-allow-origin']=origin
    headers['access-control-allow-methods']='POST, OPTIONS'
    headers['access-control-allow-headers']='content-type'
  }
  return headers
}

export function OPTIONS(request){
  const origin=request.headers.get('origin')
  if(!isAllowedResetOrigin(origin)){
    return new Response(null,{status:403,headers:{'cache-control':'no-store','vary':'Origin'}})
  }
  return new Response(null,{status:204,headers:responseHeaders(origin)})
}

export async function POST(request){
  const origin=request.headers.get('origin')
  const headers=responseHeaders(origin)
  if(!isAllowedResetOrigin(origin)){
    return new Response(JSON.stringify({ok:false,code:'origin_not_allowed'}),{status:403,headers})
  }

  let body
  try{
    body=await request.json()
  }catch{
    return new Response(JSON.stringify({ok:false,code:'invalid_request'}),{status:400,headers})
  }

  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():''
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254){
    return new Response(JSON.stringify({ok:false,code:'invalid_request'}),{status:400,headers})
  }

  const authClient=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
  const {error}=await authClient.auth.resetPasswordForEmail(email,{redirectTo:AUTH_REDIRECT_URL})
  if(error){
    const limited=['over_email_send_rate_limit','over_request_rate_limit','too_many_requests'].includes(error.code)
    return new Response(JSON.stringify({ok:false,code:limited?'too_many_requests':'reset_delivery_failed'}),{status:limited?429:503,headers})
  }

  return new Response(JSON.stringify({ok:true}),{status:200,headers})
}
