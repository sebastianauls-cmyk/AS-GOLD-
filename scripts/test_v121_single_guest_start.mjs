import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const hook=readFileSync(new URL('../app/modules/workspace/useWorkspaceSession.js',import.meta.url),'utf8')
const controller=readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')

assert.match(hook,/if\(isGuestTestRequest\(\)&&isAnonymousTestSession\(session\)\)return/,'restored and newly created guest SIGNED_IN events must not schedule another guest start')
assert.match(hook,/if\(event==='SIGNED_OUT'\)\{\s*if\(isGuestTestRequest\(\)\)return/,'the intentional local guest sign-out must not reset the controller mid-replacement')
assert.match(controller,/if\(guestStartAttempted\.current\)return\s*guestStartAttempted\.current=true\s*startGuestTest\(\)/,'the controller must keep a single in-flight guest start')

assert.equal(APP_RELEASE.number,121)
assert.equal(APP_VERSION,'V121')

console.log('V121 single guest start passed: auth events cannot trigger a duplicate anonymous account during guest replacement.')
