import assert from 'node:assert/strict'
import fs from 'node:fs'
import { amountToMinorUnits, checkoutSessionParameters, integrationIdentifier } from '../app/modules/payments/checkoutSession.mjs'
import { paymentRuntimeConfig, publicPaymentConfig } from '../app/modules/payments/paymentConfig.mjs'
import { paymentTranslations } from '../app/modules/payments/paymentTranslations.mjs'
import { isTesterAccessQuote } from '../app/modules/pricing/testerAccess.js'

const read=path=>fs.readFileSync(path,'utf8')
const languageKeys=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const readyEnv={
  STRIPE_PAYMENT_MODE:'test',
  STRIPE_SECRET_KEY:'sk_test_example',
  STRIPE_WEBHOOK_SECRET:'whsec_example',
  SUPABASE_SECRET_KEY:'supabase-secret-example-value',
  APP_BASE_URL:'https://app-gold-workspace.vercel.app'
}

assert.equal(paymentRuntimeConfig(readyEnv).enabled,true)
assert.deepEqual(publicPaymentConfig(readyEnv),{enabled:true,mode:'test',liveLocked:false,fixedTerms:true,autoRenew:false,currency:'EUR'})
assert.equal(paymentRuntimeConfig({...readyEnv,STRIPE_SECRET_KEY:'sk_live_forbidden'}).enabled,false)
assert.equal(paymentRuntimeConfig({...readyEnv,STRIPE_SECRET_KEY:'sk_live_forbidden'}).liveLocked,true)
assert.equal(paymentRuntimeConfig({...readyEnv,STRIPE_PAYMENT_MODE:'live'}).enabled,false)
assert.equal(paymentRuntimeConfig({...readyEnv,STRIPE_WEBHOOK_SECRET:''}).enabled,false)

assert.equal(amountToMinorUnits(49.9),4990)
assert.throws(()=>amountToMinorUnits(0))
assert.equal(integrationIdentifier(()=>0),'asgold_aaaaaaaa')

const requestId='123e4567-e89b-12d3-a456-426614174000'
const checkout=checkoutSessionParameters({
  reservation:{request_id:requestId,to_plan_name:'Gold Business',term_months:3,payment_amount:149.7},
  userEmail:'test@example.com',
  baseUrl:'https://app-gold-workspace.vercel.app',
  nowSeconds:1_800_000_000,
  identifier:'asgold_abcdefgh'
})
assert.equal(checkout.mode,'payment')
assert.equal(checkout.integration_identifier,'asgold_abcdefgh')
assert.equal(checkout.line_items[0].price_data.unit_amount,14970)
assert.equal(checkout.line_items[0].price_data.currency,'eur')
assert.equal(checkout.expires_at,1_800_001_800)
assert.equal(checkout.client_reference_id,requestId)
assert.match(checkout.success_url,/\{CHECKOUT_SESSION_ID\}/)
assert.match(checkout.cancel_url,new RegExp(requestId))
assert.equal(checkout.payment_method_types,undefined)

const testerQuote={promo_code_state:'valid',promo_discount_percent:100,package_total:0,promo_grants_access:true}
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:1,quote:testerQuote,promoCode:'tester'}),true)
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:1,quote:{...testerQuote,promo_grants_access:false},promoCode:'tester'}),false)

assert.deepEqual(Object.keys(paymentTranslations),languageKeys)
for(const language of languageKeys){
  for(const field of ['testModeBadge','testModeInfo','paymentOff','totalToday','payTest','unavailable','success','cancelled']){
    assert.ok(paymentTranslations[language][field],`${language}: missing payment translation ${field}`)
  }
}

const checkoutRoute=read('app/api/payments/checkout/route.js')
const cancelRoute=read('app/api/payments/cancel/route.js')
const webhookRoute=read('app/api/payments/webhook/route.js')
const panel=read('app/modules/pricing/UpgradePanel.js')
const promoControl=read('app/modules/pricing/PromoCodeControl.js')
const migration=read('supabase/migrations/20260907000038_v124_stripe_test_checkout.sql')
const advisorMigration=read('supabase/migrations/20260907002400_v124_stripe_webhook_fk_index.sql')
assert.match(checkoutRoute,/gold_reserve_checkout_service/)
assert.match(checkoutRoute,/idempotencyKey/)
assert.match(checkoutRoute,/paymentOriginAllowed/)
assert.match(cancelRoute,/checkout\.sessions\.expire/)
assert.match(webhookRoute,/webhooks\.constructEvent/)
assert.match(webhookRoute,/live_event_rejected/)
assert.match(webhookRoute,/payment_status!=='paid'/)
assert.match(webhookRoute,/gold_fulfill_checkout_service/)
assert.match(panel,/payment\.totalToday/)
assert.match(panel,/promo\.activateTestAccess/)
assert.match(promoControl,/promoToggle/)
assert.match(migration,/gold_stripe_webhook_events/)
assert.match(migration,/Checkout amount mismatch/)
assert.match(migration,/grant execute on function public\.gold_fulfill_checkout_service[\s\S]*to service_role/)
assert.match(migration,/make_interval\(days=>coalesce\(v_request\.term_months,1\)\*30\)/)
assert.match(migration,/'auto_renew',false/)
assert.match(migration,/'checkout_total',v_checkout_total/)
assert.match(advisorMigration,/gold_stripe_webhook_events\(upgrade_request_id\)/)

console.log('V124 Stripe test checkout guard passed: hosted one-time checkout, optional promo, direct 100% promo access, signed idempotent webhook fulfilment, fixed terms, no auto-renewal and live-key lock are wired in eleven languages.')
