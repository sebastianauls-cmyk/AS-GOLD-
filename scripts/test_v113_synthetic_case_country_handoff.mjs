import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { buildSyntheticCaseDraft } from '../app/modules/testing/syntheticCaseDraft.mjs'
import { SYNTHETIC_TESTERS } from '../app/modules/testing/syntheticTesterRegistry.mjs'

assert.ok(APP_RELEASE.number>=113,'synthetic country handoff requires release V113 or newer')

for(const tester of SYNTHETIC_TESTERS){
  const draft=buildSyntheticCaseDraft(tester)
  assert.equal(draft.home_country,tester.home_country,`${tester.id} must keep its home country`)
  assert.equal(draft.target_country,tester.target_country,`${tester.id} must keep its target country`)
  assert.equal(draft.test_case_id,tester.id,`${tester.id} must keep its synthetic marker`)
  assert.equal(draft.test_case_language,tester.language,`${tester.id} must keep its output language`)
}

const controller=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')
assert.match(controller,/setNewCase\(\{\.\.\.emptyCase,\.\.\.buildSyntheticCaseDraft\(tester\)\}\)/)

console.log(`${APP_VERSION} synthetic-case handoff passed: all ${SYNTHETIC_TESTERS.length} test cases keep language, home country, target country and test marker.`)
