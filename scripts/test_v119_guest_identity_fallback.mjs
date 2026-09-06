import assert from 'node:assert/strict'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { isAnonymousTestSession } from '../app/modules/auth/sessionIdentity.mjs'
import { resolveWorkspaceEntry } from '../app/modules/workspace/sessionEntry.mjs'
import { startAnonymousTestSession } from '../app/modules/services/authRepository.js'

function mockSupabase(session){
  const calls=[]
  return {
    calls,
    auth:{
      async getSession(){calls.push('getSession');return {data:{session},error:null}},
      async signOut(options){calls.push(['signOut',options]);return {error:null}},
      async signInAnonymously(){calls.push('signInAnonymously');return {data:{session:{user:{id:'fresh-guest',is_anonymous:true}}},error:null}}
    }
  }
}

const explicitAnonymous={user:{id:'guest-1',is_anonymous:true}}
const compatibleAnonymous={user:{id:'guest-2',user_metadata:{test_data_only:true}}}
const permanentMember={user:{id:'member',email:'tester@example.invalid',user_metadata:{test_data_only:true}}}

assert.equal(isAnonymousTestSession(explicitAnonymous),true)
assert.equal(isAnonymousTestSession(compatibleAnonymous),true)
assert.equal(isAnonymousTestSession(permanentMember),false)
assert.equal(isAnonymousTestSession(null),false)

assert.deepEqual(resolveWorkspaceEntry(compatibleAnonymous,'guest-test'),{kind:'guest-test'})
const compatibleClient=mockSupabase(compatibleAnonymous)
const compatibleResult=await startAnonymousTestSession(compatibleClient,{displayName:'Synthetic',privacyNoticeVersion:'p1',termsVersion:'t1'})
assert.equal(compatibleResult.data.session.user.id,'fresh-guest')
assert.deepEqual(compatibleClient.calls,['getSession',['signOut',{scope:'local'}],'signInAnonymously'])

const memberClient=mockSupabase(permanentMember)
const memberResult=await startAnonymousTestSession(memberClient,{displayName:'Synthetic',privacyNoticeVersion:'p1',termsVersion:'t1'})
assert.equal(memberResult.error.code,'permanent_session_active')
assert.deepEqual(memberClient.calls,['getSession'])

assert.ok(APP_RELEASE.number>=119)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

console.log('V119 guest identity fallback passed: real anonymous-session shapes restart while permanent accounts remain protected.')
