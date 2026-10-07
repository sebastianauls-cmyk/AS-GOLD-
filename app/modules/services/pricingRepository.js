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

async function paymentRequest(supabase,path,body,failureCode){
  try{
    const sessionResult=await supabase.auth.getSession()
    const token=sessionResult?.data?.session?.access_token
    if(sessionResult?.error||!token)return {data:null,error:{code:'authentication_required'}}
    const response=await fetch(path,{
      method:'POST',
      cache:'no-store',
      headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(15_000)
    })
    const result=await response.json().catch(()=>null)
    if(!response.ok||result?.ok!==true)return {data:null,error:{code:result?.code||failureCode}}
    return {data:result,error:null}
  }catch{
    return {data:null,error:{code:failureCode}}
  }
}

export function startCheckoutRecord(supabase,{planKey,termMonths,promoCode=''}){
  return paymentRequest(supabase,'/api/payments/checkout',{planKey,termMonths,promoCode},'checkout_failed')
}

export async function awaitCheckoutApplied(supabase,{requestId,attempts=12,intervalMs=1000}){
  for(let attempt=0;attempt<attempts;attempt+=1){
    const result=await paymentRequest(supabase,'/api/payments/status',{requestId},'checkout_status_failed')
    if(result.error)return result
    if(result.data.applied===true)return result
    if(result.data.applied!==false)return {data:null,error:{code:'checkout_status_failed'}}
    if(attempt<attempts-1)await new Promise(resolve=>setTimeout(resolve,intervalMs))
  }
  return {data:null,error:{code:'checkout_status_timeout'}}
}

export async function cancelCheckoutRecord(supabase,{requestId}){
  const result=await paymentRequest(supabase,'/api/payments/cancel',{requestId},'cancellation_failed')
  if(result.error)return result
  return result.data.cancelled===true?result:{data:null,error:{code:'cancellation_failed'}}
}
