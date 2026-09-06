'use client'

export function PromoCodeControl({copy,code,setCode,applied,onApply,onClear,loading,quotes,anyValid,allInvalid,someInvalid,formatMoney}){
  const validQuote=Object.values(quotes).find(quote=>quote?.promo_code_state==='valid')
  return <section className="promoBox" aria-labelledby="promo-title">
    <div className="promoBoxHead"><div><h4 id="promo-title">{copy.title}</h4></div>{applied&&<button type="button" className="linkBtn" onClick={onClear}>{copy.clear}</button>}</div>
    <form className="promoForm" onSubmit={onApply}>
      <label htmlFor="promo-code">{copy.label}</label>
      <div><input id="promo-code" value={code} onChange={event=>setCode(event.target.value)} placeholder={copy.placeholder} maxLength="64" autoComplete="off" spellCheck="false"/><button className="secondary" disabled={loading||!code.trim()}>{loading?copy.checking:copy.apply}</button></div>
    </form>
    <small className="promoHelp">{copy.help}</small>
    {allInvalid&&<div className="promoState promoInvalid" role="alert">{copy.invalid}</div>}
    {anyValid&&<div className="promoState promoValid" role="status"><b>{someInvalid?copy.validSome:copy.valid}</b>{validQuote&&<span>{validQuote.promo_label||applied} · {copy.discount}: {Number(validQuote.promo_discount_percent||0).toFixed(0)}% · {copy.saved}: {formatMoney(validQuote.promo_savings)}</span>}</div>}
  </section>
}
