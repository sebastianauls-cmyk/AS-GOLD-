import 'server-only'

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../services/supabaseConfig.js'
import { STRIPE_API_VERSION, paymentRuntimeConfig } from './paymentConfig.mjs'

export function getPaymentServerConfig(){
  const config=paymentRuntimeConfig(process.env)
  if(!config.enabled){
    const error=new Error(config.liveLocked?'Live payments are locked':'Stripe test checkout is not configured')
    error.code=config.liveLocked?'live_payments_locked':'payment_not_configured'
    throw error
  }
  return config
}

export function createStripeServerClient(config=getPaymentServerConfig()){
  return new Stripe(config.stripeKey,{apiVersion:STRIPE_API_VERSION})
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
