import assert from 'node:assert/strict'
import {researchRetrievalPlan} from '../../supabase/functions/_shared/verifiedResearch.mjs'
import {advanceCompleteAnalysis,validateCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA,completeReviewGroups} from '../../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {localizedRepairTargets} from '../../supabase/functions/_shared/completeCaseRepair.mjs'
import {offlineFixtures} from './fixtures.mjs'

const fixture=offlineFixtures.find(item=>item.id==='insurance')
const args={providerKey:'offline-unused',source:fixture.source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Synthetic offline test.'},baseReviewContent:[]}

export async function testSourceActionChecks(){
  const wanted='https://www.bundesfinanzministerium.de/synthetic-contract',domains=['bundesfinanzministerium.de']
  const incidental=Array.from({length:17},(_,i)=>({url:'https://www.bundesfinanzministerium.de/synthetic-hit-'+i,title:'Fictional incidental source '+i}))
  const found=new Map([...incidental,{url:wanted,title:'Fictional selected source'}].map(source=>[source.url,source]))
  const proposed=[{url:wanted+'#eligibility'},{url:wanted+'#exceptions'},{url:'https://untrusted.invalid/not-allowed'}]
  const plan=researchRetrievalPlan(proposed,found,domains)
  assert.equal(plan.items[0].url,wanted,'normalize anchors before selecting the first eight requests')
  assert.equal(plan.items.length,8);assert.equal(new Set(plan.requested).size,8)
  assert.deepEqual(plan.selected,[wanted],'same-page anchors do not count as separate sources')
  assert.equal(plan.deferred.length,10)
  const reused=researchRetrievalPlan(proposed,found,domains,{existing:[{url:wanted},incidental[0]]})
  assert(!reused.requested.includes(wanted)&&!reused.requested.includes(incidental[0].url),'already fetched texts do not consume another slot or request')

  const researchScope={issues:[{id:'balance',title:'Synthetic question',reason:'Synthetic evidence',calculation_needed:true}],research_topics:['Fictional contract question']}
  for(const outcome of ['all_available','selected_failed','recovery_succeeds','later_topic_recovers_source']){
    let modelCalls=0;const httpCalls=[]
    const transport=async(url,options={})=>{
      if(String(url).startsWith('https://raw.githubusercontent.com/'))return new Response('',{status:404})
      if(url==='https://api.openai.com/v1/responses'){
        modelCalls++
        const request=JSON.parse(options.body)
        assert.equal(request.text.format.name,'ash_case_research')
        return Response.json({status:'completed',id:'synthetic-research-'+outcome,model:request.model,
          output:[{type:'web_search_call',status:'completed',action:{type:'search',sources:[...(outcome==='selected_failed'?incidental.slice(0,7):incidental),{url:wanted,title:'Fictional selected source'}]}}],
          output_text:JSON.stringify({sources:[{url:wanted+'#eligibility',title:'Fictional selected source'}],gaps:[]})})
      }
      httpCalls.push(url)
      if(outcome==='selected_failed'&&url===wanted)return new Response('',{status:503})
      assert(url.startsWith('https://www.bundesfinanzministerium.de/synthetic-'))
      return new Response('<main>SYNTHETIC SOURCE. This invented text is only a transport fixture, not a statement of tax or contract law. The complete original fixture is present here.</main>',{headers:{'Content-Type':'text/html'}})
    }
    const initial={stage:outcome==='recovery_succeeds'?'research_recovery':'research',scope:researchScope,research:[],discovery_gaps:[],
      ...(outcome==='recovery_succeeds'?{failed_topics:researchScope.research_topics,unreachable:[wanted],missing_research_urls:[wanted],deferred_research_urls:[wanted]}:{})}
    if(outcome==='later_topic_recovers_source')Object.assign(initial,{research_index:2,
      scope:{...researchScope,research_topics:['Earlier topic A','Earlier topic B','Later topic A','Later topic B']},
      failed_topics:['Earlier topic A','Earlier topic B'],pending_research_topics:[{topic:'Earlier topic A',urls:[wanted]},{topic:'Earlier topic B',urls:[wanted]}]})
    const flow=await advanceCompleteAnalysis({...args,state:initial,fetchImpl:transport})
    assert.equal(modelCalls,1,'one simulated research stage only')
    assert.equal(httpCalls.length,8);assert.equal(httpCalls[0],wanted)
    if(outcome==='selected_failed'){
      assert.equal(flow.state.stage,'research_recovery','seven incidental successes cannot replace the selected missing source')
      assert.deepEqual(flow.state.unreachable,[wanted]);assert.deepEqual(flow.state.missing_research_urls,[wanted])
    }else{
      assert(flow.state.deferred_research_urls.length>0,'unread hits remain explicitly distinguishable from evidence')
      assert.equal(flow.state.stage,'analysis','unattempted incidental hits do not trigger a paid research repeat')
      assert.deepEqual(flow.state.unreachable,[]);assert.deepEqual(flow.state.missing_research_urls,[])
      assert.deepEqual(flow.state.failed_topics,[],'already recovered topics cannot trigger another research call')
      assert(!flow.state.deferred_research_urls.includes(wanted),'a successful recovery clears stale missing/unread labels')
    }
  }

  const candidate=validateCompleteAnalysis(fixture.reply,fixture.source,fixture.context)
  const feedback=[{code:'source',location:'analysis.topics[0]',reason:'The cited text does not support this conclusion; the related request must seek the actual contract.'}]
  const targets=localizedRepairTargets(candidate,feedback,COMPLETE_ANALYSIS_SCHEMA)
  assert.deepEqual(targets.map(target=>target.location),['analysis.topics[0]','steps[0]','steps[1]'],'a source correction can update its explicitly linked actions in the same bounded request')
  const largeStep=structuredClone(candidate);largeStep.steps[0].action='x'.repeat(21000)
  assert(!localizedRepairTargets(largeStep,feedback,COMPLETE_ANALYSIS_SCHEMA).some(target=>target.location==='steps[0]'),'related actions never enlarge the established correction budget')

  // Replay the reported wrong-source pattern with an inconsistent downstream
  // action. These responses are handwritten, not newly generated model output.
  const bad=structuredClone(candidate)
  bad.analysis.topics[0].sources=[{url:fixture.context.research[1].url,quote:fixture.context.research[1].source_text}]
  bad.steps[0].action='Die Kürzung anhand der fremden Krankenversicherungsregel akzeptieren.'
  for(const fixAction of [true,false]){
  let repairs=0,reviews=0
  const transport=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses')
    const request=JSON.parse(options.body),payloads=request.input.flatMap(message=>message.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
    let output
    if(request.text.format.name==='ash_complete_repair_v169'){
      repairs++
      const assigned=payloads.find(item=>item.assigned_replacements).assigned_replacements
      assert.deepEqual(assigned.map(item=>item.location),['analysis.topics[0]','steps[0]','steps[1]'])
      const replacement={ 'analysis.topics[0]':fixture.reply.analysis.topics[0], 'steps[0]':fixAction?fixture.reply.steps[0]:bad.steps[0], 'steps[1]':fixture.reply.steps[1] }
      output={requires_full_correction:false,reason:'',changes:Object.fromEntries(assigned.map(item=>[item.key,replacement[item.location]]))}
    }else{
      assert.equal(request.text.format.name,'ash_evidence_review_v139','no full generation, planning or extra research is allowed during local repair')
      reviews++
      const related=payloads.find(item=>item.related_output).related_output
      assert.equal(related.steps[0].action,fixAction?fixture.reply.steps[0].action:bad.steps[0].action,'every following review sees the actual returned action')
      const part=payloads.find(item=>item.candidate).candidate
      output={issues:!fixAction&&part.steps?.some(step=>step.id==='request')?[{code:'meaning',location:'steps[0]',reason:'The action still relies on an unrelated contribution rule instead of seeking the contract.'}]:[]}
    }
    return Response.json({status:'completed',id:`synthetic-source-action-${repairs}-${reviews}`,model:request.model,output_text:JSON.stringify(output)})
  }
  let flow={status:'processing',state:{stage:'analysis',scope:fixture.context.scope,research:fixture.context.research,discovery_gaps:[],localizedRepair:{},
    modelState:{stage:'generation',attempt:2,previous:bad,feedback}}}
  let failure
  try{for(let round=0;flow.status==='processing'&&round<12;round++)flow=await advanceCompleteAnalysis({...args,state:flow.state,fetchImpl:transport})}catch(error){failure=error}
  if(!fixAction){
    assert.equal(failure?.code,'review_unresolved');assert(!flow.result)
    assert.equal(repairs,1,'a bad follow-up action does not buy another correction or become an approved result')
    continue
  }
  assert.equal(failure,undefined)
  assert.equal(flow.status,'completed');assert.equal(repairs,1);assert.equal(reviews,completeReviewGroups(candidate).length)
  assert.deepEqual(flow.result.steps,fixture.reply.steps)
  assert.deepEqual(flow.result.analysis.topics,fixture.reply.analysis.topics)
  assert.deepEqual(flow.result.analysis.calculations,candidate.analysis.calculations,'supported calculations are preserved verbatim')
  assert.deepEqual(flow.result.letters,candidate.letters)
  }
}
