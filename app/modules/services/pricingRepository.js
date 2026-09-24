export async function getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode=''}){
  const pairs=await Promise.all(upgrades.map(async upgrade=>{
    const args={p_to_plan:upgrade.plan_key,p_term_months:termMonths}
    if(promoCode)args.p_promo_code=promoCode
    const {data,error}=await supabase.rpc('gold_upgrade_quote',args)
    return [upgrade.plan_key,error?null:data]
  }))
  return Object.fromEntries(pairs)
}

export function requestUpgradeRecord(supabase,{planKey,termMonths,promoCode=''}){
  const args={p_to_plan:planKey,p_term_months:termMonths}
  if(promoCode)args.p_promo_code=promoCode
  return supabase.rpc('gold_request_upgrade',args)
}

export function redeemTestAccessRecord(supabase,{promoCode}){
  return supabase.rpc('gold_redeem_test_access',{p_promo_code:promoCode})
}

export async function getPaymentConfig({signal}={}){
  try{
    const response=await fetch('/api/payments/config',{cache:'no-store',signal})
    if(!response.ok)return {enabled:false,provider:'sumup',mode:'disabled',liveLocked:false}
    return await response.json()
  }catch{
    return {enabled:false,provider:'sumup',mode:'disabled',liveLocked:false}
  }
}

// A full-page reload/navigation does not always run React's unmount cleanup.
// Abort this optional read before the browser tears down its document, and
// resume it only if that same page returns from the back/forward cache.
export function observePaymentConfig(onConfig,{page=window}={}){
  let request,disposed=false
  const load=()=>{
    request?.abort()
    const controller=new AbortController()
    request=controller
    getPaymentConfig({signal:controller.signal}).then(config=>{
      if(!disposed&&!controller.signal.aborted)onConfig(config)
    })
  }
  const hide=()=>request?.abort()
  const show=event=>{if(event.persisted&&request?.signal.aborted&&!disposed)load()}
  page.addEventListener('pagehide',hide)
  page.addEventListener('pageshow',show)
  load()
  return ()=>{disposed=true;hide();page.removeEventListener('pagehide',hide);page.removeEventListener('pageshow',show)}
}

export async function startCheckoutRecord(supabase,{planKey,termMonths,promoCode=''}){
  const {data:{session},error:sessionError}=await supabase.auth.getSession()
  const token=session?.access_token
  if(sessionError||!token)return {data:null,error:{code:'authentication_required'}}

  try{
    const response=await fetch('/api/payments/checkout',{
      method:'POST',
      cache:'no-store',
      headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
      body:JSON.stringify({planKey,termMonths,promoCode})
    })
    const result=await response.json().catch(()=>({ok:false,code:'checkout_failed'}))
    return result?.ok?{data:result,error:null}:{data:null,error:{code:result?.code||'checkout_failed'}}
  }catch{
    return {data:null,error:{code:'checkout_failed'}}
  }
}

export async function awaitCheckoutApplied(supabase,{requestId,attempts=12,intervalMs=1000}){
  const {data:{session},error:sessionError}=await supabase.auth.getSession()
  const token=session?.access_token
  if(sessionError||!token)return {data:null,error:{code:'authentication_required'}}
  for(let attempt=0;attempt<attempts;attempt+=1){
    let response
    try{
      response=await fetch('/api/payments/status',{
        method:'POST',
        cache:'no-store',
        headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
        body:JSON.stringify({requestId})
      })
    }catch{
      return {data:null,error:{code:'checkout_status_failed'}}
    }
    const result=await response.json().catch(()=>({ok:false,code:'checkout_status_failed'}))
    if(result?.applied)return {data:result,error:null}
    if(result?.code==='checkout_cancelled')return {data:result,error:{code:'checkout_cancelled'}}
    if(!response.ok)return {data:null,error:{code:result?.code||'checkout_status_failed'}}
    if(attempt<attempts-1)await new Promise(resolve=>setTimeout(resolve,intervalMs))
  }
  return {data:null,error:{code:'checkout_status_timeout'}}
}

export async function cancelCheckoutRecord(supabase,{requestId}){
  const {data:{session},error:sessionError}=await supabase.auth.getSession()
  const token=session?.access_token
  if(sessionError||!token)return {data:null,error:{code:'authentication_required'}}
  try{
    const response=await fetch('/api/payments/cancel',{
      method:'POST',
      cache:'no-store',
      headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
      body:JSON.stringify({requestId})
    })
    const result=await response.json().catch(()=>({ok:false,code:'cancellation_failed'}))
    return result?.ok?{data:result,error:null}:{data:null,error:{code:result?.code||'cancellation_failed'}}
  }catch{
    return {data:null,error:{code:'cancellation_failed'}}
  }
}
