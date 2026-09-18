'use client'

import { useEffect, useState } from 'react'
import OptionalExtensions from '../optional/OptionalExtensions'
import { LegalFooter } from '../compliance/LegalFooter'
import { supabase } from '../services/supabaseClient'

const button={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}
const card={border:'1px solid #e1d6b9',background:'#fffdf7',borderRadius:16,padding:18,marginBottom:20}
const badge={display:'inline-flex',alignItems:'center',gap:7,padding:'6px 10px',borderRadius:999,background:'#fff2bf',color:'#6b520d',fontWeight:800,fontSize:13}

export default function IntegrationHub(){
  const [connections,setConnections]=useState([])
  const [loading,setLoading]=useState(true)
  const [connecting,setConnecting]=useState('')
  const [connectMessage,setConnectMessage]=useState('')

  async function connectMailbox(provider){
    setConnectMessage('')
    setConnecting(provider)
    try{
      const {data:{session}}=await supabase.auth.getSession()
      const token=session?.access_token
      if(!token) throw new Error('Bitte zuerst anmelden.')
      const response=await fetch('/api/integrations/'+provider+'/start',{method:'POST',headers:{authorization:'Bearer '+token}})
      const payload=await response.json().catch(()=>({}))
      if(!response.ok||!payload.url){
        if(payload.error==='google_not_configured') throw new Error('Google-Verbindung ist technisch vorbereitet, aber die Google-OAuth-Zugangsdaten fehlen noch.')
        if(payload.error==='microsoft_not_configured') throw new Error('Microsoft-Verbindung ist technisch vorbereitet, aber die Microsoft-OAuth-Zugangsdaten fehlen noch.')
        throw new Error('E-Mail-Verbindung konnte nicht gestartet werden.')
      }
      window.location.assign(payload.url)
    }catch(error){
      setConnectMessage(error.message||'Verbindung fehlgeschlagen.')
      setConnecting('')
    }
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const connected=params.get('connected')
    const account=params.get('account')
    const error=params.get('error')
    if(connected) setConnectMessage((account?account+' · ':'')+'E-Mail-Konto wurde verbunden.')
    else if(error) setConnectMessage('Verbindung noch nicht abgeschlossen: '+error)
  },[])

  useEffect(()=>{
    let cancelled=false
    ;(async()=>{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){if(!cancelled)setLoading(false);return}
      const {data}=await supabase
        .from('email_connections')
        .select('id,provider,account_email,display_name,status,can_read,can_draft,can_send,is_default_read,is_default_send,last_synced_at,last_error')
        .order('created_at',{ascending:true})
      if(!cancelled){setConnections(data||[]);setLoading(false)}
    })()
    return ()=>{cancelled=true}
  },[])

  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>ASH Workspace Gold</a><a className="integrationBackBtn" data-persistent-back href="/" style={button}>← Zurück</a></div></header>
  <main className="wrap" style={{padding:'42px 0 70px'}}>
    <section style={card}>
      <span style={badge}>E-MAIL · MEHRERE KONTEN</span>
      <h1 style={{margin:'10px 0 8px'}}>Mehrere E-Mail-Adressen je Arbeitsbereich</h1>
      <p style={{margin:'0 0 14px',color:'#606872',lineHeight:1.5}}>ASH Workspace Gold behandelt jedes eingebundene Postfach als eigene Quelle. Zu jeder fallbezogenen Nachricht sollen Absenderkonto, Empfänger, Zeitpunkt, Antwortbezug und Zustellstatus nachvollziehbar bleiben. Ein Fall darf deshalb nicht auf eine einzige E-Mail-Adresse festgelegt sein.</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'0 0 14px'}}>
        <button type="button" onClick={()=>connectMailbox('google')} disabled={!!connecting} style={button}>{connecting==='google'?'Google wird geöffnet …':'Google-Konto hinzufügen'}</button>
        <button type="button" onClick={()=>connectMailbox('microsoft')} disabled={!!connecting} style={button}>{connecting==='microsoft'?'Microsoft wird geöffnet …':'Microsoft-Konto hinzufügen'}</button>
      </div>
      {connectMessage&&<div style={{marginBottom:14,padding:12,borderRadius:10,background:'#f4f1e8',color:'#5e5a50'}}>{connectMessage}</div>}
      <div style={{display:'grid',gap:10}}>
        {loading&&<div style={{color:'#737b85'}}>E-Mail-Konten werden geprüft …</div>}
        {!loading&&connections.length===0&&<div style={{padding:14,border:'1px dashed #cabd9c',borderRadius:12,color:'#6d7279'}}>Noch kein E-Mail-Konto direkt in ASH Workspace verbunden. Die Datenstruktur unterstützt jetzt mehrere Google- und Microsoft-Konten pro Nutzer.</div>}
        {connections.map(item=><div key={item.id} style={{padding:14,border:'1px solid #e0e2e5',borderRadius:12,background:'#fff'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><b>{item.display_name||item.account_email||'E-Mail-Konto'}</b><span>{item.status}</span></div>
          <div style={{marginTop:6,color:'#6a727d',fontSize:14}}>{item.provider} · Lesen {item.can_read?'✓':'–'} · Entwurf {item.can_draft?'✓':'–'} · Senden {item.can_send?'✓':'–'}{item.is_default_send?' · Standardversand':''}{item.is_default_read?' · Standardlesen':''}</div>
          {item.last_error&&<div style={{marginTop:7,color:'#8b2d2d',fontSize:13}}>Letzter Fehler: {item.last_error}</div>}
        </div>)}
      </div>
      <div style={{marginTop:14,padding:14,borderRadius:12,background:'#f7f3e8'}}>
        <b>Pflicht für die Fallakte</b>
        <div style={{marginTop:5,color:'#646c75',lineHeight:1.45}}>Bei jeder E-Mail wird künftig gespeichert: über welches Konto sie lief, ob sie ein- oder ausgehend war, worauf sie antwortete und ob ein Zustellfehler vorlag. So kann die Chronologie auch dann vollständig bleiben, wenn mehrere Adressen beteiligt sind.</div>
      </div>
    </section>
    <OptionalExtensions/>
    <p style={{marginTop:20,color:'#666'}}>Externe E-Mail-Konten werden nur nach ausdrücklicher Verbindung verwendet. Ohne Verbindung erfolgt weder automatisches Lesen noch Senden.</p>
  </main><LegalFooter language="de"/></>
}
