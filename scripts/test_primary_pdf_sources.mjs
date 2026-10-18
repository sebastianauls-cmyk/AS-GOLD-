import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import {officialSourcePdf} from './fixtures/officialSourcePdf.mjs'
import {extractOfficialPdfText} from '../supabase/functions/_shared/officialPdfText.mjs'
import {retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'
import {quoteContainsNumber} from '../supabase/functions/_shared/checkedCalculations.mjs'

// Run with Deno 2.1, no network permission, and cached pinned dependencies.
// Responses below contain real PDF bytes; the parser is never mocked.
let externalRequests=0
globalThis.fetch=async()=>{externalRequests++;throw new Error('Unexpected network request')}
const url='https://authority.example/decision.pdf',domains=['authority.example']
const item={url,title:'Synthetic discovery label'}
const bytes=officialSourcePdf()
const pdfResponse=()=>new Response(bytes.slice(),{headers:{'content-type':'application/pdf'}})
const digest=async text=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex')
const start=performance.now()
const evidence=(await retrieveOfficialEvidence([item],domains,{fetchImpl:async(request,options)=>{
  assert.equal(request,url);assert.equal(options.redirect,'manual')
  assert.match(options.headers.Accept,/application\/pdf/);assert(options.signal)
  return pdfResponse()
}})).get(url)
assert(evidence,'a readable allowed PDF must become retrieved evidence')
assert.equal(evidence.url,url);assert.equal(evidence.final_url,url)
assert.match(evidence.source_text,/Prüfung, Fälligkeit und Abrechnung/)
assert.match(evidence.source_text,/Voraussetzung A UND Voraussetzung B/)
assert.match(evidence.source_text,/Ausnahme/)
assert.match(evidence.source_text,/Seite 1/);assert.match(evidence.source_text,/Seite 2/)
assert.equal(evidence.truncated,false)
assert.equal(evidence.content_sha256,await digest(evidence.source_text))
assert.equal(quoteContainsNumber(evidence.source_text,'960'),true)
assert.equal(quoteContainsNumber(evidence.source_text,'288'),true)
assert.equal(quoteContainsNumber(evidence.source_text,'960288'),false)

const shortened=(await retrieveOfficialEvidence([item],domains,{maxChars:160,fetchImpl:pdfResponse})).get(url)
assert.equal(shortened.source_text.length,160);assert.equal(shortened.truncated,true)
assert.equal(shortened.content_sha256,await digest(shortened.source_text))

let visited=[]
const redirected=(await retrieveOfficialEvidence([item],domains,{fetchImpl:async request=>{
  visited.push(request)
  return request===url?new Response('',{status:302,headers:{location:'/final.pdf'}}):pdfResponse()
}})).get(url)
assert.deepEqual(visited,[url,'https://authority.example/final.pdf'])
assert.equal(redirected.final_url,visited[1]);assert.equal(redirected.url,url)
for(const location of ['https://untrusted.example/file.pdf','http://authority.example/file.pdf','https://user:pass@authority.example/file.pdf']){
  visited=[]
  const denied=await retrieveOfficialEvidence([item],domains,{fetchImpl:async request=>{
    visited.push(request);return new Response('',{status:302,headers:{location}})
  }})
  assert.equal(denied.size,0);assert.deepEqual(visited,[url])
}
for(const response of [
  ()=>new Response('Forbidden',{status:403}),
  ()=>new Response(bytes.slice(),{headers:{'content-type':'application/octet-stream'}}),
  ()=>new Response('HTML challenge disguised as PDF'.repeat(8),{headers:{'content-type':'application/pdf'}}),
  ()=>new Response('%PDF-1.7\nmalformed document',{headers:{'content-type':'application/pdf'}}),
  ()=>new Response(officialSourcePdf({empty:true}),{headers:{'content-type':'application/pdf'}}),
  ()=>new Response(officialSourcePdf({pages:41}),{headers:{'content-type':'application/pdf'}}),
  ()=>new Response(bytes.slice(),{headers:{'content-type':'application/pdf','content-length':'1500001'}}),
  ()=>new Response(new Uint8Array(1500001),{headers:{'content-type':'application/pdf'}})
])assert.equal((await retrieveOfficialEvidence([item],domains,{fetchImpl:response})).size,0,'unreadable, forbidden and oversized files stay unavailable')

const cancelled=new AbortController();cancelled.abort()
assert.equal(await extractOfficialPdfText(bytes.slice(),{signal:cancelled.signal}),null)
const items=Array.from({length:4},(_,i)=>({url:`https://authority.example/${i}.pdf`}))
const bounded=await retrieveOfficialEvidence(items,domains,{fetchImpl:pdfResponse})
assert.equal(bounded.size,3,'one research step parses at most three PDF responses')
const cached={...evidence,checked_at:new Date().toISOString(),retrieval_mode:'verified_snapshot'}
assert.equal((await retrieveOfficialEvidence([item],domains,{fetchImpl:async()=>new Response('',{status:503}),snapshotRecords:[cached]})).get(url).source_text,evidence.source_text)
const text='Plain source content with enough readable text for evidence extraction. Existing text, HTML and character decoding paths must continue working.'
assert.equal((await retrieveOfficialEvidence([item],domains,{fetchImpl:async()=>new Response(text,{headers:{'content-type':'text/plain'}})})).get(url).source_text,text)
assert.equal(externalRequests,0,'PDFs cannot initiate their own network/asset requests')
console.log(JSON.stringify({pdf_extraction:'passed',runtime:Deno.version,elapsed_ms:Math.round(performance.now()-start),live_model_calls:0,external_requests:externalRequests,customer_acceptance:'pending'}))
