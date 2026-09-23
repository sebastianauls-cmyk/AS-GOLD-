import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,validateCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA,completeReviewCoverage} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {localizedRepairTargets,localizedRepairSchema,applyLocalizedRepair} from '../supabase/functions/_shared/completeCaseRepair.mjs'

const get=(value,path)=>path.reduce((item,key)=>item[key],value)
const issue=(location,reason='Synthetic concrete defect in this field.')=>({code:'meaning',location,reason})
const cleanCalculation=item=>{
  const {result,...calculation}=structuredClone(item)
  calculation.inputs=calculation.inputs.map(input=>Object.fromEntries(['name','label','value','kind',...({document:['document_id','quote'],source:['url','quote'],calculation:['calculation_id'],assumption:['explanation']}[input.kind])].map(key=>[key,input[key]])))
  return calculation
}

export async function runLocalizedRepairChecks({args,candidate,big,bigScope,topicFixture,outlineFixture}){
  const schema=COMPLETE_ANALYSIS_SCHEMA
  const data=validateCompleteAnalysis({...big,analysis:{...big.analysis,calculations:big.analysis.calculations.map(cleanCalculation)}},args.source,{scope:bigScope,research:[],outputLanguage:'de',referenceLanguage:'de'})
  const unchanged=structuredClone(data)
  const targets=localizedRepairTargets(data,[issue('analysis.calculations[difference_18].explanation'),issue('analysis.calculations[18].conditions')],schema)
  assert.equal(targets.length,1,'several findings on the same item require only one replacement')
  assert.deepEqual(targets[0].path,['analysis','calculations',18])
  for(const location of ['analysis','analysis.topics','analysis.calculations[99]','analysis.topics[missing]','analysis.topics[0].not_a_field','__proto__.polluted','letters','output'])assert.equal(localizedRepairTargets(data,[issue(location)],schema),null,'ambiguous or new structure retains the complete correction path')
  assert.equal(localizedRepairTargets(data,[{...issue('analysis.topics[0]'),code:'source'}],schema),null,'a source objection retains the full-evidence correction')
  const ambiguous=structuredClone(data);ambiguous.analysis.topics[1].id='0'
  assert.equal(localizedRepairTargets(ambiguous,[issue('analysis.topics[0].conclusion')],schema),null,'an index/ID collision must not choose the wrong item')
  assert.equal(localizedRepairTargets(data,data.analysis.topics.slice(0,9).map(t=>issue(`analysis.topics[${t.id}]`)),schema),null,'a local request has a fixed size bound')

  const linked=structuredClone(data)
  linked.analysis.calculations[19].inputs=[{name:'prior',label:'Vorheriger Wert',kind:'calculation',calculation_id:'difference_18',value:'1000.00'}]
  linked.analysis.calculations[19].expression='prior+prior'
  linked.analysis.calculations[20].inputs=[{name:'prior',label:'Vorheriger Wert',kind:'calculation',calculation_id:'difference_19',value:'2000.00'}]
  linked.analysis.calculations[20].expression='prior'
  const dependent=localizedRepairTargets(linked,[issue('analysis.calculations[difference_18].inputs[0].value')],schema)
  assert.deepEqual(dependent.map(t=>t.path.at(-1)),[18,19,20],'all transitive numerical consumers are assigned in their original order')
  const linkedChanges=Object.fromEntries(dependent.map(target=>[target.key,cleanCalculation(get(linked,target.path))]))
  linkedChanges.edit_0.inputs[0].value='17000'
  const staleDependent=applyLocalizedRepair({requires_full_correction:false,reason:'',changes:linkedChanges},dependent,linked,schema,value=>value)
  assert.throws(()=>validateCompleteAnalysis(staleDependent,args.source,{scope:bigScope,research:[],outputLanguage:'de',referenceLanguage:'de'}),/weiterverwendetes/,'stale derived inputs cannot pass the exact arithmetic gate')
  linkedChanges.edit_1.inputs[0].value='0';linkedChanges.edit_2.inputs[0].value='0'
  const repairedDependent=validateCompleteAnalysis(applyLocalizedRepair({requires_full_correction:false,reason:'',changes:linkedChanges},dependent,linked,schema,value=>value),args.source,{scope:bigScope,research:[],outputLanguage:'de',referenceLanguage:'de'})
  assert.deepEqual(repairedDependent.analysis.calculations.slice(18,21).map(item=>item.result),['0.00','0.00','0.00'])
  assert.deepEqual(localizedRepairSchema(targets,data,schema).properties.changes.anyOf[0].properties.edit_0.properties.id.enum,['difference_18'])
  const corrected=cleanCalculation(data.analysis.calculations[18]);corrected.explanation+=' Der Unterschied ist keine Feststellung der Steuer.'
  const patch={requires_full_correction:false,reason:'',changes:{edit_0:corrected}}
  const rebuilt=applyLocalizedRepair(patch,targets,data,schema,value=>value)
  const expected=structuredClone(data);expected.analysis.calculations[18]=corrected
  assert.deepEqual(rebuilt,expected,'all unassigned data is preserved by the server, not regenerated')
  assert.deepEqual(data,unchanged,'applying a correction never mutates the checkpoint candidate')
  for(const invalid of [
    {...patch,changes:{}},
    {...patch,changes:{...patch.changes,edit_1:corrected}},
    {...patch,changes:{edit_0:{...corrected,id:'difference_17'}}},
    {...patch,changes:{edit_0:{...corrected,extra:'unassigned'}}},
    {...patch,requires_full_correction:true},
  ])assert.throws(()=>applyLocalizedRepair(invalid,targets,data,schema,value=>value),/Korrektur|Abschnitt/i)
  assert.equal(applyLocalizedRepair({requires_full_correction:true,reason:'An additional action is needed.',changes:null},targets,data,schema,value=>value),null)

  // Use the actual complete pipeline, source/arithmetic checks and review-cache
  // hashes. Every provider answer is synthetic; this measures requests, not $.
  const counts={total:0,topics:0,outlines:0,numbers:0,plans:0,repairs:0,reviews:0}
  let flagged=false,initialCalls=0
  const fetchImpl=async(url,options)=>{
    if(url!=='https://api.openai.com/v1/responses')return new Response('',{status:404})
    const request=JSON.parse(options.body),name=request.text.format.name
    counts.total++
    let output
    if(name==='ash_case_scope')output=bigScope
    else if(name==='ash_complete_topics_v167'){counts.topics++;output=topicFixture(big.analysis,request)}
    else if(name==='ash_complete_outline_v166'){counts.outlines++;output=outlineFixture(big.analysis)}
    else if(name==='ash_complete_numbers_v157'){
      counts.numbers++
      const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
      output={calculations:big.analysis.calculations.filter(c=>assigned.some(a=>a.id===c.id)).map(cleanCalculation)}
    }else if(name==='ash_complete_plan_v157'){
      counts.plans++
      const {analysis,...plan}=structuredClone(big);output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
    }else if(name==='ash_complete_repair_v169'){
      counts.repairs++;initialCalls=counts.total-1
      assert.equal(request.reasoning.effort,'medium');assert.equal(request.max_output_tokens,8000)
      assert(request.prompt_cache_key.length<=64)
      const payload=JSON.parse(request.input.at(-1).content[0].text)
      assert.deepEqual(payload.assigned_replacements.map(t=>t.location),['analysis.calculations[18]'])
      output=patch
    }else{
      counts.reviews++
      const payloads=request.input.filter(m=>m.role==='user').flatMap(m=>m.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
      const part=payloads.find(p=>p.candidate).candidate
      const reject=!flagged&&part.analysis?.calculations?.some(c=>c.id==='difference_18')
      if(reject)flagged=true
      output={issues:reject?[issue('analysis.calculations[difference_18].explanation')]:[]}
    }
    return Response.json({status:'completed',id:'localized-'+counts.total,model:request.model,output_text:JSON.stringify(output)})
  }
  let flow=await advanceCompleteAnalysis({...args,fetchImpl})
  for(let step=0;flow.status==='processing'&&step<90;step++){
    assert(!flow.result,'no patch or intermediate candidate is a customer result')
    flow=await advanceCompleteAnalysis({...args,fetchImpl,state:flow.state})
  }
  assert.equal(flow.status,'completed');assert.equal(flow.attempts,2)
  assert.deepEqual([counts.topics,counts.outlines,counts.numbers,counts.plans,counts.repairs],[5,1,4,1,1],'a substantive calculation correction does not regenerate topics, the numerical plan, unrelated calculations or letters')
  assert.equal(counts.total,initialCalls+2,'one targeted correction and one changed review follow the first full round')
  assert.equal(flow.result.analysis.verification.review_response_ids.length,25)
  assert.equal(flow.result.analysis.verification.reused_review_response_ids.length,24)
  assert.equal(flow.result.analysis.verification.correction_response_ids.length,1)
  assert.deepEqual(flow.result.analysis.verification.review_coverage,completeReviewCoverage(data))
  const {research_sources,verification,...finalAnalysis}=flow.result.analysis
  assert.deepEqual({...flow.result,analysis:finalAnalysis},validateCompleteAnalysis(expected,args.source,{scope:bigScope,research:[],outputLanguage:'de',referenceLanguage:'de'}))

  // A no-research fixture cannot detect needless invalidation of scoped review
  // receipts. Use distinct, explicitly fictional source families here so an
  // unchanged review really has a different request from a full-source review.
  const research=data.analysis.topics.map((topic,index)=>({
    url:`https://www.gesetze-im-internet.de/synthetic_repair_${index}/__1.html`,
    title:'Fictional correction-routing source '+index,
    source_text:`SYNTHETIC REPAIR EVIDENCE ${index}. Complete fictional rule and exception.`,
    checked_at:'2026-09-23T00:00:00Z'
  }))
  const sourced=structuredClone(data)
  sourced.analysis.topics.forEach((topic,index)=>{topic.sources=[{url:research[index].url,quote:`SYNTHETIC REPAIR EVIDENCE ${index}.`}]})
  let scopedCalls=0,scopedRepairs=0,scopedReviews=0,modules=0,initiallyRejected=false
  const scopedTransport=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses','this fixture never fetches real research or model output')
    const request=JSON.parse(options.body)
    const payloads=request.input.flatMap(message=>message.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
    scopedCalls++
    let output
    if(request.text.format.name==='ash_complete_repair_v169'){
      scopedRepairs++
      assert.equal(payloads.find(payload=>payload.retrieved_sources).retrieved_sources.length,research.length,'the local correction still receives every fetched source')
      const value=cleanCalculation(sourced.analysis.calculations[18]);value.explanation+=' Synthetic explanation clarification.'
      output={requires_full_correction:false,reason:'',changes:{edit_0:value}}
    }else{
      assert.equal(request.text.format.name,'ash_evidence_review_v139','a local explanation correction must not regenerate other components')
      scopedReviews++
      const sources=payloads.find(payload=>payload.retrieved_sources)
      if(sources.research_context?.mode==='module')modules++
      const part=payloads.find(payload=>payload.candidate).candidate
      const reject=!initiallyRejected&&part.analysis?.calculations?.some(item=>item.id==='difference_18')
      if(reject)initiallyRejected=true
      output={issues:reject?[issue('analysis.calculations[difference_18].explanation')]:[]}
    }
    return Response.json({status:'completed',id:'scoped-local-'+scopedCalls,model:request.model,output_text:JSON.stringify(output)})
  }
  let scopedRun={status:'processing',state:{stage:'analysis',scope:bigScope,research,discovery_gaps:[],modelState:{stage:'review',attempt:1,candidate:sourced,structuralFeedback:[],response_id:'synthetic-initial-generation'}}}
  for(let step=0;scopedRun.status==='processing'&&step<60;step++)scopedRun=await advanceCompleteAnalysis({...args,fetchImpl:scopedTransport,state:scopedRun.state})
  assert.equal(scopedRun.status,'completed')
  assert(modules>0,'this regression must exercise actual scoped source contexts')
  assert.equal(scopedRepairs,1)
  assert.equal(scopedReviews,26,'25 initial reviews plus only the changed review; unchanged scoped requests keep their approvals')
  assert.equal(scopedRun.result.analysis.verification.reused_review_response_ids.length,24)
  assert.equal(scopedRun.result.analysis.verification.review_response_ids.length,25)
  assert.deepEqual(scopedRun.result.analysis.research_sources,research)
  assert.deepEqual(scopedRun.result.analysis.topics,sourced.analysis.topics)
  console.log(`Localized correction with scoped research: ${scopedCalls} simulated requests from a generated candidate; 25 initial reviews + 1 correction + 1 changed review.`)

  // Invalid numbers never enter the final reviewers; one mechanical repair is
  // available in this candidate, and a second bad repair stops the job.
  for(const repeatBad of [false,true]){
    let repairs=0,reviews=0
    const previous=validateCompleteAnalysis(candidate,args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const state={stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],localizedRepair:{},modelState:{stage:'generation',attempt:2,previous,feedback:[issue('analysis.calculations[difference].explanation')]}}
    const transport=async(url,options)=>{
      if(url!=='https://api.openai.com/v1/responses')return new Response('',{status:404})
      const request=JSON.parse(options.body)
      let output
      if(request.text.format.name==='ash_complete_repair_v169'){
        repairs++
        const value=cleanCalculation(previous.analysis.calculations[0])
        if(repairs===1||repeatBad)value.inputs[0].value='19000'
        if(repairs===2)assert(JSON.parse(request.input.at(-1).content[0].text).mechanical_feedback.some(f=>f.reason.includes('19000')))
        output={requires_full_correction:false,reason:'',changes:{edit_0:value}}
      }else {reviews++;output={issues:[]}}
      return Response.json({status:'completed',id:`source-repair-${repairs}-${reviews}`,model:request.model,output_text:JSON.stringify(output)})
    }
    let run={status:'processing',state},failure
    try{for(let step=0;run.status==='processing'&&step<15;step++)run=await advanceCompleteAnalysis({...args,fetchImpl:transport,state:run.state})}catch(error){failure=error}
    assert.equal(repairs,2)
    if(repeatBad){assert.equal(failure?.code,'source_unresolved');assert.equal(reviews,0);assert(!run.result)}
    else {assert.equal(failure,undefined);assert.equal(run.status,'completed');assert.equal(reviews,8);assert.equal(run.result.analysis.calculations[0].result,'1000.00')}
  }
  const truncatedState={stage:'analysis',scope:bigScope,research:[],discovery_gaps:[],localizedRepair:{},reviewReceipts:{stale:{request_hash:'old'}},modelState:{stage:'generation',attempt:2,previous:data,feedback:[issue('analysis.calculations[18].explanation')]}}
  let truncations=0
  const truncated=await advanceCompleteAnalysis({...args,state:truncatedState,fetchImpl:async()=>{
    truncations++
    return Response.json({status:'incomplete',id:'truncated-patch',incomplete_details:{reason:'max_output_tokens'},output_text:'{"changes":'})
  }})
  assert.equal(truncations,1);assert.equal(truncated.status,'processing');assert(!truncated.result)
  assert.equal(truncated.state.localizedRepair,null);assert.equal(truncated.state.reviewReceipts,null)
  assert.equal(truncated.state.modelState.attempt,2,'a truncated patch does not grant another substantive candidate')
  assert.deepEqual(truncated.state.modelState.previous,data,'incomplete patch bytes never replace the prior candidate')
  console.log(`Localized complete-case correction: ${counts.total} simulated model requests; ${initialCalls} for the first candidate, then 1 replacement + 1 changed review; 25 current approvals retained. No live model cost measured.`)
}
