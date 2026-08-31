import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

const scopes={
  gmail:['openid','email','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'],
  drive:['openid','email','https://www.googleapis.com/auth/drive.file']
}

export async function GET(request){
  const service=request.nextUrl.searchParams.get('service')==='drive'?'drive':'gmail'
  if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.INTEGRATION_TOKEN_KEY){
    return NextResponse.redirect(new URL(`/integrationen?error=google_not_configured&service=${service}`,request.url))
  }
  const state=randomUUID()
  const redirectUri=`${request.nextUrl.origin}/api/integrations/google/callback`
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',process.env.GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri',redirectUri)
  url.searchParams.set('response_type','code')
  url.searchParams.set('access_type','offline')
  url.searchParams.set('prompt','consent')
  url.searchParams.set('scope',scopes[service].join(' '))
  url.searchParams.set('state',`${state}:${service}`)
  const response=NextResponse.redirect(url)
  response.cookies.set('asgold_google_oauth_state',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'})
  return response
}
