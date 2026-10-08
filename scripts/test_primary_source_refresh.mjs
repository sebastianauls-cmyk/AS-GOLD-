import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {PRIMARY_REFRESH_URLS,refreshPublicPrimarySources} from '../app/modules/research/primarySourceRefresh.mjs'
import {GET} from '../app/api/primary-sources/route.js'

const requests=[]
const fetchImpl=async url=>{
  assert(PRIMARY_REFRESH_URLS.includes(url),'only the fixed public catalogue may be fetched')
  requests.push(url)
  const section=/__([a-z0-9]+)\.html$/.exec(url)[1]
  return new Response(`<title>§ ${section} – Synthetic retrieval test</title><main>§ ${section}. This is synthetic source markup for testing retrieval only. It does not state a legal rule and contains no customer data. <table><tr><td>960</td><td>288</td></tr></table></main>`,{headers:{'content-type':'text/html; charset=utf-8'}})
}
const result=await refreshPublicPrimarySources({fetchImpl})
assert.equal(result.complete,true)
assert.equal(result.records.length,PRIMARY_REFRESH_URLS.length)
assert.deepEqual(requests,PRIMARY_REFRESH_URLS)
for(const record of result.records){
  assert.equal(record.content_sha256,createHash('sha256').update(record.source_text).digest('hex'))
  assert.match(record.source_text,/960 \| 288/)
  assert.equal(record.retrieval_mode,'verified_snapshot')
  assert.equal(record.truncated,false)
}
let failures=0
const unavailable=await refreshPublicPrimarySources({fetchImpl:async()=>{failures++;throw new Error('Network unavailable')}})
assert.equal(unavailable.complete,false)
assert.equal(unavailable.records.length,0,'failure must never return bundled old texts as newly retrieved')
assert.equal(failures,5,'stop after the first wholly unreachable batch')
const wrong=await refreshPublicPrimarySources({fetchImpl:async()=>new Response('<title>Wrong provision</title><main>'+('A'.repeat(200))+'</main>',{headers:{'content-type':'text/html'}})})
assert.equal(wrong.records.length,0)
assert.equal((await GET(new Request('https://ash.example/api/primary-sources?url=https://other.example'))).status,400)
console.log('Public source refresh: fixed destinations, exact hashes, table boundaries, no stale fallback, bounded failure, wrong-provision rejection and no caller-supplied URL pass.')
