import assert from 'node:assert/strict'
import {offlineFixtures} from './fixtures.mjs'
import {validateRoadmapResult,roadmapSteps} from '../../supabase/functions/_shared/customerRoadmap.mjs'

// Reported defect, reconstructed with invented documents: the prose requires
// replies from steps 2 through 4, but the graph accidentally skips step 3.
export function testWaitingDependencies(){
  const fixture=offlineFixtures.find(item=>item.id==='family')
  const missing=structuredClone(fixture.reply)
  missing.steps[4].depends_on=['orders','application']
  for(const text of [
    'Antworten aus Schritten 2 bis 4.',
    'Antworten aus den Schritten 2–4.',
    'Rückmeldungen zu den Schritten 2, 3 und 4.',
    'Responses from steps 2 through 4.',
    'Replies from steps 2, 3 and 4.',
  ]){
    missing.steps[4].waiting_for=text
    const checked=validateRoadmapResult(missing,fixture.source,fixture.context)
    assert.deepEqual(new Set(checked.steps[4].depends_on),new Set(['orders','payments','application']),text)
    assert.deepEqual(missing.steps[4].depends_on,['orders','application'],'validation must not mutate its caller')
    const progress=Object.fromEntries(['prepare','orders','application'].map(id=>[id,{done:true,note:'Im Test bestätigt.'}]))
    assert.equal(roadmapSteps({result:checked,progress})[4].blocked,true,'a missing response still blocks completion')
    progress.payments={done:true,note:'Im Test bestätigt.'}
    assert.equal(roadmapSteps({result:checked,progress})[4].blocked,false)
    assert.deepEqual(validateRoadmapResult(checked,fixture.source,fixture.context),checked,'normalization must be idempotent')
  }
  for(const text of [
    'Keine Antwort aus Schritt 3 nötig.',
    'Antwort aus Schritt 2 oder 3.',
    'Antworten aus Schritten 2 bis 4, außer Schritt 3.',
    'Antwort bis 02.10.2026.',
    'Antwort auf Rechnung 234.',
    'Antworten aus Schritten 2 bis 400.',
    'Réponses des étapes 2 à 4.',
  ]){
    missing.steps[4].waiting_for=text
    assert.deepEqual(validateRoadmapResult(missing,fixture.source,fixture.context).steps[4].depends_on,['orders','application'],'ambiguous or unsupported prose stays with semantic review: '+text)
  }
  for(const text of ['Antworten aus Schritten 2 bis 5.','Replies from steps 2 through 6.']){
    missing.steps[4].waiting_for=text
    assert.throws(()=>validateRoadmapResult(missing,fixture.source,fixture.context),/vorherigen Schritten/,'self/future references must not create a cycle')
  }
  for(const id of ['invoice','deposit','insurance','bilingual']){
    const other=offlineFixtures.find(item=>item.id===id),reply=structuredClone(other.reply)
    reply.steps[1].waiting_for='Response from step 1.'
    reply.steps[1].depends_on=[]
    assert.deepEqual(validateRoadmapResult(reply,other.source,other.context).steps[1].depends_on,[reply.steps[0].id],id+': references are positions, independent of topic and step ID')
  }
}
