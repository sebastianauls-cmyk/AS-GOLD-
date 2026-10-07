import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import {createClient} from '@supabase/supabase-js'
import {createAuthFetch,PASSWORD_SIGN_IN_TIMEOUT_MS} from '../app/modules/services/authTransport.mjs'
import {getAuthErrorMessage} from '../app/modules/auth/authMessages.mjs'
import {offlineNetworkAttempts} from './offline/noNetwork.mjs'

const origin='https://synthetic-auth.invalid'
const tokenUrl=origin+'/auth/v1/token?grant_type=password'
const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const post={method:'POST',headers:{'content-type':'application/json'},body:'{"synthetic":true}'}
const ok=()=>Response.json({access_token:'synthetic-only',user:{id:'synthetic-owner'}})

test('deadline aborts one stalled request; a later attempt can succeed',async()=>{
  let calls=0,signal
  const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:20,fetchImpl:async(_input,init)=>{
    calls++;signal=init.signal
    if(calls===2)return ok()
    return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))
  }})
  await assert.rejects(fetch(tokenUrl,post),{name:'AbortError'})
  assert.equal(calls,1);assert.equal(signal.aborted,true)
  assert.equal((await (await fetch(tokenUrl,post)).json()).user.id,'synthetic-owner')
  assert.equal(calls,2)
})

test('deadline also covers stalled response bodies',async()=>{
  let signal
  const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:20,fetchImpl:async(_input,init)=>{
    signal=init.signal
    return new Response(new ReadableStream({start(controller){
      signal.addEventListener('abort',()=>controller.error(signal.reason),{once:true})
    }}),{headers:{'content-type':'application/json'}})
  }})
  await assert.rejects(fetch(tokenUrl,post),{name:'AbortError'})
  assert.equal(signal.aborted,true)
})

test('late response from a transport ignoring abort cannot complete sign-in',async()=>{
  const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:15,fetchImpl:async()=>{await tick(40);return ok()}})
  const source=fs.readFileSync('app/modules/auth/workspaceAuthWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
  const state={message:'',accessReads:0,screens:[]}
  const context={getAuthErrorMessage,signInSession:async()=>{
    try{return {data:{session:await (await fetch(tokenUrl,post)).json()},error:null}}
    catch{return {data:{session:null},error:{name:'AuthRetryableFetchError'}}}
  },getWorkspaceAccess:async()=>{state.accessReads++;return {access:{active:true,status:'approved'}}}}
  vm.createContext(context);vm.runInContext(source+'\nthis.create=createWorkspaceAuthActions',context)
  const actions=context.create({supabase:{},language:'de',email:'synthetic@example.invalid',password:'synthetic-input-only',setMessage:value=>state.message=value,setScreen:value=>state.screens.push(value)})
  assert.equal(await actions.signIn({preventDefault(){}}),false)
  assert.equal(state.message,getAuthErrorMessage({code:'auth_unavailable'},'de'))
  await tick(45)
  assert.equal(state.accessReads,0);assert.deepEqual(state.screens,[])
})

test('successful and rejected auth responses preserve status, headers and exact body bytes',async()=>{
  for(const status of [200,400,429,503]){
    const body=status===200?'{"access_token":"synthetic-only"}':'{"code":"invalid_credentials"}'
    let passedInput,passedInit
    const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:20,fetchImpl:async(input,init)=>{
      passedInput=input;passedInit=init
      return new Response(body,{status,headers:{'content-type':'application/json','x-synthetic':'yes'}})
    }})
    const response=await fetch(tokenUrl,post)
    assert.equal(passedInput,tokenUrl);assert.equal(passedInit.body,post.body);assert.equal(passedInit.headers,post.headers)
    assert.equal(response.status,status);assert.equal(response.headers.get('x-synthetic'),'yes');assert.equal(await response.text(),body)
    await tick(25);assert.equal(passedInit.signal.aborted,false)
  }
})

test('uploads, queries, refreshes, other origins and non-password requests are unchanged',async()=>{
  const requests=[
    [origin+'/storage/v1/object/test/file',post],
    [origin+'/rest/v1/cases',post],
    [origin+'/auth/v1/token?grant_type=refresh_token',post],
    ['https://another-synthetic.invalid/auth/v1/token?grant_type=password',post],
    [tokenUrl,{method:'GET'}],
    [origin+'/auth/v1/token',post]
  ]
  await Promise.all(requests.map(async([url,init])=>{
    const response=ok()
    const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:10,fetchImpl:async(input,options)=>{
      assert.equal(input,url);assert.equal(options,init);await tick(25);return response
    }})
    assert.equal(await fetch(url,init),response)
  }))
})

test('caller cancellation propagates; already cancelled calls never reach transport',async()=>{
  let calls=0,receivedSignal
  const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:200,fetchImpl:async(_input,init)=>{
    calls++;receivedSignal=init.signal;return new Promise(()=>{})
  }})
  const first=new AbortController();const reason=new DOMException('Synthetic cancellation','AbortError')
  const pending=fetch(new Request(tokenUrl,{...post,signal:first.signal}))
  first.abort(reason)
  await assert.rejects(pending,error=>error===reason)
  assert.equal(receivedSignal.aborted,true)
  const already=new AbortController();already.abort(reason)
  await assert.rejects(fetch(tokenUrl,{...post,signal:already.signal}),error=>error===reason)
  assert.equal(calls,1)
})

test('production wiring keeps the deadline at 20 seconds and offline tests make no network requests',()=>{
  assert.equal(PASSWORD_SIGN_IN_TIMEOUT_MS,20_000)
  const source=fs.readFileSync('app/modules/services/supabaseClient.js','utf8')
  assert.match(source,/global:\{fetch:createAuthFetch\(\{supabaseUrl:SUPABASE_URL\}\)\}/)
  assert.deepEqual(offlineNetworkAttempts(),[])
})

test('installed Supabase SDK returns the localized failure without a session and can then sign in',async()=>{
  let calls=0
  const events=[]
  const fetch=createAuthFetch({supabaseUrl:origin,timeoutMs:20,fetchImpl:async(_input,init)=>{
    calls++
    if(calls===1)return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true}))
    return Response.json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,user:{id:'synthetic-owner',aud:'authenticated'}})
  }})
  const client=createClient(origin,'synthetic-publishable-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch}})
  const {data:{subscription}}=client.auth.onAuthStateChange(event=>{events.push(event)})
  const first=await client.auth.signInWithPassword({email:'synthetic@example.invalid',password:'synthetic-input-only'})
  assert.equal(first.data.session,null)
  assert.equal(first.error.name,'AuthRetryableFetchError')
  assert.equal(getAuthErrorMessage(first.error,'de'),getAuthErrorMessage({code:'auth_unavailable'},'de'))
  assert.equal(events.includes('SIGNED_IN'),false);assert.equal(calls,1)
  assert.equal((await client.auth.getSession()).data.session,null)
  const second=await client.auth.signInWithPassword({email:'synthetic@example.invalid',password:'synthetic-input-only'})
  assert.equal(second.error,null);assert.equal(second.data.session.user.id,'synthetic-owner');assert.equal(calls,2)
  assert.equal(events.filter(event=>event==='SIGNED_IN').length,1)
  subscription.unsubscribe()
  assert.deepEqual(offlineNetworkAttempts(),[])
})
