import { checkoutSessionParameters } from '../../../modules/payments/checkoutSession.mjs'
import {
  authenticatePaymentRequest,
  createStripeServerClient,
  createSupabaseServiceClient,
  getPaymentServerConfig,
  noStoreJson,
  paymentOriginAllowed
} from '../../../modules/payments/stripeServer.js'

export const dynamic='force-dynamic'

const PLAN_KEYS=new Set(['start','klar','analyse','komplett','business'])
const TERM_MONTHS=new Set([1,3,6,12])

function checkoutErrorCode(error){
  const message=String(error?.message||'')
  if(/already pending/i.test(message))return 'checkout_already_pending'
  if(/promo/i.test(message))return 'promo_invalid'
  if(error?.code==='payment_not_configured'||error?.code==='live_payments_locked')return error.code
  return 'checkout_failed'
}

export async function POST(request){
  let config
  try{
    config=getPaymentServerConfig()
  }catch(error){
    return noStoreJson({ok:false,code:checkoutErrorCode(error)},{status:503})
  }

  if(!paymentOriginAllowed(request,config)){
    return noStoreJson({ok:false,code:'origin_not_allowed'},{status:403})
  }

  let body
  try{
    body=await request.json()
  }catch{
    return noStoreJson({ok:false,code:'invalid_request'},{status:400})
  }

  const planKey=typeof body?.planKey==='string'?body.planKey:''
  const termMonths=Number(body?.termMonths)
  const promoCode=typeof body?.promoCode==='string'?body.promoCode.trim():''
  if(!PLAN_KEYS.has(planKey)||!TERM_MONTHS.has(termMonths)||promoCode.length>64){
    return noStoreJson({ok:false,code:'invalid_request'},{status:400})
  }

  const auth=await authenticatePaymentRequest(request)
  if(auth.error)return noStoreJson({ok:false,code:auth.error},{status:401})

  const {data:upgrade,error:upgradeError}=await auth.supabase.rpc('gold_request_upgrade',{
    p_to_plan:planKey,
    p_term_months:termMonths,
    ...(promoCode?{p_promo_code:promoCode}:{})
  })
  if(upgradeError||!upgrade?.request_id){
    return noStoreJson({ok:false,code:promoCode?'promo_invalid':'quote_unavailable'},{status:400})
  }

  const service=createSupabaseServiceClient(config)
  let reservation=null
  let session=null
  try{
    const reserved=await service.rpc('gold_reserve_checkout_service',{
      p_request_id:upgrade.request_id,
      p_owner_id:auth.user.id,
      p_ttl_minutes:30
    })
    if(reserved.error)throw reserved.error
    reservation={...reserved.data,to_plan_name:upgrade.to_plan_name||reserved.data?.to_plan}

    const stripe=createStripeServerClient(config)
    const params=checkoutSessionParameters({
      reservation,
      userEmail:auth.user.email,
      baseUrl:config.appBaseUrl
    })
    session=await stripe.checkout.sessions.create(params,{idempotencyKey:`asgold-checkout-${upgrade.request_id}`})
    if(!session?.id||!session?.url)throw new Error('Stripe Checkout did not return a URL')

    const attached=await service.rpc('gold_attach_checkout_session_service',{
      p_request_id:upgrade.request_id,
      p_owner_id:auth.user.id,
      p_checkout_session_id:session.id,
      p_checkout_url:session.url
    })
    if(attached.error){
      await stripe.checkout.sessions.expire(session.id).catch(()=>null)
      throw attached.error
    }

    return noStoreJson({ok:true,checkoutUrl:session.url,mode:'test',requestId:upgrade.request_id})
  }catch(error){
    await service.rpc('gold_cancel_checkout_service',{
      p_request_id:upgrade.request_id,
      p_checkout_session_id:session?.id||null,
      p_event_id:null,
      p_event_type:null
    }).catch(()=>null)
    return noStoreJson({ok:false,code:checkoutErrorCode(error)},{status:409})
  }
}
