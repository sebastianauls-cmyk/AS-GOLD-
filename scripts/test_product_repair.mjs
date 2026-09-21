import assert from 'node:assert/strict'
import fs from 'node:fs'
import {advanceReviewedModel} from '../supabase/functions/_shared/modelQuality.mjs'
import {sealModelCheckpoint,openModelCheckpoint} from '../supabase/functions/_shared/modelCheckpoint.mjs'
import {runRoadmapContinuation} from '../app/modules/services/roadmapContinuation.mjs'
import {roadmapSource,validateRoadmapResult,splitVerbatimRoadmapEvidence} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {readableStepText,roadmapProgressLabel} from '../app/modules/cases/lib/roadmapDisplay.mjs'
import {buildDeadlineOverview} from '../app/modules/cases/deadlineCases.mjs'
import {countrySwitcherLabel} from '../app/modules/country/countryLabels.mjs'

const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
const validate=raw=>validateRoadmapResult(raw,source)
const defect={issues:[{code:'meaning',location:'opening',reason:'Mocked negative control: changes the supplied original meaning.'}]}
function provider(outputs){const requests=[];return {requests,fetchImpl:async(_url,options)=>{requests.push(JSON.parse(options.body));assert.ok(outputs.length);return new Response(JSON.stringify({id:'synthetic-mock-'+requests.length,model:'mock',status:'completed',output_text:JSON.stringify(outputs.shift())}))}}}
const request={model:'mock',reasoning:{effort:'high'},instructions:'Originals only',input:[]}
const secret='synthetic-local-test-key-not-a-real-secret'
const binding={workflow:'roadmap-staged-v1',owner_id:'owner-a',case_id:'case-a',fingerprint:'source-v1',language:'de'}
let mock=provider([roadmapTestResult,defect,roadmapTestResult,{issues:[]}]),state=null,token,issuedAt=Date.now()
for(let step=0;step<4;step++) {
  const result=await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,state,fetchImpl:mock.fetchImpl})
  assert.equal(mock.requests.length,step+1,'exactly one model call per request')
  if(step<3) {
    assert.equal(result.status,'processing');assert.equal(result.result,undefined,'no early approval')
    token=await sealModelCheckpoint({state:result.state,binding,secret,issuedAt})
    assert.ok(!token.includes('candidate')&&!token.includes('Nora'),'unreviewed content is encrypted')
    state=(await openModelCheckpoint({token,binding,secret})).state
  }else {assert.equal(result.status,'completed');assert.equal(result.attempts,2);assert.deepEqual(result.result,roadmapTestResult)}
}
assert.ok(mock.requests.every(value=>value.reasoning.effort==='high'),'full review retained')
for(const changed of [{...binding,owner_id:'owner-b'},{...binding,case_id:'case-b'},{...binding,fingerprint:'source-v2'},{...binding,language:'en'},{...binding,workflow:'different'}])await assert.rejects(openModelCheckpoint({token,binding:changed,secret}),/ungültig/)
await assert.rejects(openModelCheckpoint({token:token.slice(0,-8)+'abcdabcd',binding,secret}),/ungültig/)
await assert.rejects(openModelCheckpoint({token,binding,secret,now:issuedAt+16*60*1000}),/abgelaufen/)
await assert.rejects(openModelCheckpoint({token,binding,secret:'different-test-key-not-a-real-secret'}),/ungültig/)

mock=provider([roadmapTestResult,defect,roadmapTestResult,defect]);state=null
for(let step=0;step<3;step++)state=(await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,state,fetchImpl:mock.fetchImpl})).state
await assert.rejects(advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,state,fetchImpl:mock.fetchImpl}),error=>error.code==='review_unresolved'&&error.issues[0].reason===defect.issues[0].reason)
assert.equal(mock.requests.length,4,'one bounded correction, no weakening of the evidence gate')
// Observed live regression: a corrected candidate joined non-adjacent sentences.
// Repair quotation structure only; every sentence must remain a literal source.
const quoteSource={documents:[{id:'tk',extracted_text:'Beginn der Beitragspflicht: 1. September 2026. Im Bescheid genanntes Ende: 31. August 2036. Die erste Zahlung für September ist am 15. Oktober 2026 fällig.'}]}
const first='Beginn der Beitragspflicht: 1. September 2026.',last='Die erste Zahlung für September ist am 15. Oktober 2026 fällig.'
const joined=first+'\n'+last
const quoteCandidate={opening:'Unchanged assertion',facts:[{text:'Unchanged fact',evidence:[{document_id:'tk',quote:joined}]}],steps:[{id:'one',action:'Unchanged action',deadline:{document_id:'tk',quote:joined,date:'2026-10-15'},evidence:[{document_id:'tk',quote:joined}]}],letters:[{body:'Unchanged letter'}]}
const before=structuredClone(quoteCandidate)
const split=splitVerbatimRoadmapEvidence(quoteCandidate,quoteSource)
assert.deepEqual(quoteCandidate,before,'never mutate the raw provider output')
assert.deepEqual(split.facts[0].evidence,[{document_id:'tk',quote:first},{document_id:'tk',quote:last}])
assert.deepEqual(split.steps[0].evidence,split.facts[0].evidence)
assert.deepEqual(split.steps[0].deadline,before.steps[0].deadline,'a deadline cannot be silently rewritten or split')
assert.equal(split.opening,before.opening);assert.equal(split.facts[0].text,before.facts[0].text);assert.equal(split.steps[0].action,before.steps[0].action);assert.deepEqual(split.letters,before.letters)
for(const evidence of [{document_id:'wrong',quote:joined},{document_id:'tk',quote:last+' '+first},{document_id:'tk',quote:first+' Die Zahlung beträgt 99 EUR.'},{document_id:'tk',quote:first}]){
  const candidate={facts:[{text:'test',evidence:[evidence]}]}
  assert.deepEqual(splitVerbatimRoadmapEvidence(candidate,quoteSource),candidate,'unknown IDs, reversed order, invented wording and already-valid quotes stay for the strict gate')
}
assert.deepEqual(splitVerbatimRoadmapEvidence(quoteCandidate,{documents:[{id:'tk',extracted_text:quoteSource.documents[0].extracted_text+' '+first}]}),quoteCandidate,'ambiguous repeated sentences must not be guessed')
mock=provider([quoteCandidate,defect,quoteCandidate,defect]);state=null
for(let step=0;step<3;step++)state=(await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:raw=>splitVerbatimRoadmapEvidence(raw,quoteSource),state,fetchImpl:mock.fetchImpl})).state
await assert.rejects(advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:raw=>splitVerbatimRoadmapEvidence(raw,quoteSource),state,fetchImpl:mock.fetchImpl}),error=>error.code==='review_unresolved','valid quotations never override a rejected meaning check')
const multipleBadQuotes=structuredClone(roadmapTestResult)
multipleBadQuotes.facts[0].evidence[0].quote='First invented quotation.'
multipleBadQuotes.steps[0].evidence[0].quote='Second invented quotation.'
assert.throws(()=>validate(multipleBadQuotes),error=>error.message.includes('facts[0].evidence[0]')&&error.message.includes('steps[0].evidence[0]'),'report every defective quote so one repair can address all locations')
const invalid=structuredClone(roadmapTestResult);invalid.facts[0].evidence[0].quote='This is an invented source quote.'
mock=provider([invalid,defect,roadmapTestResult,{issues:[]}]);state=null
for(let step=0;step<4;step++){const result=await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,state,fetchImpl:mock.fetchImpl});state=result.state;if(step===1){assert.equal(state.feedback.length,2,'collect both structural and semantic defects before the single correction');assert.equal(result.result,undefined)}if(step===3)assert.equal(result.status,'completed')}
for(const [name,code] of [['TimeoutError','provider_timeout'],['TypeError','provider_network']])await assert.rejects(advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,fetchImpl:async()=>{const error=new Error();error.name=name;throw error}}),error=>error.code===code)
await assert.rejects(advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate,budgetMs:0,fetchImpl:async()=>{throw Error('must not call')}}),/zu lange/)

let calls=0
const clientResult=await runRoadmapContinuation(async({body})=>{
  calls++;assert.equal(body.staged,true)
  if(calls>1)assert.equal(body.checkpoint,'sealed-'+(calls-1))
  return {data:calls===4?{status:'completed',roadmap:{id:'verified'}}:{status:'processing',checkpoint:'sealed-'+calls,stage:'review',roadmap:{id:'unreviewed'}}}
},{case_id:'case-a'})
assert.equal(clientResult.data.roadmap.id,'verified');assert.equal(calls,4)
calls=0;await assert.rejects(runRoadmapContinuation(async()=>{calls++;return {data:{status:'processing',checkpoint:'same'}}},{}),/vollständig/);assert.equal(calls,4)
calls=0;const error=new Error('Access expired');assert.equal((await runRoadmapContinuation(async()=>{calls++;return {error}},{})).error,error);assert.equal(calls,1)

const steps=[{id:'S3',title:'Antwort prüfen'},{id:'S4',title:'Beträge abgleichen'}]
assert.equal(readableStepText('Nach S3 folgt S4.',steps),'Nach „1. Antwort prüfen“ folgt „2. Beträge abgleichen“.')
assert.equal(readableStepText('TEST-S40 AS4 bleibt.',steps),'TEST-S40 AS4 bleibt.')
assert.equal(readableStepText('TEST-S4 und AS4 bleiben.',steps),'TEST-S4 und AS4 bleiben.')
assert.equal(readableStepText('1.800 EUR, 2 Tage, 3.000 EUR, 02.10.2026 und anfragen.',[{id:'1',title:'Prüfen'},{id:'2',title:'Zahlen'},{id:'3',title:'Abschließen'},{id:'anfragen',title:'Fragen'}]),'1.800 EUR, 2 Tage, 3.000 EUR, 02.10.2026 und anfragen.')
assert.throws(()=>validateRoadmapResult(roadmapTestResult,source,{outputLanguage:'en',referenceLanguage:'de'}),/Kundenübersetzung/)
const translated=structuredClone(roadmapTestResult);translated.letters.forEach(letter=>letter.customer_translation='Synthetic translation fixture; semantic accuracy is checked by the reviewer.')
assert.doesNotThrow(()=>validateRoadmapResult(translated,source,{outputLanguage:'en',referenceLanguage:'de'}))
assert.throws(()=>validateRoadmapResult(translated,source,{outputLanguage:'de',referenceLanguage:'de'}),/leer bleiben/)
const validateBilingual=(raw,repairContext={})=>validateRoadmapResult(raw,source,{outputLanguage:'en',referenceLanguage:'de',...repairContext})
const removedLetters=structuredClone(roadmapTestResult);removedLetters.letters=[]
mock=provider([roadmapTestResult,{issues:[]},removedLetters])
state=(await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:validateBilingual,fetchImpl:mock.fetchImpl})).state
assert.deepEqual(state.validationContext.requiredLetterIds,roadmapTestResult.letters.map(letter=>letter.id))
state=(await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:validateBilingual,state,fetchImpl:mock.fetchImpl})).state
await assert.rejects(advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:validateBilingual,state,fetchImpl:mock.fetchImpl}),error=>error.code==='source_unresolved'&&error.issues[0].reason.includes('Anschreiben'),'a translation repair must not silently delete letters')
mock=provider([roadmapTestResult,{issues:[]},translated,{issues:[]}]);state=null
for(let step=0;step<4;step++){const result=await advanceReviewedModel({providerKey:'mock',request,reviewContent:[],validate:validateBilingual,state,fetchImpl:mock.fetchImpl});state=result.state;if(step===3){assert.equal(result.status,'completed');assert.equal(result.result.letters.length,roadmapTestResult.letters.length)}}
const item={id:'case-a',owner_id:'owner-a',deadline_at:''}
const documents=[{id:'original',owner_id:'owner-a',case_id:'case-a',title:'Mahnung',extracted_text:'Zahlung bis 24.09.2026.'},{id:'answer',owner_id:'owner-a',case_id:'case-a',title:'Korrektur',extracted_text:'Bitte zahlen Sie bis 02.10.2026.'},{id:'foreign',owner_id:'owner-b',case_id:'case-a',extracted_text:'Frist bis 01.09.2026.'},{id:'upload-only',owner_id:'owner-a',case_id:'case-a',uploaded_at:'2026-09-19',extracted_text:'Keine konkrete Frist genannt.'}]
let overview=buildDeadlineOverview([item],documents)
assert.equal(overview.dated.length,0,'detected dates are never silently confirmed')
assert.deepEqual(overview.detected[0].candidates.map(value=>value.date),['2026-09-24','2026-10-02'])
assert.ok(overview.detected[0].candidates.every(value=>value.confirmed===false&&value.quote))
assert.equal(item.deadline_at,'','detection never writes a case deadline')
overview=buildDeadlineOverview([{...item,deadline_at:'2026-10-02T10:00:00Z'}],documents)
assert.equal(overview.dated.length,1);assert.equal(overview.detected[0].candidates.length,2,'old and new source dates remain reviewable')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])for(const stage of ['generation','review','correction']){assert.ok(roadmapProgressLabel(language,stage));assert.ok(countrySwitcherLabel(language))}
const endpoint=fs.readFileSync('supabase/functions/gold-case-roadmap/index.ts','utf8')
assert.ok(endpoint.indexOf('client.auth.getUser()')<endpoint.indexOf('openModelCheckpoint({'))
assert.ok(endpoint.indexOf("client.rpc('current_gold_access')")<endpoint.indexOf('openModelCheckpoint({'))
assert.ok(endpoint.indexOf("if(analysis.status==='processing')")<endpoint.indexOf(".insert({owner_id:user.id"))
assert.match(endpoint,/await roadmapFingerprint\(fresh\)!==fingerprint/)
console.log('Product repair: staged generation/review/correction, encrypted owner/source-bound continuation, bounded client flow, negative controls, readable steps, deadline source isolation and 11 language labels passed. Model calls mocked; no live acceptance claimed.')
