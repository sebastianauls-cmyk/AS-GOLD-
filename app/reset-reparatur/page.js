'use client'

import {useState} from 'react'
import {inspectRecoveryLink,RECOVERY_LIVE_URL} from '../modules/auth/recoveryLinkRepair.mjs'
import {supabase} from '../modules/services/supabaseClient.js'

export default function ResetRepairPage(){
  const [rawLink,setRawLink]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)

  async function pasteFromClipboard(){
    try{
      const value=await navigator.clipboard.readText()
      setRawLink(value)
      setMessage(value?'Link eingefügt. Jetzt auf „Sicher fortfahren“ drücken.':'Die Zwischenablage ist leer.')
    }catch{
      setMessage('Bitte den kopierten Link im Feld gedrückt halten und „Einfügen“ wählen.')
    }
  }

  async function continueRecovery(event){
    event.preventDefault()
    const result=inspectRecoveryLink(rawLink)
    if(!result.ok){
      setMessage('Das ist nicht der vollständige Passwort-Link. Bitte den blauen „Reset password“-Link aus der neuesten E-Mail vollständig kopieren.')
      return
    }
    if(result.kind==='session'){
      window.location.replace(result.url)
      return
    }

    setBusy(true)
    setMessage('Der sichere Einmal-Link wird direkt bei Supabase bestätigt …')
    const {error}=await supabase.auth.verifyOtp({token_hash:result.tokenHash,type:'recovery'})
    if(error){
      setBusy(false)
      setMessage('Der Link ist abgelaufen oder wurde bereits verwendet. Bitte einen neuen Reset-Link anfordern und den neuesten Link kopieren.')
      return
    }
    window.location.replace(`${RECOVERY_LIVE_URL}?type=recovery&release=V105`)
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
      <p className="muted">Kopieren Sie den blauen Link <b>„Reset password“</b> aus der neuesten E-Mail und fügen Sie ihn hier ein.</p>
      <p className="note"><b>🔒 Sicher:</b> Der Einmal-Link wird ausschließlich in diesem Browser verarbeitet und direkt bei Supabase bestätigt. Er wird nicht an unseren Server übertragen.</p>

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
          placeholder="Vollständigen Link aus der E-Mail hier einfügen"
        />
        <button className="secondary full" type="button" onClick={pasteFromClipboard} disabled={busy}>Aus Zwischenablage einfügen</button>
        <button className="primary full" type="submit" disabled={busy}>{busy?'Link wird geprüft …':'Sicher fortfahren'}</button>
      </form>

      {message&&<p className="note" role="status">{message}</p>}
      <a className="backBtn full btn" href="/?start=reset&release=V105">← Neuen Reset-Link anfordern</a>
    </section>
  </main>
}
