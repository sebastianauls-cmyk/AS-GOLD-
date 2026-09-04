'use client'

import {useState} from 'react'
import {repairRecoveryUrl} from '../modules/auth/recoveryLinkRepair.mjs'

export default function ResetRepairPage(){
  const [rawLink,setRawLink]=useState('')
  const [message,setMessage]=useState('')

  async function pasteFromClipboard(){
    try{
      const value=await navigator.clipboard.readText()
      setRawLink(value)
      setMessage(value?'Link eingefügt. Jetzt auf „Sicher fortfahren“ drücken.':'Die Zwischenablage ist leer.')
    }catch{
      setMessage('Bitte den kopierten Link im Feld gedrückt halten und „Einfügen“ wählen.')
    }
  }

  function continueRecovery(event){
    event.preventDefault()
    const result=repairRecoveryUrl(rawLink)
    if(!result.ok){
      setMessage('Das ist nicht der vollständige Passwort-Link. Bitte die komplette localhost-Adresse kopieren und erneut einfügen.')
      return
    }
    window.location.replace(result.url)
  }

  return <main className="center">
    <section className="card authCard" aria-labelledby="repair-title">
      <div className="brand">
        <span className="logo" aria-hidden="true">AS</span>
        <span className="brandCopy">
          <span className="brandName"><strong>Workspace</strong><span className="brandEdition">Gold</span></span>
          <span className="brandDescriptor">Der digitale Fall- und Dokumentenmanager</span>
        </span>
      </div>

      <h1 id="repair-title">Passwort-Link reparieren</h1>
      <p className="muted">Fügen Sie hier die vollständige Adresse ein, die mit <b>localhost:3000</b> beginnt.</p>
      <p className="note"><b>🔒 Sicher:</b> Der Link wird ausschließlich in diesem Browser verarbeitet und nicht an unseren Server übertragen.</p>

      <form onSubmit={continueRecovery}>
        <label htmlFor="recovery-link">Kopierter Passwort-Link</label>
        <textarea
          id="recovery-link"
          rows="4"
          value={rawLink}
          onChange={event=>setRawLink(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="localhost:3000/#access_token=…"
        />
        <button className="secondary full" type="button" onClick={pasteFromClipboard}>Aus Zwischenablage einfügen</button>
        <button className="primary full" type="submit">Sicher fortfahren</button>
      </form>

      {message&&<p className="note" role="status">{message}</p>}
      <a className="backBtn full btn" href="/?start=reset&release=V104">← Neuen Reset-Link anfordern</a>
    </section>
  </main>
}
