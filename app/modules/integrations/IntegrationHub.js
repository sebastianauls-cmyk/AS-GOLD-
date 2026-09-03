'use client'

import { useEffect, useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'

function openDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open('asgold-integrations',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveHandle(handle){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,'localFolder');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function readHandle(){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readonly');const req=tx.objectStore('handles').get('localFolder');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}

const card={background:'#fff',border:'1px solid #e1e3e7',borderRadius:16,padding:18,display:'grid',gap:10}
const button={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}
const disabledButton={...button,opacity:.62,cursor:'not-allowed',background:'#f4f4f4',color:'#6b6f76'}
const infoBox={background:'#f8f9fb',border:'1px solid #e6e8ec',borderRadius:12,padding:12,display:'grid',gap:6,fontSize:'.92rem',lineHeight:1.45}

function ProviderAction({configured,href,children}){
  if(!configured) return <span role="link" aria-disabled="true" style={disabledButton}>Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen</span>
  return <a style={button} href={href}>{children}</a>
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

  return <><header style={{background:'#fff',borderBottom:'1px solid #e3e5e9'}}><div className="wrap" style={{minHeight:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><a href="/" style={{fontWeight:900,color:'#252b33',textDecoration:'none'}}>AS Workspace Gold</a><a href="/" style={button}>← Zurück</a></div></header>
  <main className="wrap" style={{padding:'42px 0 70px'}}><div className="eyebrow">Verbindungen & Ablage</div><h1 style={{fontSize:'clamp(2rem,6vw,3.7rem)',margin:'12px 0'}}>E-Mail, Cloud und eigener Speicher</h1><p className="lead">AS Workspace Gold soll sich in die vorhandene Arbeitsweise des Kunden einfügen: E-Mails können angebunden, Cloud-Speicher genutzt und Dateien auf Wunsch in einem selbst gewählten Ordner auf dem PC oder Gerät abgelegt werden. Verbindungen werden nur nach ausdrücklicher Freigabe hergestellt.</p>

  <section style={{marginTop:24,padding:20,background:'#fffaf0',border:'1px solid #e5d7b5',borderRadius:16}}>
    <b style={{fontSize:'1.05rem'}}>So funktioniert die Verbindung für Sie</b>
    <ol style={{margin:'12px 0 0',paddingLeft:22,lineHeight:1.6}}>
      <li>Sie wählen unten den gewünschten Dienst aus, zum Beispiel Gmail, Outlook, Google Drive, OneDrive oder einen eigenen Ordner.</li>
      <li>Bei E-Mail oder Cloud melden Sie sich selbst direkt beim jeweiligen Anbieter an. AS Workspace Gold erhält Ihr Passwort nicht.</li>
      <li>Der Anbieter zeigt Ihnen, auf welche Funktionen AS Workspace Gold zugreifen möchte. Sie entscheiden selbst, ob Sie diese Freigabe erteilen.</li>
      <li>Nach erfolgreicher Freigabe kann AS Workspace Gold nur die ausdrücklich erlaubten Funktionen nutzen, zum Beispiel E-Mails lesen, Anhänge übernehmen, Antwortschreiben versenden oder Dateien speichern.</li>
      <li>Bei einem eigenen Ordner wählen Sie selbst den Speicherort auf Ihrem PC, Mac oder Gerät. Sie können diese Auswahl später ändern.</li>
    </ol>
    <p style={{margin:'12px 0 0'}}><b>Sie müssen keine technischen Zugangsdaten eingeben.</b> Die normale Anmeldung bei Ihrem E-Mail- oder Cloud-Anbieter und Ihre Zustimmung reichen aus, sobald der jeweilige Dienst für AS Workspace Gold freigeschaltet ist.</p>
  </section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginTop:28}}>
    <article style={card}><b>✉ Gmail</b><p>E-Mails lesen, Anhänge übernehmen und vorbereitete Antwortschreiben über das verbundene Konto versenden.</p><div style={infoBox}><b>Was Sie tun</b><span>„Gmail verbinden“ wählen, sich bei Google anmelden und die angezeigten Zugriffsrechte bestätigen oder ablehnen.</span><b>Was AS Workspace Gold danach kann</b><span>Freigegebene E-Mails und Anhänge für Fälle nutzen und von Ihnen freigegebene Antwortschreiben über das verbundene Konto versenden.</span></div><span>{connected.gmail?'✓ Verbunden':configured.google?'Bereit zur Verbindung':'Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen'}</span><ProviderAction configured={!!configured.google} href="/api/integrations/google/start?service=gmail">{connected.gmail?'Erneut verbinden':'Gmail verbinden'}</ProviderAction></article>
    <article style={card}><b>✉ Outlook / Microsoft 365</b><p>Postfach, Anhänge und Antwortentwürfe über Microsoft Graph anbinden.</p><div style={infoBox}><b>Was Sie tun</b><span>„Outlook verbinden“ wählen, sich bei Microsoft anmelden und die gewünschten Berechtigungen bestätigen.</span><b>Was AS Workspace Gold danach kann</b><span>Freigegebene Nachrichten und Anhänge übernehmen und von Ihnen bestätigte Antwortschreiben über Outlook/Microsoft 365 versenden.</span></div><span>{connected.outlook?'✓ Verbunden':configured.microsoft?'Bereit zur Verbindung':'Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen'}</span><ProviderAction configured={!!configured.microsoft} href="/api/integrations/microsoft/start">{connected.outlook?'Erneut verbinden':'Outlook verbinden'}</ProviderAction></article>
    <article style={card}><b>☁ Google Drive</b><p>Dokumente und Exporte in einer freigegebenen Google-Drive-Ablage verwenden.</p><div style={infoBox}><b>Was Sie tun</b><span>„Google Drive verbinden“ wählen, sich bei Google anmelden und den Zugriff bestätigen.</span><b>Was AS Workspace Gold danach kann</b><span>Nur die für AS Workspace Gold freigegebenen Dateien verwenden und Ergebnisse in der vorgesehenen Drive-Ablage speichern.</span></div><span>{connected.drive?'✓ Verbunden':configured.google?'Bereit zur Verbindung':'Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen'}</span><ProviderAction configured={!!configured.google} href="/api/integrations/google/start?service=drive">Google Drive verbinden</ProviderAction></article>
    <article style={card}><b>☁ OneDrive</b><p>Cloud-Dateien über dieselbe Microsoft-Verbindung nutzen und Ergebnisse dort ablegen.</p><div style={infoBox}><b>Was Sie tun</b><span>„OneDrive verbinden“ wählen, sich bei Microsoft anmelden und den gewünschten Dateizugriff freigeben.</span><b>Was AS Workspace Gold danach kann</b><span>Freigegebene Dateien für Fälle verwenden und Ergebnisse in Ihrer OneDrive-Ablage speichern.</span></div><span>{connected.onedrive?'✓ Verbunden':configured.microsoft?'Bereit zur Verbindung':'Anbieterfreigabe für AS Workspace Gold noch nicht abgeschlossen'}</span><ProviderAction configured={!!configured.microsoft} href="/api/integrations/microsoft/start">OneDrive verbinden</ProviderAction></article>
    <article style={card}><b>💾 Eigener Ordner / Gerätespeicher</b><p>Sie entscheiden selbst, wo Exporte und Arbeitsdateien liegen sollen.</p><div style={infoBox}><b>Was Sie tun</b><span>„Eigenen Ordner auswählen“ wählen und einen Ordner auf PC, Mac oder einem unterstützten Gerät freigeben.</span><b>Was AS Workspace Gold danach kann</b><span>Ergebnisse in diesem von Ihnen gewählten Speicherort ablegen. Der Zugriff bleibt auf den freigegebenen Ordner begrenzt.</span></div><strong>{folder}</strong><button style={button} onClick={chooseFolder}>Eigenen Ordner auswählen</button>{localNote&&<small>{localNote}</small>}</article>
    <article style={card}><b>☁ Weitere Cloud-Anbieter</b><p>Die Integrationsstruktur ist erweiterbar. Dropbox und weitere Anbieter können nach demselben Freigabeprinzip ergänzt werden.</p><div style={infoBox}><b>Grundprinzip</b><span>Auch bei weiteren Anbietern entscheidet immer der Kunde selbst, welches Konto verbunden und welcher Zugriff erlaubt wird.</span></div><span>Vorbereitet für Erweiterungen</span></article>
  </section>
  <div className="legalNotice" style={{marginTop:24}}><b>Kontrolle bleibt beim Kunden.</b><p>AS Workspace Gold verbindet kein Konto automatisch. OAuth-Verbindungen können erst nach Zustimmung des Kontoinhabers hergestellt werden. Passwörter von Gmail oder Microsoft werden nicht in AS Workspace Gold gespeichert; vorgesehen sind kurzlebige Zugriffstoken und verschlüsselte Refresh-Tokens. Eine Verbindung kann später wieder getrennt werden.</p></div>
  </main><LegalFooter language="de"/></>
}
