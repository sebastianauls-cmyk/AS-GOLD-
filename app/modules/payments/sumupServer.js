import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../services/supabaseConfig.js'
import { paymentRuntimeConfig } from './paymentConfig.mjs'

const SUMUP_API_ORIGIN='https://api.sumup.com'
const SUMUP_CHECKOUT_ORIGIN='https://checkout.sumup.com'

export function getPaymentServerConfig(){
  const config=paymentRuntimeConfig(process.env)
  if(!config.enabled){
    const error=new Error(config.liveLocked?'Live payments are locked':'SumUp sandbox checkout is not configured')
    error.code=config.liveLocked?'live_payments_locked':'payment_not_configured'
    throw error
  }
  return config
}

export function createSupabaseServiceClient(config=getPaymentServerConfig()){
  return createClient(SUPABASE_URL,config.supabaseSecret,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
}

export function readBearerToken(request){
  const header=request.headers.get('authorization')||''
  const match=/^Bearer\s+([^\s]+)$/i.exec(header)
  const token=match?.[1]||''
  return token.length>0&&token.length<=8192?token:''
}

export function createSupabaseUserClient(token){
  return createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    global:{headers:{Authorization:`Bearer ${token}`}},
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
}

export async function authenticatePaymentRequest(request){
  const token=readBearerToken(request)
  if(!token)return {user:null,supabase:null,error:'authentication_required'}
  const supabase=createSupabaseUserClient(token)
  const {data,error}=await supabase.auth.getUser(token)
  if(error||!data?.user)return {user:null,supabase:null,error:'authentication_required'}
  if(data.user.is_anonymous)return {user:null,supabase:null,error:'permanent_account_required'}
  return {user:data.user,supabase,error:null}
}

export function paymentOriginAllowed(request,config=getPaymentServerConfig()){
  const origin=request.headers.get('origin')
  return typeof origin==='string'&&origin===new URL(config.appBaseUrl).origin
}

export function noStoreJson(payload,{status=200}={}){
  return Response.json(payload,{status,headers:{'cache-control':'no-store'}})
}

export async function sumupRequest(path,{method='GET',body,config=getPaymentServerConfig()}={}){
  if(!/^\/v[0-9.]+\//.test(path))throw new Error('Invalid SumUp API path')
  const response=await fetch(`${SUMUP_API_ORIGIN}${path}`,{
    method,
    cache:'no-store',
    headers:{
      authorization:`Bearer ${config.apiKey}`,
      accept:'application/json',
      ...(body?{'content-type':'application/json'}:{})
    },
    ...(body?{body:JSON.stringify(body)}:{}),
    signal:AbortSignal.timeout(12_000)
  })
  const payload=await response.json().catch(()=>null)
  if(!response.ok){
    const error=new Error('SumUp API request failed')
    error.code=response.status===401?'sumup_key_invalid':response.status===403?'sumup_checkout_not_allowed':'sumup_api_error'
    error.status=response.status
    throw error
  }
  return payload
}

export async function validateSumupMerchant(config=getPaymentServerConfig()){
  const merchant=await sumupRequest(`/v1/merchants/${encodeURIComponent(config.merchantCode)}`,{config})
  if(merchant?.merchant_code!==config.merchantCode){
    const error=new Error('SumUp merchant mismatch')
    error.code='sumup_merchant_mismatch'
    throw error
  }
  if(String(merchant.default_currency||'').toUpperCase()!=='EUR'){
    const error=new Error('SumUp merchant currency must be EUR')
    error.code='sumup_currency_mismatch'
    throw error
  }
  if(config.mode==='sandbox'&&merchant.sandbox!==true){
    const error=new Error('A SumUp sandbox merchant is required')
    error.code='sumup_sandbox_required'
    throw error
  }
  return merchant
}

export async function createSumupHostedCheckout(payload,config=getPaymentServerConfig()){
  const checkout=await sumupRequest('/v0.1/checkouts',{method:'POST',body:payload,config})
  if(!/^[0-9a-f-]{36}$/i.test(String(checkout?.id||'')))throw new Error('SumUp did not return a checkout id')
  const checkoutUrl=new URL(String(checkout?.hosted_checkout_url||''))
  if(checkoutUrl.origin!==SUMUP_CHECKOUT_ORIGIN)throw new Error('SumUp did not return a trusted hosted checkout URL')
  return checkout
}

export function retrieveSumupCheckout(checkoutId,config=getPaymentServerConfig()){
  if(!/^[0-9a-f-]{36}$/i.test(String(checkoutId||'')))throw new Error('Invalid SumUp checkout id')
  return sumupRequest(`/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,{config})
}

export async function deactivateSumupCheckout(checkoutId,config=getPaymentServerConfig()){
  if(!/^[0-9a-f-]{36}$/i.test(String(checkoutId||'')))return null
  try{
    return await sumupRequest(`/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,{method:'DELETE',config})
  }catch(error){
    if(error?.status===404||error?.status===409)return null
    throw error
  }
}
