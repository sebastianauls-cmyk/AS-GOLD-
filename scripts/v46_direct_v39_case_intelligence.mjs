import fs from 'node:fs'

const v39Path='app/modules/cases/V39CaseTimelineAutoAssessment.js'
const casePath='app/modules/cases/V24Workspace.js'
const layoutPath='app/layout.js'
const testPath='scripts/test_v39_case_intelligence.mjs'
const guardPath='scripts/test_v46_modular_boundaries.mjs'
const readmePath='app/modules/README.md'

let v39=fs.readFileSync(v39Path,'utf8')
if(!v39.includes('export function DocumentAutoAssessment')){
  const labelsMatch=v39.match(/const labels=\{[\s\S]*?\n\}\n\nfunction lang\(\)/)
  if(!labelsMatch) throw new Error('V39 labels boundary missing')
  const labelsBlock=labelsMatch[0].replace(/\n\nfunction lang\(\)$/,'').replace(/^const labels=/,'export const caseIntelligenceLabels=')
  v39=`'use client'\n\nimport { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'\nimport { autoDocumentAssessment,sortTimelineEntries } from '../lib/v39CaseIntelligence.mjs'\n\n${labelsBlock}\n\nfunction copyFor(language='de'){\n  return caseIntelligenceLabels[language]||caseIntelligenceLabels.de\n}\n\nfunction isoDate(value=''){\n  const raw=String(value||'').trim()\n  if(!raw) return ''\n  const iso=raw.match(/^(\\d{4}-\\d{2}-\\d{2})/)\n  if(iso) return iso[1]\n  const local=raw.match(/(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{4})/)\n  if(local){const [,d,m,y]=local;return \`${'${y}'}-${'${m.padStart(2,\'0\')'}-${'${d.padStart(2,\'0\')'}\`}\n  const date=new Date(raw)\n  return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)\n}\n\nexport function DocumentAutoAssessment({language='de',text=''}){\n  const t=copyFor(language)\n  const deadline=analyzeDeadlines({text})\n  const result=autoDocumentAssessment(text,deadline)\n  const icon=result.trafficLight==='red'?'🔴':result.trafficLight==='green'?'🟢':'🟡'\n  return <section className=\"detailCard v39AutoAssessment\" data-v39-auto-assessment=\"true\">\n    <div className=\"detailCardHead\"><div><span className=\"modeBadge\">V39</span><h3>{t.auto}</h3></div><strong>{icon} {t[result.trafficLight]}</strong></div>\n    <p><b>{result.title}</b></p>\n    <small>{t.provisional}</small>\n    <p><b>{t.basis}:</b> {result.reason}</p>\n    <p><b>{t.next}:</b> {result.nextStep}</p>\n  </section>\n}\n\nexport function CaseTimeline({language='de',caseDeadline='',documents=[]}){\n  const t=copyFor(language)\n  const entries=[]\n  const deadlineDate=isoDate(caseDeadline)\n  if(deadlineDate) entries.push({date:deadlineDate,type:'deadline',title:t.deadline,detail:String(caseDeadline)})\n  for(const document of documents){\n    const rawDate=document?.document_date||document?.created_at||''\n    const date=isoDate(rawDate)\n    if(date) entries.push({date,type:'document',title:document?.title||t.document,detail:String(rawDate)})\n  }\n  const sorted=sortTimelineEntries(entries)\n  return <section className=\"detailCard v39Timeline\" data-v39-timeline=\"true\">\n    <div className=\"detailCardHead\"><div><span className=\"modeBadge\">V39</span><h3>{t.timeline}</h3></div></div>\n    <ol className=\"v39TimelineList\">\n      {sorted.length?sorted.map((entry,index)=><li key={\`${'${entry.type}'}-${'${entry.date}'}-${'${index}'}\`}><time>{entry.date}</time><div><b>{entry.type==='deadline'?t.deadline:t.document} · {entry.title}</b><small>{entry.detail||''}</small></div></li>):<li className=\"emptyState\">{t.noTimeline}</li>}\n    </ol>\n  </section>\n}\n\nexport function V39CaseTimelineAutoAssessment(){ return null }\n`
  fs.writeFileSync(v39Path,v39)
}

let cases=fs.readFileSync(casePath,'utf8')
const primaryImport="import { PrimaryNextStepCard } from './V38PrimaryNextStep'"
const v39Import="import { CaseTimeline, DocumentAutoAssessment } from './V39CaseTimelineAutoAssessment'"
if(!cases.includes(v39Import)){
  if(!cases.includes(primaryImport)) throw new Error('V39 import anchor missing')
  cases=cases.replace(primaryImport,`${primaryImport}\n${v39Import}`)
}
const primaryCard='<PrimaryNextStepCard language={language} item={item} documents={documents} assessments={assessments}/>'
if(!cases.includes('<CaseTimeline language={language}')){
  if(!cases.includes(primaryCard)) throw new Error('V39 case insertion anchor missing')
  cases=cases.replace(primaryCard,`${primaryCard}\n    <CaseTimeline language={language} caseDeadline={item.deadline_at||''} documents={documents}/>`)
}
const deadlineCard='<DeadlineWarningCard language={language} text={draft.extracted_text} mode="document"/>'
if(!cases.includes('<DocumentAutoAssessment language={language}')){
  if(!cases.includes(deadlineCard)) throw new Error('V39 document insertion anchor missing')
  cases=cases.replace(deadlineCard,`${deadlineCard}\n    <DocumentAutoAssessment language={language} text={draft.extracted_text}/>`)
}
fs.writeFileSync(casePath,cases)

let layout=fs.readFileSync(layoutPath,'utf8')
layout=layout.replace("import { V39CaseTimelineAutoAssessment } from './modules/cases/V39CaseTimelineAutoAssessment'\n",'')
layout=layout.replace('<V39CaseTimelineAutoAssessment/>','')
if(layout.includes('<V39CaseTimelineAutoAssessment/>')) throw new Error('V39 enhancer still mounted globally')
fs.writeFileSync(layoutPath,layout)

let test=fs.readFileSync(testPath,'utf8')
if(!test.includes("const directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')")){
  const layoutRead="const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')"
  if(!test.includes(layoutRead)) throw new Error('V39 test layout anchor missing')
  test=test.replace(layoutRead,`${layoutRead}\nconst directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')`)
}
test=test.replace('assert.match(layout,/modules\\/cases\\/V39CaseTimelineAutoAssessment/)','assert.doesNotMatch(layout,/V39CaseTimelineAutoAssessment/)\nassert.match(component,/DocumentAutoAssessment/)\nassert.match(component,/CaseTimeline/)\nassert.doesNotMatch(component,/MutationObserver|document\\.createElement|querySelector|innerHTML|setInterval/)\nassert.match(directCases,/DocumentAutoAssessment language=\\{language\\}/)\nassert.match(directCases,/CaseTimeline language=\\{language\\}/)')
test=test.replace("console.log('V39 case intelligence guard passed: module-owned automatic provisional traffic light and chronological case timeline verified.')","console.log('V39 case intelligence guard passed: direct React automatic provisional traffic light and chronological case timeline verified.')")
fs.writeFileSync(testPath,test)

let guard=fs.readFileSync(guardPath,'utf8')
const primaryGuard="assert.doesNotMatch(primaryStepModule,/MutationObserver|document\\.createElement|querySelector|innerHTML/)"
const v39Guard="const v39Module=read('app/modules/cases/V39CaseTimelineAutoAssessment.js')\nassert.doesNotMatch(layout,/V39CaseTimelineAutoAssessment/)\nassert.match(directCaseModule,/DocumentAutoAssessment/)\nassert.match(directCaseModule,/CaseTimeline/)\nassert.doesNotMatch(v39Module,/MutationObserver|document\\.createElement|querySelector|innerHTML|setInterval/)"
if(!guard.includes('const v39Module=')){
  if(!guard.includes(primaryGuard)) throw new Error('V39 modular guard anchor missing')
  guard=guard.replace(primaryGuard,`${primaryGuard}\n${v39Guard}`)
}
fs.writeFileSync(guardPath,guard)

let readme=fs.readFileSync(readmePath,'utf8')
if(!readme.includes('`DocumentAutoAssessment`')) readme += '\n- `cases/DocumentAutoAssessment` and `cases/CaseTimeline`: V39 document traffic-light and timeline UI render directly from document/case props; the former global MutationObserver/polling enhancer is now a no-op compatibility export.\n'
fs.writeFileSync(readmePath,readme)

console.log('V46 direct V39 case intelligence prepared')
