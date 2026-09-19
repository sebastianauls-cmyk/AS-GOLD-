// Shared by the server, the customer preview and the exports. No case-specific data.
export const ROADMAP_VERSION = 'v136'
export const ROADMAP_LANGUAGES = ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
export const ROADMAP_PHASES = ['now','parallel','waiting','afterwards']
export const ROADMAP_COLORS = {green:'#287b50',yellow:'#b77900',red:'#be3030',white:'#64748b'}
const text = value => typeof value === 'string' ? value.trim() : ''
const list = value => Array.isArray(value) ? value : []
const strings = {type:'array',items:{type:'string'}}
const object = properties => ({type:'object',additionalProperties:false,properties,required:Object.keys(properties)})
const string = {type:'string'}
const evidence = object({document_id:string,quote:string})
export const ROADMAP_SCHEMA = object({
  title:string,opening:string,key_points:strings,meaning:string,next:string,customer_action:string,
  facts:{type:'array',items:object({text:string,evidence:{type:'array',items:evidence}})},
  open_questions:{type:'array',items:object({question:string,who:string,why:string})},
  steps:{type:'array',items:object({
    id:string,title:string,phase:{type:'string',enum:ROADMAP_PHASES},
    light:{type:'string',enum:['yellow','red','white']},
    reason:string,owner:string,action:string,waiting_for:string,after_response:string,
    done_when:string,follow_up:string,depends_on:strings,
    deadline:{anyOf:[object({date:string,document_id:string,quote:string}),{type:'null'}]},
    evidence:{type:'array',items:evidence}
  })},
  letters:{type:'array',items:object({id:string,recipient:string,subject:string,body:string,customer_translation:string,document_ids:strings})},
  closing:string
})

export function roadmapStyle(value={}) {
  return {
    customer_name:text(value.customer_name).slice(0,160),
    salutation:text(value.salutation).slice(0,200),
    tone:value.tone==='formal'?'formal':'personal',
    sender_name:text(value.sender_name).slice(0,180),
    letterhead:text(value.letterhead).slice(0,1500),
    closing:text(value.closing).slice(0,600)
  }
}

// Include all original text, not only the previous model summaries. Stable ordering
// also makes edits, reassignment, removal and new documents invalidate old reports.
export function roadmapSource(item,documents=[],assessments=[]) {
  const own = entry => entry.case_id===item.id && (!item.owner_id || entry.owner_id===item.owner_id)
  const scoped = assessments.filter(own)
  const replaced = new Set(scoped.map(entry=>entry.supersedes_assessment_id).filter(Boolean))
  return {
    case:Object.fromEntries(['id','title','client_id','reference_no','goal','summary','deadline_at','next_action','home_country','target_country'].map(key=>[key,item[key]??null])),
    documents:documents.filter(own).sort((a,b)=>a.id.localeCompare(b.id)).map(doc=>Object.fromEntries(
      ['id','title','document_date','data_classification','extracted_text','voice_context','analysis_summary','analysis_reasoning','analysis_next_step','updated_at'].map(key=>[key,doc[key]??null]))),
    assessments:scoped.filter(entry=>!replaced.has(entry.id)).sort((a,b)=>a.id.localeCompare(b.id)).map(entry=>Object.fromEntries(
      ['id','title','traffic_light','reasoning','next_step','source_document_id','source_excerpt','source_locator','source_document_updated_at','source_reviewed_at','created_at'].map(key=>[key,entry[key]??null])))
  }
}

export async function roadmapFingerprint(source) {
  const bytes = new TextEncoder().encode(JSON.stringify(source))
  const digest = await globalThis.crypto.subtle.digest('SHA-256',bytes)
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
}

export function validateRoadmapInput(source) {
  if(!source.documents.length) throw new Error('Bitte zuerst Dokumente zum Fall hinzufügen.')
  if(source.documents.some(doc=>!['synthetic','anonymized'].includes(doc.data_classification))) throw new Error('Der Testbetrieb erlaubt nur künstliche oder wirksam anonymisierte Unterlagen.')
  if(source.documents.some(doc=>!text(doc.extracted_text))) throw new Error('Bitte zuerst alle Dokumente auslesen und speichern. Der Fahrplan benötigt den vollständigen Fall.')
  if(source.documents.length>30 || JSON.stringify(source).length>200000) throw new Error('Dieser Fall ist für einen gemeinsamen Durchlauf zu groß. Bitte in sachlich getrennte Teilfälle aufteilen; es wurden keine Unterlagen stillschweigend ausgelassen.')
}

export function validateRoadmapResult(raw,source) {
  if(!raw || !text(raw.title) || !text(raw.opening) || !text(raw.meaning) || !text(raw.next) || !text(raw.customer_action)) throw new Error('Der Kundenfahrplan ist unvollständig.')
  if(!Array.isArray(raw.key_points) || raw.key_points.length<1 || raw.key_points.length>3) throw new Error('Die Kurzfassung muss ein bis drei Kernpunkte enthalten.')
  if(!Array.isArray(raw.steps) || !raw.steps.length || raw.steps.length>12 || list(raw.letters).length>6) throw new Error('Der Fahrplan enthält keine gültige Schrittfolge.')
  const docs = new Map(source.documents.map(doc=>[doc.id,doc]))
  const normalized = value=>text(value).replace(/\s+/gu,' ')
  function checkEvidence(items,required=false) {
    if(!Array.isArray(items) || (required&&!items.length)) throw new Error('Ein Beleg für den Fahrplan fehlt.')
    for(const item of items) if(!docs.has(item.document_id) || normalized(item.quote).length<8 || !normalized(docs.get(item.document_id).extracted_text).includes(normalized(item.quote))) throw new Error('Ein Beleg stimmt nicht mit dem Original überein. Bitte erneut erstellen.')
  }
  for(const fact of list(raw.facts)) { if(!text(fact.text)) throw new Error('Leere Tatsachenangabe.'); checkEvidence(fact.evidence,true) }
  const seen = new Set()
  for(const step of raw.steps) {
    if(!/^[a-zA-Z0-9_-]{1,50}$/.test(step.id) || seen.has(step.id)) throw new Error('Schrittkennungen sind nicht eindeutig.')
    if(!ROADMAP_PHASES.includes(step.phase) || !['red','yellow','white'].includes(step.light)) throw new Error('Ungültiger Schrittstatus.')
    for(const key of ['title','reason','owner','action','done_when','after_response']) if(!text(step[key])) throw new Error('Ein Schritt erklärt Handlung oder Erledigung nicht vollständig.')
    if(!Array.isArray(step.depends_on) || step.depends_on.some(id=>!seen.has(id))) throw new Error('Die Reihenfolge der Schritte ist nicht schlüssig.')
    checkEvidence(step.evidence)
    if(step.deadline) {
      const {date,document_id,quote}=step.deadline
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('Eine Frist ist ungültig.')
      checkEvidence([{document_id,quote}],true)
      const [y,m,d]=date.split('-')
      const variants=[date,`${Number(d)}.${Number(m)}.${y}`,`${d}.${m}.${y}`,`${Number(d)}.${m}.${y}`,`${d}.${Number(m)}.${y}`]
      // Match a complete date in the original, then require the quotation to
      // include that whole token. Substrings could turn 11.04.2030 into 1 April,
      // even when the quotation itself was cropped to "1.04.2030".
      const original=normalized(docs.get(document_id).extracted_text)
      const quotation=normalized(quote)
      const dates=[...original.matchAll(/(?<![\p{L}\p{N}])(?:\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4})(?![\p{L}\p{N}])/gu)]
        .filter(match=>variants.includes(match[0]))
      let quotationStart=original.indexOf(quotation),dateQuoted=false
      while(quotationStart!==-1&&!dateQuoted) {
        dateQuoted=dates.some(match=>match.index>=quotationStart&&match.index+match[0].length<=quotationStart+quotation.length)
        quotationStart=original.indexOf(quotation,quotationStart+1)
      }
      if(!dateQuoted) throw new Error('Eine Frist ist nicht ausdrücklich im zitierten Original belegt.')
    }
    seen.add(step.id)
  }
  const letterIds = new Set()
  for(const letter of list(raw.letters)) {
    if(!text(letter.id) || letterIds.has(letter.id) || !text(letter.recipient) || !text(letter.subject) || !text(letter.body)) throw new Error('Ein Anschreiben ist unvollständig.')
    if(!Array.isArray(letter.document_ids) || !letter.document_ids.length || letter.document_ids.some(id=>!docs.has(id))) throw new Error('Die Grundlage eines Anschreibens fehlt.')
    if(/[🔴🟡🟢⚪●]/u.test(letter.body)) throw new Error('Die formalen Anschreiben dürfen keine Ampelpunkte enthalten.')
    letterIds.add(letter.id)
  }
  return raw
}

export function roadmapSteps(record,{stale=false,today=new Date().toISOString().slice(0,10)}={}) {
  const complete = new Set()
  return list(record?.result?.steps).map(step=>{
    const update=record.progress?.[step.id]
    const blocked=step.depends_on.some(id=>!complete.has(id))
    const done=!stale && !blocked && update?.done===true && text(update.note).length>=5
    if(done) complete.add(step.id)
    const urgent=step.deadline?.date && step.deadline.date<=today
    return {...step,done,blocked,update,light:done?'green':stale?'white':urgent?'red':step.light}
  })
}

export function updateRoadmapProgress(record,{step_id,done,note},now=new Date().toISOString()) {
  const steps=roadmapSteps(record)
  const step=steps.find(entry=>entry.id===step_id)
  if(!step || typeof done!=='boolean' || text(note).length<5 || text(note).length>1200) throw new Error('Bitte die Erledigung oder Wiederöffnung mit mindestens fünf Zeichen begründen.')
  if(done && step.blocked) throw new Error('Bitte zuerst die vorher erforderlichen Schritte abschließen.')
  const progress={...(record.progress||{}),[step_id]:{done,note:text(note),at:now}}
  // Reopening invalidates confirmations that depended on this step, transitively.
  const invalid=new Set(done?[]:[step_id])
  for(const entry of record.result.steps) if(entry.depends_on.some(id=>invalid.has(id))) {
    invalid.add(entry.id)
    if(progress[entry.id]?.done) progress[entry.id]={...progress[entry.id],done:false,reopened_at:now,reopened_by_step:step_id}
  }
  return {progress,events:[...list(record.events),{step_id,done,note:text(note),at:now}].slice(-200)}
}
