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
  const before=text.slice(0,index)
  const after=text.slice(index+length)
  const leftBreak=Math.max(before.lastIndexOf('.'),before.lastIndexOf('!'),before.lastIndexOf('?'),before.lastIndexOf('\n'),before.lastIndexOf(';'))
  const rightOffsets=[after.indexOf('.'),after.indexOf('!'),after.indexOf('?'),after.indexOf('\n'),after.indexOf(';')].filter(value=>value>=0)
  const rightBreak=rightOffsets.length?Math.min(...rightOffsets):after.length
  const start=leftBreak+1
  const end=index+length+rightBreak
  return text.slice(start,end).trim()
}

export function parseGermanDate(value){
  const match=String(value||'').match(/\b([0-3]?\d)\.(0?\d|1[0-2])\.(20\d{2})\b/)
  return match?dateFromParts(match[1],match[2],match[3]):null
}

export function extractDeadlineDates(value){
  const text=String(value||'')
  const matches=[]
  DATE_RE.lastIndex=0
  let match
  while((match=DATE_RE.exec(text))){
    const date=dateFromParts(match[1],match[2],match[3])
    if(!date) continue
    const context=sentenceContext(text,match.index,match[0].length)
    const strong=STRONG_DEADLINE_CUES.test(context)
    const ordinary=ORDINARY_DATE_CUES.test(context)
    if(!strong) continue
    matches.push({
      date,
      confidence:ordinary?'medium':'high',
      basis:ordinary?'Datum mit Fristbezug im Dokument – Terminbezug zusätzlich prüfen':'Expliziter Fristbezug im Dokument',
      context
    })
  }
  return matches
}

export function deadlineUrgency(deadline,now=new Date()){
  if(!(deadline instanceof Date)||Number.isNaN(deadline.getTime())) return {level:'uncertain',days:null}
  const days=Math.ceil((atNoonUtc(deadline)-atNoonUtc(now))/DAY_MS)
  if(days<0) return {level:'overdue',days}
  if(days<=2) return {level:'immediate',days}
  if(days<=7) return {level:'high',days}
  return {level:'normal',days}
}

export function analyzeDeadlines({text='',caseDeadline='',now=new Date()}={}){
  const candidates=[]
  if(caseDeadline){
    const parsed=new Date(caseDeadline)
    if(!Number.isNaN(parsed.getTime())) candidates.push({date:parsed,source:'case',basis:'Im Fall hinterlegte Frist',confidence:'high'})
  }
  for(const extracted of extractDeadlineDates(text)){
    candidates.push({date:extracted.date,source:'document',basis:extracted.basis,confidence:extracted.confidence,context:extracted.context})
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
