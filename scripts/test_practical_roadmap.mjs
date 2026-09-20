import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import JSZip from 'jszip'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {updateRoadmapProgress,ROADMAP_LANGUAGES} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapExportBlocks,createRoadmapDocx,createRoadmapPdf} from '../app/modules/services/customerRoadmapExport.mjs'
import {roadmapCurrentStatus,roadmapCurrentCopy} from '../app/modules/cases/lib/roadmapCurrentStatus.mjs'
import {roadmapUi} from '../app/modules/cases/lib/customerRoadmapCopy.mjs'

function summaryValue(record,label) {
  const blocks=roadmapExportBlocks(record)
  const index=blocks.findIndex(block=>block.kind==='heading'&&block.text===label)
  assert.ok(index>=0,`Missing customer summary: ${label}`)
  return blocks[index+1]?.text
}
let record=roadmapTestRecord()
const original=structuredClone(record.result)
const initialLetter=roadmapExportBlocks(record,{letterId:'kasse'})
assert.equal(roadmapCurrentStatus(record).step.id,'frist')
record={...record,...updateRoadmapProgress(record,{step_id:'frist',done:true,note:'Synthetischer Test: Empfangsbestätigung eingereicht, Zugang belegt.'})}
assert.match(summaryValue(record,'Nächster Schritt'),/2\. Beide Auskunftsanfragen vorbereiten/,'After completing step 1, the customer summary must direct the customer to the still-open second step, not repeat step 1.')
assert.equal(summaryValue(record,'Selbst erledigen'),record.result.steps[1].action)
assert.equal(roadmapCurrentStatus(record).completed,1)

record={...record,...updateRoadmapProgress(record,{step_id:'anfragen',done:true,note:'Beide Anfragen geprüft und versandt; Testbelege abgelegt.'})}
const waiting=roadmapCurrentStatus(record)
assert.equal(waiting.state,'waiting')
assert.equal(waiting.step.id,'antworten')
assert.ok(waiting.action.includes(record.result.steps[2].waiting_for),'waiting names the missing responses')
assert.ok(waiting.action.includes(record.result.steps[2].follow_up),'waiting preserves the follow-up instruction')
assert.ok(!waiting.action.includes(record.result.steps[2].action),'do not instruct the customer to review a reply as if it had arrived')
assert.equal(roadmapCurrentStatus(record,{today:'2030-01-01'}).state,'waiting','elapsed time never confirms receipt of a reply')
const waitingRecord=structuredClone(record)

for(const id of ['antworten','abschluss'])record={...record,...updateRoadmapProgress(record,{step_id:id,done:true,note:'Synthetisch geprüft und Ergebnis mit Belegen abgelegt.'})}
const completed=roadmapCurrentStatus(record)
assert.equal(completed.state,'completed')
assert.equal(completed.step,null)
assert.equal(completed.completed,4)
assert.equal(summaryValue(record,'Nächster Schritt'),'Alle Schritte als erledigt bestätigt.')
assert.equal(summaryValue(record,'Selbst erledigen'),roadmapCurrentCopy('de').observe)
const completedRecord=structuredClone(record)
record={...record,...updateRoadmapProgress(record,{step_id:'anfragen',done:false,note:'Anfrage muss anhand des vorhandenen Testbelegs korrigiert werden.'})}
assert.equal(roadmapCurrentStatus(record).step.id,'anfragen','reopening selects the reopened prerequisite, never its blocked dependants')
assert.equal(roadmapCurrentStatus(record).completed,1)
for(const saved of [waitingRecord,completedRecord,record]) {
  const stale=roadmapCurrentStatus(saved,{stale:true})
  assert.equal(stale.state,'stale')
  assert.equal(stale.step,null,'a changed source cannot recommend an old action')
  assert.equal(stale.completed,0,'old confirmations are not presented as current')
  assert.equal(stale.light,'white')
  assert.deepEqual(saved.result,original,'progress never rewrites the reviewed assessment, quotes or letters')
  assert.deepEqual(roadmapExportBlocks(saved,{letterId:'kasse'}),initialLetter,'status changes never rewrite the separate formal letter')
}

const malformed=roadmapTestRecord()
malformed.result.steps[0].depends_on=['missing']
malformed.result.steps[1].depends_on=['frist']
assert.equal(roadmapCurrentStatus(malformed).state,'blocked','unmet prerequisites do not become actionable')
const parallel=roadmapTestRecord()
parallel.result.steps[0].phase='waiting';parallel.result.steps[0].light='yellow';parallel.result.steps[0].deadline=null
assert.equal(roadmapCurrentStatus(parallel).step.id,'anfragen','ready parallel work is shown ahead of waiting when neither is urgent')
parallel.result.steps[0].deadline={date:'2026-09-19'}
assert.equal(roadmapCurrentStatus(parallel,{today:'2026-09-20'}).step.id,'frist','a source-backed urgent task takes priority')

for(const language of ROADMAP_LANGUAGES) {
  const localized={...completedRecord,output_language:language}
  const copy=roadmapCurrentCopy(language)
  for(const value of Object.values(copy))assert.ok(value,`${language}: missing progress label`)
  if(language!=='de')assert.notEqual(copy.completed,roadmapCurrentCopy('de').completed)
  assert.equal(summaryValue(localized,roadmapUi(language).next),copy.completed)
}

const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ash-practical-roadmap-'))
const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>fs.readFileSync('public/fonts/'+name).toString('base64'))
const poppler=spawnSync('pdftotext',['-v'],{encoding:'utf8'}).status===0
for(const [name,saved] of [['waiting',waitingRecord],['completed',completedRecord],['reopened',record]]) {
  const current=roadmapCurrentStatus(saved)
  const docx=await createRoadmapDocx(saved)
  fs.writeFileSync(path.join(directory,name+'.docx'),Buffer.from(await docx.arrayBuffer()))
  const xml=await (await JSZip.loadAsync(await docx.arrayBuffer())).file('word/document.xml').async('string')
  assert.ok(xml.includes(current.next),`${name}: Word contains the current next step`)
  assert.ok(xml.indexOf(current.next)<xml.indexOf(roadmapCurrentCopy('de').original),'current progress precedes the archived assessment')
  assert.ok(!xml.includes(original.next),'Word does not repeat the initial next-step instruction as current')
  const pdf=await createRoadmapPdf(saved,{fonts})
  const file=path.join(directory,name+'.pdf')
  fs.writeFileSync(file,Buffer.from(await pdf.arrayBuffer()))
  if(poppler) {
    const extracted=spawnSync('pdftotext',['-raw',file,'-'],{encoding:'utf8'})
    assert.equal(extracted.status,0,extracted.stderr)
    const text=extracted.stdout.replace(/\s+/g,' ')
    assert.ok(text.includes(current.next),`${name}: PDF contains the current next step`)
    assert.ok(!text.includes(original.next),'PDF does not repeat the initial next-step instruction as current')
    assert.ok(text.includes(original.facts[0].evidence[0].quote),'PDF preserves the original evidence quotation')
  }
}
console.log('Practical roadmap: next action, waiting, completion, reopening, changed sources, prerequisite/urgency ordering, 11-language status, unchanged evidence/letters and real Word/PDF exports passed.')
console.log(`PDF text extraction: ${poppler?'verified':'Poppler unavailable'}. Temporary export files: ${directory}`)
