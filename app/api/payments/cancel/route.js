import {
  authenticatePaymentRequest,
  createSupabaseServiceClient,
  deactivateSumupCheckout,
  getPaymentServerConfig,
  noStoreJson,
  paymentOriginAllowed
} from '../../../modules/payments/sumupServer.js'

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
    .select('id,status,payment_provider,sumup_checkout_id')
    .eq('id',requestId)
    .maybeSingle()
  if(error||!upgrade||upgrade.payment_provider!=='sumup')return noStoreJson({ok:false,code:'checkout_not_found'},{status:404})
  if(upgrade.status==='applied')return noStoreJson({ok:false,code:'checkout_already_applied'},{status:409})
  if(upgrade.status==='cancelled')return noStoreJson({ok:true,cancelled:true})

  if(upgrade.sumup_checkout_id){
    try{
      await deactivateSumupCheckout(upgrade.sumup_checkout_id,config)
    }catch(error){
      // A processed checkout must be reconciled through the status endpoint.
      // Never cancel the local record when the provider outcome is unknown.
      if(error?.status===409)return noStoreJson({ok:false,code:'checkout_already_applied'},{status:409})
      return noStoreJson({ok:false,code:'cancellation_failed'},{status:502})
    }
  }

  try{
    const service=createSupabaseServiceClient(config)
    const cancelled=await service.rpc('gold_cancel_sumup_checkout_service',{
      p_request_id:upgrade.id,
      p_checkout_id:upgrade.sumup_checkout_id||null,
      p_event_type:null
    })
    if(cancelled.error)return noStoreJson({ok:false,code:'cancellation_failed'},{status:500})
    // The RPC can report success after a concurrent fulfillment. Check the
    // persisted owner-scoped record before telling the customer it was cancelled.
    const confirmed=await auth.supabase.from('upgrade_requests').select('status').eq('id',requestId).maybeSingle()
    if(confirmed.error||!confirmed.data)return noStoreJson({ok:false,code:'cancellation_failed'},{status:500})
    if(confirmed.data.status==='applied')return noStoreJson({ok:false,code:'checkout_already_applied'},{status:409})
    if(confirmed.data.status!=='cancelled')return noStoreJson({ok:false,code:'cancellation_failed'},{status:409})
    return noStoreJson({ok:true,cancelled:true})
  }catch{
    return noStoreJson({ok:false,code:'cancellation_failed'},{status:500})
  }
}
