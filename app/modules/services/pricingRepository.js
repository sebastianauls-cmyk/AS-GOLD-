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
