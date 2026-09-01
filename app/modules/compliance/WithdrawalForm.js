'use client'

import { useState } from 'react'
import { useLegalLanguage } from '../language/LegalLanguageContext'
import { localeForLanguage } from '../language/v36Languages.mjs'
import { withdrawalCopy } from './v31InteractiveLegalTranslations.mjs'

const endpoint='https://bcvggtnvuesaihqvgisg.supabase.co/functions/v1/gold-withdrawal'
const publishableKey='sb_publishable_O0JQYoJW-60sh3_5f7yr2Q_czCPZNH0'

function saveText(text,name){
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}))
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)
}

export default function WithdrawalForm(){
  const language=useLegalLanguage()
  const on=withdrawalCopy[language]||withdrawalCopy.de
  const [step,setStep]=useState('start')
  const [startedAt,setStartedAt]=useState('')
  const [name,setName]=useState('')
  const [reference,setReference]=useState('')
  const [company,setCompany]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [confirmation,setConfirmation]=useState(null)

  function begin(){setStartedAt(new Date().toISOString());setStep('form');setError('')}

  async function submit(event){
    event.preventDefault();setBusy(true);setError('')
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:publishableKey},body:JSON.stringify({name:name.trim(),contract_reference:reference.trim(),confirmation_channel:'download',started_at:startedAt,company})})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(on.error)
      setConfirmation(payload);setStep('done')
      saveText(payload.confirmation_text,`AS_Gold_Widerruf_${payload.withdrawal_id}.txt`)
    }catch{setError(on.error)}
    finally{setBusy(false)}
  }

  if(step==='start') return <div className="withdrawalStart"><p>{on.startText}</p><button type="button" className="primary withdrawalPrimary" onClick={begin}>{on.start}</button></div>

  if(step==='done') return <div className="withdrawalDone" aria-live="polite"><h3>{on.done}</h3><p>{on.received} <b>{new Date(confirmation.received_at).toLocaleString(localeForLanguage[language]||localeForLanguage.de)}</b>.</p><p>{on.reference}: <code>{confirmation.withdrawal_id}</code></p><button type="button" className="secondary" onClick={()=>saveText(confirmation.confirmation_text,`AS_Gold_Widerruf_${confirmation.withdrawal_id}.txt`)}>{on.again}</button><small>{on.keep}</small></div>

  return <form className="withdrawalForm" onSubmit={submit}>
    <h3>{on.prepare}</h3>
    <label>{on.name}<input value={name} onChange={event=>setName(event.target.value)} minLength="2" maxLength="160" autoComplete="name" required/></label>
    <label>{on.contract}<input value={reference} onChange={event=>setReference(event.target.value)} minLength="3" maxLength="200" placeholder={on.placeholder} required/><small>{on.help}</small></label>
    <label>{on.channel}<input value={on.download} readOnly/></label>
    <label className="withdrawalHoneypot" aria-hidden="true">{on.company}<input tabIndex="-1" autoComplete="off" value={company} onChange={event=>setCompany(event.target.value)}/></label>
    <div className="withdrawalDeclaration"><b>{on.declaration}</b><p>{on.declarationText}</p></div>
    {error&&<div className="legalNotice legalNotice-warning" role="alert">{error}</div>}
    <button className="primary withdrawalPrimary" disabled={busy}>{busy?on.sending:on.confirm}</button>
    <button type="button" className="linkBtn" onClick={()=>setStep('start')}>{on.cancel}</button>
  </form>
}
