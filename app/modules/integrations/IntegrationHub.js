'use client'

import { useEffect, useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'

function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open('asgold-integrations',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveHandle(handle){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,'localFolder');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function readHandle(){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readonly');const req=tx.objectStore('handles').get('localFolder');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}

const card={background:'#fff',border:'1px solid #e1e3e7',borderRadius:16,padding:18,display:'grid',gap:10}
const button={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}
const disabledButton={...button,opacity:.72,cursor:'not-allowed',background:'#f4f4f4',color:'#6b6f76'}
const infoBox={background:'#f8f9fb',border:'1px solid #e6e8ec',borderRadius:12,padding:12,display:'grid',gap:6,fontSize:'.92rem',lineHeight:1.45}
const statusBox={background:'#fff8e8',border:'1px solid #ead59b',borderRadius:12,padding:'10px 12px',display:'grid',gap:4,fontSize:'.92rem',lineHeight:1.4}

function ProviderAction({configured,href,children}){
  if(!configured) return <span role="link" aria-disabled="true" aria-live="polite" style={disabledButton}>Im aktuellen Test noch nicht freigeschaltet</span>
  return <a style={button} href={href}>{children}</a>
}

function ProviderStatus({connected,configured}){
  if(connected) return <strong>✓ Verbunden</strong>
  if(configured) return <span>Bereit zur Verbindung</span>
  return <div style={statusBox}><b>🟡 Noch nicht freigeschaltet</b><span>Diese externe Verbindung ist technisch vorbereitet, aber im aktuellen kontrollierten Test nicht aktiv. Das ist kein Fehler und blockiert die übrigen Funktionen nicht.</span></div>
}

export default function IntegrationHub(){
  const [status,setStatus]=useState(null)
  const [folder,setFolder]=useState('Noch kein Ordner gewählt')
  const [localNote,setLocalNote]=useState('')

  useEffect(()=>{
    fetch('/api/integrations/status',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setStatus).catch(()=>setStatus(null))
    readHandle().then(h=>{if(h?.name)setFolder(h.name)}).catch(()=>{})
  },[])

  async function chooseFolder(){
    setLocalNote('')
    if(!window.showDirectoryPicker){setLocalNote('Dieser Browser erlaubt keine dauerhafte Ordnerfreigabe. Exporte werden weiterhin über den normalen Speichern-/Download-Dialog des Geräts abgelegt.');return}
    try{const handle=await window.showDirectoryPicker({mode:'readwrite'});await saveHandle(handle);setFolder(handle.name);setLocalNote('Ordner gespeichert. Der Browser fragt bei Bedarf erneut nach der Zugriffsfreigabe.')}catch(error){if(error?.name!=='AbortError')setLocalNote(error.message)}
  }

  const connected=status?.connected||{}
  const configured=status?.configured||{}

  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>AS Workspace Gold</a><a className="integrationBackBtn" data-persistent-back href="/" style={button}>← Zurück</a></div></header>
  <main className="wrap" style={{padding:'42px 0 70px'}}><div className="eyebrow">Verbindungen & Ablage</div><h1 style={{fontSize:'clamp(2rem,6vw,3.7rem)',margin:'12px 0'}}>E-Mail, Cloud und eigener Speicher</h1><p className="lead">AS Workspace Gold ist für E-Mail-, Cloud- und Gerätespeicher-Verbindungen vorbereitet. Im aktuellen kontrollierten Test bleiben externe Google- und Microsoft-Verbindungen bewusst deaktiviert. Der übrige Fall-, Dokument-, Sprach-, Fristen-, Freigabe- und Exportablauf kann unabhängig davon vollständig getestet werden.</p>

  <section style={{marginTop:24,padding:20,background:'#fffaf0',border:'1px solid #e5d7b5',borderRadius:16}}>
    <b style={{fontSize:'1.05rem'}}>Aktueller Teststatus</b>
    <p style={{margin:'10px 0 0'}}><b>🟢 Eigener Ordner / Gerätespeicher:</b> kann getestet werden.</p>
    <p style={{margin:'8px 0 0'}}><b>🟡 Gmail, Outlook, Google Drive und OneDrive:</b> technisch vorbereitet, aber im aktuellen Test noch nicht freigeschaltet. Dafür sind noch die jeweiligen Anbieterfreigaben erforderlich.</p>
    <p style={{margin:'8px 0 0'}}><b>Wichtig:</b> Eine nicht freigeschaltete externe Verbindung ist im jetzigen Test kein Produktfehler und darf die übrige Abnahme nicht blockieren.</p>
  </section>

  <section style={{marginTop:20,padding:20,background:'#f8f9fb',border:'1px solid #e6e8ec',borderRadius:16}}>
    <b style={{fontSize:'1.05rem'}}>So funktioniert eine externe Verbindung später</b>
    <ol style={{margin:'12px 0 0',paddingLeft:22,lineHeight:1.6}}>
      <li>Sie wählen den gewünschten Dienst aus, zum Beispiel Gmail, Outlook, Google Drive oder OneDrive.</li>
      <li>Sie melden sich selbst direkt beim jeweiligen Anbieter an. AS Workspace Gold erhält Ihr Passwort nicht.</li>
      <li>Der Anbieter zeigt die angeforderten Rechte. Sie entscheiden selbst, ob Sie diese Freigabe erteilen.</li>
      <li>AS Workspace Gold kann anschließend nur die ausdrücklich erlaubten Funktionen nutzen.</li>
      <li>Eine Verbindung kann später wieder getrennt werden.</li>
    </ol>
  </section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginTop:28}}>
    <article style={card}><b>✉ Gmail</b><p>E-Mails lesen, Anhänge übernehmen und vorbereitete Antwortschreiben über das verbundene Konto versenden.</p><div style={infoBox}><b>Nach Freischaltung</b><span>Sie melden sich bei Google an und bestätigen die gewünschten Zugriffsrechte. Nur freigegebene E-Mails und Anhänge können dann für Fälle genutzt werden.</span></div><ProviderStatus connected={connected.gmail} configured={configured.google}/><ProviderAction configured={!!configured.google} href="/api/integrations/google/start?service=gmail">{connected.gmail?'Erneut verbinden':'Gmail verbinden'}</ProviderAction></article>
    <article style={card}><b>✉ Outlook / Microsoft 365</b><p>Postfach, Anhänge und Antwortentwürfe über Microsoft Graph anbinden.</p><div style={infoBox}><b>Nach Freischaltung</b><span>Sie melden sich bei Microsoft an und bestätigen die gewünschten Berechtigungen. Von Ihnen bestätigte Antwortschreiben können dann über Outlook versendet werden.</span></div><ProviderStatus connected={connected.outlook} configured={configured.microsoft}/><ProviderAction configured={!!configured.microsoft} href="/api/integrations/microsoft/start">{connected.outlook?'Erneut verbinden':'Outlook verbinden'}</ProviderAction></article>
    <article style={card}><b>☁ Google Drive</b><p>Dokumente und Exporte in einer freigegebenen Google-Drive-Ablage verwenden.</p><div style={infoBox}><b>Nach Freischaltung</b><span>Nur die ausdrücklich für AS Workspace Gold freigegebenen Dateien und Ablagen werden genutzt.</span></div><ProviderStatus connected={connected.drive} configured={configured.google}/><ProviderAction configured={!!configured.google} href="/api/integrations/google/start?service=drive">Google Drive verbinden</ProviderAction></article>
    <article style={card}><b>☁ OneDrive</b><p>Cloud-Dateien über dieselbe Microsoft-Verbindung nutzen und Ergebnisse dort ablegen.</p><div style={infoBox}><b>Nach Freischaltung</b><span>Der Zugriff bleibt auf die von Ihnen freigegebenen Microsoft-Dateien und Ablagen begrenzt.</span></div><ProviderStatus connected={connected.onedrive} configured={configured.microsoft}/><ProviderAction configured={!!configured.microsoft} href="/api/integrations/microsoft/start">OneDrive verbinden</ProviderAction></article>
    <article style={card}><b>💾 Eigener Ordner / Gerätespeicher</b><p>Sie entscheiden selbst, wo Exporte und Arbeitsdateien liegen sollen.</p><div style={infoBox}><b>Jetzt testbar</b><span>Wählen Sie einen Ordner auf PC, Mac oder einem unterstützten Gerät. Der Zugriff bleibt auf den freigegebenen Ordner begrenzt.</span></div><strong>{folder}</strong><button style={button} onClick={chooseFolder}>Eigenen Ordner auswählen</button>{localNote&&<small>{localNote}</small>}</article>
    <article style={card}><b>☁ Weitere Cloud-Anbieter</b><p>Die Integrationsstruktur ist erweiterbar. Dropbox und weitere Anbieter können nach demselben Freigabeprinzip ergänzt werden.</p><div style={infoBox}><b>Status</b><span>Vorbereitet für spätere Erweiterungen. Im aktuellen Test nicht Bestandteil der Abnahme.</span></div></article>
  </section>
  <div className="legalNotice" style={{marginTop:24}}><b>Kontrolle bleibt beim Nutzer.</b><p>AS Workspace Gold verbindet kein Konto automatisch. OAuth-Verbindungen können erst nach Zustimmung des Kontoinhabers hergestellt werden. Passwörter von Gmail oder Microsoft werden nicht in AS Workspace Gold gespeichert; vorgesehen sind kurzlebige Zugriffstoken und verschlüsselte Refresh-Tokens.</p></div>
  </main><LegalFooter language="de"/></>
}
