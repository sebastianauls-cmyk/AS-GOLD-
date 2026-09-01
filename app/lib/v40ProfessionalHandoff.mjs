export function buildProfessionalHandoff({title='Fallakte',goal='',summary='',deadline='',nextAction='',documents=[],assessments=[],timeline=[]}={}){
  const clean=value=>String(value||'').trim()
  const normalizedDocuments=(documents||[]).filter(Boolean).map(item=>({title:clean(item.title)||'Dokument',date:clean(item.date),status:clean(item.status)}))
  const normalizedAssessments=(assessments||[]).filter(Boolean).map(item=>({trafficLight:['green','yellow','red'].includes(item.trafficLight)?item.trafficLight:'yellow',title:clean(item.title)||'Bewertung',reasoning:clean(item.reasoning),nextStep:clean(item.nextStep)}))
  const normalizedTimeline=(timeline||[]).filter(Boolean).map(item=>({date:clean(item.date),title:clean(item.title),detail:clean(item.detail)})).sort((a,b)=>a.date.localeCompare(b.date))
  const missing=[]
  if(!clean(goal)) missing.push('goal')
  if(!clean(summary)) missing.push('summary')
  if(!normalizedDocuments.length) missing.push('documents')
  if(!normalizedAssessments.length) missing.push('assessments')
  return {title:clean(title)||'Fallakte',goal:clean(goal),summary:clean(summary),deadline:clean(deadline),nextAction:clean(nextAction),documents:normalizedDocuments,assessments:normalizedAssessments,timeline:normalizedTimeline,missing,ready:missing.length===0}
}

export function handoffPriority(assessments=[]){
  if(assessments.some(item=>item.trafficLight==='red')) return 'red'
  if(assessments.some(item=>item.trafficLight==='yellow')) return 'yellow'
  return assessments.length?'green':'yellow'
}
