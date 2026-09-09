'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const steps=[
  ['1','Einladung personalisieren','Name, Anlass und passenden Kanal wählen. Die Ansprache bleibt individuell und nachvollziehbar.'],
  ['2','Interesse bestätigen lassen','Der Interessent sendet seinen Namen und die spätere Login-E-Mail zurück.'],
  ['3','Persönlich freigeben','In der Tester-Verwaltung einen individuellen, an genau diese Login-E-Mail gebundenen Zugang freigeben.'],
  ['4','Nutzung begleiten','Tester verwalten, Rückmeldungen aufnehmen und bei Bedarf den Zugang wieder beenden.']
]

export function InvitationWorkflowPanel(){
  const [allowed,setAllowed]=useState(null)

  useEffect(()=>{(async()=>{
    const {data,error}=await supabase.rpc('current_gold_access')
    const row=Array.isArray(data)?data[0]:data
    setAllowed(!error&&row?.app_role==='owner')
  })()},[])

  if(allowed!==true) return null

  return <section className="card" style={{marginTop:16}}>
    <span className="modeBadge">V131 · Eigentümer-Workflow</span>
    <h2>Vom persönlichen Kontakt bis zum aktiven Tester</h2>
    <p className="muted">Der komplette Ablauf bleibt unter Ihrer Kontrolle: keine öffentliche Code-Verteilung, keine automatische Freischaltung und keine Zahlung im Testzugang.</p>
    <div style={{display:'grid',gap:10,marginTop:14}}>
      {steps.map(([number,title,text])=><div key={number} className="detailCard" style={{padding:14}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
          <span className="modeBadge" aria-hidden="true">{number}</span>
          <div><b>{title}</b><p className="muted" style={{margin:'5px 0 0'}}>{text}</p></div>
        </div>
      </div>)}
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
      <a className="primary btn" href="/tester-verwaltung">Tester verwalten</a>
      <a className="secondary btn" href="/tester-freischalten">Code-Einlösung prüfen</a>
      <a className="secondary btn" href="/testen">Öffentliche Tester-Anfrage ansehen</a>
    </div>
    <div className="legalNotice" style={{marginTop:14}}>
      <b>Freigaberegel</b>
      <p>Ein persönlicher Testzugang wird erst nach ausdrücklicher Freigabe erzeugt und bleibt an die festgelegte Login-E-Mail gebunden. Änderungen an dieser Logik erfolgen nicht über das Einladungsmodul.</p>
    </div>
  </section>
}
