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
const docx=await createRoadmapDocx(record)
const zip=await JSZip.loadAsync(await docx.arrayBuffer())
const xml=await zip.file('word/document.xml').async('string')
assert.match(xml,/Wird grün, sobald/)
assert.match(xml,/Hallo Nora/)
assert.match(xml,/w:color w:val="287b50"/i)
assert.ok(zip.file('word/header1.xml'),'letterhead repeats through the document header')
const letterBlocks=roadmapExportBlocks(record,{letterId:'kasse'})
assert.ok(letterBlocks.every(block=>!block.light))
assert.ok(!letterBlocks.some(block=>block.text.includes('Wird grün')))
assert.match(letterBlocks.map(block=>block.text).join('\n'),/Sehr geehrte/)
console.log('V136: case isolation, complete input, original quotes, deadline provenance, stale reports, dependencies, reopening/history, 11 languages and separate Word letters passed.')
