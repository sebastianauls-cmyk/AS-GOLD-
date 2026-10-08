import assert from 'node:assert/strict'
import {recordAuthDiagnostic,observeAuthTransport,sessionDiagnosticSnapshot,reportSessionCheckFailure} from '../app/modules/services/authDiagnostics.mjs'

const secret='NEVER_RETAIN_SYNTHETIC_SECRET'
const untrusted={access_token:secret,email:secret}
recordAuthDiagnostic(secret,'#_acquireLock','begin',secret,untrusted)
recordAuthDiagnostic(secret,'#_acquireLock','lock acquired for storage key',secret)
recordAuthDiagnostic(secret,'#_recoverAndRefresh()','begin',untrusted)
recordAuthDiagnostic(secret,`#_callRefreshToken(${secret})`,'begin',untrusted)
recordAuthDiagnostic(secret,'#_notifyAllSubscribers(TOKEN_REFRESHED)','begin',untrusted)
recordAuthDiagnostic(secret,'#_notifyAllSubscribers(TOKEN_REFRESHED)','end',untrusted)
recordAuthDiagnostic(secret,'#_saveSession()',untrusted)
recordAuthDiagnostic(secret,`#_notifyAllSubscribers(${secret})`,'begin',untrusted)
recordAuthDiagnostic(secret,'#_acquireLock','__proto__',untrusted)
recordAuthDiagnostic(secret,null,untrusted)
const response=Response.json({access_token:secret})
const input='https://synthetic.invalid/auth/v1/token?grant_type=refresh_token&unexpected='+secret
const init={method:'POST',body:secret}
assert.equal(await observeAuthTransport(async(url,options)=>{assert.equal(url,input);assert.equal(options,init);return response},input,init,'https://synthetic.invalid'),response)
assert.equal((await response.json()).access_token,secret,'diagnostics never consume or rewrite the response body')
const failure=new Error(secret)
await assert.rejects(observeAuthTransport(async()=>{throw failure},input,init,'https://synthetic.invalid'),e=>e===failure)
const before=sessionDiagnosticSnapshot()
await observeAuthTransport(async()=>response,'https://synthetic.invalid/storage/v1/object/file',init,'https://synthetic.invalid')
await observeAuthTransport(async()=>response,'https://other.invalid/auth/v1/token',init,'https://synthetic.invalid')
assert.deepEqual(sessionDiagnosticSnapshot(),before)
assert.equal(JSON.stringify(before).includes(secret),false)
assert.deepEqual(before.phases.map(entry=>entry.phase),['lock_wait','lock_acquired','recover_begin','refresh_begin','notify_begin_TOKEN_REFRESHED','notify_end_TOKEN_REFRESHED','token_request','token_headers','token_request','token_failure'])
let report
const warn=console.warn
try{console.warn=value=>report=value;reportSessionCheckFailure()}finally{console.warn=warn}
assert.ok(report.startsWith('ASH_SESSION_CHECK_UNAVAILABLE '));assert.equal(report.includes(secret),false)
for(let i=0;i<30;i++)recordAuthDiagnostic(secret,'#_acquireLock','end')
assert.equal(sessionDiagnosticSnapshot().phases.length,20,'diagnostics have a fixed memory bound')
console.log('Auth diagnostics passed: fixed phase labels only, no credentials/URLs/user data, bounded memory, unchanged requests, responses and errors; no network.')
