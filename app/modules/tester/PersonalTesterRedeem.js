'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export function PersonalTesterRedeem(){
  const [code,setCode]=useState('')
  const [message,setMessage]=useState('')
  const [working,setWorking]=useState(false)
  const [ok,setOk]=useState(false)
  const [accountEmail,setAccountEmail]=useState('')
  const [checkingAccount,setCheckingAccount]=useState(true)

  useEffect(()=>{(async()=>{
    const {data}=await supabase.auth.getUser()
    setAccountEmail(data?.user?.email||'')
    setCheckingAccount(false)
  })()},[])

  async function redeem(event){
    event.preventDefault();setWorking(true);setMessage('');setOk(false)
    const normalizedCode=code.trim()
    if(!accountEmail){
      setMessage('Bitte melden Sie sich zuerst mit der persönlich freigegebenen Login-E-Mail an und öffnen Sie diese Seite danach erneut.')
      setWorking(false)
      return
    }
    const {data,error}=await supabase.rpc('gold_redeem_personal_tester_access',{p_promo_code:normalizedCode})
    if(error||data?.access_granted!==true){
      setMessage('Der Code konnte nicht aktiviert werden. Prüfen Sie bitte den Code und ob die aktuell angemeldete E-Mail exakt der persönlich freigegebenen Login-E-Mail entspricht.')
    }else{
      setOk(true)
      setMessage('🟢 Testerzugang aktiviert. Sie können AS Workspace Gold jetzt mit diesem Konto nutzen. Der persönliche Testzugang gilt bis auf Widerruf; es entstehen keine Kosten, kein Abonnement und keine automatische Verlängerung.')
    }
    setWorking(false)
  }

  return <main className="center"><section className="card recoveryCard" style={{maxWidth:620}}>
    <span className="modeBadge">V131 · Persönlicher Testerzugang</span>
    <h1>Tester-Code einlösen</h1>
    <p className="muted">Der persönliche Code funktioniert nur mit genau der Login-E-Mail, für die er freigegeben wurde.</p>

    <div className="legalNotice" style={{marginBottom:14}}>
      <b>1. Anmeldung prüfen</b>
      {checkingAccount?<p>Angemeldetes Konto wird geprüft …</p>:accountEmail?<p>🟢 Aktuell angemeldet als <strong>{accountEmail}</strong></p>:<><p>🟡 Sie sind derzeit nicht mit einem Konto angemeldet.</p><a className="secondary btn" href="/">Zur Anmeldung</a></>}
    </div>

    <div className="legalNotice" style={{marginBottom:14}}>
      <b>2. Persönlichen Code eingeben</b>
      <p>Verwenden Sie ausschließlich den Code, den Sie nach persönlicher Freigabe erhalten haben. Der Code wird nicht öffentlich vergeben und kann keinem anderen Konto zugeordnet werden.</p>
    </div>

    <form onSubmit={redeem} style={{display:'grid',gap:12}}>
      <label htmlFor="personal-tester-code"><b>Persönlicher Promo-Code</b></label>
      <input id="personal-tester-code" type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} required disabled={!accountEmail||working}/>
      <button className="primary full" type="submit" disabled={working||!code.trim()||!accountEmail}>{working?'Code wird geprüft …':'Testerzugang aktivieren'}</button>
    </form>

    {message&&<div className={ok?'legalNotice legalNotice-success':'legalNotice legalNotice-warning'} style={{marginTop:14}}><p>{message}</p></div>}

    {ok&&<div style={{display:'grid',gap:10,marginTop:14}}>
      <a className="primary btn" href="/">AS Workspace Gold öffnen</a>
      <p className="muted" style={{margin:0}}>3. Fertig: Ihr Konto ist freigeschaltet. Sie können jetzt Fälle, Dokumente, Ampelanalysen, Fristen, Rechtsraumvergleich und die freigegebenen Ausgaben nutzen.</p>
    </div>}

    <div className="legalNotice" style={{marginTop:14}}>
      <b>Wichtig</b>
      <p>Keine Zahlung. Kein Abo. Keine automatische Verlängerung. Der Anbieter kann den persönlichen Testzugang jederzeit beenden, sperren oder ändern.</p>
    </div>

    <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
  </section></main>
}
