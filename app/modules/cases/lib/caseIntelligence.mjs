const redSignals=[/frist\s+(?:abgelaufen|versäumt)/i,/mahnung/i,/kündigung/i,/vollstreck/i,/klage/i,/inkasso/i,/zahlungsaufforderung/i,/ablehnung/i,/widerspruchsfrist/i,/einspruchsfrist/i]
const greenSignals=[/bestätigt/i,/genehmigt/i,/bewilligt/i,/stattgegeben/i,/erledigt/i,/vollständig\s+gezahlt/i,/fristgerecht/i]
// This is a conservative German keyword aid, not a semantic or legal verdict.
// Positive words in negated, conditional or unfinished statements cannot clear
// the document. In particular, "nicht bestätigt" used to turn the light green.
const uncertaintySignals=[/unklar/i,/fehlt|fehlen/i,/unvollständig/i,/vorläufig/i,
  /(?:^|[^\p{L}])(?:nicht|kein(?:e|en|em|er|es)?|ohne|unbestätigt\p{L}*|offen|ausstehend\p{L}*)(?=$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])(?:wenn|falls|sofern|soll|sollen|sollte|sollten|voraussichtlich|geplant)(?=$|[^\p{L}])/iu,
  /\b(?:steht|stehen)\s+(?:noch\s+)?aus\b/i,
  // An alleged decision, acknowledgement of receipt or future promise cannot
  // establish that the requested outcome has already happened.
  /angeblich|behaupt\p{L}*|vermut\p{L}*/iu,
  /(?:^|[^\p{L}])(?:sei|seien|wäre|wären|würde|würden|könnte|könnten)(?=$|[^\p{L}])/iu,
  /\b(?:wird|werden)\b[^.!?\n]{0,100}(?:bestätigt|genehmigt|bewilligt|stattgegeben|erledigt|gezahlt)/i,
  /eingangsbestätigung|\beingang\b|empfangsbestätigung|teilzahlung|abschlagszahlung/i,
  /angebot|leistungsverzeichnis|ausschreibung|beitragsverrechnung/i]

export function autoDocumentAssessment(text='',deadlineResult=null){
  const value=String(text||'').trim()
  if(!value) return {trafficLight:'yellow',confidence:'low',title:'Noch keine belastbare Dokument-Ampel',reason:'Es liegt kein ausgelesener Dokumentinhalt vor.',nextStep:'Dokumentinhalt prüfen oder Analyse starten.',signals:[]}
  const red=redSignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const uncertain=uncertaintySignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const green=uncertain.length?[]:greenSignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const urgent=['overdue','immediate'].includes(deadlineResult?.status)
  const high=deadlineResult?.status==='high'
  let trafficLight='yellow'
  let title='Prüfung erforderlich'
  if(urgent){trafficLight='red';title='Erhöhter Handlungsbedarf erkannt'}
  else if(green.length>0&&!red.length&&!high&&!uncertain.length){trafficLight='green';title='Derzeit keine offensichtliche Warnlage erkannt'}
  const basis=[]
  if(deadlineResult?.primary?.date) basis.push(`Frist ${deadlineResult.primary.date}`)
  if(red.length) basis.push(`${red.length} Risikosignal(e)`)
  if(green.length) basis.push(`${green.length} positives Signal(e)`)
  if(uncertain.length) basis.push(`${uncertain.length} Unsicherheitssignal(e)`)
  return {
    trafficLight,
    confidence:red.length+green.length+uncertain.length>1?'medium':'low',
    title,
    reason:basis.length?basis.join(' · '):'Keine eindeutigen Warn- oder Entlastungssignale erkannt.',
    nextStep:trafficLight==='red'?'Originaldokument, Frist und mögliche Folgen sofort prüfen.':trafficLight==='green'?'Ergebnis anhand des Originaldokuments bestätigen.':'Fehlende Angaben ergänzen und Originaldokument fachlich prüfen.',
    signals:[...red.map(value=>({type:'risk',value})),...green.map(value=>({type:'positive',value})),...uncertain.map(value=>({type:'uncertain',value}))]
  }
}

export function timelineIsoDate(value=''){
  const raw=String(value||'').trim()
  const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/)
  const local=raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/)
  if(!iso&&!local) return ''
  const [year,month,day]=iso?[iso[1],iso[2],iso[3]]:[local[3],local[2],local[1]]
  const result=`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`
  const date=new Date(`${result}T12:00:00Z`)
  if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==result) return ''
  if(iso&&raw.includes('T')&&Number.isNaN(Date.parse(raw))) return ''
  return result
}

export function documentTimelineEntry(document={}){
  const original=timelineIsoDate(document?.document_date)
  const uploaded=timelineIsoDate(document?.created_at)
  return {
    id:document?.id||'',
    date:original||uploaded,
    type:original?'document':uploaded?'upload':'undated',
    dateBasis:original?'document_date':uploaded?'created_at':'unknown',
    title:document?.title||'',
    detail:document?.document_type||''
  }
}

export function sortTimelineEntries(entries=[]){
  return [...entries].filter(Boolean).sort((a,b)=>{
    const left=a.date?new Date(a.date).getTime():NaN
    const right=b.date?new Date(b.date).getTime():NaN
    return (Number.isFinite(left)?left:Infinity)-(Number.isFinite(right)?right:Infinity)||0
  })
}
