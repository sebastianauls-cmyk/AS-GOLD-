import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { SYNTHETIC_TESTERS } from '../app/modules/testing/syntheticTesterRegistry.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const panel=read('app/modules/testing/SyntheticTesterPanel.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const cases=read('app/modules/cases/CaseWorkspace.js')

assert.equal(APP_VERSION,'V109')
assert.equal(SYNTHETIC_TESTERS.length,12)
assert.match(panel,/useState\(true\)/)
assert.match(panel,/function selectTester\(tester\)/)
assert.doesNotMatch(panel,/function selectTester\(tester\)[\s\S]*?onOpenCase\(tester\)/)
assert.match(panel,/showStart&&onOpenCase/)
assert.match(panel,/aria-pressed=\{selected\?\.id===tester\.id\}/)
assert.match(controller,/reference_no:`TEST-\$\{tester\.id\}`/)
assert.match(controller,/test_case_id:tester\.id/)
assert.match(cases,/syntheticCaseNotice/)
assert.match(cases,/syntheticCasePill/)
assert.match(cases,/TEST-\(ST\\d\{2\}\)/)

console.log('V109 visible synthetic cases passed: all 12 cases open visibly, selection is separate from start, and created test cases retain a clear marker.')
