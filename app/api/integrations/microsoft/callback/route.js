import { NextResponse } from 'next/server'
import { openIntegrationToken, sealIntegrationToken } from '../../../../lib/integrationTokens'
import { SUPABASE_URL } from '../../../../modules/services/supabaseConfig'

async function saveConnection({ownerId,email,refreshToken,accessToken,expiresIn,scope}){
  const secret=process.env.SUPABASE_SECRET_KEY
  if(!secret) throw new Error('SUPABASE_SECRET_KEY fehlt')
  const payload={
    owner_id:ownerId,
    provider:'microsoft',
    account_email:email,
    display_name:email,
    status:'connected',
    scopes:String(scope||'').split(' ').filter(Boolean),
    can_read:true,
    can_draft:true,
    can_send:true,
    refresh_token_ciphertext:sealIntegrationToken({refresh_token:refreshToken}),
    access_token_ciphertext:accessToken?sealIntegrationToken({access_token:accessToken}):null,
    access_token_expires_at:expiresIn?new Date(Date.now()+Number(expiresIn)*1000).toISOString():null,
    connected_at:new Date().toISOString(),
    revoked_at:null,
    last_error:null,
    updated_at:new Date().toISOString()
  }
  const response=await fetch(SUPABASE_URL+'/rest/v1/email_connections?on_conflict=owner_id,provider,account_email',{
    method:'POST',
    headers:{apikey:secret,authorization:`Bearer ${secret}`,'content-type':'application/json',prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(payload)
  })
  if(!response.ok) throw new Error('E-Mail-Konto konnte nicht gespeichert werden')
}

export async function GET(request){
  const code=request.nextUrl.searchParams.get('code')
  const state=openIntegrationToken(request.nextUrl.searchParams.get('state'))
  if(!code||!state?.owner_id||state.provider!=='microsoft'||Date.now()-Number(state.created_at||0)>10*60*1000){
    return NextResponse.redirect(new URL('/integrationen?error=microsoft_state',request.url))
  }
  try{
    const redirectUri=`${request.nextUrl.origin}/api/integrations/microsoft/callback`
    const result=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{
      method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({client_id:process.env.MICROSOFT_CLIENT_ID||'',client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',code,redirect_uri:redirectUri,grant_type:'authorization_code',scope:'offline_access openid email User.Read Mail.Read Mail.Send'})
    })
    const token=await result.json()
    if(!result.ok||!token.refresh_token||!token.access_token) throw new Error(token.error_description||token.error||'Kein Zugriffstoken erhalten')
    const profileResponse=await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName',{headers:{authorization:`Bearer ${token.access_token}`}})
    const profile=await profileResponse.json()
    const email=profile.mail||profile.userPrincipalName
    if(!profileResponse.ok||!email) throw new Error('Microsoft-Konto konnte nicht identifiziert werden')
    await saveConnection({ownerId:state.owner_id,email,refreshToken:token.refresh_token,accessToken:token.access_token,expiresIn:token.expires_in,scope:token.scope})
    return NextResponse.redirect(new URL('/integrationen?connected=microsoft&account='+encodeURIComponent(email),request.url))
  }catch(error){
    return NextResponse.redirect(new URL('/integrationen?error=microsoft_callback&detail='+encodeURIComponent(error.message),request.url))
  }
}
