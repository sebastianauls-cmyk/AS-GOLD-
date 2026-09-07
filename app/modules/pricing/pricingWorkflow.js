import { getWorkspaceAccess } from '../services/workspaceRepository.js'
import { awaitCheckoutApplied, cancelCheckoutRecord, getUpgradeQuotes, redeemTestAccessRecord, startCheckoutRecord } from '../services/pricingRepository.js'
import { isTesterAccessQuote } from './testerAccess.js'

export function createPricingWorkflowActions({
  supabase,
  upgrades,
  termMonths,
  promoCode,
  appliedPromoCode,
  quotes,
  promoCopy,
  paymentCopy,
  paymentConfig,
  notices,
  setQuotes,
  setPromoCode,
  setAppliedPromoCode,
  setPromoRevision,
  setQuoteLoading,
  setCheckoutPlan,
  setMessage,
  setAccess,
  setUpgrades,
  onTestAccessGranted=()=>{},
  onPaymentAccessGranted=()=>{},
  formatAccessEnd=value=>value,
  recordServerAudit,
  redirectToCheckout=url=>window.location.assign(url)
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

    if(!paymentConfig?.enabled){
      setMessage(paymentCopy.unavailable)
      return false
    }

    setCheckoutPlan(plan.plan_key)
    setMessage(paymentCopy.starting)
    const {data,error}=await startCheckoutRecord(supabase,{planKey:plan.plan_key,termMonths,promoCode:appliedPromoCode})
    if(error){
      setCheckoutPlan('')
      const errorCopy={
        permanent_account_required:paymentCopy.permanentAccountRequired,
        checkout_already_pending:paymentCopy.alreadyPending,
        promo_invalid:promoCopy.invalid,
        payment_not_configured:paymentCopy.unavailable,
        live_payments_locked:paymentCopy.unavailable
      }
      setMessage(errorCopy[error.code]||paymentCopy.failed)
      return false
    }
    redirectToCheckout(data.checkoutUrl)
    return true
  }

  async function handleCheckoutReturn({sessionId,requestId,cancelled=false,cleanUrl=()=>{}}={}){
    cleanUrl()
    if(cancelled){
      if(requestId)await cancelCheckoutRecord(supabase,{requestId})
      setCheckoutPlan('')
      setMessage(paymentCopy.cancelled)
      return false
    }
    if(!sessionId)return false

    setMessage(paymentCopy.successPending)
    const result=await awaitCheckoutApplied(supabase,{sessionId})
    if(result.error){
      setMessage(result.error.code==='checkout_status_timeout'?paymentCopy.statusTimeout:paymentCopy.failed)
      return false
    }

    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){
      setMessage(accessSnapshot.error.message)
      return false
    }
    setAccess(accessSnapshot.access)
    setUpgrades(accessSnapshot.upgrades||[])
    setQuotes({})
    setCheckoutPlan('')
    onPaymentAccessGranted()
    const end=accessSnapshot.access?.permissions?.paid_access_ends_at
    setMessage(paymentCopy.success.replace('{date}',end?formatAccessEnd(end):''))
    return true
  }

  return {loadQuotes,applyPromo,clearPromo,requestUpgrade,handleCheckoutReturn}
}
