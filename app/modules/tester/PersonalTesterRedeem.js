'use client'

import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export function PersonalTesterRedeem(){
  const [code,setCode]=useState('')
  const [message,setMessage]=useState('')
  const [working,setWorking]=useState(false)
  const [ok,setOk]=useState(false)

  async function redeem(event){
    event.preventDefault();setWorking(true);setMessage('');setOk(false)
    const {data,error}=await supabase.rpc('gold_redeem_personal_tester_access',{p_promo_code:code})
    if(error){setMessage('Der Code konnte nicht eingelöst werden. Bitte prüfen Sie, ob Sie mit der persönlich freigegebenen E-Mail angemeldet sind.')}
    else{setOk(data?.access_granted===true);setMessage('Testerzugang wurde aktiviert. Er gilt bis auf Widerruf und kann vom Anbieter jederzeit beendet oder geändert werden. Es besteht kein Anspruch auf dauerhafte oder unbefristete Nutzung.')}
    setWorking(false)
  }

  return <main className="center"><section className="card recoveryCard" style={{maxWidth:560}}>
    <span className="modeBadge">Persönlicher Testerzugang</span>
    <h1>Tester-Code einlösen</h1>
    <p className="muted">Melden Sie sich zuerst mit genau der E-Mail-Adresse an, die persönlich freigegeben wurde. Der Code ist an dieses Konto gebunden.</p>
    <form onSubmit={redeem} style={{display:'grid',gap:12}}>
      <label htmlFor="personal-tester-code"><b>Persönlicher Promo-Code</b></label>
      <input id="personal-tester-code" type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} required/>
      <button className="primary full" type="submit" disabled={working||!code.trim()}>{working?'Code wird geprüft …':'Testerzugang aktivieren'}</button>
    </form>
    {message&&<div className={ok?'legalNotice legalNotice-success':'legalNotice legalNotice-warning'} style={{marginTop:14}}><p>{message}</p></div>}
    {ok&&<a className="primary btn" href="/">AS Workspace Gold öffnen</a>}
    <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
  </section></main>
}
