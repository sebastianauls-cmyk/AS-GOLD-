const DAY_MS=86400000
const DATE_RE=/\b([0-3]?\d)\.(0?\d|1[0-2])\.(20\d{2})\b/g
const STRONG_DEADLINE_CUES=/\b(bis(?:\s+zum|\s+spätestens)?|spätestens|frist(?:\s+bis|ende)?|fristablauf|einzureichen|einreichen|eingehen|eingang|vorzulegen|vorlegen|zahlbar|fällig)\b/i
const ORDINARY_DATE_CUES=/\b(besprechung|termin|geburtstag|veranstaltung|meeting|gespräch|anhörungstermin|telefonat)\b/i

function atNoonUtc(date){
  return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),12,0,0,0)
}

function dateFromParts(day,month,year){
  const date=new Date(Date.UTC(Number(year),Number(month)-1,Number(day),12))
  if(date.getUTCFullYear()!==Number(year)||date.getUTCMonth()!==Number(month)-1||date.getUTCDate()!==Number(day)) return null
  return date
}

function sentenceContext(text,index,length){
  // Decimal amounts and dotted dates are not sentence boundaries.
  const boundary=(at)=>/[!?;\n]/u.test(text[at])||(text[at]==='.'&&!/\d/u.test(text[at+1]||''))
  let start=index,end=index+length
  while(start>0&&!boundary(start-1))start--
  while(end<text.length&&!boundary(end))end++
  return text.slice(start,end).trim()
}

const PAYMENT=/zahl|restbetrag|forderung|mahnung|fällig/iu
const REPLACEMENT=/ersetzt|zurückgezogen|aufgehoben|verlängert|stattdessen|anstelle/iu
const CONDITIONAL=/\b(?:nicht|falls|wenn|würde|könnte)\b/iu
function dateState(context,token){
  if(!REPLACEMENT.test(context)||CONDITIONAL.test(context))return 'active'
  const before=context.slice(0,context.indexOf(token)),after=context.slice(context.indexOf(token)+token.length)
  // Explicit old/new date relation, never simply the newest date in the file.
  if(/(?:früher|bisher|alt|ursprünglich|anstelle|statt der)/iu.test(before)&&!/(?:neu|nun|stattdessen)[^.!?]*$/iu.test(before))return 'superseded'
  if(/^(?:\s*[^\d]{0,60})?(?:wird|ist|wurde)\s+(?:hiermit\s+)?(?:ersetzt|zurückgezogen|aufgehoben)/iu.test(after))return 'superseded'
  if(/(?:ersetzt|verlängert|verschoben)\s+(?:durch|auf|bis|zum)/iu.test(after))return 'superseded'
  return 'active'
}

// Invoice due dates remain evidence of the original invoice. When the same
// text contains a later payment request, they are history, not today's action.
export function resolveDeadlineCandidates(entries){
  const result=entries.map(entry=>({...entry}))
  for(const entry of result){
    if(entry.kind==='invoice_due'&&entry.invoice_reference&&result.some(other=>other.kind==='payment_request'&&other.invoice_reference===entry.invoice_reference&&other.state==='active'&&other.date>entry.date))entry.state='historical'
  }
  return result
}

export function parseGermanDate(value){
  const match=String(value||'').match(/\b([0-3]?\d)\.(0?\d|1[0-2])\.(20\d{2})\b/)
  return match?dateFromParts(match[1],match[2],match[3]):null
}

export function extractDeadlineDates(value){
  const text=String(value||'')
  const matches=[]
  const invoiceIds=[...new Set([...text.matchAll(/Rechnung\s*:?\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)/giu)].map(entry=>entry[1].toUpperCase()))]
  DATE_RE.lastIndex=0
  let match
  while((match=DATE_RE.exec(text))){
    const date=dateFromParts(match[1],match[2],match[3])
    if(!date) continue
    const context=sentenceContext(text,match.index,match[0].length)
    const before=context.slice(0,context.indexOf(match[0]))
    const earlier=[...before.matchAll(new RegExp(DATE_RE.source,'g'))].at(-1)
    const localCue=earlier?before.slice(earlier.index+earlier[0].length):before
    const strong=STRONG_DEADLINE_CUES.test(localCue)
    const ordinary=ORDINARY_DATE_CUES.test(context)
    if(!strong&&!(/frist/iu.test(localCue)&&REPLACEMENT.test(context))) continue
    matches.push({
      date,
      confidence:ordinary?'medium':'high',
      basis:ordinary?'Datum mit Fristbezug im Dokument – Terminbezug zusätzlich prüfen':'Expliziter Fristbezug im Dokument',
      context,
      invoice_reference:invoiceIds.length===1?invoiceIds[0]:null,
      state:dateState(context,match[0]),
      kind:/rechnung/iu.test(context)&&/fällig|zahlbar/iu.test(context)?'invoice_due':PAYMENT.test(context)?'payment_request':'deadline'
    })
  }
  return resolveDeadlineCandidates(matches)
}

export function deadlineUrgency(deadline,now=new Date()){
  if(!(deadline instanceof Date)||Number.isNaN(deadline.getTime())) return {level:'uncertain',days:null}
  const days=Math.ceil((atNoonUtc(deadline)-atNoonUtc(now))/DAY_MS)
  if(days<0) return {level:'overdue',days}
  if(days<=2) return {level:'immediate',days}
  if(days<=7) return {level:'high',days}
  return {level:'normal',days}
}

export function analyzeDeadlines({text='',caseDeadline='',now=new Date(),entries=null}={}){
  const candidates=[]
  if(caseDeadline){
    const parsed=new Date(caseDeadline)
    if(!Number.isNaN(parsed.getTime())) candidates.push({date:parsed,source:'case',basis:'Im Fall hinterlegte Frist',confidence:'high'})
  }
  for(const extracted of entries||extractDeadlineDates(text)){
    if(extracted.state&&extracted.state!=='active')continue
    candidates.push({date:extracted.date,source:'document',basis:extracted.basis,confidence:extracted.confidence,context:extracted.context,document_id:extracted.document_id})
  }
  if(!candidates.length){
    return {status:'uncertain',primary:null,message:'Keine sichere Frist ableitbar. Originaldokument und Fallangaben prüfen.',consequence:'Keine Rechtsfolge behauptet, solange die Fristgrundlage nicht verifiziert ist.',candidates:0}
  }
  candidates.sort((a,b)=>a.date-b.date)
  const primary=candidates[0]
  const urgency=deadlineUrgency(primary.date,now)
  const consequence=urgency.level==='overdue'
    ?'Frist scheint bereits abgelaufen. Mögliche Rechtsfolgen müssen anhand des konkreten Vorgangs geprüft werden.'
    :urgency.level==='immediate'
      ?'Sehr kurzfristiger Handlungsbedarf. Versäumnisfolgen können je nach Vorgang erheblich sein und müssen konkret geprüft werden.'
      :urgency.level==='high'
        ?'Zeitnah handeln und Fristgrundlage prüfen. Mögliche Versäumnisfolgen hängen vom Vorgang ab.'
        :'Frist vormerken und rechtzeitig die konkrete Fristgrundlage sowie mögliche Folgen prüfen.'
  return {status:urgency.level,primary:{...primary,days:urgency.days,date:primary.date.toISOString().slice(0,10)},message:`Priorisierte Frist: ${primary.date.toLocaleDateString('de-DE',{timeZone:'UTC'})}`,consequence,candidates:candidates.length}
}
