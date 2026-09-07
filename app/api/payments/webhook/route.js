import {
  createStripeServerClient,
  createSupabaseServiceClient,
  getPaymentServerConfig,
  noStoreJson
} from '../../../modules/payments/stripeServer.js'

export const dynamic='force-dynamic'

const PAID_EVENTS=new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded'
])
const CANCEL_EVENTS=new Set([
  'checkout.session.expired',
  'checkout.session.async_payment_failed'
])

function objectId(value){
  if(typeof value==='string')return value
  return typeof value?.id==='string'?value.id:''
}

export async function POST(request){
  let config
  try{
    config=getPaymentServerConfig()
  }catch(error){
    return noStoreJson({received:false,code:error.code||'payment_not_configured'},{status:503})
  }

  const signature=request.headers.get('stripe-signature')
  if(!signature)return noStoreJson({received:false,code:'signature_required'},{status:400})

  const stripe=createStripeServerClient(config)
  let event
  try{
    event=stripe.webhooks.constructEvent(await request.text(),signature,config.webhookSecret)
  }catch{
    return noStoreJson({received:false,code:'invalid_signature'},{status:400})
  }

  if(event.livemode){
    return noStoreJson({received:false,code:'live_event_rejected'},{status:400})
  }
  if(!PAID_EVENTS.has(event.type)&&!CANCEL_EVENTS.has(event.type)){
    return noStoreJson({received:true,ignored:true})
  }

  const session=event.data?.object
  const service=createSupabaseServiceClient(config)

  if(CANCEL_EVENTS.has(event.type)){
    const result=await service.rpc('gold_cancel_checkout_service',{
      p_request_id:null,
      p_checkout_session_id:session?.id||null,
      p_event_id:event.id,
      p_event_type:event.type
    })
    if(result.error)return noStoreJson({received:false,code:'cancellation_failed'},{status:500})
    return noStoreJson({received:true,cancelled:true})
  }

  if(session?.payment_status!=='paid'){
    return noStoreJson({received:true,paymentPending:true})
  }

  const result=await service.rpc('gold_fulfill_checkout_service',{
    p_event_id:event.id,
    p_event_type:event.type,
    p_checkout_session_id:session.id,
    p_payment_intent_id:objectId(session.payment_intent),
    p_amount_total:session.amount_total,
    p_currency:session.currency,
    p_payment_status:session.payment_status,
    p_paid_at:new Date(event.created*1000).toISOString()
  })
  if(result.error)return noStoreJson({received:false,code:'fulfilment_failed'},{status:500})

  return noStoreJson({received:true,applied:!!result.data?.applied})
}
