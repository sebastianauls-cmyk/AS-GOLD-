'use client'

import { useEffect, useState } from 'react'
import { LegalFooter } from '../components/LegalFooter'

function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open('asgold-integrations',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveHandle(handle){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,'localFolder');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function readHandle(){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readonly');const req=tx.objectStore('handles').get('localFolder');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}

const card={background:'#fff',border:'1px solid #e1e3e7',borderRadius:16,padding:18,display:'grid',gap:10}
const button={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}

export default function Integrationen(){
  const [status,setStatus]=useState(null);const [folder,setFolder]=useState('Noch kein Ordner gewählt');const [localNote,setLocalNote]=useState('')
  useEffect(()=>{fetch('/api/integrations/status').then(r=>r.json()).then(setStatus).catch(()=>setStatus(null));readHandle().then(h=>{if(h?.name)setFolder(h.name)}).catch(()=>{})},[])
  async function chooseFolder(){
    setLocalNote('')
    if(!window.showDirectoryPicker){setLocalNote('Dieser Browser erlaubt keine dauerhafte Ordnerfreigabe. Exporte werden weiterhin über den normalen Speichern-/Download-Dialog des Geräts abgelegt.');return}
    try{const handle=await window.showDirectoryPicker({mode:'readwrite'});await saveHandle(handle);setFolder(handle.name);setLocalNote('Ordner gespeichert. Der Browser fragt bei Bedarf erneut nach der Zugriffsfreigabe.')}catch(error){if(error?.name!=='AbortError')setLocalNote(error.message)}
  }
  const connected=status?.connected||{};const configured=status?.configured||{}
  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>AS Gold</a><a href="/" style={button}>← Zurück</a></div></header>
  <main className="wrap" style={{padding:'42px 0 70px'}}><div className="eyebrow">Verbindungen & Ablage</div><h1 style={{fontSize:'clamp(2rem,6vw,3.7rem)',margin:'12px 0'}}>E-Mail, Cloud und eigener Speicher</h1><p className="lead">AS Gold soll sich in die vorhandene Arbeitsweise des Kunden einfügen: E-Mails können angebunden, Cloud-Speicher genutzt und Dateien auf Wunsch in einem selbst gewählten Ordner auf dem PC oder Gerät abgelegt werden. Verbindungen werden nur nach ausdrücklicher Freigabe hergestellt.</p>
  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginTop:28}}>
    <article style={card}><b>✉ Gmail</b><p>E-Mails lesen, Anhänge übernehmen und vorbereitete Antwortschreiben über das verbundene Konto versenden.</p><span>{connected.gmail?'✓ Verbunden':configured.google?'Bereit zur Verbindung':'OAuth-Schlüssel noch nicht in Vercel hinterlegt'}</span><a style={button} href="/api/integrations/google/start?service=gmail">{connected.gmail?'Erneut verbinden':'Gmail verbinden'}</a></article>
    <article style={card}><b>✉ Outlook / Microsoft 365</b><p>Postfach, Anhänge und Antwortentwürfe über Microsoft Graph anbinden.</p><span>{connected.outlook?'✓ Verbunden':configured.microsoft?'Bereit zur Verbindung':'OAuth-Schlüssel noch nicht in Vercel hinterlegt'}</span><a style={button} href="/api/integrations/microsoft/start">{connected.outlook?'Erneut verbinden':'Outlook verbinden'}</a></article>
    <article style={card}><b>☁ Google Drive</b><p>Dokumente und Exporte in einer freigegebenen Google-Drive-Ablage verwenden.</p><span>{connected.drive?'✓ Verbunden':configured.google?'Bereit zur Verbindung':'OAuth-Schlüssel noch nicht in Vercel hinterlegt'}</span><a style={button} href="/api/integrations/google/start?service=drive">Google Drive verbinden</a></article>
    <article style={card}><b>☁ OneDrive</b><p>Cloud-Dateien über dieselbe Microsoft-Verbindung nutzen und Ergebnisse dort ablegen.</p><span>{connected.onedrive?'✓ Verbunden':configured.microsoft?'Bereit zur Verbindung':'OAuth-Schlüssel noch nicht in Vercel hinterlegt'}</span><a style={button} href="/api/integrations/microsoft/start">OneDrive verbinden</a></article>
    <article style={card}><b>💾 Eigener Ordner / Gerätespeicher</b><p>Der Kunde entscheidet selbst, wo Exporte und Arbeitsdateien liegen sollen. Auf unterstützten Desktop-Browsern kann ein eigener Ordner dauerhaft gewählt werden.</p><strong>{folder}</strong><button style={button} onClick={chooseFolder}>Eigenen Ordner auswählen</button>{localNote&&<small>{localNote}</small>}</article>
    <article style={card}><b>☁ Weitere Cloud-Anbieter</b><p>Die Integrationsstruktur ist erweiterbar. Dropbox und weitere Anbieter können nach demselben Freigabeprinzip ergänzt werden.</p><span>Vorbereitet für Erweiterungen</span></article>
  </section>
  <div className="legalNotice" style={{marginTop:24}}><b>Kontrolle bleibt beim Kunden.</b><p>AS Gold verbindet kein Konto automatisch. OAuth-Verbindungen können erst nach Zustimmung des Kontoinhabers hergestellt werden. Passwörter von Gmail oder Microsoft werden nicht in AS Gold gespeichert; vorgesehen sind kurzlebige Zugriffstoken und verschlüsselte Refresh-Tokens.</p></div>
  </main><LegalFooter language="de"/></>
}
