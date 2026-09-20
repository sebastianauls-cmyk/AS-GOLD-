import { analyzeDeadlines, extractDeadlineDates } from './deadlineIntelligence.mjs'

const referenceKeys=text=>[...String(text||'').matchAll(/(?:Fallkennung|Bezug|Rechnung|Referenz)\s*:?\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)/giu)].map(match=>match[1].toUpperCase())
export function caseDeadlineEntries(item,documents=[]){
  const own=documents.filter(doc=>doc.case_id===item?.id&&(!item?.owner_id||doc.owner_id===item.owner_id))
  const entries=own.flatMap(doc=>extractDeadlineDates(doc.extracted_text||'').map(entry=>({...entry,document_id:doc.id,document_title:doc.title||'',references:referenceKeys(doc.extracted_text)})))
  for(const entry of entries){
    const replacement=entries.find(other=>other.state==='superseded'&&other.kind===entry.kind&&other.date.getTime()===entry.date.getTime()&&(other.document_id===entry.document_id||(entry.invoice_reference&&other.invoice_reference?entry.invoice_reference===other.invoice_reference:entry.references.some(key=>other.references.includes(key)))))
    if(replacement){entry.state='superseded';entry.replacement_quote=replacement.context;entry.replacement_document_id=replacement.document_id}
  }
  return entries
}

// Manually confirmed case dates stay active alongside independent document dates. Detected replacements
// affect proposed action priority only; this never writes a case deadline.
export function analyzeCaseDeadlines(item,documents=[],now=new Date()){
  const result=analyzeDeadlines({caseDeadline:item?.deadline_at||'',entries:caseDeadlineEntries(item,documents),now})
  return {...result,document:documents.find(doc=>doc.id===result.primary?.document_id)}
}
