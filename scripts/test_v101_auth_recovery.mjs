import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getAuthErrorMessage } from '../app/modules/auth/authMessages.mjs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'

const workflow=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8')
const controller=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const languages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']

assert.ok(Number(APP_VERSION.slice(1))>=101,'V101 auth recovery must remain active in later releases')
for(const language of languages){
  const message=getAuthErrorMessage({code:'invalid_credentials'},language)
  assert.ok(message.length>25,`${language}: invalid-credentials guidance is missing`)
  assert.doesNotMatch(message,/Invalid login credentials/i,`${language}: raw Supabase message must not leak into the UI`)
  assert.ok(getAuthErrorMessage({code:'email_not_confirmed'},language).length>20,`${language}: email confirmation guidance is missing`)
  assert.ok(getAuthErrorMessage({code:'over_request_rate_limit'},language).length>20,`${language}: rate-limit guidance is missing`)
  assert.ok(getAuthErrorMessage({code:'unknown'},language).length>20,`${language}: generic auth guidance is missing`)
}
assert.match(workflow,/getAuthErrorMessage\(error,language\)/)
assert.equal((workflow.match(/AUTH_REDIRECT_URL/g)||[]).length,3,'registration and password reset must use one production redirect')
const navigation=controller.match(/const navigateToScreen=(nextScreen=>\{[\s\S]*?\n  \})/)?.[1]
assert.ok(navigation,'the shared public/auth navigation handler must remain available')
const events=[]
const navigate=new Function('publicCaseStart','setMessage','setScreen',`return (${navigation})`)(
  {current:{cancel:()=>events.push(['cancel'])}},
  value=>events.push(['message',value]),
  value=>events.push(['screen',value])
)
for(const screen of ['login','register','request-reset','public']){
  events.length=0
  navigate(screen)
  assert.deepEqual(events.slice(-2),[['message',''],['screen',screen]],'navigation clears stale feedback before changing screen')
  assert.equal(events.some(([kind])=>kind==='cancel'),screen==='public','only abandoning the auth flow discards the pending choices')
}
assert.equal((controller.match(/setScreen=\{navigateToScreen\}/g)||[]).length,2,'public and auth navigation must both clear stale messages')
console.log('V101 auth recovery guard passed: localized errors, clean screen changes and production-safe reset redirects are active in 11 languages.')
