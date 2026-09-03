import assert from 'node:assert/strict'
import fs from 'node:fs'
import { redeemTestAccessRecord } from '../app/modules/services/pricingRepository.js'
import { createPricingWorkflowActions } from '../app/modules/pricing/pricingWorkflow.js'
import { isTesterAccessQuote } from '../app/modules/pricing/testerAccess.js'

const quote={promo_code_state:'valid',promo_discount_percent:100,package_total:0,payment_enabled:false}
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:1,quote,promoCode:'provided-code'}),true)
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:3,quote,promoCode:'provided-code'}),false)
assert.equal(isTesterAccessQuote({planKey:'analyse',termMonths:1,quote,promoCode:'provided-code'}),false)
assert.equal(isTesterAccessQuote({planKey:'business',termMonths:1,quote:{...quote,promo_discount_percent:50},promoCode:'provided-code'}),false)

const transportCalls=[]
await redeemTestAccessRecord({rpc:async(name,args)=>{transportCalls.push([name,args]);return {data:{access_granted:true},error:null}}},{promoCode:'provided-code'})
assert.deepEqual(transportCalls,[['gold_redeem_test_access',{p_promo_code:'provided-code'}]])

const calls=[]
let access=null
let upgrades=null
let message=''
let granted=false
const supabase={rpc:async(name,args)=>{
  calls.push([name,args])
  if(name==='gold_redeem_test_access') return {data:{access_granted:true,already_redeemed:false,ends_at:'2026-10-03T12:00:00Z',payment_enabled:false,no_auto_renew:true},error:null}
  if(name==='current_gold_access') return {data:[{active:true,status:'approved',permissions:{tier:'business',test_access:true,promo_access_ends_at:'2026-10-03T12:00:00Z'}}],error:null}
  if(name==='gold_available_upgrades') return {data:[],error:null}
  throw new Error('Unexpected RPC: '+name)
}}
const workflow=createPricingWorkflowActions({
  supabase,
  upgrades:[{plan_key:'business'}],
  termMonths:1,
  promoCode:'provided-code',
  appliedPromoCode:'provided-code',
  quotes:{business:quote},
  promoCopy:{invalid:'invalid',testAccessFailed:'failed',testAccessGranted:'Tester access until {date}',testAccessAlready:'Already until {date}'},
  notices:{upgradeReserved:'Reserved',selected:'Selected',monthOne:'month',monthMany:'months'},
  setQuotes:()=>{},
  setPromoCode:()=>{},
  setAppliedPromoCode:()=>{},
  setPromoRevision:()=>{},
  setQuoteLoading:()=>{},
  setMessage:value=>{message=value},
  setAccess:value=>{access=value},
  setUpgrades:value=>{upgrades=value},
  onTestAccessGranted:()=>{granted=true},
  formatAccessEnd:()=> '3 October 2026',
  recordServerAudit:async()=>{throw new Error('Tester redemption already audits on the server')}
})
assert.equal(await workflow.requestUpgrade({plan_key:'business',plan_name:'Gold Business'}),true)
assert.deepEqual(calls.map(([name])=>name),['gold_redeem_test_access','current_gold_access','gold_available_upgrades'])
assert.equal(access.permissions.tier,'business')
assert.deepEqual(upgrades,[])
assert.equal(granted,true)
assert.equal(message,'Tester access until 3 October 2026')

const panel=fs.readFileSync('app/modules/pricing/UpgradePanel.js','utf8')
const dashboard=fs.readFileSync('app/modules/workspace/DashboardSurface.js','utf8')
const controller=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')
const translations=fs.readFileSync('app/modules/pricing/v31PromoTranslations.mjs','utf8')
const migration=fs.readFileSync('supabase/migrations/20260903172122_v76_cap_tester_full_access_at_10.sql','utf8')
assert.match(panel,/activateTestAccess/)
assert.match(dashboard,/testAccessStatus/)
assert.match(controller,/promo_access_ends_at/)
assert.equal((translations.match(/activateTestAccess:/g)||[]).length,11)
assert.equal((translations.match(/testAccessStatus:/g)||[]).length,11)
assert.match(migration,/max_redemptions = 10/)
assert.doesNotMatch(migration,/aspromo2026/i)
console.log('V76 tester full-access guard passed: secure redemption, refreshed Business rights, visible end date, 0 EUR/no renewal contract and 10-tester cap are wired.')
