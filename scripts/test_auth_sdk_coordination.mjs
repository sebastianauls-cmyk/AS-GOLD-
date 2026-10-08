import assert from 'node:assert/strict'
import { offlineNetworkAttempts } from './offline/noNetwork.mjs'

// Exercise the installed SDK with synthetic storage and transport only. The
// reported browser never granted its first Web Lock, before any HTTP request.
let lockRequests=0
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{
  request(){lockRequests++;return new Promise(()=>{})}
}}})
globalThis.window={location:{href:'https://synthetic-auth.invalid/',hash:'',search:''},addEventListener(){},removeEventListener(){}}
globalThis.document={visibilityState:'hidden',addEventListener(){},removeEventListener(){}}
globalThis.BroadcastChannel=class{addEventListener(){}postMessage(){}close(){}}
const {createClient}=await import('@supabase/supabase-js')
const {createAuthFetch}=await import('../app/modules/services/authTransport.mjs')
const {recordAuthDiagnostic}=await import('../app/modules/services/authDiagnostics.mjs')
const origin='https://synthetic-auth.invalid'
let nextStorageKey=0
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function session(suffix='original',expired=false){
  return {access_token:`synthetic-access-${suffix}`,refresh_token:`synthetic-refresh-${suffix}`,
    token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+(expired?-120:3600),
    user:{id:'synthetic-owner',aud:'authenticated',email:'test@example.invalid'}}
}
async function bounded(promise){
  let timer
  try{return await Promise.race([promise,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error('SDK session operation hung behind a browser lock')),500)
  })])}finally{clearTimeout(timer)}
}
function harness(initial,fetchImpl=async()=>{throw new Error('Unexpected synthetic HTTP request')}){
  const key=`synthetic-sdk-session-${++nextStorageKey}`
  const values=new Map(initial?[[key,JSON.stringify(initial)]]:[])
  const storage={getItem:name=>values.get(name)??null,setItem:(name,value)=>values.set(name,value),removeItem:name=>values.delete(name)}
  const client=createClient(origin,'synthetic-public-key',{
    auth:{storage,storageKey:key,persistSession:true,autoRefreshToken:true,debug:recordAuthDiagnostic},
    global:{fetch:createAuthFetch({supabaseUrl:origin,fetchImpl})}
  })
  return {client,storage,key}
}

try{
  // A stuck browser mutex must not block either an existing or absent session.
  for(const initial of [session(),null]){
    const {client}=harness(initial)
    try{
      const result=await bounded(client.auth.getSession())
      assert.equal(result.error,null)
      assert.equal(result.data.session?.user.id,initial?.user.id)
    }finally{await client.auth.dispose?.()}
  }
  assert.equal(lockRequests,0,'the default SDK path must not request the stalled mutex')

  // Concurrent session reads still deduplicate refresh and keep the real auth
  // transport contract, even while Web Locks are unavailable.
  {
    let refreshes=0
    const next=session('renewed')
    const {client}=harness(session('expired',true),async(url,init)=>{
      assert.equal(new URL(url).pathname,'/auth/v1/token')
      assert.equal(new URL(url).searchParams.get('grant_type'),'refresh_token')
      assert.equal(init.method,'POST');refreshes++
      return Response.json(next)
    })
    try{
      const results=await bounded(Promise.all([client.auth.getSession(),client.auth.getSession()]))
      assert.equal(refreshes,1)
      for(const result of results){assert.equal(result.error,null);assert.equal(result.data.session.access_token,next.access_token)}
    }finally{await client.auth.dispose?.()}
  }

  // A late refresh must not restore a session removed by sign-out in another
  // context, or overwrite the session another context has already renewed.
  for(const replacement of [null,session('other-context')]){
    const started=deferred(),reply=deferred()
    const {client,storage,key}=harness(session(),async url=>{
      assert.equal(new URL(url).pathname,'/auth/v1/token')
      started.resolve();return reply.promise
    })
    try{
      await bounded(client.auth.getSession())
      const pending=client.auth.refreshSession()
      await bounded(started.promise)
      if(replacement)storage.setItem(key,JSON.stringify(replacement))
      else storage.removeItem(key)
      reply.resolve(Response.json(session('late-response')))
      const result=await bounded(pending)
      assert.equal(result.data.session,null)
      assert.equal(result.error?.name,'AuthRefreshDiscardedError')
      assert.equal(storage.getItem(key),replacement?JSON.stringify(replacement):null)
    }finally{await client.auth.dispose?.()}
  }
  assert.equal(lockRequests,0)
  assert.equal(offlineNetworkAttempts.length,0)
  console.log('SDK coordination passed: stalled browser lock, fresh/absent sessions, one concurrent refresh, and no late session overwrite after sign-out or renewal. No network used.')
}catch(error){console.error(error.message);process.exitCode=1}
