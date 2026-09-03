export function isTesterAccessQuote({planKey,termMonths,quote,promoCode}){
  return Boolean(
    promoCode&&
    planKey==='business'&&
    Number(termMonths)===1&&
    quote?.promo_code_state==='valid'&&
    Number(quote?.promo_discount_percent)===100&&
    Number(quote?.package_total)===0&&
    quote?.payment_enabled===false
  )
}
