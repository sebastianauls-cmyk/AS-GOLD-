export const STRIPE_PAYMENT_MODE_TEST='test'
export const STRIPE_PAYMENT_MODE_LIVE='live'
export const STRIPE_API_VERSION='2026-07-29.dahlia'

export function isStripeTestKey(value=''){
  return /^(?:sk|rk)_test_/.test(String(value))
}

export function isStripeLiveKey(value=''){
  return /^(?:sk|rk)_live_/.test(String(value))
}

export function paymentRuntimeConfig(env={}){
  const mode=String(env.STRIPE_PAYMENT_MODE||'disabled').toLowerCase()
  const stripeKey=String(env.STRIPE_SECRET_KEY||'')
  const webhookSecret=String(env.STRIPE_WEBHOOK_SECRET||'')
  const supabaseSecret=String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||'')
  const appBaseUrl=String(env.APP_BASE_URL||'')
  const testReady=
    mode===STRIPE_PAYMENT_MODE_TEST&&
    isStripeTestKey(stripeKey)&&
    webhookSecret.startsWith('whsec_')&&
    supabaseSecret.length>=20&&
    /^https?:\/\//.test(appBaseUrl)

  return {
    enabled:testReady,
    mode:testReady?STRIPE_PAYMENT_MODE_TEST:'disabled',
    requestedMode:mode,
    liveLocked:mode===STRIPE_PAYMENT_MODE_LIVE||isStripeLiveKey(stripeKey),
    stripeKey,
    webhookSecret,
    supabaseSecret,
    appBaseUrl
  }
}

export function publicPaymentConfig(env={}){
  const config=paymentRuntimeConfig(env)
  return {
    enabled:config.enabled,
    mode:config.mode,
    liveLocked:config.liveLocked,
    fixedTerms:true,
    autoRenew:false,
    currency:'EUR'
  }
}
