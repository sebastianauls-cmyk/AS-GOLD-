import {offlineNetworkAttempts} from './noNetwork.mjs'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import https from 'node:https'
import net from 'node:net'
import childProcess from 'node:child_process'
import {offlineFixtures} from './fixtures.mjs'

// Production code is imported only after the transport guard is installed.
const {evaluateOfflineResponse,applyCounterexample}=await import('./evaluate.mjs')
const {roadmapSteps,updateRoadmapProgress}=await import('../../supabase/functions/_shared/customerRoadmap.mjs')
const {testWaitingDependencies}=await import('./waitingDependencies.mjs')

const args=process.argv.slice(2)
let selected,responseFile,json=false
for(let i=0;i<args.length;i++){
  if(args[i]==='--json')json=true
  else if(['--case','--response'].includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')){
    const option=args[i++];if(option==='--case')selected=args[i];else responseFile=args[i]
  }else throw new Error('Aufruf: npm run test:offline -- [--case ID] [--response lokale-datei.json] [--json]')
}
if(responseFile&&!selected)throw new Error('--response benötigt --case für den passenden festen Prüfauftrag.')
const fixtures=selected?offlineFixtures.filter(fixture=>fixture.id===selected):offlineFixtures
if(!fixtures.length)throw new Error('Unbekannter Referenzfall. Verfügbar: '+offlineFixtures.map(fixture=>fixture.id).join(', '))

// A probe uses no DNS/socket. Native HTTP and socket clients must be blocked too;
// merely overriding fetch would allow an accidental axios/https call to escape.
const blocked={code:'ASH_OFFLINE_NETWORK'}
await assert.rejects(()=>fetch('https://offline-probe.invalid'),blocked)
assert.throws(()=>https.get('https://offline-probe.invalid'),blocked)
assert.throws(()=>net.createConnection({host:'offline-probe.invalid',port:443}),blocked)
assert.throws(()=>childProcess.spawn('curl',['https://offline-probe.invalid']),blocked)
const probeCount=offlineNetworkAttempts().length
testWaitingDependencies()

const cases=[],failures=[]
for(const fixture of fixtures){
  const raw=responseFile?JSON.parse(fs.readFileSync(responseFile,'utf8')):fixture.reply
  // Accept the actual stored record envelope as well as its result object.
  const response=responseFile&&raw?.result&&typeof raw.result==='object'?raw.result:raw
  const result=evaluateOfflineResponse(fixture,response)
  const summary={id:fixture.id,title:fixture.title,provenance:responseFile?'local_response_file':fixture.provenance,
    reference:result.passed?'passed':'failed',issues:result.issues,counterexamples:[]}
  if(!result.passed)failures.push(...result.issues.map(issue=>({case:fixture.id,...issue})))
  if(!responseFile){
    for(const counterexample of fixture.counterexamples){
      const rejected=evaluateOfflineResponse(fixture,applyCounterexample(fixture.reply,counterexample.changes))
      const corrected=counterexample.behavior==='corrected'&&rejected.passed&&JSON.stringify(rejected.checked.steps)!==JSON.stringify(applyCounterexample(fixture.reply,counterexample.changes).steps)
      const caught=counterexample.behavior==='corrected'?corrected:rejected.issues.some(issue=>issue.code===counterexample.code)
      summary.counterexamples.push({id:counterexample.id,provenance:counterexample.provenance,expected_issue:counterexample.code,
        detected:caught,corrected,production_validation:rejected.production_validation})
      if(!caught)failures.push({case:fixture.id,code:'counterexample_missed',message:counterexample.id})
    }
    // Exercise the customer-visible workflow, including reopening prerequisites.
    // These assertions are independent of text matching in the local oracle.
    let record={result:result.checked??fixture.reply,progress:{},events:[]}
    for(const step of record.result.steps){
      const visible=roadmapSteps(record).find(item=>item.id===step.id)
      assert.equal(visible.blocked,false,`${fixture.id}: earlier prerequisites must already be done`)
      record={...record,...updateRoadmapProgress(record,{step_id:step.id,done:true,note:'Mit synthetischem Beleg geprüft.'})}
    }
    assert(roadmapSteps(record).every(step=>step.done),`${fixture.id}: completion persists`)
    const first=record.result.steps[0].id
    record={...record,...updateRoadmapProgress(record,{step_id:first,done:false,note:'Neue synthetische Antwort prüfen.'})}
    assert(roadmapSteps(record).every(step=>!step.done),`${fixture.id}: reopening invalidates dependent confirmations`)
    summary.progress='passed'
  }
  cases.push(summary)
}
const extraAttempts=offlineNetworkAttempts().slice(probeCount)
if(extraAttempts.length)failures.push({code:'unexpected_network_attempt',message:extraAttempts.join(', ')})
const counterexamples=cases.flatMap(entry=>entry.counterexamples)
const report={version:1,status:failures.length?'failed':'passed',mode:responseFile?'local-response-check':'reference-and-counterexample-check',
  cases_checked:cases.length,counterexamples_checked:counterexamples.length,counterexamples_detected:counterexamples.filter(item=>item.detected).length,
  counterexamples_corrected:counterexamples.filter(item=>item.corrected).length,
  network_guard:'enabled',blocked_self_test_probes:probeCount,unexpected_network_attempts:extraAttempts.length,live_model_calls:0,
  model_generation_quality:'not_measured',product_acceptance:'pending',
  production_validation_gaps:counterexamples.filter(item=>item.production_validation==='passed'&&!item.corrected).map(({id,expected_issue})=>({id,expected_issue})),
  cases,failures}
if(json)console.log(JSON.stringify(report,null,2))
else{
  for(const entry of cases)console.log(`${entry.reference==='passed'?'OK':'FEHLER'} ${entry.id}: ${entry.title} (${entry.counterexamples.filter(item=>item.detected).length}/${entry.counterexamples.length} Gegenproben erkannt)`)
  console.log(`\n${report.cases_checked} Referenzfälle; ${report.counterexamples_detected}/${report.counterexamples_checked} Fehlvarianten erkannt oder regelbasiert korrigiert; ${report.live_model_calls} Live-Modellaufrufe.`)
  console.log('Neue KI-Qualität: nicht gemessen. Produktabnahme: offen.')
  if(report.production_validation_gaps.length)console.log(`${report.production_validation_gaps.length} Fehlvarianten bestehen die reine Produktions-Strukturprüfung. Der feste lokale Prüfauftrag erkennt sie; die unabhängige inhaltliche Produktionsprüfung bleibt erforderlich.`)
  for(const failure of failures)console.error(JSON.stringify(failure))
}
if(failures.length)process.exitCode=1
