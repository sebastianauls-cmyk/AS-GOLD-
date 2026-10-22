import assert from 'node:assert/strict'
import {processCaseAnalysisJob} from '../supabase/functions/_shared/caseAnalysisWorker.mjs'
import {advanceCompleteAnalysis} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {caseResponseCache} from '../supabase/functions/_shared/caseResponseCache.mjs'

export async function testCaseDiscoveryCache({db,client,owner,caseId,secret,enqueue,claim,cancel,finish,stored,scalar,modelCalls}){
  const oldFetch=globalThis.fetch,ids=[],requests=[],evidence=[]
  const url='https://www.gesetze-im-internet.de/ash_synthetic_cache_test.html'
  let sourceVersion='A',sourceReads=0
  const fresh=async()=>{const job=await enqueue();ids.push(job.id);return job}
  const run=(job,deployment='discovery-a')=>processCaseAnalysisJob({client,job,secret,providerKey:'synthetic-only',cacheNamespace:deployment,reuseValidatedResponses:true,advance:async args=>{
    const result=await advanceCompleteAnalysis(args)
    if(result.state?.research?.length)evidence.push(structuredClone(result.state.research))
    return result
  }})
  const cleanup=async()=>{
    for(const id of ids)await cancel(id)
    await db.query('delete from public.case_roadmaps where id=any($1)',[ids])
    await db.query('delete from public.case_analysis_jobs where id=any($1)',[ids])
    ids.length=0;requests.length=0;evidence.length=0
  }
  globalThis.fetch=async(address,options)=>{
    if(String(address).startsWith('https://raw.githubusercontent.com/'))return Response.json([])
    if(address===url){sourceReads++;return new Response(('Synthetic source version '+sourceVersion+'. This controlled text is a transport fixture and establishes no legal rule. ').repeat(3),{headers:{'Content-Type':'text/plain'}})}
    const request=JSON.parse(options.body);requests.push(request)
    const response=await oldFetch(address,options),raw=await response.json()
    if(request.text.format.name==='ash_case_scope'){
      const scope=JSON.parse(raw.output_text);scope.research_topics=['Allgemeine Regeln zur Abrechnung einer Auszahlung'];raw.output_text=JSON.stringify(scope)
    }
    if(request.text.format.name==='ash_case_research'){
      raw.output_text=JSON.stringify({sources:[{url,title:'Controlled source'}],gaps:[]})
      raw.output=[{type:'web_search_call',status:'completed',action:{type:'search',sources:[{url,title:'Controlled source'}]}}]
    }
    return Response.json(raw)
  }
  try{
    const first=await fresh(),before=modelCalls()
    for(let i=0;i<9;i++)await run(await claim(first.id))
    assert.equal(modelCalls()-before,9)
    const originalEvidence=evidence[0][0]
    const searchRequest=requests.find(request=>request.text.format.name==='ash_case_research')
    assert.equal(await scalar("select count(*)::int from private.case_response_cache where case_id=$1 and stage='research'",[caseId]),1)
    await finish(await claim(first.id),{status:'failed',code:'review_unresolved'})
    const second=await fresh(),lease=await claim(second.id),cache=caseResponseCache({client,job:lease,secret})
    assert.equal((await cache.read(searchRequest,'research')).reused,true)
    const input=JSON.parse(searchRequest.input)
    for(const changed of [{...input,review_date:'2099-01-01'},{...input,research_topics:['Changed question']},{...input,prior_unreachable_urls:[url]}]){
      assert.equal(await cache.read({...searchRequest,input:JSON.stringify(changed)},'research'),null)
    }
    assert.equal(await cache.read({...searchRequest,tools:[{type:'web_search',filters:{allowed_domains:['different.example']}}]},'research'),null)
    assert.equal(await cache.read(searchRequest,'research_recovery'),null,'recovery has a separate identity')
    const retryBefore=modelCalls(),readsBefore=sourceReads
    await run(lease,'discovery-b')
    for(let i=0;i<20&&(await stored(second.id)).status!=='completed';i++)await run(await claim(second.id),'discovery-b')
    assert.equal((await stored(second.id)).status,'completed')
    assert.equal(modelCalls()-retryBefore,4,'same dated discovery and unchanged re-fetched text reuse all six drafts; all four independent reviews execute')
    assert.equal(sourceReads-readsBefore,1,'source text is fetched again even when discovery is reused')
    const result=await scalar('select result from public.case_roadmaps where id=$1',[second.id])
    assert.equal(result.analysis.verification.reused_search_response_ids.length,1)
    assert.equal(result.analysis.verification.review_response_ids.length,4)
    assert.equal(result.analysis.research_sources[0].content_sha256,originalEvidence.content_sha256)
    assert.notEqual(result.analysis.research_sources[0].checked_at,originalEvidence.checked_at,'exact new retrieval timestamp remains in saved evidence')
    await cleanup()

    const seed=await fresh()
    for(let i=0;i<3;i++)await run(await claim(seed.id))
    await finish(await claim(seed.id),{status:'failed',code:'review_unresolved'})
    sourceVersion='B'
    const changed=await fresh(),changedBefore=modelCalls(),changedReads=sourceReads
    for(let i=0;i<3;i++)await run(await claim(changed.id),'discovery-c')
    assert.equal(modelCalls()-changedBefore,1,'planning/discovery reused, changed source text forces a fresh topical analysis')
    assert.equal(sourceReads-changedReads,1)
    assert(evidence.at(-1)[0].source_text.includes('version B'))
    console.log('Research restart: 4 instead of 10 simulated provider calls; source refetch, unchanged-content reuse, date/query/domain isolation and fresh analysis on changed text verified. Zero external requests.')
  }finally{globalThis.fetch=oldFetch;await cleanup()}
}
