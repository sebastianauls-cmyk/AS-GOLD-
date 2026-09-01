import fs from 'node:fs'

const assessmentPath='app/modules/cases/V38AssessmentExplainability.js'
const nextPath='app/modules/cases/V38PrimaryNextStep.js'
const casePath='app/modules/cases/V24Workspace.js'
const layoutPath='app/layout.js'
const assessmentTestPath='scripts/test_v38_assessment_explainability.mjs'
const nextTestPath='scripts/test_v38_primary_next_step.mjs'
const syntheticPath='scripts/test_v38_synthetic_full_flow.mjs'
const guardPath='scripts/test_v46_modular_boundaries.mjs'
const readmePath='app/modules/README.md'

let assessment=fs.readFileSync(assessmentPath,'utf8')
if(!assessment.includes('export function AssessmentExplainability')){
  const marker='\nconst labels='
  if(!assessment.includes(marker)) throw new Error('assessment DOM enhancer marker missing')
  let prefix=assessment.split(marker)[0]
  prefix=prefix.replace("import { useEffect } from 'react'\n",'')
  prefix=prefix.replace('const copies={','export const assessmentExplainabilityCopies={')
  assessment=`${prefix}\n\nexport function AssessmentExplainability({language='de',reasoning='',next=''}){\n  const c=assessmentExplainabilityCopies[language]||assessmentExplainabilityCopies.de\n  const basis=reasoning||'—'\n  return <details className=\"v38AssessmentWhy\" style={{marginTop:'12px',paddingTop:'10px',borderTop:'1px solid rgba(90,90,90,.18)'}}>\n    <summary style={{cursor:'pointer',fontWeight:850,color:'#72591d',listStylePosition:'inside'}}>{c.why}</summary>\n    <div style={{display:'grid',gap:'8px',marginTop:'10px',padding:'10px',borderRadius:'12px',background:'#faf8f1'}}>\n      <p style={{margin:0,lineHeight:1.45}}><b>{c.basis}: </b>{basis}</p>\n      <p style={{margin:0,lineHeight:1.45}}><b>{c.uncertainty}: </b>{c.uncertaintyText}</p>\n      <p style={{margin:0,lineHeight:1.45}}><b>{c.missing}: </b>{c.missingText}</p>\n      {next&&next!=='—'?<p style={{margin:0,lineHeight:1.45}}><b>→ </b>{next}</p>:null}\n    </div>\n  </details>\n}\n\nexport function V38AssessmentExplainability(){ return null }\n`
  fs.writeFileSync(assessmentPath,assessment)
}

let primary=fs.readFileSync(nextPath,'utf8')
if(!primary.includes('export function PrimaryNextStepCard')){
  const labelsMarker='\nconst languageByName='
  if(!primary.includes(labelsMarker)) throw new Error('primary next-step DOM marker missing')
  let prefix=primary.split(labelsMarker)[0]
  prefix=prefix.replace("import { useEffect } from 'react'\n",'')
  prefix=prefix.replace("import { prioritizeNextStep } from '../lib/v38NextStepEngine.mjs'", "import { prioritizeNextStep } from '../lib/v38NextStepEngine.mjs'\nimport { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'\nimport { deadlineWarningLabels } from './V38DeadlineCardEnhancer'")
  prefix=prefix.replace('const labels={','export const primaryNextStepLabels={')
  primary=`${prefix}\n\nexport function PrimaryNextStepCard({language='de',item,documents=[],assessments=[]}){\n  const t=primaryNextStepLabels[language]||primaryNextStepLabels.de\n  const deadlineCopy=deadlineWarningLabels[language]||deadlineWarningLabels.de\n  const deadline=analyzeDeadlines({caseDeadline:item?.deadline_at||''})\n  const result=prioritizeNextStep({\n    language,\n    missing:!documents.length,\n    deadlineStatus:deadline.status,\n    deadlineAction:deadline.primary?deadlineCopy.verify:'',\n    assessments:assessments.map(entry=>({traffic:entry.traffic_light||'yellow',next:entry.next_step||''})),\n    caseNext:item?.next_action||''\n  })\n  return <section className=\"detailCard v38PrimaryNextStep\" data-v38-primary-next-step=\"true\" style={{border:'2px solid #b89242',background:'linear-gradient(135deg,#fffaf0,#fff)'}}>\n    <div className=\"detailCardHead\"><div><span className=\"modeBadge\">V38</span><h3 style={{margin:'.55rem 0 .2rem'}}>{t.title}</h3></div><strong>1</strong></div>\n    <p style={{fontSize:'1.16rem',fontWeight:900,lineHeight:1.45,margin:'.8rem 0'}}>{result.action}</p>\n    <p><b>{t.when}</b> {result.when}</p>\n    <p><b>{t.why}</b> {result.why}</p>\n  </section>\n}\n\nexport function V38PrimaryNextStep(){ return null }\n`
  fs.writeFileSync(nextPath,primary)
}

let cases=fs.readFileSync(casePath,'utf8')
const deadlineImport="import { DeadlineWarningCard } from './V38DeadlineCardEnhancer'"
const assessmentImport="import { AssessmentExplainability } from './V38AssessmentExplainability'"
const primaryImport="import { PrimaryNextStepCard } from './V38PrimaryNextStep'"
if(!cases.includes(assessmentImport)){
  if(!cases.includes(deadlineImport)) throw new Error('case guidance import anchor missing')
  cases=cases.replace(deadlineImport,`${deadlineImport}\n${assessmentImport}\n${primaryImport}`)
}
const deadlineCard='<DeadlineWarningCard language={language} caseDeadline={item.deadline_at||\'\'} mode="case"/>'
if(!cases.includes('<PrimaryNextStepCard')){
  if(!cases.includes(deadlineCard)) throw new Error('primary next-step insertion anchor missing')
  cases=cases.replace(deadlineCard,`${deadlineCard}\n    <PrimaryNextStepCard language={language} item={item} documents={documents} assessments={assessments}/>`)
}
const oldAssessment="<article className={`assessment ${entry.traffic_light}`} key={entry.id}><div><span>{entry.traffic_light==='red'?`🔴 ${on.red}`:entry.traffic_light==='green'?`🟢 ${on.green}`:`🟡 ${on.yellow}`}</span><b>{entry.title}</b></div><p>{entry.reasoning||'—'}</p><small>{on.nextAction}: {entry.next_step||'—'}</small></article>"
const newAssessment="<article className={`assessment ${entry.traffic_light}`} key={entry.id}><div><span>{entry.traffic_light==='red'?`🔴 ${on.red}`:entry.traffic_light==='green'?`🟢 ${on.green}`:`🟡 ${on.yellow}`}</span><b>{entry.title}</b></div><p>{entry.reasoning||'—'}</p><small>{on.nextAction}: {entry.next_step||'—'}</small><AssessmentExplainability language={language} reasoning={entry.reasoning} next={entry.next_step}/></article>"
if(!cases.includes('<AssessmentExplainability language={language}')){
  if(!cases.includes(oldAssessment)) throw new Error('assessment explainability insertion anchor missing')
  cases=cases.replace(oldAssessment,newAssessment)
}
fs.writeFileSync(casePath,cases)

let layout=fs.readFileSync(layoutPath,'utf8')
layout=layout.replace("import { V38AssessmentExplainability } from './modules/cases/V38AssessmentExplainability'\n",'')
layout=layout.replace("import { V38PrimaryNextStep } from './modules/cases/V38PrimaryNextStep'\n",'')
layout=layout.replace('<V38AssessmentExplainability/><V38PrimaryNextStep/>','')
if(layout.includes('<V38AssessmentExplainability/>')||layout.includes('<V38PrimaryNextStep/>')) throw new Error('case guidance enhancers still mounted globally')
fs.writeFileSync(layoutPath,layout)

let assessmentTest=fs.readFileSync(assessmentTestPath,'utf8')
if(!assessmentTest.includes("const directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')")){
  const layoutRead="const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')"
  assessmentTest=assessmentTest.replace(layoutRead,`${layoutRead}\nconst directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')`)
}
assessmentTest=assessmentTest.replace("assert.match(component,/\\.assessmentList \\.assessment/)\nassert.match(component,/reasoning=card\\.querySelector\\('p'\\)/)\n",'assert.match(component,/AssessmentExplainability/)\nassert.doesNotMatch(component,/MutationObserver|document\\.createElement|querySelector|appendChild/)\nassert.match(directCases,/AssessmentExplainability language=\\{language\\}/)\n')
assessmentTest=assessmentTest.replace('assert.match(layout,/modules\\/cases\\/V38AssessmentExplainability/)','assert.doesNotMatch(layout,/V38AssessmentExplainability/)')
assessmentTest=assessmentTest.replace("console.log('V38 assessment explainability guard passed: case-module ownership, compatibility adapter and 10-language layer verified.')","console.log('V38 assessment explainability guard passed: direct React assessment explanation, compatibility adapter and 10-language layer verified.')")
fs.writeFileSync(assessmentTestPath,assessmentTest)

let nextTest=fs.readFileSync(nextTestPath,'utf8')
if(!nextTest.includes("const directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')")){
  const layoutRead="const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')"
  nextTest=nextTest.replace(layoutRead,`${layoutRead}\nconst directCases=fs.readFileSync(new URL('../app/modules/cases/V24Workspace.js',import.meta.url),'utf8')`)
}
for(const stale of [
  'assert.match(component,/attentionBox/)\n',
  'assert.match(component,/data-v38-deadline-card/)\n',
  'assert.match(component,/caseCoreGrid/)\n'
]) nextTest=nextTest.replace(stale,'')
nextTest=nextTest.replace('assert.match(component,/assessment/)','assert.match(component,/assessments/)')
nextTest=nextTest.replace('assert.match(layout,/modules\\/cases\\/V38PrimaryNextStep/)','assert.doesNotMatch(layout,/V38PrimaryNextStep/)\nassert.match(component,/PrimaryNextStepCard/)\nassert.match(component,/analyzeDeadlines/)\nassert.doesNotMatch(component,/MutationObserver|document\\.createElement|querySelector|innerHTML/)\nassert.match(directCases,/PrimaryNextStepCard language=\\{language\\}/)')
nextTest=nextTest.replace("console.log('V38 primary next-step guard passed: case-module ownership, exactly one recommendation and ten-language copy verified.')","console.log('V38 primary next-step guard passed: direct React recommendation, exactly one recommendation and ten-language copy verified.')")
fs.writeFileSync(nextTestPath,nextTest)

let synthetic=fs.readFileSync(syntheticPath,'utf8')
synthetic=synthetic.replace("for(const component of ['V38AssessmentExplainability','V38PrimaryNextStep']) assert.match(layout,new RegExp(component))","for(const component of ['V38AssessmentExplainability','V38PrimaryNextStep']) assert.doesNotMatch(layout,new RegExp(component))\nassert.match(directCases,/AssessmentExplainability/)\nassert.match(directCases,/PrimaryNextStepCard/)")
synthetic=synthetic.replace('remaining V38 UI layers are mounted','V38 assessment and next-step UI are directly composed')
fs.writeFileSync(syntheticPath,synthetic)

let guard=fs.readFileSync(guardPath,'utf8')
const deadlineGuard="assert.doesNotMatch(deadlineModule,/MutationObserver|document\\.createElement|querySelector|innerHTML/)"
const caseGuidanceGuard="const assessmentModule=read('app/modules/cases/V38AssessmentExplainability.js')\nconst primaryStepModule=read('app/modules/cases/V38PrimaryNextStep.js')\nassert.doesNotMatch(layout,/V38AssessmentExplainability|V38PrimaryNextStep/)\nassert.match(directCaseModule,/AssessmentExplainability/)\nassert.match(directCaseModule,/PrimaryNextStepCard/)\nassert.doesNotMatch(assessmentModule,/MutationObserver|document\\.createElement|querySelector|appendChild/)\nassert.doesNotMatch(primaryStepModule,/MutationObserver|document\\.createElement|querySelector|innerHTML/)"
if(!guard.includes('const assessmentModule=')){
  if(!guard.includes(deadlineGuard)) throw new Error('case guidance modular guard anchor missing')
  guard=guard.replace(deadlineGuard,`${deadlineGuard}\n${caseGuidanceGuard}`)
}
fs.writeFileSync(guardPath,guard)

let readme=fs.readFileSync(readmePath,'utf8')
if(!readme.includes('`AssessmentExplainability`')) readme += '\n- `cases/AssessmentExplainability` and `cases/PrimaryNextStepCard`: V38 explanation and prioritised next-step UI now render directly from case state; their legacy global enhancer exports remain no-op compatibility adapters only.\n'
fs.writeFileSync(readmePath,readme)

console.log('V46 direct case guidance composition prepared')
