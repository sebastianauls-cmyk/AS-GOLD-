import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { roadmapSource,roadmapFingerprint,validateRoadmapInput,validateRoadmapResult,roadmapSteps,updateRoadmapProgress,ROADMAP_LANGUAGES } from '../supabase/functions/_shared/customerRoadmap.mjs'
import { roadmapTestCase,roadmapTestDocuments,roadmapTestResult,roadmapTestRecord } from '../app/modules/testing/customerRoadmapFixture.mjs'
import { roadmapUi,ROADMAP_UI_LANGUAGES } from '../app/modules/cases/lib/customerRoadmapCopy.mjs'
import { createRoadmapDocx,roadmapExportBlocks } from '../app/modules/services/customerRoadmapExport.mjs'

const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
validateRoadmapInput(source)
validateRoadmapResult(roadmapTestResult,source)
const other={...roadmapTestDocuments[0],id:'foreign',owner_id:'someone-else'}
assert.equal(roadmapSource(roadmapTestCase,[...roadmapTestDocuments,other],[]).documents.length,2)
assert.throws(()=>validateRoadmapInput({...source,documents:[{...source.documents[0],extracted_text:''}]}),/auslesen/)
assert.throws(()=>validateRoadmapInput({...source,documents:[{...source.documents[0],data_classification:'real'}]}),/Testbetrieb/)
assert.throws(()=>validateRoadmapInput({...source,documents:Array(31).fill(source.documents[0])}),/groß/)
const original=await roadmapFingerprint(source)
assert.equal(original,await roadmapFingerprint(roadmapSource(roadmapTestCase,[...roadmapTestDocuments].reverse(),[])))
for(const changed of [roadmapSource({...roadmapTestCase,summary:'New fact'},roadmapTestDocuments,[]),roadmapSource(roadmapTestCase,roadmapTestDocuments.slice(0,1),[]),roadmapSource(roadmapTestCase,roadmapTestDocuments.map((doc,i)=>i?doc:{...doc,extracted_text:doc.extracted_text+' correction'}),[])]) assert.notEqual(original,await roadmapFingerprint(changed))
const forged=structuredClone(roadmapTestResult);forged.facts[0].evidence[0].quote='A completely invented quotation'
assert.throws(()=>validateRoadmapResult(forged,source),/Original/)
const wrongDeadline=structuredClone(roadmapTestResult);wrongDeadline.steps[0].deadline.date='2026-10-01'
assert.throws(()=>validateRoadmapResult(wrongDeadline,source),/Frist/)
// A date must be complete in its quoted original, not a matching substring.
function deadlineCheck(original,date,quote=original) {
  const document={...source.documents[0],id:'deadline-evidence',extracted_text:original}
  const result=structuredClone(roadmapTestResult)
  result.steps[0].deadline={date,document_id:document.id,quote}
  return ()=>validateRoadmapResult(result,{...source,documents:[...source.documents,document]})
}
for(const [original,date,quote] of [
  ['Bitte antworten Sie bis 11.04.2030.','2030-04-01'],
  ['Bitte antworten Sie bis 21.04.2030.','2030-04-01','1.04.2030'],
  ['Bitte antworten Sie bis 11.04.2030.','2030-04-11','11.04.203'],
  ['Bitte antworten Sie bis 1.04.20300.','2030-04-01'],
  ['Bitte antworten Sie bis 2030-04-011.','2030-04-01'],
  ['Bitte antworten Sie bis 12030-04-01.','2030-04-01'],
  ['Termin 01.04.2030. Bitte antworten Sie bis 11.04.2030.','2030-04-01','Bitte antworten Sie bis 11.04.2030.'],
  ['Kennung X2030-04-01Y, kein Fristdatum.','2030-04-01']
]) assert.throws(deadlineCheck(original,date,quote),/Frist/,original)
for(const written of ['1.4.2030','01.04.2030','1.04.2030','01.4.2030','2030-04-01']) {
  assert.doesNotThrow(deadlineCheck(`Bitte antworten Sie bis (${written}).`,'2030-04-01',written))
}
assert.doesNotThrow(deadlineCheck('Vom 11.04.2030-21.04.2030.','2030-04-21'))
assert.doesNotThrow(deadlineCheck('Bitte antworten\nSie bis 11.04.2030.','2030-04-11','Bitte antworten Sie bis 11.04.2030.'))
for(const written of ['15. Oktober 2026','15 October 2026','October 15, 2026','October 15 2026'])assert.doesNotThrow(deadlineCheck(`Die erste Zahlung ist am ${written} fällig.`,'2026-10-15'))
assert.doesNotThrow(deadlineCheck('Die erste Zahlung ist am\n15. Oktober 2026 fällig.','2026-10-15','15. Oktober 2026'))
for(const [original,date,quote] of [
  ['Termin 15. Oktober 2026.','2026-10-05','5. Oktober 2026'],
  ['Termin 15. Oktober 2026.','2026-10-15','15. Oktober'],
  ['Termin 15. Oktober 20260.','2026-10-15'],
  ['Termin 15. September 2026.','2026-10-15'],
  ['Termin 31. September 2026.','2026-10-01'],
  ['Termin 15. Oktober 2026; danach 15. November 2026.','2026-10-15','15. November 2026'],
  ['Die Frist beträgt einen Monat nach Erhalt.','2026-10-15']
])assert.throws(deadlineCheck(original,date,quote),/Frist/,'written dates require a complete matching original token; no inferred relative deadline')
const cycle=structuredClone(roadmapTestResult);cycle.steps[0].depends_on=['abschluss']
assert.throws(()=>validateRoadmapResult(cycle,source),/Reihenfolge/)
const falseGreen=structuredClone(roadmapTestResult);falseGreen.steps[0].light='green'
assert.throws(()=>validateRoadmapResult(falseGreen,source),/Schrittstatus/)
let record=roadmapTestRecord()
assert.throws(()=>updateRoadmapProgress(record,{step_id:'antworten',done:true,note:'Alles erledigt'}),/vorher/)
assert.throws(()=>updateRoadmapProgress(record,{step_id:'frist',done:true,note:'ja'}),/begründen/)
for(const id of ['frist','anfragen','antworten','abschluss'])record={...record,...updateRoadmapProgress(record,{step_id:id,done:true,note:'Bestätigung mit Beleg abgelegt.'})}
assert.ok(roadmapSteps(record).every(step=>step.light==='green'))
assert.ok(roadmapSteps(record,{stale:true}).every(step=>step.light!=='green'))
record={...record,...updateRoadmapProgress(record,{step_id:'anfragen',done:false,note:'Antwort fehlt; Anfrage korrigieren.'})}
assert.equal(roadmapSteps(record).find(step=>step.id==='antworten').done,false)
assert.equal(roadmapSteps(record).find(step=>step.id==='abschluss').done,false)
assert.equal(record.events.length,5)
assert.deepEqual(ROADMAP_UI_LANGUAGES,ROADMAP_LANGUAGES)
for(const language of ROADMAP_LANGUAGES)for(const [key,value] of Object.entries(roadmapUi(language)))assert.ok(value,`${language}.${key} missing`)
const reopenedSnapshot=structuredClone(record)
const reopenedBlocks=roadmapExportBlocks(record)
function exportedStep(blocks,number) {
  const start=blocks.findIndex(block=>block.kind==='step'&&block.text.startsWith(`${number}. `))
  const end=blocks.findIndex((block,index)=>index>start&&block.kind==='step')
  return blocks.slice(start,end<0?undefined:end)
}
const thirdStep=exportedStep(reopenedBlocks,3)
const fourthStep=exportedStep(reopenedBlocks,4)
assert.ok(thirdStep.some(block=>block.text==='Zuerst erforderlich: 2. Beide Auskunftsanfragen vorbereiten'),'export identifies the prerequisite before the dependent action')
assert.ok(fourthStep.some(block=>block.text==='Zuerst erforderlich: 1. Empfangsbestätigung prüfen und einreichen · 3. Antworten auf Vollständigkeit prüfen'),'export preserves multiple prerequisites in order')
for(const blocks of [thirdStep,fourthStep]) {
  assert.equal(blocks[0].light,'yellow','reopened dependent action is not completed')
  assert.ok(blocks.some(block=>block.text==='Vorherige Schritte sind noch offen.'),'export explains blocked progress')
  assert.ok(blocks.some(block=>block.text==='Automatisch wieder geöffnet nach Wiederöffnung von: 2. Beide Auskunftsanfragen vorbereiten'),'export explains the original cause of direct and transitive reopening')
  assert.ok(blocks.some(block=>block.text==='Verlauf: Bestätigung mit Beleg abgelegt.'),'previous evidence remains available without a current completion claim')
}
for(const fact of record.result.facts) {
  const index=reopenedBlocks.findIndex(block=>block.text===fact.text)
  for(const evidence of fact.evidence) {
    assert.ok(reopenedBlocks[index+1].text.includes(evidence.quote),'fact export retains its original quotation next to the claim')
    assert.ok(reopenedBlocks[index+1].text.includes(record.source_documents.find(doc=>doc.id===evidence.document_id).title),'fact export identifies its source')
  }
}
for(const language of ROADMAP_LANGUAGES) {
  const ui=roadmapUi(language)
  assert.ok(ui.prerequisites&&ui.reopenedAfter,`${language}: dependency and reopening labels are translated`)
  const blocks=exportedStep(roadmapExportBlocks({...record,output_language:language}),3)
  for(const label of [ui.prerequisites,ui.reopenedAfter,ui.blocked])assert.ok(blocks.some(block=>block.text.startsWith(label)),`${language}: ${label}`)
}
assert.deepEqual(record,reopenedSnapshot,'export does not change recorded progress or evidence')
const docx=await createRoadmapDocx(record)
const zip=await JSZip.loadAsync(await docx.arrayBuffer())
const xml=await zip.file('word/document.xml').async('string')
assert.match(xml,/Wird grün, sobald/)
assert.match(xml,/Hallo Nora/)
assert.match(xml,/w:color w:val="287b50"/i)
assert.match(xml,/Zuerst erforderlich: 2\. Beide Auskunftsanfragen vorbereiten/)
assert.match(xml,/Automatisch wieder geöffnet nach Wiederöffnung von: 2\. Beide Auskunftsanfragen vorbereiten/)
assert.ok(xml.includes(record.result.facts[0].evidence[0].quote),'Word includes the fact-only source quotation')
assert.ok(zip.file('word/header1.xml'),'letterhead repeats through the document header')
const letterBlocks=roadmapExportBlocks(record,{letterId:'kasse'})
assert.ok(letterBlocks.every(block=>!block.light))
assert.ok(!letterBlocks.some(block=>block.text.includes('Wird grün')))
assert.match(letterBlocks.map(block=>block.text).join('\n'),/Sehr geehrte/)
assert.ok(!letterBlocks.some(block=>block.text.includes('Zuerst erforderlich')||block.text.includes('Automatisch wieder geöffnet')),'progress context stays out of the separate recipient letter')
let reconfirmed=structuredClone(record)
for(const id of ['anfragen','antworten','abschluss'])reconfirmed={...reconfirmed,...updateRoadmapProgress(reconfirmed,{step_id:id,done:true,note:'Erneut geprüft; neuer Beleg abgelegt.'})}
const reconfirmedBlocks=roadmapExportBlocks(reconfirmed)
assert.ok(reconfirmedBlocks.filter(block=>block.kind==='step').every(block=>block.light==='green'))
assert.ok(!reconfirmedBlocks.some(block=>block.text.includes('Automatisch wieder geöffnet')||block.text==='Vorherige Schritte sind noch offen.'),'reconfirmation clears outdated reopening and blocked explanations')
assert.deepEqual(roadmapExportBlocks(reconfirmed,{letterId:'kasse'}),letterBlocks,'progress changes never rewrite the recipient letter')
console.log('V136: case isolation, complete input, original quotes, deadline provenance, stale reports, dependencies, reopening/history, fact provenance and progress context in export, 11 languages and separate Word letters passed.')
