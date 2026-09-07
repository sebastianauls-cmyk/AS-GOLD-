import {
  authenticatePaymentRequest,
  createStripeServerClient,
  createSupabaseServiceClient,
  getPaymentServerConfig,
  noStoreJson,
  paymentOriginAllowed
} from '../../../modules/payments/stripeServer.js'

export const dynamic='force-dynamic'

export async function POST(request){
  let config
  try{
    config=getPaymentServerConfig()
  }catch(error){
    return noStoreJson({ok:false,code:error.code||'payment_not_configured'},{status:503})
  }
  if(!paymentOriginAllowed(request,config))return noStoreJson({ok:false,code:'origin_not_allowed'},{status:403})

  const auth=await authenticatePaymentRequest(request)
  if(auth.error)return noStoreJson({ok:false,code:auth.error},{status:401})

  const body=await request.json().catch(()=>null)
  const requestId=typeof body?.requestId==='string'?body.requestId:''
  if(!/^[0-9a-f-]{36}$/i.test(requestId))return noStoreJson({ok:false,code:'invalid_request'},{status:400})

  const {data:upgrade,error}=await auth.supabase
    .from('upgrade_requests')
    .select('id,status,stripe_checkout_session_id')
    .eq('id',requestId)
    .maybeSingle()
  if(error||!upgrade)return noStoreJson({ok:false,code:'checkout_not_found'},{status:404})
  if(upgrade.status==='applied')return noStoreJson({ok:false,code:'checkout_already_applied'},{status:409})

  if(upgrade.stripe_checkout_session_id){
    const stripe=createStripeServerClient(config)
    await stripe.checkout.sessions.expire(upgrade.stripe_checkout_session_id).catch(()=>null)
  }

  const service=createSupabaseServiceClient(config)
  const cancelled=await service.rpc('gold_cancel_checkout_service',{
    p_request_id:upgrade.id,
    p_checkout_session_id:upgrade.stripe_checkout_session_id||null,
    p_event_id:null,
    p_event_type:null
  })
  if(cancelled.error)return noStoreJson({ok:false,code:'cancellation_failed'},{status:500})
  return noStoreJson({ok:true,cancelled:true})
}
