import assert from 'node:assert/strict'
import fs from 'node:fs'
import {inspectRecoveryLink} from '../app/modules/auth/recoveryLinkRepair.mjs'
import {APP_VERSION} from '../app/modules/release/appRelease.mjs'

assert.equal(APP_VERSION,'V105')

const emailLink='https://bcvggtnvuesaihqvgisg.supabase.co/auth/v1/verify?token=hashed-recovery-token&type=recovery&redirect_to=http%3A%2F%2Flocalhost%3A3000'
const inspected=inspectRecoveryLink(emailLink)
assert.deepEqual(inspected,{ok:true,kind:'token_hash',tokenHash:'hashed-recovery-token'})

assert.equal(inspectRecoveryLink('https://attacker.example/auth/v1/verify?token=x&type=recovery').ok,false)
assert.equal(inspectRecoveryLink('https://bcvggtnvuesaihqvgisg.supabase.co/auth/v1/verify?token=x&type=signup').ok,false)

const page=fs.readFileSync(new URL('../app/reset-reparatur/page.js',import.meta.url),'utf8')
assert.match(page,/verifyOtp\(\{token_hash:result\.tokenHash,type:'recovery'\}\)/)
assert.match(page,/Reset password/)
assert.doesNotMatch(page,/fetch\(/)

console.log('V105 email recovery guard passed: copied Supabase recovery links are validated and exchanged directly in the browser.')
