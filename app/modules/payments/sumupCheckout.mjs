export function sumupCheckoutReference(requestId){
  const value=String(requestId||'')
  if(!/^[0-9a-f-]{36}$/i.test(value))throw new Error('Invalid checkout request')
  return `asgold_${value}`
}

export function sumupCheckoutPayload({reservation,merchantCode,baseUrl,now=new Date()}){
  const requestId=String(reservation?.request_id||'')
  const planName=String(reservation?.to_plan_name||reservation?.to_plan||'AS Workspace Gold')
  const termMonths=Number(reservation?.term_months||1)
  const amount=Number(reservation?.payment_amount)
  if(!/^[0-9a-f-]{36}$/i.test(requestId))throw new Error('Invalid checkout request')
  if(![1,3,6,12].includes(termMonths))throw new Error('Invalid checkout term')
  if(!Number.isFinite(amount)||amount<0.5)throw new Error('Invalid checkout amount')
  if(!/^[A-Z0-9]{6,16}$/.test(String(merchantCode||'')))throw new Error('Invalid SumUp merchant code')
  if(!/^https:\/\//.test(baseUrl))throw new Error('Invalid checkout base URL')

  const validUntil=new Date(new Date(now).getTime()+30*60*1000).toISOString()
  return {
    checkout_reference:sumupCheckoutReference(requestId),
    amount:Math.round((amount+Number.EPSILON)*100)/100,
    currency:'EUR',
    merchant_code:merchantCode,
    description:`AS Workspace Gold – ${planName} – ${termMonths} Monat${termMonths===1?'':'e'}`,
    return_url:`${baseUrl}/api/payments/webhook`,
    redirect_url:`${baseUrl}/?payment=return&request_id=${requestId}`,
    valid_until:validUntil,
    hosted_checkout:{enabled:true}
  }
}

export function successfulSumupTransaction(checkout){
  return Array.isArray(checkout?.transactions)
    ?checkout.transactions.find(transaction=>transaction?.status==='SUCCESSFUL')||null
    :null
}

export function verifySumupCheckout(checkout,expected){
  if(!checkout||checkout.id!==expected.checkoutId)return {valid:false,reason:'checkout_id_mismatch'}
  if(checkout.checkout_reference!==expected.checkoutReference)return {valid:false,reason:'checkout_reference_mismatch'}
  if(checkout.merchant_code!==expected.merchantCode)return {valid:false,reason:'merchant_mismatch'}
  if(String(checkout.currency||'').toUpperCase()!==String(expected.currency||'').toUpperCase())return {valid:false,reason:'currency_mismatch'}
  if(Math.abs(Number(checkout.amount)-Number(expected.amount))>0.001)return {valid:false,reason:'amount_mismatch'}
  if(checkout.status!=='PAID')return {valid:true,paid:false,status:checkout.status||'PENDING',transaction:null}
  const transaction=successfulSumupTransaction(checkout)
  if(!transaction)return {valid:false,reason:'successful_transaction_missing'}
  if(String(transaction.currency||'').toUpperCase()!==String(expected.currency||'').toUpperCase())return {valid:false,reason:'transaction_currency_mismatch'}
  if(Math.abs(Number(transaction.amount)-Number(expected.amount))>0.001)return {valid:false,reason:'transaction_amount_mismatch'}
  if(transaction.merchant_code!==expected.merchantCode)return {valid:false,reason:'transaction_merchant_mismatch'}
  return {valid:true,paid:true,status:'PAID',transaction}
}
