import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { sealIntegrationToken } from '../../../../lib/integrationTokens'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../../../modules/services/supabaseConfig'

async function currentUser(request){
  const authorization=request.headers.get('authorization')||''
  if(!authorization.startsWith('Bearer ')) return null
  const response=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,authorization}})
  if(!response.ok) return null
  return response.json()
}

export async function POST(request){
  if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.INTEGRATION_TOKEN_KEY||!process.env.SUPABASE_SECRET_KEY){
    return NextResponse.json({ok:false,error:'google_not_configured'},{status:503})
  }
  const user=await currentUser(request)
  if(!user?.id) return NextResponse.json({ok:false,error:'not_authenticated'},{status:401})

  const nonce=randomUUID()
  const redirectUri=`${request.nextUrl.origin}/api/integrations/google/callback`
  const state=sealIntegrationToken({owner_id:user.id,provider:'google',service:'gmail',nonce,created_at:Date.now()})
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id',process.env.GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri',redirectUri)
  url.searchParams.set('response_type','code')
  url.searchParams.set('access_type','offline')
  url.searchParams.set('prompt','consent select_account')
  url.searchParams.set('include_granted_scopes','true')
  url.searchParams.set('scope',['openid','email','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'].join(' '))
  url.searchParams.set('state',state)
  return NextResponse.json({ok:true,url:url.toString()})
}

export async function GET(request){
  return NextResponse.redirect(new URL('/integrationen?error=use_account_button',request.url))
}
