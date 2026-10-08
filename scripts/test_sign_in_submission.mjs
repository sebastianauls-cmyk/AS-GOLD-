import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { getAuthErrorMessage } from '../app/modules/auth/authMessages.mjs'

const source=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
const member={user:{id:'synthetic-member'},access_token:'synthetic-session-only'}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}
const event=(email='autofilled@example.invalid',password='synthetic-filled-password')=>({preventDefault(){},currentTarget:{elements:{namedItem:name=>({value:name==='email'?email:password})}}})
function harness(){
  const state={calls:[],statuses:[],messages:[],screens:[],users:[],response:{data:{session:null},error:{code:'invalid_credentials'}},access:{access:{active:true,status:'approved'},upgrades:[]},accessCalls:0}
  const ref={current:null}
  const context={
    signInSession:async(_client,credentials)=>{state.calls.push(credentials);return await state.response},
    getAuthErrorMessage,getWorkspaceConnectionCopy:()=>({unavailable:'Workspace unavailable'}),
    getWorkspaceAccess:async()=>{state.accessCalls++;return state.access},
    loadWorkspaceBundle:async()=>({data:{cases:[]},audit:[],deletionRequests:[],privacy:{}}),
    isPasswordRecoveryActive:()=>false,passwordRecoveryRevision:()=>0
  }
  vm.createContext(context)
  vm.runInContext(`${source}\nthis.create=createWorkspaceAuthActions`,context)
  const noop=()=>{}
  const options={language:'de',pendingMessages:{de:'Approval required'},email:'stale@example.invalid',password:'synthetic-stale-password',
    signInAttemptRef:ref,sessionLoadRef:{current:null},setSignInStatus:v=>state.statuses.push(v),
    setMessage:v=>state.messages.push(v),setScreen:v=>state.screens.push(v),setUser:v=>state.users.push(v),
    setAccess:noop,setUpgrades:noop,setData:noop,setServerAudit:noop,setDeletionRequests:noop,setPrivacySettings:noop}
  return {state,ref,actions:context.create(options),rerender:()=>context.create(options)}
}

const failures=[]
let passed=0
async function check(name,run){try{await run();passed++;console.log(`PASS ${name}`)}catch(error){failures.push(name);console.error(`FAIL ${name}: ${error.message}`)}}

await check('submitted fields override stale controlled state, email trimmed and password unchanged',async()=>{
  const {state,actions}=harness()
  await actions.signIn(event(' filled@example.invalid ',' synthetic-filled-password '))
  assert.equal(state.calls[0].email,'filled@example.invalid')
  assert.equal(state.calls[0].password,' synthetic-filled-password ')
})
await check('a cleared form never falls back to old credentials',async()=>{
  const {state,actions}=harness()
  await actions.signIn(event('',''))
  assert.equal(state.calls.length,0)
  assert.equal(state.screens.includes('app'),false)
})
await check('pending feedback is immediate and a rerender cannot send a second request',async()=>{
  const {state,actions,rerender}=harness(),wait=deferred()
  state.response=wait.promise
  const first=actions.signIn(event())
  const second=rerender().signIn(event())
  const during={calls:state.calls.length,status:state.statuses.at(-1)}
  wait.resolve({data:{session:null},error:{code:'invalid_credentials'}})
  await Promise.all([first,second])
  assert.equal(during.status,'submitting')
  assert.equal(during.calls,1)
  assert.equal(state.statuses.at(-1),'idle')
})
await check('a failed attempt allows one deliberate retry',async()=>{
  const {state,actions,ref}=harness()
  assert.equal(await actions.signIn(event()),false)
  assert.equal(ref.current,null)
  assert.equal(await actions.signIn(event()),false)
  assert.equal(state.calls.length,2)
  assert.match(state.messages.at(-1),/nicht korrekt/)
  assert.equal(state.accessCalls,0)
})
await check('a thrown SDK error clears pending state and does not grant access',async()=>{
  const {state,actions,ref}=harness(),wait=deferred()
  state.response=wait.promise
  const pending=actions.signIn(event())
  wait.reject(new Error('synthetic failure'))
  assert.equal(await pending,false)
  assert.equal(ref.current,null)
  assert.equal(state.statuses.at(-1),'idle')
  assert.equal(state.accessCalls,0)
  assert.match(state.messages.at(-1),/nicht erreichbar/)
})
await check('missing authenticated user cannot enter the workspace',async()=>{
  const {state,actions}=harness()
  state.response={data:{session:{}},error:null}
  assert.equal(await actions.signIn(event()),false)
  assert.equal(state.accessCalls,0)
  assert.equal(state.users.length,0)
})
await check('valid authentication still requires approved workspace access',async()=>{
  const {state,actions}=harness()
  state.response={data:{session:member},error:null}
  state.access={access:{active:false,status:'pending'}}
  assert.equal(await actions.signIn(event()),false)
  assert.equal(state.screens.at(-1),'workspace-denied')
  assert.equal(state.users.length,0)
})
await check('successful authentication and data loading finish at the real workspace gate',async()=>{
  const {state,actions}=harness()
  state.response={data:{session:member},error:null}
  assert.equal(await actions.signIn(event()),true)
  assert.equal(state.screens.at(-1),'app')
  assert.equal(state.users.length,1)
  assert.equal(state.statuses.at(-1),'idle')
  assert.doesNotMatch(state.messages.join(' '),/synthetic-|example.invalid/)
})
console.log(`${passed} passed; ${failures.length} failed. Synthetic workflow checks, not a live sign-in.`)
if(failures.length)process.exitCode=1
