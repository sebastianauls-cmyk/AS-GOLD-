import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { isAllowedResetOrigin } from '../app/api/auth/password-reset/route.js'

const repository=fs.readFileSync('app/modules/services/authRepository.js','utf8')
const route=fs.readFileSync('app/api/auth/password-reset/route.js','utf8')

assert.equal(APP_VERSION,'V102')
assert.equal(isAllowedResetOrigin('https://app-gold-workspace.vercel.app'),true)
assert.equal(isAllowedResetOrigin('http://localhost:3000'),true)
assert.equal(isAllowedResetOrigin('https://example.com'),false)
assert.match(repository,/fetch\(`\$\{AUTH_REDIRECT_URL\}\/api\/auth\/password-reset`/)
assert.match(repository,/reset_delivery_failed/)
assert.match(route,/resetPasswordForEmail\(email,\{redirectTo:AUTH_REDIRECT_URL\}\)/)
assert.match(route,/origin_not_allowed/)
assert.doesNotMatch(route,/body\?\.redirectTo/)

console.log('V102 password reset delivery guard passed: the installed app uses the production relay with a fixed redirect and restricted origins.')
