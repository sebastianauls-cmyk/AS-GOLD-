import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'

const surface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
const session=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8')
const controller=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')

assert.ok(Number(APP_VERSION.replace('V',''))>=103)
assert.match(surface,/screen==='request-reset'/)
assert.match(surface,/form onSubmit=\{submitResetRequest\}/)
assert.match(surface,/autoComplete="email" required autoFocus/)
assert.match(surface,/setScreen\('request-reset'\)/)
assert.match(session,/if\(start==='reset'\)return 'request-reset'/)
assert.match(controller,/screen==='request-reset'/)

const resetBranch=surface.slice(surface.indexOf("screen==='request-reset'"),surface.indexOf("}else{",surface.indexOf("screen==='request-reset'")))
assert.doesNotMatch(resetBranch,/PasswordField/)
assert.doesNotMatch(resetBranch,/register/)

console.log('V103 dedicated reset screen guard passed: the direct reset entry contains only email and the reset submit action.')
