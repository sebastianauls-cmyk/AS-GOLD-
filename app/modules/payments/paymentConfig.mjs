export const SUMUP_PAYMENT_MODE_SANDBOX='sandbox'
export const SUMUP_PAYMENT_MODE_LIVE='live'

export function isSumupSecretKey(value=''){
  return /^sup_sk_[A-Za-z0-9_-]{12,}$/.test(String(value))
}

export function isSumupMerchantCode(value=''){
  return /^[A-Z0-9]{6,16}$/.test(String(value))
}

export function paymentRuntimeConfig(env={}){
  const requestedMode=String(env.SUMUP_PAYMENT_MODE||'disabled').toLowerCase()
  const apiKey=String(env.SUMUP_API_KEY||'')
  const merchantCode=String(env.SUMUP_MERCHANT_CODE||'').toUpperCase()
  const supabaseSecret=String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||'')
  const appBaseUrl=String(env.APP_BASE_URL||'')
  const sandboxReady=
    requestedMode===SUMUP_PAYMENT_MODE_SANDBOX&&
    isSumupSecretKey(apiKey)&&
    isSumupMerchantCode(merchantCode)&&
    supabaseSecret.length>=20&&
    /^https:\/\//.test(appBaseUrl)

  return {
    enabled:sandboxReady,
    provider:'sumup',
    mode:sandboxReady?SUMUP_PAYMENT_MODE_SANDBOX:'disabled',
    requestedMode,
    liveLocked:requestedMode===SUMUP_PAYMENT_MODE_LIVE,
    apiKey,
    merchantCode,
    supabaseSecret,
    appBaseUrl
  }
}

export function publicPaymentConfig(env={}){
  const config=paymentRuntimeConfig(env)
  return {
    enabled:config.enabled,
    provider:config.provider,
    mode:config.mode,
    liveLocked:config.liveLocked,
    fixedTerms:true,
    autoRenew:false,
    currency:'EUR'
  }
}
