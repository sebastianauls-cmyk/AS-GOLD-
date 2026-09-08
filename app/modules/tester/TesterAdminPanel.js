'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const statusLabel={approved:'Freigegeben · noch nicht eingelöst',active:'Aktiv',revoked:'Gesperrt'}
const fmt=value=>value?new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—'

export function TesterAdminPanel(){
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [note,setNote]=useState('')
  const [issued,setIssued]=useState(null)
  const [saving,setSaving]=useState(false)

  async function load(){
    setLoading(true);setError('')
    const {data,error}=await supabase.rpc('gold_owner_tester_overview')
    if(error){setError('Diese Übersicht ist ausschließlich für den Eigentümer freigegeben.');setRows([])}
    else setRows(data?.testers||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function approve(event){
    event.preventDefault();setSaving(true);setError('');setIssued(null)
    const {data,error:rpcError}=await supabase.rpc('gold_owner_create_tester_access',{p_email:email,p_display_name:name||null,p_note:note||null})
    if(rpcError)setError(rpcError.message||'Freigabe konnte nicht erstellt werden.')
    else{setIssued(data);setName('');setEmail('');setNote('');await load()}
    setSaving(false)
  }

  async function setEnabled(row,enabled){
    setError('')
    const {error:rpcError}=await supabase.rpc('gold_owner_set_tester_access',{p_id:row.id,p_enabled:enabled,p_note:null})
    if(rpcError)setError(rpcError.message||'Status konnte nicht geändert werden.')
    else await load()
  }

  const totals=useMemo(()=>({active:rows.filter(r=>r.status==='active').length,approved:rows.filter(r=>r.status==='approved').length,revoked:rows.filter(r=>r.status==='revoked').length}),[rows])

  return <main className="wrap" style={{paddingBlock:28}}>
    <a className="secondary btn" data-persistent-back href="/">← Zur App</a>
    <section className="card" style={{marginTop:16}}>
      <span className="modeBadge">Eigentümer-Modul · Testersteuerung</span>
      <h1>Tester verwalten</h1>
      <p className="muted">Persönliche Freigaben, tatsächliche Nutzung und Widerruf an einer Stelle. Es werden nur notwendige Nutzungsmetadaten angezeigt, keine Fall- oder Dokumentinhalte.</p>
      <div className="stats" style={{marginTop:14}}><div className="stat"><b>{totals.active}</b><span>Aktiv</span></div><div className="stat"><b>{totals.approved}</b><span>Noch nicht eingelöst</span></div><div className="stat"><b>{totals.revoked}</b><span>Gesperrt</span></div></div>
    </section>

    <section className="card" style={{marginTop:16}}>
      <h2>Persönlichen Tester freigeben</h2>
      <p>Die Person muss vorher persönlich angefragt haben. Mit deiner Freigabe wird ein einmaliger Code erzeugt und an genau die angegebene Login-E-Mail gebunden.</p>
      <form onSubmit={approve} className="coreForm" style={{display:'grid',gap:12}}>
        <label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Name des Testers"/></label>
        <label>Login-E-Mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@beispiel.de"/></label>
        <label>Interne Notiz<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="z. B. Anfrage per WhatsApp am …"/></label>
        <button className="primary" type="submit" disabled={saving}>{saving?'Freigabe wird erstellt …':'Ja · persönlichen Tester freigeben'}</button>
      </form>
      {issued&&<div className="legalNotice legalNotice-warning" style={{marginTop:14}}><b>Code nur jetzt sichtbar</b><p><strong>{issued.promo_code}</strong></p><p>Nur an {issued.assigned_email} senden. Der Code wird im System nur gehasht gespeichert.</p><a className="secondary btn" href="/tester-freischalten">Einlöse-Seite öffnen</a></div>}
    </section>

    <section className="card" style={{marginTop:16}}>
      <h2>Nutzungsübersicht</h2>
      <p className="muted">„Aktivität“ bedeutet technische Nutzungsvorgänge im Audit-Protokoll. Inhalte der Fälle und Dokumente werden hier bewusst nicht angezeigt.</p>
      {loading?<p>Lade Übersicht …</p>:rows.length===0?<p>Noch keine persönlich freigegebenen Tester.</p>:<div style={{display:'grid',gap:12}}>{rows.map(row=><article key={row.id} className="detailCard" style={{padding:16}}>
        <div className="detailCardHead"><div><b>{row.display_name||'Tester'}</b><p style={{margin:4}}>{row.assigned_email}</p></div><span className="modeBadge">{statusLabel[row.status]||row.status}</span></div>
        <div className="stats" style={{marginTop:10}}><div className="stat"><b>{row.activity_30d||0}</b><span>Aktivitäten · 30 Tage</span></div><div className="stat"><b>{row.cases_count||0}</b><span>Fälle</span></div><div className="stat"><b>{row.documents_count||0}</b><span>Dokumente</span></div></div>
        <p><b>Freigegeben:</b> {fmt(row.approved_at)} · <b>Eingelöst:</b> {fmt(row.redeemed_at)} · <b>Letzte Aktivität:</b> {fmt(row.last_activity_at)} · <b>Letzte Anmeldung:</b> {fmt(row.last_sign_in_at)}</p>
        {row.owner_note&&<p><b>Interne Notiz:</b> {row.owner_note}</p>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{row.status==='revoked'?<button className="secondary" onClick={()=>setEnabled(row,true)}>Zugang wieder freigeben</button>:<button className="secondary" onClick={()=>setEnabled(row,false)}>Zugang sofort sperren</button>}</div>
      </article>)}</div>}
      {error&&<p role="alert" style={{color:'#8a2929'}}>{error}</p>}
    </section>

    <section className="card" style={{marginTop:16}}>
      <h2>Hinweis für Tester</h2>
      <p><b>Empfohlene Formulierung:</b> „Der Testzugang wird persönlich freigegeben und gilt bis auf Widerruf. Es besteht kein Anspruch auf dauerhafte oder unbefristete Nutzung. Der Zugang kann jederzeit beendet oder geändert werden. Die Bezahlfunktion bleibt deaktiviert.“</p>
    </section>
  </main>
}
