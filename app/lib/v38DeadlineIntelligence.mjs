const DAY_MS=86400000

function atNoonUtc(date){
  return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),12,0,0,0)
}

export function parseGermanDate(value){
  const match=String(value||'').match(/\b([0-3]?\d)\.(0?\d|1[0-2])\.(20\d{2})\b/)
  if(!match) return null
  const day=Number(match[1]);const month=Number(match[2]);const year=Number(match[3])
  const date=new Date(Date.UTC(year,month-1,day,12))
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) return null
  return date
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
  const explicit=parseGermanDate(text)
  if(explicit) candidates.push({date:explicit,source:'document',basis:'Explizit genanntes Datum im Dokument',confidence:'medium'})
  if(!candidates.length){
    return {status:'uncertain',primary:null,message:'Keine sichere Frist ableitbar. Originaldokument und Fallangaben prüfen.',consequence:'Keine Rechtsfolge behauptet, solange die Fristgrundlage nicht verifiziert ist.'}
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
