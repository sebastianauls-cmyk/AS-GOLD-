'use client'

import { useEffect, useState } from 'react'
import { TesterGuide } from './TesterGuide'

const SESSION_KEY='asgold-tester-promo-until'
const TWO_HOURS=2*60*60*1000

export function PromoTesterGate(){
  const [code,setCode]=useState('')
  const [unlocked,setUnlocked]=useState(false)
  const [checking,setChecking]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    try{
      const until=Number(sessionStorage.getItem(SESSION_KEY)||0)
      if(until>Date.now())setUnlocked(true)
      else sessionStorage.removeItem(SESSION_KEY)
    }catch{}
  },[])

  async function submit(event){
    event.preventDefault()
    setChecking(true)
    setMessage('')
    try{
      const response=await fetch('/api/tester/promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})})
      if(!response.ok)throw new Error('invalid')
      const result=await response.json()
      if(!result?.ok)throw new Error('invalid')
      try{sessionStorage.setItem(SESSION_KEY,String(Date.now()+TWO_HOURS))}catch{}
      setCode('')
      setUnlocked(true)
    }catch{
      setMessage('Promo-Code ungültig. Bitte prüfen Sie die Eingabe.')
    }finally{setChecking(false)}
  }

  if(unlocked)return <TesterGuide/>

  return <main className="center"><section className="card recoveryCard" style={{maxWidth:520}}>
    <span className="modeBadge">V131 · Testerzugang</span>
    <h1>Testerzugang mit Promo-Code</h1>
    <p className="muted">Der Testerbereich ist nicht öffentlich freigeschaltet. Für den Zugang ist ein gültiger Promo-Code erforderlich.</p>
    <form onSubmit={submit} style={{display:'grid',gap:12}}>
      <label htmlFor="tester-promo-code"><b>Promo-Code</b></label>
      <input id="tester-promo-code" name="promo" type="password" autoComplete="off" value={code} onChange={event=>setCode(event.target.value)} required placeholder="Promo-Code eingeben"/>
      {message&&<p role="alert" style={{margin:0,color:'#8a2929'}}>{message}</p>}
      <button type="submit" className="primary full" disabled={checking||!code.trim()}>{checking?'Code wird geprüft …':'Testerzugang freischalten'}</button>
    </form>
    <small>Freigabe gilt für diese Browser-Sitzung höchstens 2 Stunden. Die Bezahlfunktion bleibt deaktiviert.</small>
    <a className="secondary btn" data-persistent-back href="/">← Zur Startseite</a>
  </section></main>
}
