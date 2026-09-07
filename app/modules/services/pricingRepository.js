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

export async function getPaymentConfig(){
  try{
    const response=await fetch('/api/payments/config',{cache:'no-store'})
    if(!response.ok)return {enabled:false,mode:'disabled',liveLocked:false}
    return await response.json()
  }catch{
    return {enabled:false,mode:'disabled',liveLocked:false}
  }
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

export async function awaitCheckoutApplied(supabase,{sessionId,attempts=12,intervalMs=750}){
  for(let attempt=0;attempt<attempts;attempt+=1){
    const {data,error}=await supabase
      .from('upgrade_requests')
      .select('status,fulfilled_at,period_ends_at,granted_access_period_id')
      .eq('stripe_checkout_session_id',sessionId)
      .maybeSingle()
    if(error)return {data:null,error}
    if(data?.status==='applied')return {data,error:null}
    if(data?.status==='cancelled')return {data,error:{code:'checkout_cancelled'}}
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
