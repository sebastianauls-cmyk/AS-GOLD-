import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
export async function GET(request){
  if(!process.env.MICROSOFT_CLIENT_ID||!process.env.MICROSOFT_CLIENT_SECRET||!process.env.INTEGRATION_TOKEN_KEY) return NextResponse.redirect(new URL('/integrationen?error=microsoft_not_configured',request.url))
  const state=randomUUID();const redirectUri=`${request.nextUrl.origin}/api/integrations/microsoft/callback`
  const url=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  url.searchParams.set('client_id',process.env.MICROSOFT_CLIENT_ID);url.searchParams.set('response_type','code');url.searchParams.set('redirect_uri',redirectUri);url.searchParams.set('response_mode','query');url.searchParams.set('scope','offline_access openid email Mail.Read Mail.Send Files.ReadWrite');url.searchParams.set('state',state)
  const response=NextResponse.redirect(url);response.cookies.set('asgold_ms_oauth_state',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});return response
}
