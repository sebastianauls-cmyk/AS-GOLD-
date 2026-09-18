'use client'

import { useState } from 'react'
import { CaseDetail, DocumentDetail, getV24Copy } from '../../modules/cases/CaseWorkspace'
import { assessmentEvidence } from '../../modules/cases/lib/caseEvidence.mjs'

const initialCase={id:'preview-case',title:'Musterfall: Unterlagen nachreichen',goal:'Fehlende Unterlagen geordnet ergänzen.',summary:'Ein frei erfundenes Schreiben bittet um weitere Unterlagen.',home_country:'DE',target_country:'DE',next_action:'Unterlagen zusammenstellen',traffic_light:'yellow',status:'open'}
const initialDocument={id:'preview-document',case_id:initialCase.id,title:'Synthetisches Musterschreiben',created_at:'2026-09-17T10:00:00Z',updated_at:'2026-09-17T10:00:00Z',data_classification:'synthetic',extracted_text:'SYNTHETISCHER MUSTERFALL.\nBitte reichen Sie die fehlenden Unterlagen ein.\nSeite 1 – Abschnitt Unterlagen.',document_type:'Musterschreiben'}
const initialAssessment={id:'preview-assessment',case_id:initialCase.id,title:'Unterlagen',traffic_light:'yellow',reasoning:'Das Musterschreiben bittet um ergänzende Unterlagen.',next_step:'Fehlende Unterlagen bestimmen und zusammenstellen.',statement_kind:'inference',source_document_id:initialDocument.id,source_document_updated_at:initialDocument.updated_at,source_title_snapshot:initialDocument.title,source_locator:'Seite 1 – Abschnitt Unterlagen',source_excerpt:'Bitte reichen Sie die fehlenden Unterlagen ein.',source_reviewed_at:null,created_at:'2026-09-17T11:00:00Z'}

export function GuidancePreview({framed}) {
  const [width,setWidth]=useState('100%')
  const [language,setLanguage]=useState('de')
  const [item,setItem]=useState(initialCase)
  const [documents,setDocuments]=useState([initialDocument])
  const [assessments,setAssessments]=useState([initialAssessment])
  const [selectedDocument,setSelectedDocument]=useState(null)
  const [message,setMessage]=useState('')
  const [revision,setRevision]=useState(0)
  const on=getV24Copy(language)
  function scenario(kind){
    setItem({...initialCase,deadline_at:kind==='urgent'?new Date(Date.now()+3600000).toISOString():null})
    setDocuments(kind==='empty'?[]:[{...initialDocument,updated_at:kind==='changed'?'2026-09-18T11:00:00Z':initialDocument.updated_at}])
    setAssessments(kind==='empty'?[]:[{...initialAssessment,source_reviewed_at:kind==='changed'?'2026-09-17T11:00:00Z':null}])
    setSelectedDocument(null);setMessage('');setRevision(value=>value+1)
  }
  async function saveAssessment(caseId,draft){
    const source=documents.find(document=>document.id===draft.source_document_id)
    const record={...draft,id:crypto.randomUUID(),case_id:caseId,created_at:new Date().toISOString(),source_document_updated_at:source?.updated_at,source_title_snapshot:source?.title,source_reviewed_at:draft.source_reviewed?new Date().toISOString():null}
    if(draft.source_reviewed&&assessmentEvidence(record,documents).status!=='reviewed'){setMessage('Bitte ein wörtliches Zitat aus dem Dokument und die Fundstelle angeben.');return false}
    setAssessments(previous=>[record,...previous]);setItem(previous=>({...previous,traffic_light:draft.traffic_light}));setMessage('Bewertung in dieser Vorschau gespeichert.');return true
  }
  const content=<main style={{maxWidth:960,margin:'0 auto',padding:16}} dir={['ar','fa'].includes(language)?'rtl':'ltr'}>
    <p className="modeBadge">V135 · SYNTHETISCHE FUNKTIONSVORSCHAU</p>
    <p>Frei erfundene Daten. Änderungen gelten nur in dieser Vorschau und werden beim Neuladen zurückgesetzt. Dokumentanalyse, Upload und Freigabe sind hier nicht mit Live-Diensten verbunden. Die Übergabe-Exporte enthalten nur diese Musterdaten.</p>
    <label>Sprache <select aria-label="Sprache" value={language} onChange={event=>setLanguage(event.target.value)}>{['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'].map(key=><option key={key}>{key}</option>)}</select></label>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>{[['empty','1 · Leerer Fall'],['pending','2 · Beleg prüfen'],['changed','3 · Dokument geändert'],['urgent','Frist hat Vorrang']].map(([key,label])=><button className="secondary" type="button" key={key} onClick={()=>scenario(key)}>{label}</button>)}</div>
    {message&&<p role="status">{message}</p>}
    {selectedDocument?<DocumentDetail key={selectedDocument.id} copy={on} language={language} item={selectedDocument} cases={[item]} onBack={()=>setSelectedDocument(null)} onSave={async(id,draft)=>{const saved={...selectedDocument,...draft,updated_at:new Date().toISOString()};setDocuments(previous=>previous.map(document=>document.id===id?saved:document));setSelectedDocument(saved);setMessage('Dokument in dieser Vorschau gespeichert.');return true}} onOpen={async()=>null} onPrepareApproval={()=>setMessage('Die Freigabe ist in dieser Funktionsvorschau nicht verbunden.')} approvalLabel="Freigabe vorbereiten"/>:<CaseDetail key={`${item.id}-${revision}`} copy={on} language={language} item={item} clients={[]} documents={documents} assessments={assessments} onBack={()=>scenario('pending')} onSave={async(id,draft)=>{setItem(previous=>({...previous,...draft}));return true}} onAddAssessment={saveAssessment} onAddDocument={()=>{setDocuments([initialDocument]);setSelectedDocument(initialDocument)}} onOpenDocument={setSelectedDocument}/>}
  </main>
  if(framed)return content
  return <main style={{padding:16,maxWidth:1250,margin:'0 auto'}}><h1>ASH V135 ausprobieren</h1><p>Nächste Aufgabe, Belegprüfung und Änderungen am Dokument.</p><div style={{display:'flex',gap:10,margin:'16px 0'}}><button className="secondary" onClick={()=>setWidth('390px')}>Handyansicht</button><button className="secondary" onClick={()=>setWidth('100%')}>Große Ansicht</button></div><iframe title="ASH Funktionsvorschau" src="/vorschau/v135?frame=1" style={{display:'block',width,maxWidth:'100%',height:'80vh',margin:'0 auto',border:'1px solid #d8cba9',borderRadius:18,background:'#fff'}}/></main>
}
