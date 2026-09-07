import { randomInt } from 'node:crypto'

const LETTERS='abcdefghijklmnopqrstuvwxyz'

export function integrationIdentifier(randomIndex=maximum=>randomInt(maximum)){
  const suffix=Array.from({length:8},()=>LETTERS[randomIndex(LETTERS.length)]).join('')
  return `asgold_${suffix}`
}

export function amountToMinorUnits(amount){
  const value=Number(amount)
  if(!Number.isFinite(value)||value<=0)throw new Error('Invalid checkout amount')
  const minor=Math.round((value+Number.EPSILON)*100)
  if(!Number.isSafeInteger(minor)||minor<50)throw new Error('Checkout amount is below the supported minimum')
  return minor
}

export function checkoutSessionParameters({reservation,userEmail,baseUrl,nowSeconds=Math.floor(Date.now()/1000),identifier=integrationIdentifier()}){
  const requestId=String(reservation?.request_id||'')
  const planName=String(reservation?.to_plan_name||reservation?.to_plan||'AS Workspace Gold')
  const termMonths=Number(reservation?.term_months||1)
  if(!/^[0-9a-f-]{36}$/i.test(requestId))throw new Error('Invalid checkout request')
  if(![1,3,6,12].includes(termMonths))throw new Error('Invalid checkout term')
  if(!/^https?:\/\//.test(baseUrl))throw new Error('Invalid checkout base URL')

  return {
    mode:'payment',
    integration_identifier:identifier,
    success_url:`${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${baseUrl}/?payment=cancelled&request_id=${requestId}`,
    expires_at:nowSeconds+1800,
    client_reference_id:requestId,
    customer_email:userEmail,
    customer_creation:'always',
    billing_address_collection:'required',
    locale:'auto',
    submit_type:'pay',
    line_items:[{
      quantity:1,
      price_data:{
        currency:'eur',
        unit_amount:amountToMinorUnits(reservation.payment_amount),
        product_data:{
          name:`AS Workspace Gold – ${planName}`,
          description:`Fester Zugang für ${termMonths} Monat${termMonths===1?'':'e'} · keine automatische Verlängerung`
        }
      }
    }],
    metadata:{upgrade_request_id:requestId},
    payment_intent_data:{metadata:{upgrade_request_id:requestId}}
  }
}
