import { reconcileSumupCheckout, SUMUP_PAYMENT_COLUMNS } from '../../../modules/payments/sumupFulfillment.js'
import {
  authenticatePaymentRequest,
  createSupabaseServiceClient,
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

  const {data:record,error}=await auth.supabase
    .from('upgrade_requests')
    .select(SUMUP_PAYMENT_COLUMNS)
    .eq('id',requestId)
    .maybeSingle()
  if(error||!record)return noStoreJson({ok:false,code:'checkout_not_found'},{status:404})

  const service=createSupabaseServiceClient(config)
  try{
    const result=await reconcileSumupCheckout({record,config,service})
    return noStoreJson(result,{status:result.code==='checkout_cancelled'?409:200})
  }catch{
    return noStoreJson({ok:false,code:'verification_failed'},{status:500})
  }
}
