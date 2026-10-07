import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {getAuthErrorMessage} from '../app/modules/auth/authMessages.mjs'

// Only transport results are simulated. No live credentials or provider calls.
const authSource=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
const pricingSource=fs.readFileSync('app/modules/pricing/pricingWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
const session={user:{id:'synthetic-owner'},access_token:'synthetic-session-only'}
const event={preventDefault(){}}
function authHarness(result,{allowed=true,language='de'}={}){
  const state={message:'',screen:'login',accessReads:0,bundleReads:0}
  const context={getAuthErrorMessage,signInSession:result,signInTeamAccount:result,isPasswordRecoveryActive:()=>false,passwordRecoveryRevision:()=>0,
    getWorkspaceConnectionCopy:()=>({unavailable:'Arbeitsbereich nicht erreichbar'}),
    getWorkspaceAccess:async()=>{state.accessReads++;return {access:{active:allowed,status:allowed?'approved':'pending'},upgrades:[]}},
    loadWorkspaceBundle:async()=>{state.bundleReads++;return {data:{},audit:[],deletionRequests:[],privacy:{}}}}
  vm.createContext(context);vm.runInContext(authSource+'\nthis.create=createWorkspaceAuthActions',context)
  const ignore=()=>{}
  const actions=context.create({supabase:{},language,email:'synthetic@example.invalid',password:'synthetic-input-only',pendingMessages:{de:'Zugang noch nicht freigegeben'},
    setMessage:v=>state.message=v,setScreen:v=>state.screen=v,setAccess:ignore,setUpgrades:ignore,setData:ignore,setServerAudit:ignore,setDeletionRequests:ignore,setPrivacySettings:ignore,setUser:ignore,sessionLoadRef:{current:null}})
  return {actions,state}
}
function pricingHarness({quote=async()=>({start:{checkout_total:19.9}}),checkout=async()=>({data:{checkoutUrl:'https://synthetic.invalid/checkout'}}),enabled=true,promo=false}={}){
  const state={message:'',loading:false,quotes:{old:{checkout_total:7}},checkoutPlan:'',redirects:[],grants:0,checkoutCalls:0}
  const context={getUpgradeQuotes:quote,isTesterAccessQuote:()=>promo,
    startCheckoutRecord:async()=>{state.checkoutCalls++;return checkout()},
    redeemTestAccessRecord:async()=>{throw new TypeError('PRIVATE synthetic transport detail')},
    getWorkspaceAccess:async()=>{state.grants++;return {access:{active:true},upgrades:[]}}}
  vm.createContext(context);vm.runInContext(pricingSource+'\nthis.create=createPricingWorkflowActions',context)
  const actions=context.create({supabase:{},upgrades:[{plan_key:'start'}],termMonths:1,quotes:{start:{checkout_total:19.9,promo_code_state:'valid'}},appliedPromoCode:promo?'SYNTHETIC':'',
    paymentConfig:{enabled},paymentCopy:{failed:'Zahlung konnte nicht vorbereitet werden',unavailable:'Zahlung derzeit deaktiviert',starting:'Zahlung wird vorbereitet'},promoCopy:{invalid:'Code ungültig'},
    setMessage:v=>state.message=v,setQuoteLoading:v=>state.loading=v,setQuotes:v=>state.quotes=v,setCheckoutPlan:v=>state.checkoutPlan=v,
    redirectToCheckout:v=>state.redirects.push(v),setAccess:()=>state.grants++,setUpgrades:()=>state.grants++})
  return {actions,state}
}
const failures=[]
async function check(name,run){try{await run()}catch(error){failures.push({name,error:error.message})}}
const unavailable=getAuthErrorMessage({code:'auth_unavailable'},'de')
await check('sign-in rejected transport gives visible feedback',async()=>{
  const {actions,state}=authHarness(async()=>{throw new TypeError('PRIVATE synthetic network detail')})
  assert.equal(await actions.signIn(event),false)
  assert.equal(state.message,unavailable);assert.equal(state.screen,'login');assert.equal(state.accessReads,0)
})
await check('missing session cannot enter the workspace',async()=>{
  for(const data of [null,{}, {session:null}]){
    const {actions,state}=authHarness(async()=>({data,error:null}))
    assert.equal(await actions.signIn(event),false);assert.equal(state.message,unavailable);assert.equal(state.accessReads,0)
  }
})
await check('team sign-in rejected transport gives visible feedback',async()=>{
  const {actions,state}=authHarness(async()=>{throw new TypeError('PRIVATE synthetic network detail')})
  assert.equal(await actions.signInTeam(event),false);assert.match(state.message,/nicht.*erreichbar/);assert.equal(state.accessReads,0)
})
await check('provider rejection remains localized and does not grant access',async()=>{
  const {actions,state}=authHarness(async()=>({data:{session:null},error:{code:'invalid_credentials',message:'PRIVATE'}}))
  assert.equal(await actions.signIn(event),false);assert.equal(state.message,getAuthErrorMessage({code:'invalid_credentials'},'de'));assert.equal(state.accessReads,0)
})
await check('valid sign-in still checks approval before reading case data',async()=>{
  const denied=authHarness(async()=>({data:{session},error:null}),{allowed:false})
  assert.equal(await denied.actions.signIn(event),false);assert.equal(denied.state.screen,'login');assert.equal(denied.state.bundleReads,0)
  const accepted=authHarness(async()=>({data:{session},error:null}))
  assert.equal(await accepted.actions.signIn(event),true);assert.equal(accepted.state.screen,'app');assert.equal(accepted.state.accessReads,1);assert.equal(accepted.state.bundleReads,1)
})
await check('network feedback is distinct from incorrect credentials in 11 languages',async()=>{
  for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
    const message=getAuthErrorMessage({code:'auth_unavailable',message:'PRIVATE'},lang)
    assert.notEqual(message,getAuthErrorMessage({code:'unknown'},lang));assert.notEqual(message,getAuthErrorMessage({code:'invalid_credentials'},lang));assert.doesNotMatch(message,/PRIVATE/)
    assert.equal(getAuthErrorMessage({name:'AuthRetryableFetchError',message:'PRIVATE'},lang),message)
  }
})
await check('failed price request clears loading and obsolete quotes',async()=>{
  const {actions,state}=pricingHarness({quote:async()=>{throw new TypeError('PRIVATE synthetic network detail')}})
  const result=await actions.loadQuotes();assert.equal(Object.keys(result).length,0);assert.equal(state.loading,false);assert.equal(Object.keys(state.quotes).length,0);assert.equal(state.checkoutCalls,0)
})
await check('cancelled price result cannot overwrite a newer screen',async()=>{
  let cancelled=false
  const {actions,state}=pricingHarness({quote:async()=>{cancelled=true;throw new TypeError('PRIVATE')}})
  await actions.loadQuotes({isCancelled:()=>cancelled});assert.equal(state.quotes.old.checkout_total,7)
})
await check('failed checkout preparation resets the button without granting access',async()=>{
  const {actions,state}=pricingHarness({checkout:async()=>{throw new TypeError('PRIVATE synthetic network detail')}})
  assert.equal(await actions.requestUpgrade({plan_key:'start'}),false);assert.equal(state.checkoutPlan,'');assert.equal(state.message,'Zahlung konnte nicht vorbereitet werden');assert.equal(state.redirects.length,0);assert.equal(state.grants,0)
})
await check('failed promo redemption also returns visible failure',async()=>{
  const {actions,state}=pricingHarness({promo:true})
  assert.equal(await actions.requestUpgrade({plan_key:'start'}),false);assert.equal(state.message,'Zahlung konnte nicht vorbereitet werden');assert.equal(state.checkoutCalls,0);assert.equal(state.grants,0)
})
await check('disabled payments never create a checkout',async()=>{
  const {actions,state}=pricingHarness({enabled:false})
  assert.equal(await actions.requestUpgrade({plan_key:'start'}),false);assert.equal(state.checkoutCalls,0);assert.equal(state.redirects.length,0)
})
await check('successful price and checkout flow remain unchanged',async()=>{
  const {actions,state}=pricingHarness()
  await actions.loadQuotes();assert.equal(state.loading,false);assert.equal(state.quotes.start.checkout_total,19.9)
  assert.equal(await actions.requestUpgrade({plan_key:'start'}),true);assert.deepEqual(state.redirects,['https://synthetic.invalid/checkout']);assert.equal(state.grants,0)
})
console.log(JSON.stringify({checks:12,status:failures.length?'failed':'passed',live_model_calls:0,failures},null,2))
if(failures.length)process.exitCode=1
