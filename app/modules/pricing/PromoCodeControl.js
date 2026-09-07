'use client'

import { useEffect, useState } from 'react'

export function PromoCodeControl({copy,code,setCode,applied,onApply,onClear,loading,quotes,anyValid,allInvalid,someInvalid,formatMoney}){
  const [open,setOpen]=useState(Boolean(applied))
  const validQuote=Object.values(quotes).find(quote=>quote?.promo_code_state==='valid')

  useEffect(()=>{
    if(applied)setOpen(true)
  },[applied])

  if(!open){
    return <button type="button" className="secondary promoToggle" onClick={()=>setOpen(true)}>{copy.open||copy.title}</button>
  }

  return <section className="promoBox" aria-labelledby="promo-title">
    <div className="promoBoxHead"><div><h4 id="promo-title">{copy.title}</h4></div><button type="button" className="linkBtn" onClick={()=>{if(applied)onClear();setOpen(false)}}>{applied?copy.clear:'×'}</button></div>
    <form className="promoForm" onSubmit={onApply}>
      <label htmlFor="promo-code">{copy.label}</label>
      <div><input id="promo-code" value={code} onChange={event=>setCode(event.target.value)} placeholder={copy.placeholder} maxLength="64" autoComplete="off" spellCheck="false"/><button type="submit" className="secondary" disabled={loading||!code.trim()}>{loading?copy.checking:copy.apply}</button></div>
    </form>
    <small className="promoHelp">{copy.help}</small>
    {allInvalid&&<div className="promoState promoInvalid" role="alert">{copy.invalid}</div>}
    {anyValid&&<div className="promoState promoValid" role="status"><b>{someInvalid?copy.validSome:copy.valid}</b>{validQuote&&<span>{validQuote.promo_label||applied} · {copy.discount}: {Number(validQuote.promo_discount_percent||0).toFixed(0)}% · {copy.saved}: {formatMoney(validQuote.promo_savings)}</span>}</div>}
  </section>
}
