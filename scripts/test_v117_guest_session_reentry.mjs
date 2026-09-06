import assert from 'node:assert/strict'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { resolveWorkspaceEntry } from '../app/modules/workspace/sessionEntry.mjs'

const expiredAnonymousSession={user:{id:'expired-guest',is_anonymous:true}}
const permanentSession={user:{id:'member',is_anonymous:false}}

assert.deepEqual(
  resolveWorkspaceEntry(expiredAnonymousSession,'guest-test'),
  {kind:'guest-test'},
  'an explicit guest-test request must replace an existing anonymous browser session'
)
assert.deepEqual(
  resolveWorkspaceEntry(permanentSession,'guest-test'),
  {kind:'session'},
  'an explicit guest-test request must not replace a permanent signed-in account'
)
assert.deepEqual(resolveWorkspaceEntry(null,'guest-test'),{kind:'screen',screen:'guest-test'})
assert.deepEqual(resolveWorkspaceEntry(null,'register'),{kind:'screen',screen:'register'})
assert.deepEqual(resolveWorkspaceEntry(permanentSession,'public'),{kind:'session'})
assert.ok(APP_RELEASE.number>=117)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

console.log('V117 guest-session re-entry passed: expired anonymous sessions can start a fresh test while permanent sessions remain protected.')
