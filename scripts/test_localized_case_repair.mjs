import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,validateCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA,completeReviewCoverage,completeReviewGroups} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {completeReviewLocations,resolveReviewIssueLocations,localizedRepairTargets,localizedRepairSchema,applyLocalizedRepair} from '../supabase/functions/_shared/completeCaseRepair.mjs'

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
  const unchanged=structuredClone(data),groupCount=completeReviewGroups(data).length
  assert.equal(groupCount,8,'all 25 maximum-size sections fit in eight bounded review requests')
  for(const [scope,key,path] of [['analysis','topic_ids',['analysis','topics']],['calculations','calculation_ids',['analysis','calculations']],['roadmap','step_ids',['steps']],['letters','letter_ids',['letters']]]){
    const original=get(data,path)[1],sections=[{scope,[key]:[original.id]}],finding=issue(original.id)
    const resolved=resolveReviewIssueLocations([finding],data,sections)
    const targets=localizedRepairTargets(data,resolved,schema)
    assert.deepEqual(targets[0].path,[...path,1],'the assigned original ID selects its whole-result item, not local index zero')
    assert.equal(resolved[0].reason,finding.reason);assert.equal(resolved[0].code,finding.code)
    assert.equal(finding.location,original.id,'normalization never mutates provider findings')
    assert.deepEqual(resolveReviewIssueLocations(resolved,data,sections),resolved,'full paths remain unchanged')
    for(const id of ['unknown_id',get(data,path)[0].id]){
      const unresolved=resolveReviewIssueLocations([issue(id)],data,sections)
      assert.equal(unresolved[0].location,id,'unknown and out-of-assignment IDs are never guessed')
      assert.equal(localizedRepairTargets(data,unresolved,schema),null)
    }
    const sourceFinding=resolveReviewIssueLocations([{...finding,code:'source'}],data,sections)
    assert.deepEqual(localizedRepairTargets(data,sourceFinding,schema)[0].path,[...path,1],'a precisely located source finding uses the same bounded correction')
  }
  const repeatedId=structuredClone(data),sharedId=repeatedId.analysis.topics[0].id
  repeatedId.letters[0].id=sharedId
  const topicSection={scope:'analysis',topic_ids:[sharedId]},letterSection={scope:'letters',letter_ids:[sharedId]}
  assert.equal(resolveReviewIssueLocations([issue(sharedId)],repeatedId,[topicSection])[0].location,'analysis.topics[0]','the current review assignment disambiguates IDs across collections')
  assert.equal(resolveReviewIssueLocations([issue(sharedId)],repeatedId,[letterSection])[0].location,'letters[0]')
  assert.equal(resolveReviewIssueLocations([issue(sharedId)],repeatedId,[topicSection,letterSection])[0].location,sharedId,'conflicting assignments stay unresolved')
  repeatedId.analysis.topics[1].id=sharedId
  assert.equal(resolveReviewIssueLocations([issue(sharedId)],repeatedId,[topicSection])[0].location,sharedId,'duplicate IDs cannot choose an arbitrary item')
  assert.equal(resolveReviewIssueLocations([issue('opening')],data,[topicSection])[0].location,'opening','explicit scalar field paths keep their meaning')
  repeatedId.analysis.topics[0].id='opening'
  const scalarCollision=resolveReviewIssueLocations([issue('opening')],repeatedId,[{scope:'analysis',topic_ids:['opening']}])
  assert.equal(localizedRepairTargets(repeatedId,scalarCollision,schema),null,'a scalar/item ID collision must not select either possible target')
  const targets=localizedRepairTargets(data,[issue('analysis.calculations[difference_18].explanation'),issue('analysis.calculations[18].conditions')],schema)
  assert.equal(targets.length,1,'several findings on the same item require only one replacement')
  assert.deepEqual(targets[0].path,['analysis','calculations',18])
  for(const location of ['analysis','analysis.topics','analysis.calculations[99]','analysis.topics[missing]','analysis.topics[0].not_a_field','__proto__.polluted','letters','output'])assert.equal(localizedRepairTargets(data,[issue(location)],schema),null,'ambiguous or new structure cannot trigger an automatic complete rewrite')
  assert.equal(localizedRepairTargets(data,[{...issue('analysis'),code:'source'}],schema),null,'a global source objection still stops automatic correction')
  const ambiguous=structuredClone(data);ambiguous.analysis.topics[1].id='0'
  assert.deepEqual(localizedRepairTargets(ambiguous,[issue('analysis.topics[0].conclusion')],schema)[0].path,['analysis','topics',0],'a canonical index always selects the assigned position')
  assert.deepEqual(localizedRepairTargets(ambiguous,[issue('analysis.topics["0"].conclusion')],schema)[0].path,['analysis','topics',1],'a quoted numeric ID selects that original ID instead of an index')
  const numbered=structuredClone(data)
  numbered.steps.forEach((step,index)=>{step.id=String(index+1)})
  const numberSections=[{scope:'roadmap',part:'steps',step_ids:['5']}]
  for(const location of ['5','steps[4]','steps["5"].after_response']){
    const normalized=resolveReviewIssueLocations([issue(location)],numbered,numberSections,schema)
    assert.equal(normalized[0].location,'steps[4]','original step ID and canonical location converge on the fifth step')
    assert(completeReviewLocations(numbered,numberSections).includes(normalized[0].location))
    const targets=localizedRepairTargets(numbered,normalized,schema)
    assert.deepEqual(targets[0].path,['steps',4],'normalization must not reject its own canonical path')
    const replacement={...numbered.steps[4],after_response:'Synthetic explicit follow-through after the response.'}
    const repaired=applyLocalizedRepair({requires_full_correction:false,reason:'',changes:{edit_0:replacement}},targets,numbered,schema,value=>value)
    assert.deepEqual(repaired.steps[4],replacement)
    assert.deepEqual(repaired.steps[3],numbered.steps[3],'step ID 4 remains untouched')
  }
  numbered.steps[0].id='99'
  assert.equal(localizedRepairTargets(numbered,[issue('steps[99]')],schema),null,'an out-of-range canonical index never falls back to an ID')
  assert.deepEqual(localizedRepairTargets(numbered,[issue('steps["99"]')],schema)[0].path,['steps',0])
  numbered.steps[1].id='99'
  assert.equal(localizedRepairTargets(numbered,[issue('steps["99"]')],schema),null,'duplicate original IDs remain ambiguous')
  assert.equal(localizedRepairTargets(data,data.analysis.topics.slice(0,9).map(t=>issue(`analysis.topics[${t.id}]`)),schema),null,'a local request has a fixed size bound')
  const assignedLocations=completeReviewLocations(data,[{scope:'analysis',topic_ids:[data.analysis.topics[1].id]}])
  assert(assignedLocations.includes('analysis.topics[1]'))
  assert(!assignedLocations.includes('analysis.topics[0]'),'an unassigned full path cannot select a correction')
  assert(!assignedLocations.includes('analysis.topics[1] und Berechnungsabdeckung'),'compound prose is not a review location')

  // Replay a local unsupported eligibility detail through the actual workflow,
  // then prove that a failed correction, fabricated quote and invalid location
  // still cannot become an accepted customer result. No live API calls.
  for(const outcome of ['fixed','unresolved','bad_quote','unassigned','compound','global']){
    const previous=validateCompleteAnalysis(candidate,args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const original=structuredClone(previous)
    previous.analysis.topics[0].conditions+=' Unsupported synthetic eligibility detail.'
    const expectedReviews=completeReviewGroups(previous).length
    let repairCalls=0,reviewCalls=0,flaggedSource=false
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),payloads=request.input.flatMap(message=>message.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
      let output
      if(request.text.format.name==='ash_complete_repair_v169'){
        repairCalls++
        assert.equal(reviewCalls,expectedReviews,'all initial mandatory reviews precede the single local correction')
        assert.deepEqual(payloads.find(p=>p.assigned_replacements).assigned_replacements.map(t=>t.location),['analysis.topics[0]'])
        const replacement=structuredClone((outcome==='unresolved'?previous:original).analysis.topics[0])
        if(outcome==='bad_quote')replacement.sources=[{url:'https://example.invalid/not-fetched',quote:'A fabricated legal condition.'}]
        output={requires_full_correction:false,reason:'',changes:{edit_0:replacement}}
      }else{
        assert.equal(request.text.format.name,'ash_evidence_review_v139')
        reviewCalls++
        const part=payloads.find(p=>p.candidate).candidate
        const locations=request.text.format.schema.properties.issues.items.properties.location.enum
        assert(Array.isArray(locations)&&locations.includes('analysis'),'a wider defect remains reportable')
        const reject=part.analysis?.topics?.some(t=>t.conditions.includes('Unsupported synthetic eligibility detail.'))&&(!flaggedSource||repairCalls)
        if(reject)flaggedSource=true
        const location=({unassigned:'analysis.topics[99]',compound:'analysis.topics[0] und Berechnungsabdeckung',global:'analysis'})[outcome]||'analysis.topics[0]'
        output={issues:reject?[{code:'source',location,reason:'The supplied originals and fetched text do not support this eligibility example.'}]:[]}
      }
      return Response.json({status:'completed',id:`source-${outcome}-${reviewCalls}-${repairCalls}`,model:request.model,output_text:JSON.stringify(output)})
    }
    let flow={status:'processing',state:{stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],modelState:{stage:'review',attempt:1,candidate:previous,structuralFeedback:[],response_id:'synthetic-source-candidate'}}},failure
    try{for(let step=0;flow.status==='processing'&&step<30;step++){
      assert(!flow.result)
      flow=await advanceCompleteAnalysis({...args,fetchImpl:transport,state:flow.state})
    }}catch(error){failure=error}
    if(outcome==='fixed'){
      assert.equal(failure,undefined);assert.equal(flow.status,'completed');assert.equal(flow.attempts,2)
      assert.equal(repairCalls,1);assert.equal(reviewCalls,2*expectedReviews,'changed topic dependencies invalidate all affected approvals')
      assert.deepEqual(flow.result.analysis.topics,original.analysis.topics)
      assert.deepEqual(flow.result.steps,original.steps);assert.deepEqual(flow.result.letters,original.letters)
    }else{
      assert(!flow.result)
      assert.equal(failure?.code,['unassigned','compound'].includes(outcome)?'review_invalid':outcome==='bad_quote'?'source_unresolved':'review_unresolved')
      assert.equal(repairCalls,['unresolved','bad_quote'].includes(outcome)?1:0)
    }
  }

  const linked=structuredClone(data)
  linked.analysis.calculations[19].inputs=[{name:'prior',label:'Vorheriger Wert',kind:'calculation',calculation_id:'difference_18',value:'1000.00'}]
  linked.analysis.calculations[19].expression='prior+prior'
  linked.analysis.calculations[20].inputs=[{name:'prior',label:'Vorheriger Wert',kind:'calculation',calculation_id:'difference_19',value:'2000.00'}]
  linked.analysis.calculations[20].expression='prior'
  const dependent=localizedRepairTargets(linked,resolveReviewIssueLocations([issue('difference_18')],linked,[{scope:'calculations',calculation_ids:['difference_18']}]),schema)
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
      // The production review prompt explicitly allows an original item ID.
      // This must reach the same bounded correction as its full field path.
      output={issues:reject?[issue('difference_18')]:[]}
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
  assert.equal(flow.result.analysis.verification.review_response_ids.length,groupCount)
  assert.equal(flow.result.analysis.verification.reused_review_response_ids.length,groupCount-1)
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
  // Force separate topical groups so this fixture still exercises module
  // routing and unchanged scoped receipts after request consolidation.
  sourced.analysis.topics[0].conclusion+=' '+('Fictional explanatory context. '.repeat(600))
  sourced.analysis.topics.forEach((topic,index)=>{topic.sources=[{url:research[index].url,quote:`SYNTHETIC REPAIR EVIDENCE ${index}.`}]})
  const scopedGroupCount=completeReviewGroups(sourced).length
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
  assert.equal(scopedReviews,scopedGroupCount+1,'only the changed group is reviewed again; unchanged scoped requests keep their approvals')
  assert.equal(scopedRun.result.analysis.verification.reused_review_response_ids.length,scopedGroupCount-1)
  assert.equal(scopedRun.result.analysis.verification.review_response_ids.length,scopedGroupCount)
  assert.deepEqual(scopedRun.result.analysis.research_sources,research)
  assert.deepEqual(scopedRun.result.analysis.topics,sourced.analysis.topics)
  console.log(`Localized correction with scoped research: ${scopedCalls} simulated requests from a generated candidate; ${scopedGroupCount} initial reviews + 1 correction + 1 changed review.`)

  // Every unsuccessful local correction stops after ONE request, including
  // schema/source defects, required wider changes and incomplete output.
  for(const defect of ['source','format','wider','truncated']){
    let repairs=0,reviews=0
    const previous=validateCompleteAnalysis(candidate,args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const before=structuredClone(previous)
    const state={stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],localizedRepair:{},modelState:{stage:'generation',attempt:2,previous,feedback:[issue('analysis.calculations[difference].explanation')]}}
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body)
      if(request.text.format.name!=='ash_complete_repair_v169'){reviews++;throw Error('A failed patch must not reach another model call')}
      repairs++
      if(defect==='truncated')return Response.json({status:'incomplete',id:'truncated-patch',incomplete_details:{reason:'max_output_tokens'},output_text:'{"changes":'})
      const value=cleanCalculation(previous.analysis.calculations[0])
      if(defect==='source')value.inputs[0].value='19000'
      if(defect==='format')value.id='unassigned'
      const output=defect==='wider'?{requires_full_correction:true,reason:'An additional action is needed.',changes:null}:{requires_full_correction:false,reason:'',changes:{edit_0:value}}
      return Response.json({status:'completed',id:'bad-patch',model:request.model,output_text:JSON.stringify(output)})
    }
    await assert.rejects(advanceCompleteAnalysis({...args,fetchImpl:transport,state}),error=>error.code===(defect==='truncated'?'provider_token_limit':defect==='wider'?'review_unresolved':'source_unresolved'))
    assert.equal(repairs,1);assert.equal(reviews,0);assert.deepEqual(previous,before)
  }
  let unexpectedCalls=0
  await assert.rejects(advanceCompleteAnalysis({...args,state:{stage:'analysis',scope:bigScope,research:[],modelState:{stage:'generation',attempt:3}},fetchImpl:async()=>{unexpectedCalls++;throw Error('No third candidate')}}),/Korrekturrunde/)
  const invalid=structuredClone(data);invalid.analysis.calculations[0].inputs[0].value='19000'
  await assert.rejects(advanceCompleteAnalysis({...args,state:{stage:'analysis',scope:bigScope,research:[],modelState:{stage:'review',attempt:1,candidate:invalid}},fetchImpl:async()=>{unexpectedCalls++;throw Error('No paid audit of invalid source input')}}),error=>error.code==='source_unresolved')
  assert.equal(unexpectedCalls,0)
  assert.equal(initialCalls,20,'maximum-size no-research fixture previously needed 37 initial calls')
  assert.equal(counts.total,22,'one local correction reduces the former 39-call scenario to 22')
  console.log(`Grouped complete-case correction: ${counts.total} simulated requests; ${initialCalls} for the first candidate, then 1 replacement + 1 changed review; all 25 sections covered by ${groupCount} current approvals. No live model cost measured.`)
}
