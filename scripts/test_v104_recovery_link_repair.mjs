import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repairRecoveryUrl} from '../app/modules/auth/recoveryLinkRepair.mjs'
import {APP_VERSION} from '../app/modules/release/appRelease.mjs'

assert.equal(APP_VERSION,'V104')

const source='http://localhost:3000/#access_token=secret-access&refresh_token=secret-refresh&type=recovery&expires_in=3600'
const result=repairRecoveryUrl(source)
assert.equal(result.ok,true)
assert.match(result.url,/^https:\/\/app-gold-workspace\.vercel\.app\/\?release=V104#access_token=/)
assert.match(result.url,/refresh_token=secret-refresh/)
assert.equal(repairRecoveryUrl('https://attacker.example/#access_token=x&refresh_token=y&type=recovery').ok,false)
assert.equal(repairRecoveryUrl('http://localhost:3000/#type=recovery').ok,false)

const page=fs.readFileSync(new URL('../app/reset-reparatur/page.js',import.meta.url),'utf8')
assert.match(page,/navigator\.clipboard\.readText\(\)/)
assert.match(page,/repairRecoveryUrl\(rawLink\)/)
assert.doesNotMatch(page,/fetch\(/)
assert.match(page,/ausschließlich in diesem Browser verarbeitet/)

console.log('V104 recovery link repair guard passed: localhost recovery sessions are validated and repaired entirely in the browser.')
