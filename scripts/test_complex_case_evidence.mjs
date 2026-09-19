import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {autoDocumentAssessment} from '../app/modules/cases/lib/caseIntelligence.mjs'
import {analyzeDeadlines} from '../app/modules/cases/lib/deadlineIntelligence.mjs'
import * as intelligence from '../app/modules/cases/lib/caseIntelligence.mjs'
import {roadmapSource,roadmapFingerprint,validateRoadmapInput,validateRoadmapResult} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestResult,roadmapTestCase,roadmapTestDocuments} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {complexCaseToday,complexTestCases,complexTestDocuments,complexCaseAcceptance} from '../app/modules/testing/complexCaseFixture.mjs'
import {timelineDateCopy,documentDateLabel} from '../app/modules/cases/lib/timelineDateCopy.mjs'

for(const text of [
  'Die Übergabe ist nicht bestätigt.',
  'Die Forderung wurde nicht vollständig gezahlt.',
  'Angebot: Reparatur bestätigt, jedoch noch nicht beauftragt.',
  'Eine Genehmigung ist unbestätigt.',
  'Wenn die Zahlung vollständig gezahlt ist, wird der Fall erledigt.',
  'Der Antrag soll bewilligt werden.',
  'Bestätigt ist nur der Eingang, die Entscheidung steht aus.',
  'Der Antrag wurde bestätigt, aber die Anlage fehlt.'
]) assert.notEqual(autoDocumentAssessment(text).trafficLight,'green',text)
assert.equal(autoDocumentAssessment('Der Antrag wurde bewilligt und bestätigt.').trafficLight,'green')
assert.equal(autoDocumentAssessment('Die Forderung ist vollständig gezahlt.').trafficLight,'green')
assert.equal(autoDocumentAssessment('Mahnung und Zahlungsaufforderung. Nicht erledigt.').trafficLight,'red')
for(const doc of complexTestDocuments) assert.notEqual(autoDocumentAssessment(doc.extracted_text,analyzeDeadlines({text:doc.extracted_text,now:complexCaseToday})).trafficLight,'green',doc.title)

assert.equal(typeof intelligence.documentTimelineEntry,'function')
const original=intelligence.documentTimelineEntry(complexTestDocuments[1])
assert.equal(original.date,'2026-05-12')
assert.equal(original.type,'document')
assert.equal(original.dateBasis,'document_date')
const upload=intelligence.documentTimelineEntry(complexTestDocuments.at(-1))
assert.equal(upload.date,'2026-07-09')
assert.equal(upload.type,'upload')
assert.equal(upload.dateBasis,'created_at')
assert.equal(intelligence.documentTimelineEntry({document_date:'2026-02-31',created_at:'2026-07-09T10:00:00Z'}).type,'upload')
assert.equal(intelligence.documentTimelineEntry({document_date:'invalid',created_at:'invalid'}).date,'')
assert.equal(intelligence.documentTimelineEntry({document_date:'4.7.2026'}).date,'2026-07-04')

const relative=analyzeDeadlines({text:complexTestDocuments[1].extracted_text,now:complexCaseToday})
assert.equal(relative.primary,null,'No receipt date may be invented from a letter/forwarding date')
const historical=analyzeDeadlines({text:complexTestDocuments[4].extracted_text,now:complexCaseToday})
assert.equal(historical.primary.date,'2026-05-29')
assert.equal(historical.status,'overdue')

for(const item of complexTestCases) {
  const source=roadmapSource(item,complexTestDocuments,[])
  validateRoadmapInput(source)
  assert.equal(source.documents.length,complexTestDocuments.filter(doc=>doc.case_id===item.id).length)
  assert.ok(source.documents.every(doc=>complexTestDocuments.find(original=>original.id===doc.id).case_id===item.id))
  const foreign={...complexTestDocuments.find(doc=>doc.case_id===item.id),id:'foreign',owner_id:'foreign-owner'}
  assert.deepEqual(roadmapSource(item,[...complexTestDocuments,foreign],[]),source)
  const before=await roadmapFingerprint(source)
  assert.notEqual(before,await roadmapFingerprint({...source,documents:source.documents.slice(1)}))
  assert.throws(()=>validateRoadmapInput({...source,documents:[{...source.documents[0],data_classification:'real'}]}),/Testbetrieb/)
}
const validSource=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
const forged=structuredClone(roadmapTestResult)
forged.facts[0].evidence[0].document_id=complexTestDocuments[0].id
assert.throws(()=>validateRoadmapResult(forged,validSource),/Original/)
assert.equal(complexCaseAcceptance.length,10)
const component=fs.readFileSync(new URL('../app/modules/cases/CaseTimelineAutoAssessment.js',import.meta.url),'utf8')
assert.match(component,/documentTimelineEntry/)
assert.match(component,/dateBasis/)
assert.match(component,/timelineDateCopy/)
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']) {
  const copy=timelineDateCopy(language)
  assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.length>0))
  assert.ok(documentDateLabel(complexTestDocuments.at(-1),language).includes(copy.upload))
  assert.ok(documentDateLabel(complexTestDocuments.at(-1),language).includes(copy.unknown))
  assert.ok(documentDateLabel(complexTestDocuments[0],language).includes(copy.document))
}
// Render the actual component, rather than proving only helper/source strings.
// No browser, account, provider, network request or persistence is involved.
const componentUrl=new URL('../app/modules/cases/CaseTimelineAutoAssessment.js',import.meta.url)
const compiled=transformSync(component,{filename:componentUrl.pathname,jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}},target:'es2022'},module:{type:'es6'}}).code
const resolved=compiled.replace(/from (["'])([^"']+)\1/g,(_,quote,path)=>`from ${JSON.stringify(path.startsWith('.')?new URL(path,componentUrl).href:import.meta.resolve(path))}`)
const {CaseTimeline,DocumentAutoAssessment}=await import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`)
const rendered=renderToStaticMarkup(createElement(CaseTimeline,{language:'de',documents:complexTestDocuments}))
assert.match(rendered,/data-date-basis="created_at"/)
assert.match(rendered,/Dokumentdatum unbekannt/)
assert.match(rendered,/Das Uploaddatum ist kein Ereignis- oder Zugangsdatum/)
assert.match(rendered,/<time dateTime="2026-05-12">2026-05-12<\/time>/)
const undated=renderToStaticMarkup(createElement(CaseTimeline,{documents:[{title:'Ohne Datum'}]}))
assert.match(undated,/Ohne Datum/)
assert.doesNotMatch(undated,/<time/)
const light=renderToStaticMarkup(createElement(DocumentAutoAssessment,{text:'Die Übergabe ist nicht bestätigt.'}))
assert.match(light,/🟡/)
assert.doesNotMatch(light,/🟢/)
for(const file of ['gold-document-analysis','gold-case-roadmap']) {
  const source=fs.readFileSync(new URL(`../supabase/functions/${file}/index.ts`,import.meta.url),'utf8')
  assert.match(source,/CASE_EVIDENCE_RULES/)
}
console.log('Complex case: negation, incomplete evidence, dated/undated timeline, relative/historical deadlines, case/owner isolation and provenance passed. Model generation is not part of this offline test.')
