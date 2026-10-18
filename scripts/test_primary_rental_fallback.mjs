import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRIMARY_SOURCE_CACHE} from '../supabase/functions/_shared/primarySourceCache.mjs'
import {loadPrimarySources,retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'

// Reproduce the missing-source path: both requested rental provisions time out.
// Use the actual shipped catalogue, with the clock fixed to its observed date.
// Never relabel an old text as newly fetched, even in this regression check.
export async function runRentalSourceFallbackChecks(){
const published=JSON.parse(readFileSync(new URL('../supabase/functions/_shared/primarySourceCache.json',import.meta.url),'utf8'))
assert.deepEqual(published,PRIMARY_SOURCE_CACHE,'the independently loaded and bundled catalogues must agree')
const urls=['551','556'].map(section=>`https://www.gesetze-im-internet.de/bgb/__${section}.html`)
const requested=urls.map(url=>({url}))
const expected=urls.map(url=>published.find(item=>item.url===url))
assert(expected.every(Boolean),'both missing rental provisions must be available to the fallback')
const observed=Math.max(...expected.map(item=>Date.parse(item.checked_at)))
const realNow=Date.now
const calls=[]
const transport=async url=>{
  calls.push(url)
  if(String(url).startsWith('https://raw.githubusercontent.com/'))return Response.json(published)
  throw new DOMException('Synthetic direct-source timeout','TimeoutError')
}
try{
  Date.now=()=>observed
  const records=await loadPrimarySources(transport)
  const fetched=await retrieveOfficialEvidence(requested,['gesetze-im-internet.de'],{fetchImpl:transport,snapshotRecords:records})
  assert.equal(fetched.size,2,'both complete texts survive direct-retrieval timeouts')
  assert.equal(calls.filter(url=>urls.includes(url)).length,2,'each source is still attempted directly')
  for(const item of expected){
    const actual=fetched.get(item.url)
    assert.equal(actual.source_text,item.source_text)
    assert.equal(actual.checked_at,item.checked_at,'fallback preserves the actual observation time')
    assert.equal(actual.content_sha256,item.content_sha256)
    assert.equal(actual.truncated,false)
  }
  const broken=expected.map(item=>({...item,content_sha256:'0'.repeat(64)}))
  assert.equal((await retrieveOfficialEvidence(requested,['gesetze-im-internet.de'],{fetchImpl:transport,snapshotRecords:broken})).size,0,'wrong content hashes are never accepted')
  Date.now=()=>observed+3*86400000
  assert.equal((await retrieveOfficialEvidence(requested,['gesetze-im-internet.de'],{fetchImpl:transport,snapshotRecords:records})).size,0,'an outage cannot renew the observed date of expired source texts')
}finally{Date.now=realNow}
console.log('Rental-source fallback: actual complete catalogue survives two simulated direct timeouts; original texts, dates and hashes preserved; tampered and expired records rejected.')
}
