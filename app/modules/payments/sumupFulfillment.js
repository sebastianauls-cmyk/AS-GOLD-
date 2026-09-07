import 'server-only'

import { verifySumupCheckout } from './sumupCheckout.mjs'
import { retrieveSumupCheckout } from './sumupServer.js'

export const SUMUP_PAYMENT_COLUMNS='id,owner_id,status,payment_provider,payment_amount,payment_currency,sumup_checkout_id,sumup_checkout_reference,sumup_merchant_code,checkout_expires_at,fulfilled_at,period_ends_at,granted_access_period_id'

export function expectedSumupCheckout(record,config){
  return {
    checkoutId:record.sumup_checkout_id,
    checkoutReference:record.sumup_checkout_reference,
    merchantCode:config.merchantCode,
    amount:record.payment_amount,
    currency:record.payment_currency
  }
}

export async function reconcileSumupCheckout({record,config,service}){
  if(record?.payment_provider!=='sumup'||!record?.sumup_checkout_id){
    return {ok:false,code:'checkout_not_found',status:'missing'}
  }
  if(record.status==='applied')return {ok:true,applied:true,status:'applied'}
  if(record.status==='cancelled')return {ok:false,code:'checkout_cancelled',status:'cancelled'}

  const checkout=await retrieveSumupCheckout(record.sumup_checkout_id,config)
  const verification=verifySumupCheckout(checkout,expectedSumupCheckout(record,config))
  if(!verification.valid){
    const error=new Error('SumUp checkout verification failed')
    error.code=verification.reason||'sumup_verification_failed'
    throw error
  }

  if(verification.paid){
    const transaction=verification.transaction
    const fulfilled=await service.rpc('gold_fulfill_sumup_checkout_service',{
      p_checkout_id:checkout.id,
      p_checkout_reference:checkout.checkout_reference,
      p_merchant_code:checkout.merchant_code,
      p_transaction_id:transaction.id,
      p_transaction_code:transaction.transaction_code||null,
      p_amount:Number(checkout.amount),
      p_currency:checkout.currency,
      p_payment_status:checkout.status,
      p_paid_at:transaction.timestamp||checkout.date||new Date().toISOString()
    })
    if(fulfilled.error)throw fulfilled.error
    return {ok:true,applied:!!fulfilled.data?.applied,status:'applied'}
  }

  if(verification.status==='FAILED'||verification.status==='EXPIRED'){
    const cancelled=await service.rpc('gold_cancel_sumup_checkout_service',{
      p_request_id:record.id,
      p_checkout_id:checkout.id,
      p_event_type:`CHECKOUT_${verification.status}`
    })
    if(cancelled.error)throw cancelled.error
    return {ok:false,code:'checkout_cancelled',status:'cancelled'}
  }

  return {ok:true,applied:false,status:'pending'}
}
