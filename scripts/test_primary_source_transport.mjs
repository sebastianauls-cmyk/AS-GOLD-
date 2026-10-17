import assert from 'node:assert/strict'
import {GET} from '../app/api/public-primary-source/[act]/[section]/route.js'

const origin='https://www.gesetze-im-internet.de/bgb/__631.html'
const request=(path='bgb/631',query='')=>new Request('https://app.example/api/public-primary-source/'+path+query)
const context=(act='bgb',section='631')=>({params:Promise.resolve({act,section})})
const originalFetch=globalThis.fetch
let calls=0
function response(body='original statutory bytes',headers={'content-type':'text/html; charset=iso-8859-1'},url=origin,status=200){
  const result=new Response(body,{headers,status});Object.defineProperty(result,'url',{value:url});return result
}
try{
  globalThis.fetch=async(url,options)=>{
    calls++;assert.equal(url,origin);assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store')
    assert.deepEqual(Object.keys(options.headers).sort(),['Accept','User-Agent'])
    assert(options.signal instanceof AbortSignal);return response(new Uint8Array([167,32,54,51,49]))
  }
  for(const [act,section,query] of [['bgb','999999',''],['https:','631',''],['bgb','631','?url=https://private.invalid']]){
    assert.equal((await GET(request(act+'/'+section,query),context(act,section))).status,404)
  }
  assert.equal(calls,0)
  const before=Date.now(),good=await GET(request(),context())
  assert.equal(good.status,200);assert.equal(good.headers.get('x-primary-source-url'),origin)
  assert.equal(good.headers.get('content-type'),'application/octet-stream')
  assert.equal(good.headers.get('x-content-type-options'),'nosniff')
  assert.equal(good.headers.get('x-primary-source-content-type'),'text/html; charset=iso-8859-1')
  assert(Date.parse(good.headers.get('x-primary-source-checked-at'))>=before)
  assert.deepEqual([...new Uint8Array(await good.arrayBuffer())],[167,32,54,51,49])
  for(const bad of [response('blocked',{},origin,403),response('redirect',{'content-type':'text/html'},'https://elsewhere.invalid'),response('json',{'content-type':'application/json'}),response('too large',{'content-type':'text/html','content-length':'1500001'}),response(new Uint8Array(1500001))]){
    globalThis.fetch=async()=>bad
    const rejected=await GET(request(),context());assert.equal(rejected.status,502);assert.equal(rejected.headers.get('cache-control'),'no-store')
    assert.equal(rejected.headers.get('x-primary-source-checked-at'),null)
  }
}finally{globalThis.fetch=originalFetch}
console.log('Public source transport: fixed allowlist, inert original bytes, timestamp and bounded fail-closed retrieval passed.')
