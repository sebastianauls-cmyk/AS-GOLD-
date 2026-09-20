import assert from 'node:assert/strict'
import {readableStepText} from '../app/modules/cases/lib/roadmapDisplay.mjs'
import {workflowErrorMessage,readWorkflowError} from '../app/modules/services/workflowError.mjs'
import {roadmapCurrentStatus} from '../app/modules/cases/lib/roadmapCurrentStatus.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'
import {updateRoadmapProgress} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {researchSourceCandidates,retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'
import fs from 'node:fs'

const letters=[{id:'L1',recipient:'TEST-Unternehmen B',subject:'Zahlungsdaten prüfen'}]
assert.equal(readableStepText('Prüfe L1. TEST-L1 und L12 bleiben.',[],letters),'Prüfe „TEST-Unternehmen B · Zahlungsdaten prüfen“. TEST-L1 und L12 bleiben.')
assert.equal(readableStepText('Rechnung 104, 3.000 EUR.',[],[{id:'104',recipient:'A',subject:'B'}]),'Rechnung 104, 3.000 EUR.')
let record=JSON.parse(fs.readFileSync('app/modules/testing/completionRoadmapFixture.json','utf8'))
const originals=structuredClone(record.result)
assert.ok(!roadmapCurrentStatus(record).action.includes('L1'),'current action resolves the letter reference')
assert.ok(!roadmapExportBlocks(record).some(block=>/\bL1\b/u.test(block.text)),'roadmap export resolves navigation references')
for(const step of record.result.steps)record={...record,...updateRoadmapProgress(record,{step_id:step.id,done:true,note:'Frei erfundener Test: Schritt mit dem Testbeleg abgeschlossen.'})}
record=JSON.parse(JSON.stringify(record))
assert.equal(roadmapCurrentStatus(record).state,'completed','serialized progress restores the completed case')
assert.equal(roadmapCurrentStatus(record).completed,3)
record={...record,...updateRoadmapProgress(record,{step_id:record.result.steps[0].id,done:false,note:'Frei erfundener Test: Empfängerdaten müssen nochmals geprüft werden.'})}
assert.equal(roadmapCurrentStatus(record).completed,0,'reopening invalidates all dependent confirmations')
assert.deepEqual(record.result,originals,'progress and display never rewrite reviewed evidence or formal letters')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  for(const code of ['no_verified_sources','source_review_unresolved','review_unresolved','source_unresolved','provider_timeout']){
    const message=workflowErrorMessage({code,error:'RAW_SERVER_DIAGNOSTIC',issues:[{reason:'RAW_MODEL_REASON'}]},'LOCAL_FALLBACK',language)
    assert.ok(message.length>30);assert.doesNotMatch(message,/RAW_|LOCAL_FALLBACK/)
    if(language!=='de')assert.notEqual(message,workflowErrorMessage({code},'', 'de'))
  }
  const fallback=await readWorkflowError({context:{json:async()=>{throw Error('bad json')}},message:'RAW_NETWORK_ERROR'},'LOCAL_FALLBACK',language)
  assert.equal(fallback,'LOCAL_FALLBACK')
}
assert.match(await readWorkflowError({context:{json:async()=>({error:'Die Fallgrundlage hat sich geändert. Bitte einen neuen Fahrplan erstellen.'})}},'fallback','en'),/Reload/)
const url='https://entreprendre.service-public.gouv.fr/vosdroits/F38586'
const discovered=researchSourceCandidates([{url,title:'Official proposal'},{url:'https://service-public.gouv.fr.evil.invalid/'}],new Map(),['service-public.gouv.fr'])
assert.equal(discovered.size,1)
assert.equal(discovered.get(url).source_text,undefined,'a proposed URL is never source evidence')
assert.equal((await retrieveOfficialEvidence([...discovered.values()],['service-public.gouv.fr'],{fetchImpl:async()=>new Response('Access denied',{status:403})})).size,0)
const evidence=await retrieveOfficialEvidence([...discovered.values()],['service-public.gouv.fr'],{fetchImpl:async()=>new Response('Official test source. '.repeat(12),{headers:{'content-type':'text/plain'}})})
assert.equal(evidence.size,1);assert.ok(evidence.get(url).content_sha256)
console.log('V141 follow-up: letter references, exact synthetic three-step completion/reopening, 11-language errors, and proposed URL versus fetched evidence passed. Local controlled tests; no live database acceptance claimed.')
