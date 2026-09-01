import { getUpgradeQuotes, requestUpgradeRecord } from '../services/pricingRepository'

export function createPricingWorkflowActions({
  supabase,
  upgrades,
  termMonths,
  promoCode,
  appliedPromoCode,
  quotes,
  promoCopy,
  notices,
  setQuotes,
  setPromoCode,
  setAppliedPromoCode,
  setPromoRevision,
  setQuoteLoading,
  setMessage,
  recordServerAudit
}){
  async function loadQuotes(){
    setQuoteLoading(true)
    const nextQuotes=await getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode:appliedPromoCode})
    setQuotes(nextQuotes)
    setQuoteLoading(false)
    return nextQuotes
  }

  function applyPromo(event){
    event.preventDefault()
    const next=promoCode.trim()
    if(!next) return clearPromo()
    setQuotes({})
    setAppliedPromoCode(next)
    setPromoRevision(value=>value+1)
  }

  function clearPromo(){
    setPromoCode('')
    setQuotes({})
    setAppliedPromoCode('')
    setPromoRevision(value=>value+1)
  }

  async function requestUpgrade(plan){
    setMessage('')
    const selectedQuote=quotes[plan.plan_key]
    if(appliedPromoCode&&selectedQuote?.promo_code_state!=='valid'){
      setMessage(promoCopy.invalid)
      return false
    }
    const {data:upgradeData,error}=await requestUpgradeRecord(supabase,{planKey:plan.plan_key,termMonths,promoCode:appliedPromoCode})
    if(error){setMessage(appliedPromoCode?promoCopy.invalid:error.message);return false}
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:upgradeData?.promo_code_state==='valid'},'account',null)
    setMessage(`${notices.upgradeReserved} ${notices.selected}: ${upgradeData?.to_plan_name||plan.plan_name}, ${termMonths} ${termMonths===1?notices.monthOne:notices.monthMany}.`)
    return true
  }

  return {loadQuotes,applyPromo,clearPromo,requestUpgrade}
}
