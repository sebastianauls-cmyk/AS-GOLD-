import assert from 'node:assert/strict'
import { buildEvidenceActionResult, evidenceActionContract, evidenceConfidence } from '../app/modules/intelligence/evidenceActionLayer.mjs'
import { productModuleByKey } from '../app/modules/workspace/productModuleRegistry.mjs'

const readyRecord={
  status:'ready',
  source_reviewed_at:'2026-09-04T00:00:00Z',
  baseline_checked_at:'2026-09-04T00:00:00Z',
  official_sources:['law1','law2','law3'],
  court_sources:['court1','court2'],
  authority_sources:['authority1','authority2'],
  entry_sources:['entry1'],
  residence_sources:['residence1'],
  entry_requirements_verified:true,
  residence_requirements_verified:true
}
const confidence=evidenceConfidence(readyRecord)
assert.equal(confidence.level,'high')
assert.ok(confidence.score>=80)

const result=buildEvidenceActionResult({
  language:'pl',
  homeCountry:'PL',
  targetCountry:'DE',
  topic:'consumer',
  targetRecord:readyRecord,
  comparisonRows:[{label:'Frist',ampel:'🟢'}],
  nextActions:['Frist prüfen','Unterlagen sichern']
})
assert.equal(result.verified,true)
assert.equal(result.ampel,'🟢')
assert.ok(result.source_provenance.length>0)
assert.ok(result.next_actions.length>0)
assert.equal(result.rules.no_unverified_legal_claims,true)

const incomplete=buildEvidenceActionResult({targetRecord:{status:'setup_required'}})
assert.equal(incomplete.verified,false)
assert.equal(incomplete.ampel,'🔴')
assert.ok(incomplete.gaps.length>0)

const module=productModuleByKey('evidence_action_layer')
assert.ok(module)
assert.equal(module.legal_relevance,false)
assert.equal(evidenceActionContract().version,'v93')
console.log('V93 evidence action layer guard passed.')
