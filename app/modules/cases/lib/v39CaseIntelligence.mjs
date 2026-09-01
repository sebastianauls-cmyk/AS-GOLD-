const redSignals=[/frist\s+(?:abgelaufen|versäumt)/i,/mahnung/i,/kündigung/i,/vollstreck/i,/klage/i,/inkasso/i,/zahlungsaufforderung/i,/ablehnung/i,/widerspruchsfrist/i,/einspruchsfrist/i]
const greenSignals=[/bestätigt/i,/genehmigt/i,/bewilligt/i,/stattgegeben/i,/erledigt/i,/vollständig\s+gezahlt/i,/fristgerecht/i]
const uncertaintySignals=[/unklar/i,/nicht\s+bekannt/i,/fehlt/i,/ohne\s+nachweis/i,/unvollständig/i,/vorläufig/i]

export function autoDocumentAssessment(text='',deadlineResult=null){
  const value=String(text||'').trim()
  if(!value) return {trafficLight:'yellow',confidence:'low',title:'Noch keine belastbare Dokument-Ampel',reason:'Es liegt kein ausgelesener Dokumentinhalt vor.',nextStep:'Dokumentinhalt prüfen oder Analyse starten.',signals:[]}
  const red=redSignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const green=greenSignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const uncertain=uncertaintySignals.filter(pattern=>pattern.test(value)).map(pattern=>pattern.source)
  const urgent=['overdue','immediate'].includes(deadlineResult?.status)
  const high=deadlineResult?.status==='high'
  let trafficLight='yellow'
  let title='Prüfung erforderlich'
  if(urgent||red.length>=2){trafficLight='red';title='Erhöhter Handlungsbedarf erkannt'}
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

export function sortTimelineEntries(entries=[]){
  return [...entries].filter(Boolean).sort((a,b)=>{
    const left=new Date(a.date||0).getTime()||0
    const right=new Date(b.date||0).getTime()||0
    return left-right
  })
}
