import assert from 'node:assert/strict'
import fs from 'node:fs'
import { paymentRuntimeConfig, publicPaymentConfig } from '../app/modules/payments/paymentConfig.mjs'
import { sumupCheckoutPayload, sumupCheckoutReference, verifySumupCheckout } from '../app/modules/payments/sumupCheckout.mjs'
import { paymentTranslations } from '../app/modules/payments/paymentTranslations.mjs'
import { isTesterAccessQuote } from '../app/modules/pricing/testerAccess.js'

const read=path=>fs.readFileSync(path,'utf8')
const languageKeys=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const readyEnv={
  SUMUP_PAYMENT_MODE:'sandbox',
  SUMUP_API_KEY:'sup_sk_sandbox_example_123456789',
  SUMUP_MERCHANT_CODE:'MC123456',
  SUPABASE_SECRET_KEY:'supabase-secret-example-value',
  APP_BASE_URL:'https://app-gold-workspace.vercel.app'
}

assert.equal(paymentRuntimeConfig(readyEnv).enabled,true)
assert.deepEqual(publicPaymentConfig(readyEnv),{
  enabled:true,
  provider:'sumup',
  mode:'sandbox',
  liveLocked:false,
  fixedTerms:true,
  autoRenew:false,
  currency:'EUR'
})
assert.equal(paymentRuntimeConfig({...readyEnv,SUMUP_PAYMENT_MODE:'live'}).enabled,false)
assert.equal(paymentRuntimeConfig({...readyEnv,SUMUP_PAYMENT_MODE:'live'}).liveLocked,true)
assert.equal(paymentRuntimeConfig({...readyEnv,SUMUP_API_KEY:'sup_pk_public'}).enabled,false)
assert.equal(paymentRuntimeConfig({...readyEnv,SUMUP_MERCHANT_CODE:''}).enabled,false)
assert.equal(paymentRuntimeConfig({...readyEnv,APP_BASE_URL:'http://localhost:3000'}).enabled,false)

const requestId='123e4567-e89b-12d3-a456-426614174000'
assert.equal(sumupCheckoutReference(requestId),`asgold_${requestId}`)
assert.throws(()=>sumupCheckoutReference('unsafe'))
const now=new Date('2026-09-07T12:00:00.000Z')
const checkoutPayload=sumupCheckoutPayload({
  reservation:{request_id:requestId,to_plan_name:'Gold Business',term_months:3,payment_amount:149.7},
  merchantCode:'MC123456',
  baseUrl:'https://app-gold-workspace.vercel.app',
  now
})
assert.equal(checkoutPayload.checkout_reference,`asgold_${requestId}`)
assert.equal(checkoutPayload.amount,149.7)
assert.equal(checkoutPayload.currency,'EUR')
assert.equal(checkoutPayload.merchant_code,'MC123456')
assert.equal(checkoutPayload.return_url,'https://app-gold-workspace.vercel.app/api/payments/webhook')
assert.equal(checkoutPayload.redirect_url,`https://app-gold-workspace.vercel.app/?payment=return&request_id=${requestId}`)
assert.equal(checkoutPayload.valid_until,'2026-09-07T12:30:00.000Z')
assert.deepEqual(checkoutPayload.hosted_checkout,{enabled:true})

const expected={checkoutId:'64553e20-3f0e-49e4-8af3-fd0eca86ce91',checkoutReference:`asgold_${requestId}`,merchantCode:'MC123456',amount:149.7,currency:'EUR'}
const pending={id:expected.checkoutId,checkout_reference:expected.checkoutReference,merchant_code:expected.merchantCode,amount:149.7,currency:'EUR',status:'PENDING',transactions:[]}
assert.deepEqual(verifySumupCheckout(pending,expected),{valid:true,paid:false,status:'PENDING',transaction:null})
const transaction={id:'410fc44a-5956-44e1-b5cc-19c6f8d727a4',transaction_code:'TEENSK4W2K',merchant_code:'MC123456',amount:149.7,currency:'EUR',status:'SUCCESSFUL',timestamp:'2026-09-07T12:02:00.000Z'}
assert.deepEqual(verifySumupCheckout({...pending,status:'PAID',transactions:[transaction]},expected),{valid:true,paid:true,status:'PAID',transaction})
assert.equal(verifySumupCheckout({...pending,amount:1},expected).reason,'amount_mismatch')
assert.equal(verifySumupCheckout({...pending,status:'PAID',transactions:[]},expected).reason,'successful_transaction_missing')

const testerQuote={promo_code_state:'valid',promo_discount_percent:100,package_total:0,promo_grants_access:true}
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:1,quote:testerQuote,promoCode:'tester'}),true)

assert.deepEqual(Object.keys(paymentTranslations),languageKeys)
for(const language of languageKeys){
  for(const field of ['testModeBadge','testModeInfo','paymentOff','totalToday','payTest','unavailable','success','cancelled']){
    assert.ok(paymentTranslations[language][field],`${language}: missing payment translation ${field}`)
  }
}

const config=read('app/modules/payments/paymentConfig.mjs')
const server=read('app/modules/payments/sumupServer.js')
const checkoutRoute=read('app/api/payments/checkout/route.js')
const statusRoute=read('app/api/payments/status/route.js')
const webhookRoute=read('app/api/payments/webhook/route.js')
const migration=read('supabase/migrations/20260907023914_v125_sumup_sandbox_checkout.sql')
assert.match(config,/requestedMode===SUMUP_PAYMENT_MODE_SANDBOX/)
assert.match(config,/liveLocked:requestedMode===SUMUP_PAYMENT_MODE_LIVE/)
assert.match(server,/merchant\.sandbox!==true/)
assert.match(server,/SUMUP_CHECKOUT_ORIGIN='https:\/\/checkout\.sumup\.com'/)
assert.match(server,/authorization:`Bearer \$\{config\.apiKey\}`/)
assert.match(checkoutRoute,/validateSumupMerchant/)
assert.match(checkoutRoute,/gold_reserve_checkout_service/)
assert.match(checkoutRoute,/gold_attach_sumup_checkout_service/)
assert.match(statusRoute,/authenticatePaymentRequest/)
assert.match(statusRoute,/reconcileSumupCheckout/)
assert.match(webhookRoute,/CHECKOUT_STATUS_CHANGED/)
assert.match(webhookRoute,/reconcileSumupCheckout/)
assert.doesNotMatch(checkoutRoute+statusRoute+webhookRoute,/stripe/i)
assert.match(migration,/gold_sumup_checkout_events/)
assert.match(migration,/gold_fulfill_sumup_checkout_service/)
assert.match(migration,/Checkout amount mismatch/)
assert.match(migration,/payment_provider='sumup'/)
assert.match(migration,/grant execute on function public\.gold_fulfill_sumup_checkout_service[\s\S]*to service_role/)
assert.match(migration,/make_interval\(days=>coalesce\(v_request\.term_months,1\)\*30\)/)
assert.match(migration,/'auto_renew',false/)

console.log('V125 SumUp sandbox checkout guard passed: hosted checkout, merchant sandbox validation, API re-verification, idempotent fixed-term fulfilment, promo bypass and live-payment lock are wired in eleven languages.')
