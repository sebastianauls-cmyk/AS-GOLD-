const OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'
const OUTPUT_LANGUAGE_LABELS={de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български',vi:'Tiếng Việt'}

function currentOutputLanguage(){
  try{
    const value=globalThis?.localStorage?.getItem(OUTPUT_LANGUAGE_STORAGE_KEY)||'de'
    return OUTPUT_LANGUAGE_LABELS[value]?value:'de'
  }catch{return 'de'}
}

function trafficLightKey(value){
  const normalized=String(value||'').trim().toLowerCase().replace(/^[🔴🟡🟢⚪]\s*/u,'')
  return ['green','yellow','red'].includes(normalized)?normalized:'yellow'
}

function trafficLightDisplay(value){
  const key=trafficLightKey(value)
  return (key==='red'?'🔴':key==='green'?'🟢':'🟡')+' '+key
}

export function buildProfessionalHandoff({title='Fallakte',goal='',summary='',deadline='',nextAction='',documents=[],assessments=[],timeline=[]}={}){
  const clean=value=>String(value||'').trim()
  const language=currentOutputLanguage()
  const languageName=OUTPUT_LANGUAGE_LABELS[language]||OUTPUT_LANGUAGE_LABELS.de
  const normalizedDocuments=(documents||[]).filter(Boolean).map(item=>({title:clean(item.title)||'Dokument',date:clean(item.date),status:clean(item.status)}))
  const normalizedAssessments=(assessments||[]).filter(Boolean).map(item=>({trafficLight:trafficLightDisplay(item.trafficLight),title:clean(item.title)||'Bewertung',reasoning:clean(item.reasoning),nextStep:clean(item.nextStep)}))
  const normalizedTimeline=(timeline||[]).filter(Boolean).map(item=>({date:clean(item.date),title:clean(item.title),detail:clean(item.detail)})).sort((a,b)=>a.date.localeCompare(b.date))
  const missing=[]
  if(!clean(goal)) missing.push('goal')
  if(!clean(summary)) missing.push('summary')
  if(!normalizedDocuments.length) missing.push('documents')
  if(!normalizedAssessments.length) missing.push('assessments')
  return {title:'Ausgabesprache / Output language: '+languageName+'\n'+(clean(title)||'Fallakte'),outputLanguage:language,outputLanguageName:languageName,goal:clean(goal),summary:clean(summary),deadline:clean(deadline),nextAction:clean(nextAction),documents:normalizedDocuments,assessments:normalizedAssessments,timeline:normalizedTimeline,missing,ready:missing.length===0}
}

export function handoffPriority(assessments=[]){
  if(assessments.some(item=>trafficLightKey(item.trafficLight)==='red')) return 'red'
  if(assessments.some(item=>trafficLightKey(item.trafficLight)==='yellow')) return 'yellow'
  return assessments.length?'green':'yellow'
}
