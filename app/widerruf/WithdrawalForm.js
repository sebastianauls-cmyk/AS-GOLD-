'use client'

import { useState } from 'react'

const endpoint='https://bcvggtnvuesaihqvgisg.supabase.co/functions/v1/gold-withdrawal'
const publishableKey='sb_publishable_O0JQYoJW-60sh3_5f7yr2Q_czCPZNH0'

function saveText(text,name){
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}))
  const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)
}

export default function WithdrawalForm(){
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
      if(!response.ok) throw new Error(payload.error||'Der Widerruf konnte nicht übermittelt werden.')
      setConfirmation(payload);setStep('done')
      saveText(payload.confirmation_text,`AS_Gold_Widerruf_${payload.withdrawal_id}.txt`)
    }catch(reason){setError(reason.message||'Der Widerruf konnte nicht übermittelt werden.')}
    finally{setBusy(false)}
  }

  if(step==='start') return <div className="withdrawalStart"><p>Die Funktion ist ohne Anmeldung erreichbar. Nach dem ersten Schritt können Sie Name, Vertrags-/Kontoreferenz und den Bestätigungskanal angeben.</p><button type="button" className="primary withdrawalPrimary" onClick={begin}>Vertrag widerrufen</button></div>

  if(step==='done') return <div className="withdrawalDone" aria-live="polite"><h3>Widerruf eingegangen</h3><p>Ihr Widerruf wurde am <b>{new Date(confirmation.received_at).toLocaleString('de-DE')}</b> gespeichert.</p><p>Referenz: <code>{confirmation.withdrawal_id}</code></p><button type="button" className="secondary" onClick={()=>saveText(confirmation.confirmation_text,`AS_Gold_Widerruf_${confirmation.withdrawal_id}.txt`)}>Eingangsbestätigung erneut herunterladen</button><small>Bewahren Sie die heruntergeladene Textdatei als dauerhafte Eingangsbestätigung auf.</small></div>

  return <form className="withdrawalForm" onSubmit={submit}>
    <h3>Widerruf vorbereiten</h3>
    <label>Ihr Name<input value={name} onChange={event=>setName(event.target.value)} minLength="2" maxLength="160" autoComplete="name" required/></label>
    <label>Vertrags- oder Kontoreferenz<input value={reference} onChange={event=>setReference(event.target.value)} minLength="3" maxLength="200" placeholder="z. B. Konto-E-Mail oder Vertragsreferenz" required/><small>Geben Sie nur an, was zur eindeutigen Zuordnung erforderlich ist.</small></label>
    <label>Elektronischer Bestätigungskanal<input value="Download-Bestätigung in diesem Browser" readOnly/></label>
    <label className="withdrawalHoneypot" aria-hidden="true">Firma<input tabIndex="-1" autoComplete="off" value={company} onChange={event=>setCompany(event.target.value)}/></label>
    <div className="withdrawalDeclaration"><b>Erklärung</b><p>Hiermit widerrufe ich den über die AS-Gold-Online-Benutzeroberfläche geschlossenen Vertrag beziehungsweise den durch die angegebene Referenz bezeichneten Vertragsteil.</p></div>
    {error&&<div className="legalNotice legalNotice-warning" role="alert">{error}</div>}
    <button className="primary withdrawalPrimary" disabled={busy}>{busy?'Widerruf wird übermittelt …':'Widerruf bestätigen'}</button>
    <button type="button" className="linkBtn" onClick={()=>setStep('start')}>Abbrechen</button>
  </form>
}
