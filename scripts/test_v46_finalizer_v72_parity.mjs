import assert from 'node:assert/strict'
import fs from 'node:fs'
const finalizer=fs.readFileSync('scripts/v46_finalize_release_candidate.mjs','utf8')
assert.doesNotMatch(finalizer,/V70|allen 10 App-Sprachen|ten languages/)
assert.match(finalizer,/V72/)
assert.match(finalizer,/allen 11 App-Sprachen einschließlich Vietnamesisch/)
assert.match(finalizer,/eleven languages including Vietnamese/)
assert.ok(finalizer.includes('.length,11)'),'tester translation count must be eleven')
assert.match(finalizer,/WorkspaceAppV2\.js/)
assert.match(finalizer,/useWorkspaceAudit\.js/)
assert.match(finalizer,/useWorkspaceSession\.js/)
assert.match(finalizer,/active workspace controller must delegate audit and auth session lifecycle/)
assert.match(finalizer,/test:v72-vietnamese/)
console.log('V46 V72 finalizer parity guard passed')
