import fs from 'node:fs'

const cardPath='app/modules/cases/V38DeadlineCardEnhancer.js'
const casePath='app/modules/cases/V24Workspace.js'
const workspacePath='app/modules/workspace/WorkspaceApp.js'
const layoutPath='app/layout.js'
const testPath='scripts/test_v38_deadline_intelligence.mjs'
const guardPath='scripts/test_v46_modular_boundaries.mjs'
const readmePath='app/modules/README.md'

let card=fs.readFileSync(cardPath,'utf8')
if(!card.includes('export function DeadlineWarningCard')){
  const marker='\nconst languageByName='
  if(!card.includes(marker)) throw new Error('deadline DOM enhancer boundary marker missing')
  let prefix=card.split(marker)[0]
  prefix=prefix.replace("import { useEffect } from 'react'\n",'')
  prefix=prefix.replace('const labels={','export const deadlineWarningLabels={')
  card=`${prefix}\n\nfunction consequenceText(result,t){\n  if(result.status==='overdue') return t.cOverdue\n  if(result.status==='immediate') return t.cImmediate\n  if(result.status==='high') return t.cHigh\n  if(result.status==='normal') return t.cNormal\n  return t.cUncertain\n}\n\nfunction basisText(primary,t){\n  if(!primary) return t.none\n  if(primary.source==='case') return t.caseBasis\n  return primary.confidence==='medium'?t.documentMixedBasis:t.documentBasis\n}\n\nconst deadlineLocales={de:'de-DE',en:'en-GB',fr:'fr-FR',tr:'tr-TR',pl:'pl-PL',ru:'ru-RU',ar:'ar-SA',fa:'fa-IR',ro:'ro-RO',bg:'bg-BG'}\n\nfunction formatDeadline(primary,language,t){\n  if(!primary) return t.none\n  const date=new Date(\`${'${primary.date}'}T12:00:00Z\`)\n  return new Intl.DateTimeFormat(deadlineLocales[language]||deadlineLocales.de,{timeZone:'UTC'}).format(date)\n}\n\nexport function DeadlineWarningCard({language='de',caseDeadline='',text='',mode='case'}){\n  const t=deadlineWarningLabels[language]||deadlineWarningLabels.de\n  const result=analyzeDeadlines({caseDeadline,text})\n  const primary=result.primary\n  const status=t[result.status]||t.uncertain\n  return <section className=\"detailCard v38DeadlineWarningCard\" data-v38-deadline-card=\"true\" data-v38-deadline-mode={mode} style={{borderWidth:'2px',marginTop:'14px'}}>\n    <div className=\"detailCardHead\"><div><span className=\"modeBadge\">V38</span><h3 style={{margin:'.55rem 0 .2rem'}}>{t.title}</h3></div><strong>{status}</strong></div>\n    <p style={{fontSize:'1.1rem',fontWeight:800,margin:'.65rem 0'}}>{formatDeadline(primary,language,t)}</p>\n    <p><b>{t.basis}:</b> {basisText(primary,t)}</p>\n    <p><b>{t.consequence}:</b> {consequenceText(result,t)}</p>\n    <p><b>{t.action}:</b> {t.verify}</p>\n  </section>\n}\n\nexport function V38DeadlineCardEnhancer(){ return null }\n`
  fs.writeFileSync(cardPath,card)
}

let cases=fs.readFileSync(casePath,'utf8')
const analysisImport="import { ControlledDocumentAnalysis } from './V26DocumentAnalysis'"
const deadlineImport="import { DeadlineWarningCard } from './V38DeadlineCardEnhancer'"
if(!cases.includes(deadlineImport)){
  if(!cases.includes(analysisImport)) throw new Error('V24 deadline import anchor missing')
  cases=cases.replace(analysisImport,`${analysisImport}\n${deadlineImport}`)
}
cases=cases.replace('export function CaseDetail({copy:on, analysis, item, clients, documents, assessments, onBack, onSave, onAddAssessment, onAddDocument, onOpenDocument}){','export function CaseDetail({copy:on, analysis, language=\'de\', item, clients, documents, assessments, onBack, onSave, onAddAssessment, onAddDocument, onOpenDocument}){')
const caseGrid='<section className="caseCoreGrid"><article><b>{on.goal}</b><p>{item.goal||\'—\'}</p></article><article><b>{on.summary}</b><p>{item.summary||\'—\'}</p></article><article><b>{on.deadline}</b><p>{item.deadline_at?new Date(item.deadline_at).toLocaleString():\'—\'}</p></article><article><b>{on.nextAction}</b><p>{item.next_action||\'—\'}</p></article></section>'
const caseDeadline=`${caseGrid}\n    <DeadlineWarningCard language={language} caseDeadline={item.deadline_at||''} mode="case"/>`
if(!cases.includes('caseDeadline={item.deadline_at')){
  if(!cases.includes(caseGrid)) throw new Error('case deadline card anchor missing')
  cases=cases.replace(caseGrid,caseDeadline)
}
cases=cases.replace('export function DocumentDetail({copy:on, analysis, item, cases, onBack, onSave, onAnalyze, onOpen, onPrepareApproval, approvalLabel}){','export function DocumentDetail({copy:on, analysis, language=\'de\', item, cases, onBack, onSave, onAnalyze, onOpen, onPrepareApproval, approvalLabel}){')
const documentHead='<section className="documentReviewHead"><div><span className="modeBadge">V28</span><h2>{on.documentReview}</h2><p>{on.documentReviewHelp}</p></div><div className="documentReviewActions">{item.file_path&&<button className="secondary" type="button" onClick={()=>onOpen(item)}>{on.originalFile}</button>}{item.case_id&&onPrepareApproval&&<button className="primary" type="button" onClick={()=>onPrepareApproval(item)}>{approvalLabel}</button>}</div></section>'
const documentDeadline=`${documentHead}\n    <DeadlineWarningCard language={language} text={draft.extracted_text} mode="document"/>`
if(!cases.includes('text={draft.extracted_text} mode="document"')){
  if(!cases.includes(documentHead)) throw new Error('document deadline card anchor missing')
  cases=cases.replace(documentHead,documentDeadline)
}
fs.writeFileSync(casePath,cases)

let workspace=fs.readFileSync(workspacePath,'utf8')
workspace=workspace.replace('<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} item={selectedDocument}','<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} language={language} item={selectedDocument}')
workspace=workspace.replace('<CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} item={selectedCase}','<CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} language={language} item={selectedCase}')
if(!workspace.includes('CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} language={language}')) throw new Error('CaseDetail language prop not wired')
if(!workspace.includes('DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} language={language}')) throw new Error('DocumentDetail language prop not wired')
fs.writeFileSync(workspacePath,workspace)

let layout=fs.readFileSync(layoutPath,'utf8')
layout=layout.replace("import { V38DeadlineCardEnhancer } from './modules/cases/V38DeadlineCardEnhancer'\n",'')
layout=layout.replace('<AccessibilityHardening/><MobileResilience/><V38DeadlineCardEnhancer/>','<AccessibilityHardening/><MobileResilience/>')
if(layout.includes('<V38DeadlineCardEnhancer/>')) throw new Error('deadline enhancer still mounted globally')
fs.writeFileSync(layoutPath,layout)

let test=fs.readFileSync(testPath,'utf8')
if(!test.includes("const directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')")){
  const layoutRead="const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')"
  if(!test.includes(layoutRead)) throw new Error('deadline test layout read anchor missing')
  test=test.replace(layoutRead,`${layoutRead}\nconst directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')`)
}
test=test.replace("assert.match(card,/readDocumentText/)\nassert.match(card,/documentReviewForm/)\n",'assert.match(card,/DeadlineWarningCard/)\nassert.doesNotMatch(card,/MutationObserver|document\\.createElement|querySelector|innerHTML/)\nassert.match(directCases,/DeadlineWarningCard language=\\{language\\} caseDeadline=\\{item\\.deadline_at/)\nassert.match(directCases,/DeadlineWarningCard language=\\{language\\} text=\\{draft\\.extracted_text\\}/)\n')
test=test.replace('assert.match(layout,/modules\\/cases\\/V38DeadlineCardEnhancer/)','assert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)')
test=test.replace('console.log(\'V38 deadline intelligence guard passed: module-owned deadline UI and engine, semantic cues, localization and compatibility adapter verified.\')',"console.log('V38 deadline intelligence guard passed: direct React deadline UI, module-owned engine, semantic cues, localization and compatibility adapter verified.')")
fs.writeFileSync(testPath,test)

let guard=fs.readFileSync(guardPath,'utf8')
const layoutAnchor="assert.match(layout,/modules\\/cases\\/V42ActionableGaps/)"
const directGuard="assert.doesNotMatch(layout,/V38DeadlineCardEnhancer/)\nconst directCaseModule=read('app/modules/cases/V24Workspace.js')\nconst deadlineModule=read('app/modules/cases/V38DeadlineCardEnhancer.js')\nassert.match(directCaseModule,/DeadlineWarningCard/)\nassert.doesNotMatch(deadlineModule,/MutationObserver|document\\.createElement|querySelector|innerHTML/)"
if(!guard.includes('const deadlineModule=')){
  if(!guard.includes(layoutAnchor)) throw new Error('modular guard deadline anchor missing')
  guard=guard.replace(layoutAnchor,`${layoutAnchor}\n${directGuard}`)
}
fs.writeFileSync(guardPath,guard)

let readme=fs.readFileSync(readmePath,'utf8')
readme=readme.replace('- `cases/`: owns V24/V25 case workflow surfaces, V38 assessment/deadline/next-step logic, V39 timeline, V40 handoff, V41 consistency, V42 actionable gaps and their engines. Legacy component/lib paths are compatibility adapters.','- `cases/`: owns V24/V25 case workflow surfaces, V38 assessment/deadline/next-step logic, V39 timeline, V40 handoff, V41 consistency, V42 actionable gaps and their engines. The V38 deadline warning is now direct React composition inside case/document detail instead of a global DOM observer. Legacy component/lib paths are compatibility adapters.')
if(!readme.includes('`DeadlineWarningCard`')) readme += '\n- `cases/DeadlineWarningCard`: V38 deadline intelligence now renders from explicit case/document props; the legacy V38 enhancer export is a no-op compatibility adapter and is no longer mounted in the root layout.\n'
fs.writeFileSync(readmePath,readme)

console.log('V46 direct deadline card composition prepared')
