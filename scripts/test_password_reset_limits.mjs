import assert from 'node:assert/strict'
import { POST } from '../app/api/auth/password-reset/route.js'
import { AUTH_REDIRECT_URL, sendPasswordReset } from '../app/modules/services/authRepository.js'
import { SUPABASE_URL } from '../app/modules/services/supabaseConfig.js'
import { getAuthErrorMessage } from '../app/modules/auth/authMessages.mjs'

// Exercise the real route, SDK error decoding and browser service with a fake transport.
// No email is sent and no request can leave this test.
const originalFetch=globalThis.fetch
const originalWarn=console.warn
const logs=[]
let providerStatus=429
let providerCode='over_email_send_rate_limit'
let providerCalls=0
let routeStatus
const testEmail='reset-test@example.invalid'
const sensitiveMarker='provider-private-detail'
console.warn=(...args)=>logs.push(args)
globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input.url)
  if(url.origin===AUTH_REDIRECT_URL){
    assert.equal(url.pathname,'/api/auth/password-reset')
    const headers=new Headers(init.headers)
    headers.set('origin',AUTH_REDIRECT_URL)
    const response=await POST(new Request(url,{...init,headers}))
    routeStatus=response.status
    assert.equal(response.headers.get('cache-control'),'no-store')
    return response
  }
  assert.equal(url.origin,new URL(SUPABASE_URL).origin,'unexpected outbound request')
  assert.equal(url.pathname,'/auth/v1/recover')
  assert.equal(url.searchParams.get('redirect_to'),AUTH_REDIRECT_URL)
  assert.equal(init.method,'POST')
  assert.equal(JSON.parse(init.body).email,testEmail)
  providerCalls+=1
  const body=providerStatus===200?{}:{msg:sensitiveMarker,...(providerCode?{code:providerCode}:{})}
  return new Response(JSON.stringify(body),{status:providerStatus,headers:{'content-type':'application/json','x-supabase-api-version':'2024-01-01'}})
}

try{
  for(const [status,code,expectedStatus,expectedCode] of [
    [429,'over_email_send_rate_limit',429,'over_email_send_rate_limit'],
    [429,'over_request_rate_limit',429,'over_request_rate_limit'],
    [429,'too_many_requests',429,'too_many_requests'],
    [429,null,429,'too_many_requests'],
    [429,sensitiveMarker,429,'too_many_requests'],
    [400,'over_email_send_rate_limit',429,'over_email_send_rate_limit'],
    [400,'unexpected_provider_error',503,'reset_delivery_failed'],
    [200,null,200,null]
  ]){
    providerStatus=status
    providerCode=code
    const before=providerCalls
    const result=await sendPasswordReset(null,{email:`  ${testEmail.toUpperCase()}  `})
    assert.equal(providerCalls,before+1,'one user request must not auto-retry')
    assert.equal(routeStatus,expectedStatus)
    assert.equal(result.error?.code||null,expectedCode)
    assert.doesNotMatch(JSON.stringify(result),new RegExp(sensitiveMarker))
    if(expectedCode==='over_email_send_rate_limit'){
      assert.match(getAuthErrorMessage(result.error,'de'),/E-Mail-Versandlimit/)
      assert.doesNotMatch(getAuthErrorMessage(result.error,'de'),/einen Moment|kurzer Zeit/)
    }
    if(expectedCode===null)assert.equal(result.data.ok,true)
  }

  const before=providerCalls
  const denied=await POST(new Request(`${AUTH_REDIRECT_URL}/api/auth/password-reset`,{
    method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:JSON.stringify({email:testEmail})
  }))
  assert.equal(denied.status,403)
  assert.equal(providerCalls,before,'rejected origins must never contact the provider')

  for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
    const email=getAuthErrorMessage({code:'over_email_send_rate_limit'},language)
    const request=getAuthErrorMessage({code:'over_request_rate_limit'},language)
    assert.ok(email.length>100,`${language}: email-limit explanation missing`)
    assert.notEqual(email,request,`${language}: email quota must differ from request throttling`)
    assert.doesNotMatch(email+request,/\d/,`${language}: no invented countdown or fixed unlock time`)
  }
  const logText=JSON.stringify(logs)
  assert.doesNotMatch(logText,new RegExp(`${testEmail}|${sensitiveMarker}|unexpected_provider_error`))
  assert.match(logText,/over_email_send_rate_limit/)
}finally{
  globalThis.fetch=originalFetch
  console.warn=originalWarn
}

console.log('Password reset: actual route, SDK and client preserve email versus request limits; no auto-retries, no invented unlock time, fixed redirect, origin checks and private diagnostics passed. Provider transport is mocked; no email sent.')
