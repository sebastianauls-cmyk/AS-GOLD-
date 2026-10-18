import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {advanceCompleteAnalysis,completeAnalysisStage} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {completeReviewLocations,resolveReviewIssueLocations,resolveQuotedTopicIssueLocations} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'

// Adversarial, controlled provider replies test the real state machine. They
// do not establish live model accuracy or an accepted customer case.
const source=roadmapSource({...roadmapTestCase,title:'Synthetischer Grundlagen-Test',goal:'Den dokumentierten Eingang erhalten; nur fehlende Unterlagen klären.'},roadmapTestDocuments,[])
const scope={issues:[{id:'basis',title:'Grundlagen',reason:'Belege zuordnen.',calculation_needed:false}],research_topics:[]}
const topic={id:'basis',title:'Grundlagen',status:'open',conclusion:'Die vorhandenen Unterlagen sind dem Fall zugeordnet.',conditions:'Die konkrete offene Frage ist anhand der angeforderten Unterlage zu klären.',sources:[],step_ids:[]}
const analysis={topics:[topic],calculations:[],limitations:[]}
const plan={...structuredClone(roadmapTestResult),topic_steps:[{id:'basis',step_ids:[roadmapTestResult.steps[0].id]}]}
const initial={stage:'analysis',scope,research:[],discovery_gaps:[],draftAnalysis:analysis,reconciliation_response_id:'synthetic-reconciliation',modelState:{stage:'generation',attempt:1,feedback:[],previous:null}}
const args={providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Original evidence only. Internal synthetic test.',input:[]},baseReviewContent:[]}

function harness(mode){
  const calls=[]
  let repaired=false
  const state=structuredClone(initial)
  if(mode!=='valid')state.draftAnalysis.topics[0].conclusion+=' UNBELEGTE RECHTSPFLICHT.'
  const fetchImpl=async(url,options)=>{
    if(url!=='https://api.openai.com/v1/responses')return new Response('',{status:404})
    const request=JSON.parse(options.body),name=request.text.format.name
    const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
    const assignment=payloads.find(item=>item.assigned_review)?.assigned_review
    calls.push({name,scope:assignment?.scope})
    let output
    if(name==='ash_complete_plan_v157'){
      assert(calls.some(call=>call.scope==='analysis')&&calls.some(call=>call.scope==='calculations'),'both foundation scopes precede any plan')
      const supplied=payloads.find(item=>item.component==='roadmap').analysis
      assert(!JSON.stringify(supplied).includes('UNBELEGTE RECHTSPFLICHT'),'unsupported claims never enter downstream generation')
      output=plan
    }else if(name==='ash_complete_repair_v169'){
      assert(!repaired,'there is one shared substantive correction budget')
      repaired=true
      const edits=payloads.find(item=>item.assigned_replacements).assigned_replacements
      if(mode==='wider')output={requires_full_correction:true,reason:'A new topic is necessary outside the assigned replacement.',changes:null}
      else output={requires_full_correction:false,reason:'',changes:Object.fromEntries(edits.map(edit=>[edit.key,mode==='unfixed'?edit.previous:{...edit.previous,conclusion:topic.conclusion}]))}
    }else{
      assert.equal(name,'ash_evidence_review_v139')
      const candidate=payloads.find(item=>item.candidate).candidate
      const bad=candidate.analysis?.topics?.some(item=>item.conclusion.includes('UNBELEGTE RECHTSPFLICHT'))
      output={issues:bad?[{code:'source',location:'analysis.topics[0]',reason:'The assertion of a legal duty has no supplied primary text.'}]:[]}
    }
    return Response.json({id:'foundation-'+calls.length,status:'completed',model:request.model,output_text:JSON.stringify(output)})
  }
  return {state,calls,fetchImpl}
}

for(const mode of ['valid','corrected','unfixed','wider']){
  const h=harness(mode)
  let flow={status:'processing',state:h.state},failure
  try{for(let n=0;flow.status==='processing'&&n<30;n++)flow=await advanceCompleteAnalysis({...args,fetchImpl:h.fetchImpl,state:flow.state})}catch(error){failure=error}
  const plans=h.calls.filter(call=>call.name==='ash_complete_plan_v157')
  if(['unfixed','wider'].includes(mode)){
    assert.equal(failure?.code,'review_unresolved');assert.equal(plans.length,0);assert(!flow.result)
  }else{
    assert.equal(failure,undefined);assert.equal(flow.status,'completed');assert.equal(plans.length,1)
    const proof=flow.result.analysis.verification
    assert.equal(proof.foundation_review_version,'v173')
    assert.equal(proof.foundation_review_response_ids.length,2)
    assert.equal(proof.reused_review_response_ids.length,2,'final assembly reuses only matching foundation receipts')
    if(mode==='valid')assert.equal(h.calls.filter(call=>call.scope).length,4,'moving audits earlier does not add paid audits')
  }
}

// Mutating an approved foundation, its evidence or the review policy must
// invalidate approval BEFORE downstream text is generated, not just at export.
const h=harness('valid')
let approved={status:'processing',state:h.state}
for(let n=0;approved.state.foundationReview?.status!=='passed'&&n<6;n++)approved=await advanceCompleteAnalysis({...args,fetchImpl:h.fetchImpl,state:approved.state})
assert.equal(approved.state.foundationReview.status,'passed')
assert.equal(completeAnalysisStage(h.state),'review')
for(const change of ['finding','research','original','policy','receipt']){
  const state=structuredClone(approved.state),modified={...args,source:structuredClone(source)}
  if(change==='finding')state.draftAnalysis.topics[0].conditions+=' Weitere Unterlage fehlt.'
  if(change==='research')state.discovery_gaps.push('A newly observed source gap.')
  if(change==='original')modified.source.documents[0].extracted_text+=' Zusätzliche synthetische Aussage.'
  if(change==='policy')modified.baseRequest={...args.baseRequest,instructions:args.baseRequest.instructions+' New review context.'}
  if(change==='receipt')state.foundationReview.binding='0'.repeat(64)
  const before=h.calls.length
  const next=await advanceCompleteAnalysis({...modified,fetchImpl:h.fetchImpl,state})
  assert(!h.calls.slice(before).some(call=>call.name==='ash_complete_plan_v157'),'changed '+change+' must re-enter foundation validation')
  assert.equal(next.state.foundationReview.status,'reviewing')
  assert.equal(state.foundationReview.status,'passed','validation does not mutate its input checkpoint')
}
console.log('Early foundation: unsupported claims block plans, one repair is re-reviewed, identical approvals are reused, changed evidence/content/policy invalidate before writing; provider replies simulated.')

// A reviewer can quote an existing claim but report the collection location.
// Exercise that accepted global finding from related context, outside the
// topic's own review assignment. It may select one bounded correction, never
// waive another review, add a topic, or authorize a second correction.
const unsupported='Die Jahresabrechnung war laut Original bereits vollständig geprüft.'
{
  const candidate={analysis:{topics:[{...topic,conditions:unsupported,sources:[]},{...topic,id:'second'}]}}
  const base={code:'source',location:'analysis.topics',reason:''}
  const original=structuredClone(candidate)
  for(const [start,end] of [['„','“'],['“','”'],['"','"'],['«','»']]){
    const finding={...base,reason:`The condition ${start}${unsupported}${end} lacks original support.`}
    const resolved=resolveQuotedTopicIssueLocations([finding],candidate)
    assert.deepEqual(resolved,[{...finding,location:'analysis.topics[0]'}])
    assert.equal(finding.location,'analysis.topics','normalization does not mutate the original finding')
    assert.deepEqual(resolveQuotedTopicIssueLocations(resolved,candidate),resolved)
  }
  for(const finding of [
    {...base,reason:'An unquoted wider defect requires another topic.'},
    {...base,reason:'The field „conditions“ is wrong.'},
    {...base,reason:`The condition „${unsupported.toLowerCase()}“ is unsupported.`},
    {...base,reason:'The condition „Die Jahresabrechnung war … vollständig geprüft.“ is unsupported.'},
    {...base,location:'analysis',reason:`„${unsupported}“`},
    {...base,location:'unassigned_id',reason:`„${unsupported}“`}
  ])assert.deepEqual(resolveQuotedTopicIssueLocations([finding],candidate),[finding],'non-exact, short, wider and ID findings remain unresolved')
  const finding={...base,reason:`The conditions assert „${unsupported}“ without support.`}
  const calculationSection=[{scope:'calculations',calculation_ids:[]}]
  assert(!completeReviewLocations(candidate,calculationSection).includes('analysis.topics[0]'))
  assert.deepEqual(resolveReviewIssueLocations([finding],candidate,calculationSection),[finding],'review assignment validation remains unchanged before quote resolution')
  candidate.analysis.topics[1].conclusion=unsupported
  assert.deepEqual(resolveQuotedTopicIssueLocations([finding],candidate),[finding],'the same claim in two topics is ambiguous')
  candidate.analysis.topics[1].conclusion='Another independently quoted unsupported condition.'
  const two={...finding,reason:finding.reason+' Also „'+candidate.analysis.topics[1].conclusion+'“.'}
  assert.deepEqual(resolveQuotedTopicIssueLocations([two],candidate),[two],'two distinct quoted topics cannot choose one target')
  candidate.analysis.topics[0].conditions=topic.conditions
  candidate.analysis.topics[0].sources=[{url:'https://example.invalid/synthetic',quote:unsupported}]
  assert.deepEqual(resolveQuotedTopicIssueLocations([finding],candidate),[finding],'matching only a cited source never selects its topic')
  assert.deepEqual(original.analysis.topics[0].conditions,unsupported)
}
for(const outcome of ['fixed','unfixed','wider','ambiguous','paraphrased']){
  const state=structuredClone(initial),calls=[]
  state.draftAnalysis.topics[0].conditions+=' '+unsupported
  if(outcome==='ambiguous'){
    state.scope.issues.push({...state.scope.issues[0],id:'second'})
    state.draftAnalysis.topics.push({...structuredClone(state.draftAnalysis.topics[0]),id:'second'})
  }
  let repairs=0,rechecked=false,fixtureFailure
  const fetchImpl=async(url,options)=>{
    try{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),name=request.text.format.name
      const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
      const assignment=payloads.find(item=>item.assigned_review)?.assigned_review
      calls.push({name,scope:assignment?.scope})
      let output
      if(name==='ash_complete_repair_v169'){
        assert.equal(++repairs,1,'a quoted finding cannot add a correction round')
        assert(calls.some(call=>call.scope==='analysis')&&calls.some(call=>call.scope==='calculations'))
        const edits=payloads.find(item=>item.assigned_replacements).assigned_replacements
        assert.deepEqual(edits.map(edit=>edit.location),['analysis.topics[0]'])
        output=outcome==='wider'?{requires_full_correction:true,reason:'A missing topic is required beyond this existing item.',changes:null}:{requires_full_correction:false,reason:'',changes:{edit_0:outcome==='unfixed'?edits[0].previous:topic}}
      }else if(name==='ash_complete_plan_v157'){
        assert(rechecked,'the changed foundation must pass independent review before any plan')
        assert(!JSON.stringify(payloads.find(item=>item.component==='roadmap').analysis).includes(unsupported))
        output=plan
      }else{
        assert.equal(name,'ash_evidence_review_v139')
        const related=payloads.find(item=>item.related_output).related_output
        const bad=related.topics.some(item=>item.conditions.includes(unsupported))
        if(repairs&&assignment.scope==='analysis'){
          rechecked=true
          const comparison=payloads.find(item=>item.correction_comparison)?.correction_comparison
          if(outcome==='fixed'){
            assert(comparison.changes.some(change=>change.location==='analysis.topics[0]'))
            assert(comparison.previous_findings.some(finding=>finding.reason.includes(unsupported)),'the full original objection survives normalization')
          }
        }
        const quote=outcome==='paraphrased'?unsupported.replace('bereits vollständig','schon umfassend'):unsupported
        output={issues:bad&&assignment.scope==='calculations'?[{code:'source',location:'analysis.topics',reason:`The conditions assert: „${quote}“ This qualification has no support in the original.`}]:[]}
      }
      return Response.json({id:'quoted-'+outcome+'-'+calls.length,status:'completed',model:request.model,output_text:JSON.stringify(output)})
    }catch(error){fixtureFailure=error;throw error}
  }
  let flow={status:'processing',state},failure
  try{for(let n=0;flow.status==='processing'&&n<30;n++)flow=await advanceCompleteAnalysis({...args,state:flow.state,fetchImpl})}catch(error){failure=error}
  assert.ifError(fixtureFailure)
  if(outcome==='fixed'){
    assert.ifError(failure);assert.equal(flow.status,'completed');assert.equal(flow.attempts,2)
    assert.equal(repairs,1);assert.deepEqual(flow.result.analysis.topics[0].conditions,topic.conditions)
  }else{
    assert.equal(failure?.code,'review_unresolved');assert(!flow.result)
    assert.equal(repairs,['unfixed','wider'].includes(outcome)?1:0)
    assert(!calls.some(call=>call.name==='ash_complete_plan_v157'))
  }
}
console.log('Quoted collection findings: one exact topic can enter the existing repair; ambiguous/paraphrased findings, wider changes and unresolved re-reviews remain blocked; provider replies simulated.')

// Replay the complete rejected topic from the October 18 synthetic live run.
// A changed conclusion must not conceal an unsupported maturity claim left
// in conditions. This tests the actual state machine, not model accuracy.
{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/rejectedKautionCorrection.json',import.meta.url),'utf8'))
  const state=structuredClone(initial),calls=[]
  state.scope.issues[0].id=fixture.before.id
  state.draftAnalysis.topics=[fixture.before]
  // Supply precisely the cited source; it proves the default rule, not the
  // unsupported maturity prerequisite reported by both independent reviews.
  const citation=fixture.before.sources[0]
  state.research=[{url:citation.url,title:'Cited statutory text',source_text:citation.quote,checked_at:new Date().toISOString(),content_sha256:Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(citation.quote))).toString('hex')}]
  let corrections=0,reviewsAfter=0,fixtureFailure
  const fetchImpl=async(url,options)=>{
    try{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),name=request.text.format.name
      const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
      calls.push(name)
      let output
      if(name==='ash_complete_repair_v169'){
        assert.equal(++corrections,1)
        const assignments=payloads.find(item=>item.assigned_replacements).assigned_replacements
        assert.equal(assignments.length,1)
        assert.equal(assignments[0].previous.conditions,fixture.before.conditions,'the whole conditions field was available for correction')
        assert.equal(assignments[0].previous.conclusion,fixture.before.conclusion)
        output={requires_full_correction:false,reason:'',changes:{[assignments[0].key]:fixture.after}}
      }else{
        assert.equal(name,'ash_evidence_review_v139','no downstream plan may be generated')
        const assignment=payloads.find(item=>item.assigned_review).assigned_review
        if(corrections)reviewsAfter++
        const finding=corrections?fixture.remaining_finding:fixture.first_finding
        output={issues:assignment.scope==='analysis'?[{...finding,location:'analysis.topics[0]'}]:[]}
      }
      return Response.json({id:'remaining-condition-'+calls.length,status:'completed',model:request.model,output_text:JSON.stringify(output)})
    }catch(error){fixtureFailure=error;throw error}
  }
  let flow={status:'processing',state},failure
  try{for(let n=0;flow.status==='processing'&&n<30;n++)flow=await advanceCompleteAnalysis({...args,state:flow.state,fetchImpl})}catch(error){failure=error}
  assert.ifError(fixtureFailure)
  assert.equal(failure?.code,'review_unresolved');assert.equal(corrections,1);assert(reviewsAfter>0)
  assert(!flow.result);assert(!calls.includes('ash_complete_plan_v157'))
}
console.log('Stored incomplete correction: changed conclusion plus unsupported condition remains rejected after one repair; no plan/result and no second correction; reviewer responses replayed, model quality not measured.')

