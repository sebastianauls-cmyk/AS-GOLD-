'use client'

const card={background:'#fff',border:'1px solid #e1e3e7',borderRadius:16,padding:18,display:'grid',gap:10}
const request={border:'1px solid #c9ad66',background:'#fffaf0',borderRadius:10,padding:'10px 13px',fontWeight:800,color:'#5a4516',textDecoration:'none',textAlign:'center'}
const status={background:'#fff8e8',border:'1px solid #ead59b',borderRadius:12,padding:'10px 12px',lineHeight:1.45}

function requestHref(subject,body){
  return `mailto:sebastian.auls@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function OptionalExtensions(){
  return <section aria-labelledby="optional-extensions-title">
    <div className="eyebrow">Optionale Bausteine</div>
    <h1 id="optional-extensions-title" style={{fontSize:'clamp(2rem,6vw,3.4rem)',margin:'12px 0'}}>Nur auf Wunsch freischalten</h1>
    <p className="lead">AS Workspace Gold bleibt im Standardbetrieb bewusst schlank. Externe Speicher-, E-Mail- oder Bezahlfunktionen werden nicht automatisch aktiviert. Sie werden erst auf ausdrückliche Anfrage als eigener Baustein eingerichtet.</p>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginTop:24}}>
      <article style={card}>
        <b>☁ Eigene Ablage / Cloud-Anbindung</b>
        <p>Zum Beispiel Google Drive, OneDrive, Gmail, Outlook oder ein anderer externer Speicher.</p>
        <div style={status}><b>⚪ Standard: nicht aktiv</b><div>Die Anbindung wird erst eingerichtet, wenn sie ausdrücklich gewünscht wird. Bis dahin bleibt der normale Fall-, Dokument-, Fristen-, Sprach-, Freigabe- und Exportablauf vollständig unabhängig.</div></div>
        <a style={request} href={requestHref('AS Workspace Gold – Cloud-/Ablage-Baustein anfragen','Bitte prüfen Sie die Einrichtung einer optionalen Cloud-/Ablage-Anbindung für AS Workspace Gold. Gewünschter Dienst: ')}>Cloud-/Ablage-Baustein anfragen</a>
      </article>

      <article style={card}>
        <b>💳 Bezahlfunktion</b>
        <p>Eine Zahlungsfunktion ist kein Bestandteil des aktuellen Standardtests. Sie kann später als eigener kommerzieller Baustein aktiviert werden.</p>
        <div style={status}><b>⚪ Standard: nicht aktiv</b><div>Keine Zahlung wird ausgelöst oder angeboten. Eine Bezahlfunktion wird erst nach ausdrücklicher Entscheidung eingerichtet und separat geprüft.</div></div>
        <a style={request} href={requestHref('AS Workspace Gold – Bezahl-Baustein anfragen','Bitte prüfen Sie die Einrichtung einer optionalen Bezahlfunktion für AS Workspace Gold. Gewünschter Anbieter / Einsatz: ')}>Bezahl-Baustein anfragen</a>
      </article>
    </div>

    <div className="legalNotice" style={{marginTop:24}}><b>Grundprinzip</b><p>Optionale Erweiterungen bleiben technisch und fachlich getrennte Module. Sie werden erst nach ausdrücklicher Freigabe aktiviert, getestet und dokumentiert. Der Kern von AS Workspace Gold funktioniert ohne diese Erweiterungen.</p></div>
  </section>
}
