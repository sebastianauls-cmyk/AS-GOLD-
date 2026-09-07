import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { SYNTHETIC_TESTERS } from '../app/modules/testing/syntheticTesterRegistry.mjs'
import { buildSyntheticCaseDraft, trafficLightForExpectedAmpel } from '../app/modules/testing/syntheticCaseDraft.mjs'
import { CASE_TRAFFIC_LIGHTS, normalizeCasePayload, normalizeTrafficLight } from '../app/modules/cases/casePayload.mjs'
import { createCaseRecord } from '../app/modules/services/workspaceRepository.js'
import { emptyCase } from '../app/modules/workspace/stateConfig.js'

const expectedMapping={
  '🟢':'green',
  '🟡':'yellow',
  '🔴':'red',
  '⚪':'white'
}

assert.ok(APP_RELEASE.number>=128)
assert.match(APP_VERSION,/^V\d+$/)
assert.deepEqual(CASE_TRAFFIC_LIGHTS,['green','yellow','red','white'])

for(const [ampel,trafficLight] of Object.entries(expectedMapping)){
  assert.equal(trafficLightForExpectedAmpel(ampel),trafficLight)
}
assert.equal(trafficLightForExpectedAmpel('nicht definiert'),'yellow')
assert.equal(normalizeTrafficLight('WHITE'),'white')
assert.equal(normalizeTrafficLight('nicht erlaubt'),'yellow')
assert.equal(emptyCase.traffic_light,'yellow')

const caseWorkspace=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
assert.match(caseWorkspace,/traffic_light:item\.traffic_light\|\|'yellow'/,'case editing must preserve the stored traffic light')

for(const tester of SYNTHETIC_TESTERS){
  const draft=buildSyntheticCaseDraft(tester)
  const payload=normalizeCasePayload(draft)
  assert.equal(draft.traffic_light,expectedMapping[tester.expected_ampel],`${tester.id} draft must use the expected traffic light`)
  assert.equal(payload.traffic_light,expectedMapping[tester.expected_ampel],`${tester.id} payload must preserve the expected traffic light`)
}

for(const testerId of ['ST09','ST11','ST12']){
  const tester=SYNTHETIC_TESTERS.find(item=>item.id===testerId)
  assert.equal(buildSyntheticCaseDraft(tester).traffic_light,'white',`${testerId} must remain open instead of being forced to yellow`)
}
assert.equal(buildSyntheticCaseDraft(SYNTHETIC_TESTERS.find(item=>item.id==='ST06')).traffic_light,'red')

const editedMaximumPayload=normalizeCasePayload({
  ...buildSyntheticCaseDraft(SYNTHETIC_TESTERS.find(item=>item.id==='ST12')),
  deadline_at:'2026-09-09T10:00'
})
assert.equal(editedMaximumPayload.traffic_light,'white','editing a maximum case must retain its open status')
assert.ok(editedMaximumPayload.deadline_at?.startsWith('2026-09-09T'),'a valid edited deadline must be normalized for storage')

const regularPayload=normalizeCasePayload({
  title:'Normaler Fall',
  client_id:'',
  reference_no:'',
  goal:'',
  summary:'',
  deadline_at:'',
  next_action:'',
  home_country:'DE',
  target_country:'DE'
})
assert.equal(regularPayload.traffic_light,'yellow','normal cases must retain the safe yellow default')

let inserted=null
const supabase={
  from(table){
    assert.equal(table,'cases')
    return {
      insert(value){
        inserted=value
        return {
          select(){
            return {
              single(){
                return {data:value,error:null}
              }
            }
          }
        }
      }
    }
  }
}

createCaseRecord(supabase,{ownerId:'owner-test',payload:normalizeCasePayload(buildSyntheticCaseDraft(SYNTHETIC_TESTERS.find(item=>item.id==='ST11')))})
assert.equal(inserted.owner_id,'owner-test')
assert.equal(inserted.traffic_light,'white','the repository must not overwrite a synthetic open status with yellow')

createCaseRecord(supabase,{ownerId:'owner-test',payload:{...regularPayload,traffic_light:'invalid'}})
assert.equal(inserted.traffic_light,'yellow','the repository must reject unrecognized traffic lights safely')

console.log('V128 traffic-light guard passed: all four synthetic expectations survive draft, normalization and storage while normal cases stay yellow.')
