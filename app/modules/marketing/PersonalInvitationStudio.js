'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const copyText=async text=>{try{await navigator.clipboard.writeText(text);return true}catch{return false}}

function buildInvitation({name,context,variant}){
  const person=name.trim()||'Sie'
  const intro=context.trim()?`\n\nIch spreche ${person} ganz bewusst an, weil ${context.trim()}.`:''
  const base=`AS Workspace Gold ist eine neue digitale Arbeitsumgebung für Menschen und Unternehmen, die komplexe Vorgänge nicht nur speichern, sondern verstehen, strukturieren und konsequent bearbeiten möchten. Dokumente, Schreiben, Fristen, Analysen, mehrsprachige Bearbeitung und nächste Schritte werden in einer gemeinsamen Arbeitsstruktur zusammengeführt.\n\nDer entscheidende Unterschied liegt nicht in einer einzelnen Funktion, sondern darin, wie alles zusammenspielt: Wo stehe ich? Was ist wichtig? Was fehlt noch? Was sollte als Nächstes geschehen?`
  const access=`Der persönliche Testzugang ist vollständig kostenlos. Er wird derzeit nicht öffentlich verteilt, sondern nur nach persönlicher Anfrage und ausdrücklicher Freigabe vergeben. Dafür genügt eine kurze E-Mail mit Namen und der E-Mail-Adresse, die später für die Anmeldung verwendet werden soll. Nach der Freigabe wird ein individueller Code erstellt, der ausschließlich diesem Konto zugeordnet ist.\n\nKeine Zahlung. Kein Abonnement. Keine automatische Verlängerung. Der Zugang gilt bis auf Widerruf; ein Anspruch auf dauerhafte oder unbefristete Nutzung entsteht nicht.`
  if(variant==='email') return `Guten Tag${name.trim()?` ${name.trim()}`:''},\n\nich möchte Ihnen etwas zeigen, das derzeit bewusst nur ausgewählten Personen zugänglich gemacht wird.${intro}\n\n${base}\n\n${access}\n\nAm besten probieren Sie AS Workspace Gold nicht theoretisch aus, sondern direkt mit einem eigenen Dokument, einem echten Vorgang oder einer konkreten Fragestellung.\n\nWenn Sie neugierig geworden sind, antworten Sie einfach mit Ihrem Namen und Ihrer späteren Login-E-Mail.\n\nFreundliche Grüße\nSebastian Auls\nAS Workspace Gold`
  if(variant==='whatsapp') return `${name.trim()?`${name.trim()}, `:''}ich möchte dir etwas zeigen, das wir derzeit ganz bewusst nur ausgewählten Personen zum Testen freigeben.${context.trim()?` Ich spreche dich gezielt an, weil ${context.trim()}.`:''}\n\nAS Workspace Gold verbindet Dokumente, Fälle, Fristen, Analysen, mehrsprachige Bearbeitung und nächste Schritte in einer gemeinsamen Arbeitsumgebung. Entscheidend ist: Wo stehe ich, was ist wichtig und was sollte als Nächstes passieren?\n\nWenn du möchtest, kannst du AS Workspace Gold vollständig kostenlos persönlich testen. Die Zugänge werden nicht allgemein verteilt. Ich schalte jeden Tester selbst frei und der persönliche Code funktioniert nur mit der dafür freigegebenen E-Mail-Adresse.\n\nKeine Kosten, kein Abo, keine automatische Verlängerung. Der Zugang gilt bis auf Widerruf.\n\nWenn du Interesse hast, schick mir einfach deinen Namen und die E-Mail-Adresse, mit der du dich anmelden möchtest.`
  return `PERSÖNLICHE EINLADUNG\n\nAS WORKSPACE GOLD\n\nDiese Einladung richtet sich gezielt an ${person}.${intro}\n\n${base}\n\nWarum diese persönliche Einladung?\n\nAS Workspace Gold befindet sich in einer bewusst ausgewählten Testphase. Die Testzugänge werden nicht öffentlich verteilt. Wir möchten die Plattform zunächst Personen zugänglich machen, deren tatsächliche Nutzung und Einschätzung für die weitere Entwicklung besonders interessant ist. Jede Freigabe erfolgt persönlich und individuell.\n\n${access}\n\nProbieren Sie es nicht theoretisch aus. Nehmen Sie einen echten Vorgang, ein Schreiben, ein Dokument oder eine offene Frage und sehen Sie selbst, was AS Workspace Gold daraus macht.\n\nAS Workspace Gold\nStruktur. Klarheit. Handlung.\nPersönlicher Zugang. Bewusst ausgewählt.`
}

export function PersonalInvitationStudio(){
  const [allowed,setAllowed]=useState(null)
  const [name,setName]=useState('')
  const [context,setContext]=useState('')
  const [variant,setVariant]=useState('handout')
  const [copied,setCopied]=useState(false)

  useEffect(()=>{(async()=>{
    const {data,error}=await supabase.rpc('current_gold_access')
    const row=Array.isArray(data)?data[0]:data
    setAllowed(!error&&row?.app_role==='owner')
  })()},[])

  const text=useMemo(()=>buildInvitation({name,context,variant}),[name,context,variant])
  if(allowed===null) return <main className="wrap" style={{paddingBlock:28}}><section className="card"><p>Modul wird geladen …</p></section></main>
  if(!allowed) return <main className="wrap" style={{paddingBlock:28}}><section className="card"><h1>Persönliche Einladungen</h1><p>Dieses Modul ist ausschließlich für den Eigentümer freigegeben.</p><a className="secondary btn" href="/">← Zur App</a></section></main>

  return <main className="wrap" style={{paddingBlock:28}}>
    <a className="secondary btn" data-persistent-back href="/">← Zur App</a>
    <section className="card" style={{marginTop:16}}>
      <span className="modeBadge">Eigentümer-Modul · Persönliche Ansprache</span>
      <h1>Einladungen erstellen</h1>
      <p className="muted">Keine Massenwerbung: Jede Einladung wird gezielt für eine Person formuliert und führt in den persönlich freigegebenen, vollständig kostenlosen Testzugang.</p>
    </section>

    <section className="card" style={{marginTop:16}}>
      <h2>Personalisieren</h2>
      <div className="coreForm" style={{display:'grid',gap:12}}>
        <label>Name der angesprochenen Person<input value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Frau Müller"/></label>
        <label>Warum genau diese Person?<textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="z. B. Sie arbeitet täglich mit komplexen Kundenfällen und kann die Praxistauglichkeit besonders gut einschätzen."/></label>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
        <button className={variant==='handout'?'primary':'secondary'} onClick={()=>setVariant('handout')}>Hochwertige Einladung</button>
        <button className={variant==='email'?'primary':'secondary'} onClick={()=>setVariant('email')}>E-Mail</button>
        <button className={variant==='whatsapp'?'primary':'secondary'} onClick={()=>setVariant('whatsapp')}>WhatsApp</button>
      </div>
    </section>

    <section className="card" style={{marginTop:16}}>
      <div className="detailCardHead"><div><span className="modeBadge">Vorschau</span><h2>{variant==='handout'?'Persönliche Einladung':variant==='email'?'Persönliche E-Mail':'Persönliche WhatsApp-Nachricht'}</h2></div></div>
      <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.6,background:'#faf9f5',padding:18,borderRadius:14,border:'1px solid #e4dfd3'}}>{text}</pre>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="primary" onClick={async()=>{setCopied(await copyText(text));setTimeout(()=>setCopied(false),1800)}}>{copied?'Kopiert ✓':'Text kopieren'}</button>
        <a className="secondary btn" href="/testen">Tester-Anfrageseite öffnen</a>
        <a className="secondary btn" href="/tester-verwaltung">Tester danach verwalten</a>
      </div>
    </section>

    <section className="card" style={{marginTop:16}}>
      <h2>Marketing-Leitlinie</h2>
      <p><b>Positionierung:</b> persönlich, hochwertig und bewusst ausgewählt – aber ohne künstliche Verknappung oder falsche Exklusivitätsbehauptungen.</p>
      <p><b>Versprechen:</b> vollständig kostenlos testen, keine Zahlung, kein Abo, keine automatische Verlängerung. Freigabe nur persönlich und bis auf Widerruf.</p>
    </section>
  </main>
}
