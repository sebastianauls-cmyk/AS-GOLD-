'use client'
import { documentDeadlineCandidates, deadlineCandidateCopy } from './lib/deadlineCandidates.mjs'

export function DocumentDeadlineCandidates({item,documents=[],language='de',onOpenDocument,onEdit}) {
  const entries=documentDeadlineCandidates(item,documents),copy=deadlineCandidateCopy(language)
  if(!entries.length)return null
  return <section className="detailCard" aria-label={copy.title}><h3>{copy.title}</h3><p>{copy.note}</p>
    <ul>{entries.map((entry,index)=><li key={`${entry.document_id}-${index}`}><b>{entry.date} · {entry.document_title}</b><p>{copy[entry.state]||copy.active}</p><blockquote>{entry.quote}</blockquote>{entry.replacement_quote&&entry.replacement_quote!==entry.quote&&<blockquote>{entry.replacement_quote}</blockquote>}{onOpenDocument&&<button type="button" className="secondary" onClick={()=>onOpenDocument(documents.find(doc=>doc.id===entry.document_id))}>{copy.open}</button>}</li>)}</ul>
    {onEdit&&<button type="button" className="secondary" onClick={onEdit}>{copy.edit}</button>}
  </section>
}
