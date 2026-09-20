import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { retrySessionClock, loadWorkspaceBundle } from '../app/modules/services/workspaceRepository.js'
import { createClient } from '@supabase/supabase-js'
import { getWorkspaceConnectionCopy } from '../app/modules/auth/workspaceConnectionCopy.mjs'
import { resolveWorkspaceEntry } from '../app/modules/workspace/sessionEntry.mjs'

const clockError={code:'PGRST303',message:'JWT issued at future'}
const member={user:{id:'synthetic-member',email:'member@example.invalid'},access_token:'synthetic-session-only'}
const ready={access:{active:true,status:'approved',app_role:'owner'},upgrades:[]}
const bundle={data:{cases:[{id:'synthetic-case'}]},audit:[],deletionRequests:[],privacy:{}}
const source=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}

function harness(){
  const state={screens:[],messages:[],access:ready,bundle,session:member,authCalls:0,accessCalls:0,sessionReads:0,dataLoads:0,users:[],recovering:false,revision:0}
  const ref={current:{key:null,promise:null}}
  const context={
    getWorkspaceAccess:async()=>{state.accessCalls++;return typeof state.access==='function'?state.access():state.access},
    loadWorkspaceBundle:async()=>{state.dataLoads++;return state.bundle},
    signInSession:async()=>{state.authCalls++;return {data:{session:state.session},error:state.authError}},
    getAuthSession:async()=>{state.sessionReads++;return {data:{session:state.session}}},
    getAuthErrorMessage:()=> 'credential error',getWorkspaceConnectionCopy,
    isPasswordRecoveryActive:()=>state.recovering,passwordRecoveryRevision:()=>state.revision
  }
  vm.createContext(context)
  vm.runInContext(`${source}\nthis.create=createWorkspaceAuthActions`,context)
  const noop=()=>{}
  const actions=context.create({language:'de',pendingMessages:{de:'Approval required'},email:member.user.email,password:'synthetic-password',
    sessionLoadRef:ref,setScreen:v=>state.screens.push(v),setMessage:v=>state.messages.push(v),setUser:v=>state.users.push(v),
    setAccess:noop,setUpgrades:noop,setData:noop,setServerAudit:noop,setDeletionRequests:noop,setPrivacySettings:noop})
  return {state,ref,actions}
}

// Only the identified pre-execution clock rejection is retried; never bad credentials or RLS failures.
for(const error of [clockError,{code:'42501',message:'permission denied'},{code:'PGRST301',message:'JWT expired'},{code:'invalid_credentials',message:'wrong password'}]){
  let attempts=0;const delays=[]
  const result=await retrySessionClock(async()=>{attempts++;return {error}},{delay:async ms=>delays.push(ms)})
  assert.equal(result.error,error)
  assert.equal(attempts,error===clockError?5:1)
  assert.deepEqual(delays,error===clockError?[1000,2000,4000,8000]:[])
}

// Exact SDK PostgREST builders can be awaited again; each failed module is actually re-read.
{
  const counts=new Map()
  const client=createClient('https://synthetic.example.invalid','synthetic-public-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,init)=>{
    const pathname=new URL(url).pathname
    assert.equal(init.method,'GET','bundle retries must stay read-only')
    const count=(counts.get(pathname)||0)+1;counts.set(pathname,count)
    const denied=pathname.endsWith('/cases')&&count===1
    const data=pathname.endsWith('/account_privacy_settings')?{}:[]
    return new Response(JSON.stringify(denied?clockError:data),{status:denied?401:200,headers:{'content-type':'application/json'}})
  }}})
  assert.equal((await loadWorkspaceBundle(client,member.user.id)).error,null)
  assert.equal(counts.get('/rest/v1/cases'),2)
  assert.equal(counts.get('/rest/v1/clients'),1)
}

// The reported incident: password succeeds, access read fails, retry reuses the same session.
{
  const {state,ref,actions}=harness()
  state.access={error:clockError}
  assert.equal(await actions.signIn({preventDefault(){}}),false)
  assert.equal(state.screens.at(-1),'workspace-unavailable')
  assert.equal(state.screens.includes('login'),false)
  assert.equal(state.dataLoads,0)
  assert.equal(ref.current.promise,null,'a failed promise cannot be cached for this token')
  state.access=ready
  assert.equal(await actions.retryWorkspace(),true)
  assert.equal(state.screens.at(-1),'app')
  assert.equal(state.authCalls,1,'retry must not issue another credential request or fresh JWT')
  assert.equal(state.sessionReads,1)
  assert.equal(state.accessCalls,2)
  assert.equal(state.users.length,1)
  assert.doesNotMatch(state.messages.join(' '),/JWT|synthetic-session-only/)
}

// Deduplication remains effective while two SIGNED_IN paths are in flight.
{
  const {state,actions}=harness(),wait=deferred()
  state.access=()=>wait.promise
  const first=actions.loadApp(member),second=actions.loadApp(member)
  assert.equal(first,second)
  wait.resolve(ready)
  assert.equal(await first,true)
  assert.equal(state.accessCalls,1)
}

// An unavailable module cannot be displayed as an empty successful workspace.
// Refocusing after token renewal rechecks access without unmounting a live editor.
{
  const {state,actions}=harness()
  assert.equal(await actions.loadApp(member),true)
  state.screens.length=0
  assert.equal(await actions.loadApp({...member,access_token:'renewed-synthetic-session'}),true)
  assert.deepEqual(state.screens,['app'],'same-user renewal must retain the current editor and its pending result')
  assert.equal(state.accessCalls,2,'access is still verified with the renewed session')
  state.screens.length=0
  assert.equal(await actions.loadApp({user:{id:'different-member'},access_token:'different-synthetic-session'}),true)
  assert.deepEqual(state.screens,['workspace-connecting','app'],'a different account must never inherit the previous workspace')
}
{
  const {state,actions}=harness()
  await actions.loadApp(member)
  state.access={access:{active:false,status:'pending'}}
  assert.equal(await actions.loadApp({...member,access_token:'renewed-but-denied'}),false)
  assert.equal(state.screens.at(-1),'login','preserving the editor must not bypass revoked access')
}

// An unavailable module cannot be displayed as an empty successful workspace.
{
  const {state,actions}=harness()
  state.bundle={...bundle,error:clockError}
  assert.equal(await actions.loadApp(member),false)
  assert.equal(state.screens.at(-1),'workspace-unavailable')
  assert.equal(state.users.length,0)
  state.bundle=bundle
  assert.equal(await actions.retryWorkspace(),true)
}

// Access approval and absence of a valid session still block entry.
{
  const {state,actions}=harness()
  state.access={access:{active:false,status:'pending'}}
  assert.equal(await actions.loadApp(member),false)
  assert.equal(state.screens.at(-1),'login')
  assert.equal(state.dataLoads,0)
  state.session=null
  assert.equal(await actions.retryWorkspace(),false)
  assert.equal(state.screens.at(-1),'login')
  assert.equal(state.accessCalls,1)
}

// A thrown network failure remains recoverable and does not escape as an unhandled rejection.
{
  const {state,actions}=harness()
  state.access=()=>{throw new Error('synthetic network failure')}
  assert.equal(await actions.loadApp(member),false)
  assert.equal(state.screens.at(-1),'workspace-unavailable')
  state.access=ready
  assert.equal(await actions.retryWorkspace(),true)
}

// Late database replies cannot restore a signed-out or recovering workspace.
for(const interrupt of ['signout','recovery']){
  const {state,ref,actions}=harness(),wait=deferred()
  state.access=()=>wait.promise
  const pending=actions.loadApp(member)
  await Promise.resolve()
  if(interrupt==='signout')ref.current={key:null,promise:null}
  else state.revision++
  state.screens.length=0
  wait.resolve(ready)
  assert.equal(await pending,false)
  assert.deepEqual(state.screens,[])
  assert.equal(state.users.length,0)
}

for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const text=getWorkspaceConnectionCopy(language)
  for(const key of ['title','connecting','unavailable','retry','signOut'])assert.ok(text[key],`${language}.${key}`)
  if(language!=='de')assert.notEqual(text.unavailable,getWorkspaceConnectionCopy('de').unavailable)
}
// A signed-in visitor can inspect the permanent public page without an account
// load or a SIGNED_IN listener immediately replacing it with the dashboard.
for(const publicOnly of [true,false]){
  const effects=[],calls={session:0,watch:0,workspace:0,screen:0}
  const sessionSource=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
  const context={
    window:{location:{search:''}},URLSearchParams,
    useRef:value=>({current:value}),useEffect:effect=>effects.push(effect),
    getAuthSession:async()=>{calls.session++;return {data:{session:member}}},
    watchAuthState:()=>{calls.watch++;return {unsubscribe(){}}},
    capturePasswordRecovery(){},clearGuestTestRequest(){},
    isPasswordRecoveryActive:()=>false,isPasswordRecoveryLocation:()=>false,
    isAnonymousTestSession:()=>false,resolveWorkspaceEntry
  }
  vm.createContext(context)
  vm.runInContext(`${sessionSource}\nthis.useSession=useWorkspaceSession`,context)
  context.useSession({supabase:{},publicOnly,loadApp:()=>calls.workspace++,setScreen:()=>calls.screen++})
  effects.forEach(effect=>effect())
  await Promise.resolve();await Promise.resolve()
  assert.deepEqual(calls,publicOnly?{session:0,watch:0,workspace:0,screen:0}:{session:1,watch:1,workspace:1,screen:0})
}
console.log('Workspace recovery passed: bounded SDK read retries, preserved session, retry after failure, no approval bypass, no partial success, concurrent sign-in deduplication, logout/recovery races, public explanation with an existing session and 11 languages.')
