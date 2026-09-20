import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import * as recovery from '../app/modules/auth/passwordRecoveryFlow.mjs'
import { resolveWorkspaceEntry } from '../app/modules/workspace/sessionEntry.mjs'
import { isAnonymousTestSession } from '../app/modules/auth/sessionIdentity.mjs'
import { passwordRecoveryUi } from '../app/modules/auth/passwordUi.js'

const member={user:{id:'synthetic-member',email:'member@example.invalid',is_anonymous:false}}
const guest={user:{id:'synthetic-guest',is_anonymous:true}}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0))
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}

function fakeBrowser(href){
  let url=new URL(href)
  return {get location(){return url},history:{state:null,replaceState(_state,_title,next){url=new URL(next,url)}}}
}

function loadModule(path,context,exportName){
  const source=fs.readFileSync(path,'utf8').replace(/^import .*$/gm,'').replaceAll('export function ','function ')
  vm.createContext(context)
  vm.runInContext(`${source}\nthis.result=${exportName};`,context)
  return context.result
}

function recoveryBindings(browser){
  return {...recovery,
    capturePasswordRecovery:()=>recovery.capturePasswordRecovery(browser),
    enterPasswordRecovery:()=>recovery.enterPasswordRecovery(browser),
    finishPasswordRecovery:()=>recovery.finishPasswordRecovery(browser)}
}

function mountSession({url='https://app.example/',captured=false}={}){
  recovery.finishPasswordRecovery(null)
  const browser=fakeBrowser(url)
  if(captured){
    recovery.capturePasswordRecovery(browser)
    browser.history.replaceState(null,'','/') // The SDK has consumed the callback hash.
  }
  const initial=deferred(),effects=[],screens=[],loads=[]
  let notify
  const hook=loadModule('app/modules/workspace/useWorkspaceSession.js',{
    ...recoveryBindings(browser),window:browser,URLSearchParams,
    useRef:value=>({current:value}),useEffect:callback=>effects.push(callback),
    getAuthSession:()=>initial.promise,
    watchAuthState:(_,callback)=>{notify=callback;return {unsubscribe(){}}},
    resolveWorkspaceEntry,isAnonymousTestSession,
    isGuestTestRequest:()=>false,clearGuestTestRequest(){},
    setTimeout,clearTimeout,setInterval,clearInterval
  },'useWorkspaceSession')
  hook({supabase:{},loadApp:session=>{loads.push(session);screens.push('workspace')},setScreen:screen=>screens.push(screen),
    onPasswordRecovery:()=>screens.push('recovery'),onPasswordRecoveryError:()=>screens.push('invalid-recovery'),onSignedOut:()=>screens.push('signed-out')})
  const cleanups=effects.map(run=>run()).filter(Boolean)
  return {browser,initial,screens,loads,notify:(...args)=>notify(...args),close:()=>cleanups.forEach(cleanup=>cleanup())}
}

// The exact reported race: a late initial-session result overwrote recovery.
{
  const h=mountSession()
  h.notify('PASSWORD_RECOVERY',member)
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  h.notify('SIGNED_IN',member)
  assert.equal(h.screens.at(-1),'recovery')
  assert.equal(h.loads.length,0,'initial and later sign-in events cannot start the workspace during recovery')
  assert.equal(h.browser.location.search,'?start=recovery','retain non-secret intent for reloads')
  h.close()
}

// Recovery can be initialized before React subscribes to SDK events.
{
  const h=mountSession({url:'https://app.example/#type=recovery',captured:true})
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  assert.equal(h.screens.at(-1),'recovery')
  assert.equal(h.loads.length,0,'clearing the hash before mount cannot lose recovery intent')
  h.close()
}

// Reloading the cleaned callback URL must preserve recovery.
{
  const h=mountSession({url:'https://app.example/?start=recovery'})
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  assert.equal(h.screens.at(-1),'recovery')
  h.close()
}
{
  const h=mountSession()
  h.notify('PASSWORD_RECOVERY',member)
  h.notify('SIGNED_OUT',null)
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  assert.equal(h.screens.at(-1),'invalid-recovery','a late session snapshot cannot revive an expired recovery session')
  assert.equal(h.loads.length,0)
  h.close()
}

for(const session of [null,guest]){
  const h=mountSession({url:'https://app.example/?start=recovery'})
  h.initial.resolve({data:{session},error:null})
  await tick()
  assert.equal(h.screens.at(-1),'invalid-recovery')
  assert.equal(h.loads.length,0,'a routing marker cannot authorize a user or enable password recovery for an anonymous session')
  h.close()
}
{
  const h=mountSession({url:'https://app.example/?start=recovery'})
  h.initial.reject(new Error('synthetic transport failure'))
  await tick()
  assert.equal(h.screens.at(-1),'invalid-recovery')
  h.close()
}
{
  const h=mountSession({url:'https://app.example/?start=recovery'})
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  h.notify('SIGNED_OUT',null)
  assert.equal(h.screens.at(-1),'invalid-recovery')
  assert.ok(h.screens.includes('signed-out'),'clear workspace data if a recovery session expires')
  h.close()
}
{
  const h=mountSession()
  h.initial.resolve({data:{session:member},error:null})
  await tick()
  assert.equal(h.screens.at(-1),'workspace','ordinary authenticated entry remains available')
  h.close()
}

// Verify capture occurs before the real production wrapper constructs the SDK.
{
  recovery.finishPasswordRecovery(null)
  const browser=fakeBrowser('https://app.example/#type=recovery')
  let capturedBeforeClient=false
  const source=fs.readFileSync('app/modules/services/supabaseClient.js','utf8').replace(/^import .*$/gm,'').replace('export const supabase','const supabase')
  const context={capturePasswordRecovery:()=>recovery.capturePasswordRecovery(browser),SUPABASE_PUBLISHABLE_KEY:'synthetic-public-key',SUPABASE_URL:'https://app.example',
    createClient:()=>{capturedBeforeClient=recovery.isPasswordRecoveryActive();return {}}}
  vm.createContext(context);vm.runInContext(source,context)
  assert.equal(capturedBeforeClient,true)
}

function workspaceActions({access,updateError=null}={}){
  const screens=[],messages=[]
  const browser=fakeBrowser('https://app.example/?start=recovery')
  const noOp=()=>{}
  const context={...recoveryBindings(browser),
    getWorkspaceAccess:()=>access||Promise.resolve({access:{active:true,status:'approved'},upgrades:[]}),
    loadWorkspaceBundle:async()=>({data:{},audit:[],deletionRequests:[],privacy:{}}),
    updatePassword:async()=>({error:updateError}),getAuthSession:async()=>({data:{session:member}}),
    getAuthErrorMessage:()=> 'synthetic update error'}
  const create=loadModule('app/modules/auth/workspaceAuthWorkflow.js',context,'createWorkspaceAuthActions')
  const actions=create({supabase:{},language:'de',pendingMessages:{de:'pending'},recoveryCopy:passwordRecoveryUi.de,
    password:'Synthetic only!42',password2:'Synthetic only!42',validatePassword:()=>({valid:true}),
    setMessage:value=>messages.push(value),setScreen:value=>screens.push(value),sessionLoadRef:{current:{key:null,promise:null}},
    setAccess:noOp,setUpgrades:noOp,setData:noOp,setServerAudit:noOp,setDeletionRequests:noOp,setPrivacySettings:noOp,setUser:noOp,setPassword:noOp,setPassword2:noOp})
  return {actions,screens,messages}
}

// An already-running workspace request must not overwrite a new recovery screen,
// even when the user completes recovery before that stale request resolves.
for(const completeBeforeResponse of [false,true]){
  recovery.finishPasswordRecovery(null)
  const response=deferred(),h=workspaceActions({access:response.promise})
  const pending=h.actions.loadApp(member)
  recovery.enterPasswordRecovery(null)
  if(completeBeforeResponse)recovery.finishPasswordRecovery(null)
  response.resolve({access:{active:false,status:'pending'}})
  assert.equal(await pending,false)
  assert.deepEqual(h.screens,[],'stale access checks cannot replace recovery or its completion')
}
{
  recovery.enterPasswordRecovery(null)
  const h=workspaceActions({updateError:{code:'synthetic-failure'}})
  assert.equal(await h.actions.completePasswordRecovery({preventDefault(){}}),false)
  assert.equal(recovery.isPasswordRecoveryActive(),true,'failed password updates must retain the recovery form')
  assert.deepEqual(h.screens,[])
}
{
  recovery.enterPasswordRecovery(null)
  const h=workspaceActions()
  assert.equal(await h.actions.completePasswordRecovery({preventDefault(){}}),true)
  assert.equal(recovery.isPasswordRecoveryActive(),false)
  assert.equal(h.screens.at(-1),'app','only a successful password update may continue to the normal access check')
  assert.equal(h.messages.at(-1),passwordRecoveryUi.de.updated)
}
{
  const browser=fakeBrowser('https://app.example/?start=recovery&lang=de#top')
  recovery.enterPasswordRecovery(browser)
  recovery.finishPasswordRecovery(browser)
  assert.equal(browser.location.search,'?lang=de')
  assert.equal(browser.location.hash,'#top')
  assert.equal(recovery.isPasswordRecoveryActive(),false)
}
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])assert.ok(passwordRecoveryUi[language].invalid.length>20)
console.log('Password recovery routing passed: callback initialization, event races, reloads, expired sessions, stale workspace requests and completion are covered.')
