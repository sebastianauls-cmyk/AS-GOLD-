import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { clearGuestTestRequest, isGuestTestRequest } from '../app/modules/auth/guestTestRequest.mjs'

const location={href:'https://app.example/?start=guest-test&lang=de#top',search:'?start=guest-test&lang=de'}
let replacement=''
const history={replaceState(_state,_title,url){replacement=url}}

assert.equal(isGuestTestRequest(location),true)
assert.equal(clearGuestTestRequest({location,history}),true)
assert.equal(replacement,'/?lang=de#top')
assert.equal(isGuestTestRequest({href:'https://app.example/',search:''}),false)

const sessionHook=readFileSync(new URL('../app/modules/workspace/useWorkspaceSession.js',import.meta.url),'utf8')
const workflow=readFileSync(new URL('../app/modules/auth/workspaceAuthWorkflow.js',import.meta.url),'utf8')
assert.match(sessionHook,/isGuestTestRequest\(\)&&isAnonymousTestSession\(session\)/,'restored anonymous SIGNED_IN events must defer to the explicit guest restart')
assert.match(workflow,/clearGuestTestRequest\(\)\s*\n\s*return loadApp\(authData\.session\)/,'only the fresh guest session clears the request before loading')

assert.ok(APP_RELEASE.number>=120)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

console.log('V120 guest-start race passed: restored anonymous sessions cannot consume the restart request before a fresh guest session exists.')
