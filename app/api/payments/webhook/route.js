import { reconcileSumupCheckout, SUMUP_PAYMENT_COLUMNS } from '../../../modules/payments/sumupFulfillment.js'
import {
  createSupabaseServiceClient,
  getPaymentServerConfig,
  noStoreJson
} from '../../../modules/payments/sumupServer.js'

export const dynamic='force-dynamic'

export async function POST(request){
  let config
  try{
    config=getPaymentServerConfig()
  }catch(error){
    return noStoreJson({received:false,code:error.code||'payment_not_configured'},{status:503})
  }

  const body=await request.json().catch(()=>null)
  if(body?.event_type!=='CHECKOUT_STATUS_CHANGED'){
    return noStoreJson({received:true,ignored:true})
  }
  const checkoutId=typeof body?.id==='string'?body.id:''
  if(!/^[0-9a-f-]{36}$/i.test(checkoutId)){
    return noStoreJson({received:true,ignored:true})
  }

  const service=createSupabaseServiceClient(config)
  const {data:record,error}=await service
    .from('upgrade_requests')
    .select(SUMUP_PAYMENT_COLUMNS)
    .eq('sumup_checkout_id',checkoutId)
    .maybeSingle()
  if(error)return noStoreJson({received:false,code:'lookup_failed'},{status:500})
  if(!record)return noStoreJson({received:true,ignored:true})

  try{
    const result=await reconcileSumupCheckout({record,config,service})
    return noStoreJson({received:true,applied:!!result.applied,status:result.status})
  }catch{
    return noStoreJson({received:false,code:'verification_failed'},{status:500})
  }
}
