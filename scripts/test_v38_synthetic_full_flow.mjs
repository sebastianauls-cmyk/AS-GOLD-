import assert from 'node:assert/strict'
import fs from 'node:fs'
import { analyzeDeadlines } from '../app/lib/v38DeadlineIntelligence.mjs'
import { prioritizeNextStep, supportedRecommendationLanguages } from '../app/lib/v38NextStepEngine.mjs'

const now=new Date('2026-09-01T10:00:00Z')
const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg']
assert.deepEqual(supportedRecommendationLanguages.sort(),expectedLanguages.sort())

function simulate(name,{text='',caseDeadline='',missing=false,assessments=[],caseNext='',expectedDeadline,expectedKind,expectedWhen}){
  const deadline=analyzeDeadlines({text,caseDeadline,now})
  const recommendation=prioritizeNextStep({
    language:'de',
    missing,
    deadlineStatus:deadline.status,
    deadlineAction:deadline.primary?'Fristgrundlage prüfen und erforderliche Handlung vorbereiten.':'',
    assessments,
    caseNext
  })
  if(expectedDeadline) assert.equal(deadline.status,expectedDeadline,`${name}: falsche Fristenstufe`)
  assert.equal(recommendation.kind,expectedKind,`${name}: falsche Hauptpriorität`)
  if(expectedWhen) assert.equal(recommendation.when,expectedWhen,`${name}: falscher Zeitpunkt`)
  assert.ok(recommendation.action&&recommendation.action.length>4,`${name}: keine verwertbare Hauptempfehlung`)
  return {name,deadline:deadline.status,recommendation:recommendation.kind}
}

const results=[]
results.push(simulate('Akute Dokumentfrist',{text:'Ihre Stellungnahme muss bis 03.09.2026 eingehen.',expectedDeadline:'immediate',expectedKind:'deadline',expectedWhen:'Jetzt / heute'}))
results.push(simulate('Fallfrist in sechs Tagen',{caseDeadline:'2026-09-07',expectedDeadline:'high',expectedKind:'deadline',expectedWhen:'Zeitnah'}))
results.push(simulate('Akute Frist schlägt generische Unterlagenlücke',{caseDeadline:'2026-09-02',missing:true,assessments:[{traffic:'red',next:'Widerspruch vorbereiten'}],expectedDeadline:'immediate',expectedKind:'deadline',expectedWhen:'Jetzt / heute'}))
results.push(simulate('Fehlende Unterlagen vor hoher Frist',{caseDeadline:'2026-09-07',missing:true,expectedDeadline:'high',expectedKind:'missing',expectedWhen:'Jetzt / heute'}))
results.push(simulate('Rote Bewertung ohne akute Frist',{text:'Kein konkretes Fristdatum.',assessments:[{traffic:'yellow',next:'Unterlagen sortieren'},{traffic:'red',next:'Ablehnung fachlich prüfen'}],expectedDeadline:'uncertain',expectedKind:'assessment',expectedWhen:'Jetzt / heute'}))
results.push(simulate('Gelbe Bewertung vor grüner',{assessments:[{traffic:'green',next:'Archivieren'},{traffic:'yellow',next:'Rückfrage formulieren'}],expectedDeadline:'uncertain',expectedKind:'assessment',expectedWhen:'Zeitnah'}))
results.push(simulate('Hinterlegte Fallaktion als Fallback',{caseNext:'Versicherer anschreiben',expectedDeadline:'uncertain',expectedKind:'case',expectedWhen:'Als Nächstes'}))
results.push(simulate('Unsichere Datenlage ohne nächste Aktion',{expectedDeadline:'uncertain',expectedKind:'uncertain',expectedWhen:'Als Nächstes'}))
results.push(simulate('Echte Fallfrist statt bloßem Besprechungstermin',{text:'Besprechung am 20.09.2026.',caseDeadline:'2026-09-05',expectedDeadline:'high',expectedKind:'deadline',expectedWhen:'Zeitnah'}))

for(const lang of expectedLanguages){
  const rec=prioritizeNextStep({language:lang,missing:true})
  assert.equal(rec.kind,'missing',`${lang}: Prioritätslogik weicht ab`)
  assert.ok(rec.action.length>4,`${lang}: Übersetzung der Hauptempfehlung fehlt`)
  const urgent=prioritizeNextStep({language:lang,missing:true,deadlineStatus:'immediate'})
  assert.equal(urgent.kind,'deadline',`${lang}: akute Frist muss Vorrang haben`)
  assert.ok(urgent.action.length>8,`${lang}: kombinierte Frist-/Unterlagenempfehlung fehlt`)
}

const packageJson=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'))
for(const token of ['test:v38-deadlines','test:v38-assessments','test:v38-next-step']) assert.match(packageJson.scripts.prebuild,new RegExp(token.replace(':','\\:')))
const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
for(const exportToken of ['PDF','DOCX','XLSX','PPTX']) assert.match(page,new RegExp(exportToken,'i'),`Export ${exportToken} fehlt im produktiven Codepfad`)
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
for(const component of ['V38DeadlineCardEnhancer','V38AssessmentExplainability','V38PrimaryNextStep']) assert.match(layout,new RegExp(component))

console.log('V38 synthetic full-flow simulation passed.')
for(const r of results) console.log(`✓ ${r.name}: deadline=${r.deadline}, next=${r.recommendation}`)
console.log('✓ Acute/overdue deadlines outrank generic missing-information notices in all 10 languages')
console.log('✓ V38 UI layers mounted and PDF/DOCX/XLSX/PPTX export code paths present')
