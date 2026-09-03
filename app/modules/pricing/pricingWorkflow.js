import { getWorkspaceAccess } from '../services/workspaceRepository'
import { getUpgradeQuotes, redeemTestAccessRecord, requestUpgradeRecord } from '../services/pricingRepository'
import { isTesterAccessQuote } from './testerAccess'

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
  setAccess,
  setUpgrades,
  onTestAccessGranted=()=>{},
  formatAccessEnd=value=>value,
  recordServerAudit
}){
  async function loadQuotes({isCancelled=()=>false}={}){
    setQuoteLoading(true)
    const nextQuotes=await getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode:appliedPromoCode})
    if(!isCancelled()){
      setQuotes(nextQuotes)
      setQuoteLoading(false)
    }
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

  async function activateTesterAccess(){
    const {data:grant,error}=await redeemTestAccessRecord(supabase,{promoCode:appliedPromoCode})
    if(error||!grant?.access_granted){
      setMessage(promoCopy.testAccessFailed)
      return false
    }

    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){
      setMessage(accessSnapshot.error.message)
      return false
    }

    setAccess(accessSnapshot.access)
    setUpgrades(accessSnapshot.upgrades||[])
    setPromoCode('')
    setAppliedPromoCode('')
    setQuotes({})
    setPromoRevision(value=>value+1)
    onTestAccessGranted()

    const end=grant.ends_at?formatAccessEnd(grant.ends_at):''
    const template=grant.already_redeemed?promoCopy.testAccessAlready:promoCopy.testAccessGranted
    setMessage(template.replace('{date}',end))
    return true
  }

  async function requestUpgrade(plan){
    setMessage('')
    const selectedQuote=quotes[plan.plan_key]
    if(appliedPromoCode&&selectedQuote?.promo_code_state!=='valid'){
      setMessage(promoCopy.invalid)
      return false
    }
    if(isTesterAccessQuote({planKey:plan.plan_key,termMonths,quote:selectedQuote,promoCode:appliedPromoCode})){
      return activateTesterAccess()
    }

    const {data:upgradeData,error}=await requestUpgradeRecord(supabase,{planKey:plan.plan_key,termMonths,promoCode:appliedPromoCode})
    if(error){setMessage(appliedPromoCode?promoCopy.invalid:error.message);return false}
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:upgradeData?.promo_code_state==='valid'},'account',null)
    setMessage(`${notices.upgradeReserved} ${notices.selected}: ${upgradeData?.to_plan_name||plan.plan_name}, ${termMonths} ${termMonths===1?notices.monthOne:notices.monthMany}.`)
    return true
  }

  return {loadQuotes,applyPromo,clearPromo,requestUpgrade}
}
