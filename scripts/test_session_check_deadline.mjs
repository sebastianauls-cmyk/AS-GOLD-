import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {resolveWorkspaceEntry} from '../app/modules/workspace/sessionEntry.mjs'
import {getSessionCheckCopy} from '../app/modules/auth/sessionCheckCopy.mjs'

// Run the actual session hook with a controllable clock and SDK responses.
// No service credentials, network requests or simulated signed-in browser.
const member={user:{id:'synthetic-member',is_anonymous:false}}
const source=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
const tick=async()=>{await Promise.resolve();await Promise.resolve()}
function mount({publicOnly=false,recovery=false}={}){
  let resolve,reject,notify,unsubscribed=false,now=0,nextId=0
  const initial=new Promise((yes,no)=>{resolve=yes;reject=no})
  const effects=[],screens=[],loads=[],timers=new Map()
  const context={
    useRef:value=>({current:value}),useEffect:effect=>effects.push(effect),
    window:{location:{search:''}},URLSearchParams,
    getAuthSession:()=>initial,watchAuthState:(_,callback)=>{notify=callback;return {unsubscribe(){unsubscribed=true}}},
    resolveWorkspaceEntry,isAnonymousTestSession:()=>false,
    capturePasswordRecovery(){},enterPasswordRecovery(){recovery=true},
    isPasswordRecoveryActive:()=>recovery,isPasswordRecoveryLocation:()=>false,
    isGuestTestRequest:()=>false,clearGuestTestRequest(){},
    setTimeout(callback,ms){const id=++nextId;timers.set(id,{callback,at:now+ms});return id},
    clearTimeout:id=>timers.delete(id),setInterval(){throw new Error('No guest timer expected')},clearInterval(){}
  }
  vm.createContext(context);vm.runInContext(source+'\nthis.hook=useWorkspaceSession',context)
  context.hook({supabase:{},publicOnly,loadApp:session=>loads.push(session),setScreen:value=>screens.push(value),
    onPasswordRecovery:()=>screens.push('recovery'),onPasswordRecoveryError:()=>screens.push('invalid-recovery'),onSignedOut:()=>screens.push('signed-out')})
  const cleanups=effects.map(effect=>effect()).filter(Boolean)
  return {screens,loads,resolve,reject,notify:(...args)=>notify(...args),timers,
    advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.callback()}},
    close(){cleanups.forEach(fn=>fn());assert.equal(unsubscribed,!publicOnly)}}
}

{
  const h=mount();h.advance(19_999);assert.deepEqual(h.screens,[])
  h.advance(1);assert.deepEqual(h.screens,['session-unavailable'],'an unanswered initial session must stop waiting after 20 seconds')
  assert.equal(h.loads.length,0,'timeout must never open a protected workspace')
  h.resolve({data:{session:member},error:null});await tick()
  h.notify('SIGNED_IN',member);h.notify('PASSWORD_RECOVERY',member)
  assert.deepEqual(h.screens,['session-unavailable'],'late results cannot replace the error screen after the check has expired')
  assert.equal(h.loads.length,0);h.close();assert.equal(h.timers.size,0)
}
for(const fail of [h=>h.reject(new Error('synthetic network failure')),h=>h.resolve({data:{session:null},error:{code:'synthetic-unavailable'}})]){
  const h=mount();fail(h);await tick();assert.deepEqual(h.screens,['session-unavailable']);assert.equal(h.loads.length,0);assert.equal(h.timers.size,0);h.close()
}
for(const session of [null,member]){
  const h=mount();h.resolve({data:{session},error:null});await tick();h.advance(60_000)
  assert.deepEqual(h.screens,session?[]:['public']);assert.equal(h.loads.length,session?1:0);assert.equal(h.timers.size,0);h.close()
}
for(const event of ['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY']){
  const h=mount();h.notify(event,event==='SIGNED_OUT'?null:member);h.advance(60_000)
  assert.equal(h.screens.includes('session-unavailable'),false,`${event} must cancel the initial deadline`)
  assert.equal(h.timers.size,0);h.close()
}
{
  const h=mount({recovery:true});h.reject(new Error('synthetic failure'));await tick()
  assert.deepEqual(h.screens,['invalid-recovery']);assert.equal(h.loads.length,0);h.close()
}
{
  const h=mount();h.close();h.advance(60_000);h.resolve({data:{session:member}});await tick()
  assert.deepEqual(h.screens,[]);assert.equal(h.loads.length,0);assert.equal(h.timers.size,0)
}
{
  const h=mount({publicOnly:true});h.advance(60_000);assert.deepEqual(h.screens,[]);assert.equal(h.timers.size,0);h.close()
}
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const copy=getSessionCheckCopy(language)
  assert.ok(copy.unavailable&&copy.retry)
  if(language!=='de')assert.notEqual(copy.unavailable,getSessionCheckCopy('de').unavailable)
}
console.log('Session check: 20-second deadline, unavailable responses, late-result rejection, valid/absent sessions, auth/recovery events, cleanup and 11 languages passed. No network or model calls.')
