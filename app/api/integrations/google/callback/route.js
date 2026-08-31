import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sealIntegrationToken } from '../../../../lib/integrationTokens'

export async function GET(request){
  const code=request.nextUrl.searchParams.get('code')
  const state=request.nextUrl.searchParams.get('state')||''
  const [stateValue,serviceRaw]=state.split(':')
  const service=serviceRaw==='drive'?'drive':'gmail'
  const store=await cookies()
  const expected=store.get('asgold_google_oauth_state')?.value
  if(!code||!expected||expected!==stateValue){
    return NextResponse.redirect(new URL('/integrationen?error=google_state',request.url))
  }
  try{
    const redirectUri=`${request.nextUrl.origin}/api/integrations/google/callback`
    const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',redirect_uri:redirectUri,grant_type:'authorization_code'})
    })
    const token=await tokenResponse.json()
    if(!tokenResponse.ok||!token.refresh_token) throw new Error(token.error_description||token.error||'Kein Refresh-Token erhalten')
    const response=NextResponse.redirect(new URL(`/integrationen?connected=google_${service}`,request.url))
    response.cookies.delete('asgold_google_oauth_state')
    response.cookies.set(`asgold_google_${service}`,sealIntegrationToken({provider:'google',service,refresh_token:token.refresh_token,scope:token.scope||'',connected_at:new Date().toISOString()}),{httpOnly:true,secure:true,sameSite:'lax',maxAge:60*60*24*30,path:'/'})
    return response
  }catch(error){
    return NextResponse.redirect(new URL(`/integrationen?error=google_callback&detail=${encodeURIComponent(error.message)}`,request.url))
  }
}
