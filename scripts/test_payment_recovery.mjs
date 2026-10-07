import {offlineNetworkAttempts} from './offline/noNetwork.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {awaitCheckoutApplied,cancelCheckoutRecord,startCheckoutRecord} from '../app/modules/services/pricingRepository.js'
import {verifySumupCheckout} from '../app/modules/payments/sumupCheckout.mjs'
import {paymentTranslations} from '../app/modules/payments/paymentTranslations.mjs'

// Production functions, synthetic transport replies; no credentials or live requests.
const failures=[]
let checks=0
async function check(name,run){checks++;try{await run()}catch(error){failures.push({name,error:error.message})}}
function moduleWith(path,bindings){
  const source=fs.readFileSync(path,'utf8').replace(/^import\s+['"][^'"]+['"];?\s*$/gm,'').replace(/^import[\s\S]*?\bfrom\s+['"][^'"]+['"];?\s*$/gm,'').replace(/^export\s+(?=(?:async\s+)?function|const)/gm,'')
  const context=vm.createContext({...bindings})
  vm.runInContext(source,context,{filename:path})
  return context
}
const requestId='123e4567-e89b-12d3-a456-426614174000'
const checkoutId='64553e20-3f0e-49e4-8af3-fd0eca86ce91'
const session={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-session-only'}},error:null})}}
const copy=paymentTranslations.de
const expected={checkoutId,checkoutReference:`asgold_${requestId}`,merchantCode:'MC123456',amount:19.9,currency:'EUR'}
const transaction={id:'synthetic-transaction-id',merchant_code:expected.merchantCode,amount:19.9,currency:'EUR',status:'SUCCESSFUL'}
const checkout={id:checkoutId,checkout_reference:expected.checkoutReference,merchant_code:expected.merchantCode,amount:19.9,currency:'EUR',status:'PAID',transactions:[transaction]}

for(const amount of [undefined,null,NaN,Infinity,-Infinity,'bad','',false,{},[],[19.9]]){
  await check(`invalid checkout amount ${String(amount)}`,()=>assert.equal(verifySumupCheckout({...checkout,amount},expected).valid,false))
  await check(`invalid transaction amount ${String(amount)}`,()=>assert.equal(verifySumupCheckout({...checkout,transactions:[{...transaction,amount}]},expected).valid,false))
}
await check('invalid expected amount cannot confirm payment',()=>{
  for(const amount of [undefined,null,NaN,Infinity,'bad',false,0,-1])assert.equal(verifySumupCheckout(checkout,{...expected,amount}).valid,false)
})
await check('valid amounts across different prices and decimal representations',()=>{
  for(const amount of [0.5,19.9,49.9,149.7,598.8]){
    const result=verifySumupCheckout({...checkout,amount,transactions:[{...transaction,amount}]},{...expected,amount:String(amount)})
    assert.equal(result.valid,true);assert.equal(result.paid,true)
  }
  assert.equal(verifySumupCheckout({...checkout,amount:19.91},expected).valid,false)
  assert.equal(verifySumupCheckout({...checkout,transactions:[{...transaction,amount:19.89}]},expected).valid,false)
})

function workflow({status=async()=>({data:{ok:true,applied:true},error:null}),cancel=async()=>({data:{ok:true,cancelled:true},error:null}),access=async()=>({access:{permissions:{paid_access_ends_at:'2027-01-01'}},upgrades:[]})}={}){
  const state={message:'',busy:'start',cleaned:0,grants:0,accessReads:0,accessWrites:0,cancels:0,statusReads:0}
  const context=moduleWith('app/modules/pricing/pricingWorkflow.js',{
    awaitCheckoutApplied:async(...args)=>{state.statusReads++;return status(...args)},
    cancelCheckoutRecord:async(...args)=>{state.cancels++;return cancel(...args)},
    getWorkspaceAccess:async()=>{state.accessReads++;return access()}
  })
  const actions=context.createPricingWorkflowActions({supabase:{},paymentCopy:copy,
    setMessage:v=>state.message=v,setCheckoutPlan:v=>state.busy=v,setAccess:()=>state.accessWrites++,setUpgrades:()=>{},setQuotes:()=>{},
    onPaymentAccessGranted:()=>state.grants++})
  return {state,run:options=>actions.handleCheckoutReturn({requestId,cleanUrl:()=>state.cleaned++,...options})}
}
for(const failure of [async()=>{throw new TypeError('PRIVATE transport')},async()=>({error:{code:'checkout_status_failed'}})]){
  await check('status transport failure stays recoverable and gives feedback',async()=>{
    const h=workflow({status:failure});assert.equal(await h.run(),false)
    assert.equal(h.state.message,copy.statusUnconfirmed);assert.equal(h.state.cleaned,0);assert.equal(h.state.busy,'');assert.equal(h.state.grants,0);assert.equal(h.state.accessReads,0)
  })
}
await check('timeout retains return URL and does not grant access',async()=>{
  const h=workflow({status:async()=>({error:{code:'checkout_status_timeout'}})})
  assert.equal(await h.run(),false);assert.equal(h.state.message,copy.statusTimeout);assert.equal(h.state.cleaned,0);assert.equal(h.state.grants,0);assert.equal(h.state.busy,'')
})
for(const access of [async()=>{throw new TypeError('PRIVATE access')},async()=>({error:{message:'PRIVATE access'}}),async()=>({access:null})]){
  await check('access reload failure cannot claim successful activation',async()=>{
    const h=workflow({access});assert.equal(await h.run(),false);assert.equal(h.state.cleaned,0);assert.equal(h.state.grants,0);assert.equal(h.state.accessWrites,0);assert.equal(h.state.message,copy.statusUnconfirmed)
  })
}
await check('retry after a connection failure confirms the same checkout',async()=>{
  let attempts=0
  const h=workflow({status:async()=>++attempts===1?{error:{code:'checkout_status_failed'}}:{data:{ok:true,applied:true},error:null}})
  assert.equal(await h.run(),false);assert.equal(h.state.cleaned,0)
  assert.equal(await h.run(),true);assert.equal(h.state.cleaned,1);assert.equal(h.state.grants,1);assert.match(h.state.message,/2027-01-01/);assert.equal(h.state.cancels,0)
})
for(const cancel of [async()=>({error:{code:'cancellation_failed'}}),async()=>{throw new TypeError('PRIVATE cancel')},async()=>({data:{ok:true,cancelled:false},error:null})]){
  await check('failed or unconfirmed cancellation is not shown as cancelled',async()=>{
    const h=workflow({cancel});assert.equal(await h.run({cancelled:true}),false);assert.equal(h.state.cleaned,0);assert.equal(h.state.grants,0);assert.equal(h.state.message,copy.statusUnconfirmed);assert.equal(h.state.busy,'')
  })
}
await check('confirmed cancellation clears return URL',async()=>{
  const h=workflow();assert.equal(await h.run({cancelled:true}),false);assert.equal(h.state.cleaned,1);assert.equal(h.state.message,copy.cancelled);assert.equal(h.state.grants,0)
})
await check('cancellation racing with completed payment reconciles access',async()=>{
  const h=workflow({cancel:async()=>({error:{code:'checkout_already_applied'}})})
  assert.equal(await h.run({cancelled:true}),true);assert.equal(h.state.cleaned,1);assert.equal(h.state.grants,1);assert.equal(h.state.statusReads,1)
})
await check('provider-confirmed cancelled status is terminal',async()=>{
  const h=workflow({status:async()=>({error:{code:'checkout_cancelled'}})})
  assert.equal(await h.run(),false);assert.equal(h.state.cleaned,1);assert.equal(h.state.message,copy.cancelled);assert.equal(h.state.grants,0)
})
await check('missing request cannot claim cancellation',async()=>{
  const h=workflow();assert.equal(await h.run({requestId:'',cancelled:true}),false);assert.equal(h.state.message,copy.statusUnconfirmed);assert.equal(h.state.cleaned,0);assert.equal(h.state.cancels,0)
})
await check('uncertain status has a clear message in every supported language',()=>{
  for(const translation of Object.values(paymentTranslations)){assert.ok(translation.statusUnconfirmed?.trim());assert.notEqual(translation.statusUnconfirmed,translation.success);assert.notEqual(translation.statusUnconfirmed,translation.cancelled)}
})

const blockedFetch=globalThis.fetch
const calls=[['status',s=>awaitCheckoutApplied(s,{requestId,attempts:2,intervalMs:0})],['cancel',s=>cancelCheckoutRecord(s,{requestId})],['start',s=>startCheckoutRecord(s,{planKey:'start',termMonths:1})]]
try{
  for(const [name,call] of calls){
    await check(`${name}: session rejection is an error result`,async()=>{assert.ok((await call({auth:{getSession:async()=>{throw new TypeError('PRIVATE')}}})).error)})
    await check(`${name}: malformed session makes no request`,async()=>{
      let requests=0;globalThis.fetch=async()=>{requests++;throw new Error('unexpected')}
      assert.ok((await call({auth:{getSession:async()=>({data:null,error:null})}})).error);assert.equal(requests,0)
    })
    await check(`${name}: HTTP failure cannot be accepted as success`,async()=>{
      globalThis.fetch=async()=>Response.json({ok:true,applied:true,cancelled:true,checkoutUrl:'https://synthetic.invalid'},{status:500})
      assert.ok((await call(session)).error)
    })
    await check(`${name}: valid transport, malformed JSON result fails`,async()=>{
      for(const payload of [null,{}, {ok:'true',applied:'true',cancelled:'true'},{ok:false,applied:true,cancelled:true}]){
        globalThis.fetch=async()=>Response.json(payload);assert.ok((await call(session)).error)
      }
    })
    await check(`${name}: network failure gives an error result`,async()=>{globalThis.fetch=async()=>{throw new TypeError('PRIVATE')};assert.ok((await call(session)).error)})
    await check(`${name}: request has a finite transport deadline`,async()=>{
      globalThis.fetch=async(_url,options)=>{assert.ok(options.signal instanceof AbortSignal);return Response.json({ok:true,applied:true,cancelled:true,checkoutUrl:'https://synthetic.invalid'})}
      assert.equal((await call(session)).error,null)
    })
  }
  await check('pending payment is polled without starting another checkout',async()=>{
    let requests=0
    globalThis.fetch=async(url)=>{assert.equal(url,'/api/payments/status');return Response.json(++requests===1?{ok:true,applied:false,status:'pending'}:{ok:true,applied:true,status:'applied'})}
    assert.equal((await awaitCheckoutApplied(session,{requestId,attempts:2,intervalMs:0})).data.applied,true);assert.equal(requests,2)
  })
  await check('string applied and missing cancelled fields cannot confirm outcomes',async()=>{
    globalThis.fetch=async()=>Response.json({ok:true,applied:'false'})
    assert.ok((await awaitCheckoutApplied(session,{requestId,attempts:1})).error)
    globalThis.fetch=async()=>Response.json({ok:true})
    assert.ok((await cancelCheckoutRecord(session,{requestId})).error)
  })
}finally{globalThis.fetch=blockedFetch}

function cancelRoute({provider=async()=>({id:checkoutId,status:'EXPIRED'}),initial='checkout_pending',after='cancelled',rpcError=null,enabled=true,origin=true,authenticated=true}={}){
  const state={reads:0,deletes:0,writes:0}
  const record={id:requestId,payment_provider:'sumup',sumup_checkout_id:checkoutId}
  const client={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{...record,status:state.reads++?after:initial},error:null})})})})}
  const context=moduleWith('app/api/payments/cancel/route.js',{
    getPaymentServerConfig:()=>{if(!enabled)throw Object.assign(new Error(),{code:'live_payments_locked'});return {}},
    paymentOriginAllowed:()=>origin,authenticatePaymentRequest:async()=>({supabase:client,error:authenticated?null:'authentication_required'}),
    createSupabaseServiceClient:()=>({rpc:async()=>{state.writes++;return {data:{cancelled:true},error:rpcError}}}),
    deactivateSumupCheckout:async()=>{state.deletes++;return provider()},
    noStoreJson:(payload,{status=200}={})=>({payload,status})
  })
  return {state,run:()=>context.POST({json:async()=>({requestId})})}
}
await check('cancel endpoint does not persist cancellation after provider failure',async()=>{
  const h=cancelRoute({provider:async()=>{throw new TypeError('PRIVATE provider')}});const response=await h.run()
  assert.equal(response.payload.ok,false);assert.equal(response.status,502);assert.equal(h.state.writes,0)
})
await check('cancel endpoint reports paid conflict for status reconciliation',async()=>{
  const h=cancelRoute({provider:async()=>{throw Object.assign(new Error('PRIVATE'),{status:409})}});const response=await h.run()
  assert.equal(response.payload.code,'checkout_already_applied');assert.equal(h.state.writes,0)
})
await check('cancel endpoint checks persisted outcome even if RPC claims success',async()=>{
  for(const after of ['applied','checkout_pending']){
    const h=cancelRoute({after});const response=await h.run();assert.equal(response.payload.ok,false);assert.notEqual(response.payload.cancelled,true)
    if(after==='applied')assert.equal(response.payload.code,'checkout_already_applied')
  }
})
await check('confirmed and repeated cancellation are safe',async()=>{
  const h=cancelRoute();const response=await h.run();assert.equal(response.payload.cancelled,true);assert.equal(h.state.writes,1)
  const repeated=cancelRoute({initial:'cancelled'});assert.equal((await repeated.run()).payload.cancelled,true);assert.equal(repeated.state.deletes,0);assert.equal(repeated.state.writes,0)
})
await check('cancel gates cannot contact provider or mutate a payment',async()=>{
  for(const options of [{enabled:false},{origin:false},{authenticated:false},{initial:'applied'}]){
    const h=cancelRoute(options);assert.equal((await h.run()).payload.ok,false);assert.equal(h.state.deletes,0);assert.equal(h.state.writes,0)
  }
})

await check('provider deactivation does not swallow errors or incomplete success',async()=>{
  for(const response of [null,{}, {id:'wrong',status:'EXPIRED'},{id:checkoutId,status:'PAID'},{id:checkoutId,status:'PENDING',transactions:[transaction]}]){
    const context=moduleWith('app/modules/payments/sumupServer.js',{AbortSignal,fetch:async()=>Response.json(response)})
    await assert.rejects(()=>context.deactivateSumupCheckout(checkoutId,{apiKey:'synthetic-only'}))
  }
  for(const status of [404,409,503]){
    const context=moduleWith('app/modules/payments/sumupServer.js',{AbortSignal,fetch:async()=>Response.json({code:'synthetic_error'},{status})})
    await assert.rejects(()=>context.deactivateSumupCheckout(checkoutId,{apiKey:'synthetic-only'}),error=>error.status===status)
  }
  const context=moduleWith('app/modules/payments/sumupServer.js',{AbortSignal,fetch:async()=>Response.json({id:checkoutId,status:'EXPIRED'})})
  assert.equal((await context.deactivateSumupCheckout(checkoutId,{apiKey:'synthetic-only'})).id,checkoutId)
})
function reconciliation({reply=checkout,storedStatus='cancelled',recordStatus='checkout_pending'}={}){
  const state={writes:[]}
  const context=moduleWith('app/modules/payments/sumupFulfillment.js',{
    verifySumupCheckout,retrieveSumupCheckout:async()=>reply
  })
  const service={rpc:async(name,args)=>{state.writes.push({name,args});return {data:{applied:true,cancelled:true},error:null}},
    from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({data:{status:storedStatus},error:null})})})})})}
  const record={id:requestId,owner_id:'synthetic-owner',status:recordStatus,payment_provider:'sumup',sumup_checkout_id:checkoutId,sumup_checkout_reference:expected.checkoutReference,payment_amount:expected.amount,payment_currency:'EUR'}
  return {state,run:()=>context.reconcileSumupCheckout({record,config:{merchantCode:expected.merchantCode},service})}
}
await check('incomplete provider amounts never reach access fulfillment',async()=>{
  for(const reply of [{...checkout,amount:undefined},{...checkout,transactions:[{...transaction,amount:'invalid'}]}]){
    const h=reconciliation({reply});await assert.rejects(h.run);assert.equal(h.state.writes.length,0)
  }
})
await check('verified payment reaches fulfillment with the exact amount',async()=>{
  const h=reconciliation();assert.equal((await h.run()).applied,true);assert.equal(h.state.writes[0].name,'gold_fulfill_sumup_checkout_service');assert.equal(h.state.writes[0].args.p_amount,19.9)
})
await check('terminal provider result cannot hide concurrent access activation',async()=>{
  const h=reconciliation({reply:{...checkout,status:'EXPIRED',transactions:[]},storedStatus:'applied'})
  const response=await h.run();assert.equal(response.ok,true);assert.equal(response.applied,true)
})
await check('terminal provider result requires persisted cancellation',async()=>{
  const h=reconciliation({reply:{...checkout,status:'EXPIRED',transactions:[]},storedStatus:'checkout_pending'})
  await assert.rejects(h.run)
  const confirmed=reconciliation({reply:{...checkout,status:'EXPIRED',transactions:[]}})
  assert.equal((await confirmed.run()).code,'checkout_cancelled')
})
assert.equal(offlineNetworkAttempts().length,0)
console.log(JSON.stringify({checks,status:failures.length?'failed':'passed',unexpected_network_attempts:0,live_payments:0,live_model_calls:0,failures},null,2))
if(failures.length)process.exitCode=1
