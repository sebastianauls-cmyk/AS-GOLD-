import assert from 'node:assert/strict'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { startAnonymousTestSession } from '../app/modules/services/authRepository.js'

function mockSupabase(session,{sessionError=null,signOutError=null}={}){
  const calls=[]
  const freshSession={user:{id:'fresh-guest',is_anonymous:true}}
  return {
    calls,
    auth:{
      async getSession(){calls.push(['getSession']);return {data:{session},error:sessionError}},
      async signOut(options){calls.push(['signOut',options]);return {error:signOutError}},
      async signInAnonymously(options){calls.push(['signInAnonymously',options]);return {data:{session:freshSession},error:null}}
    }
  }
}

const input={displayName:'Synthetischer Testzugang',privacyNoticeVersion:'privacy-v1',termsVersion:'terms-v1'}

const empty=mockSupabase(null)
assert.equal((await startAnonymousTestSession(empty,input)).data.session.user.id,'fresh-guest')
assert.deepEqual(empty.calls.map(call=>call[0]),['getSession','signInAnonymously'])

const expired=mockSupabase({user:{id:'expired-guest',is_anonymous:true}})
assert.equal((await startAnonymousTestSession(expired,input)).data.session.user.id,'fresh-guest')
assert.deepEqual(expired.calls.map(call=>call[0]),['getSession','signOut','signInAnonymously'])
assert.deepEqual(expired.calls[1][1],{scope:'local'},'only the current anonymous browser session may be ended')

const permanent=mockSupabase({user:{id:'member',is_anonymous:false}})
const permanentResult=await startAnonymousTestSession(permanent,input)
assert.equal(permanentResult.error.code,'permanent_session_active')
assert.deepEqual(permanent.calls.map(call=>call[0]),['getSession'],'a permanent account must never be signed out by guest-test recovery')

const failedSignOut=mockSupabase({user:{id:'expired-guest',is_anonymous:true}},{signOutError:{code:'signout_failed'}})
assert.equal((await startAnonymousTestSession(failedSignOut,input)).error.code,'signout_failed')
assert.deepEqual(failedSignOut.calls.map(call=>call[0]),['getSession','signOut'],'a failed local sign-out must stop before creating another account')

assert.equal(APP_RELEASE.number,118)
assert.equal(APP_VERSION,'V118')

console.log('V118 guest-session restart passed: expired anonymous sessions are replaced locally while permanent accounts remain protected.')
