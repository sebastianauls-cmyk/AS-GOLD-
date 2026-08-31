import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sealIntegrationToken } from '../../../../lib/integrationTokens'
export async function GET(request){
  const code=request.nextUrl.searchParams.get('code');const state=request.nextUrl.searchParams.get('state');const store=await cookies();const expected=store.get('asgold_ms_oauth_state')?.value
  if(!code||!state||state!==expected) return NextResponse.redirect(new URL('/integrationen?error=microsoft_state',request.url))
  try{
    const redirectUri=`${request.nextUrl.origin}/api/integrations/microsoft/callback`
    const result=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.MICROSOFT_CLIENT_ID||'',client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',code,redirect_uri:redirectUri,grant_type:'authorization_code',scope:'offline_access openid email Mail.Read Mail.Send Files.ReadWrite'})})
    const token=await result.json();if(!result.ok||!token.refresh_token) throw new Error(token.error_description||token.error||'Kein Refresh-Token erhalten')
    const response=NextResponse.redirect(new URL('/integrationen?connected=microsoft',request.url));response.cookies.delete('asgold_ms_oauth_state');response.cookies.set('asgold_microsoft',sealIntegrationToken({provider:'microsoft',refresh_token:token.refresh_token,scope:token.scope||'',connected_at:new Date().toISOString()}),{httpOnly:true,secure:true,sameSite:'lax',maxAge:60*60*24*30,path:'/'});return response
  }catch(error){return NextResponse.redirect(new URL(`/integrationen?error=microsoft_callback&detail=${encodeURIComponent(error.message)}`,request.url))}
}
