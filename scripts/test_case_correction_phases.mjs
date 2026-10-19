import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,completeAnalysisStage} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {caseLegalWorkingBasisNotice} from '../supabase/functions/_shared/caseEvidenceRules.mjs'
import {completeCaseCorrectionPhases,nextCaseCorrectionPhases} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {sealModelCheckpoint,openModelCheckpoint} from '../supabase/functions/_shared/modelCheckpoint.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {repairReplyWithFieldDecisions} from './fixtures/repairFieldDecisions.mjs'

// Exercise the real state machine with deliberately controlled replies. This
// reproduces a correction-budget/state-transition defect, not model accuracy.
const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
const topic={id:'basis',title:'Unterlagen',status:'open',conclusion:'Die vorhandenen Unterlagen sind dem Fall zugeordnet.',conditions:'Die fehlende Anlage ist noch zu beschaffen.',sources:[],step_ids:[]}
const initial={stage:'analysis',scope:{issues:[{id:'basis',title:topic.title,reason:'Unterlagen zuordnen.',calculation_needed:false}],research_topics:[]},research:[],discovery_gaps:[],draftAnalysis:{topics:[{...topic,conclusion:topic.conclusion+' SYNTHETIC_UNSUPPORTED_BASIS'}],calculations:[],limitations:[]},reconciliation_response_id:'synthetic-reconciliation',modelState:{stage:'generation',attempt:1,feedback:[],previous:null}}
const plan={...structuredClone(roadmapTestResult),topic_steps:[{id:'basis',step_ids:[roadmapTestResult.steps[0].id]}]}
const args={providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Original evidence only. Synthetic internal test.',input:[]},baseReviewContent:[]}
const binding={workflow:'synthetic-correction-phases'},secret='synthetic-only-checkpoint-key-never-a-real-secret',runId=crypto.randomUUID(),issuedAt=Date.now()

export async function correctionPhaseScenario(mode='fixed'){
  const calls=[],corrections=[],reviewsAfterPlanRepair=[],firstPlanStages=[]
  let planGenerated=false,fixtureFailure
  const fetchImpl=async(url,options)=>{
    try{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),name=request.text.format.name
      const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
      const assignment=payloads.find(item=>item.assigned_review)?.assigned_review
      calls.push({name,scope:assignment?.scope})
      let output
      if(name==='ash_complete_plan_v157'){
        assert.equal(planGenerated,false,'the plan is generated once, never regenerated to obtain another correction')
        planGenerated=true
        assert.equal(corrections.length,1)
        const supplied=payloads.find(item=>item.component==='roadmap').analysis
        assert(!JSON.stringify(supplied).includes('SYNTHETIC_UNSUPPORTED_BASIS'))
        output={...structuredClone(plan),opening:plan.opening+' SYNTHETIC_UNSUPPORTED_ACTION'}
      }else if(name==='ash_complete_repair_v169'){
        const assigned=payloads.find(item=>item.assigned_replacements).assigned_replacements
        corrections.push(assigned.map(item=>item.location))
        if(corrections.length===1){
          assert.equal(planGenerated,false,'foundation correction occurs before the first plan exists')
          assert.deepEqual(corrections[0],['analysis.topics[0]'])
          output={requires_full_correction:false,reason:'',changes:{[assigned[0].key]:topic}}
        }else{
          assert.equal(corrections.length,2,'each phase has at most one correction')
          assert.deepEqual(corrections[1],['opening'])
          const addressed=payloads.find(item=>item.previously_addressed_issues)?.previously_addressed_issues
          assert(addressed?.some(item=>item.location==='analysis.topics[0]'),'the earlier foundation finding remains available as a preservation check')
          output=mode==='wider'?{requires_full_correction:true,reason:'A necessary new action is outside the existing replacement.',changes:null}:{requires_full_correction:false,reason:'',changes:{[assigned[0].key]:mode==='unfixed'?plan.opening+' DIFFERENT_UNSUPPORTED_ACTION':plan.opening}}
        }
        output=repairReplyWithFieldDecisions(output,assigned)
      }else{
        assert.equal(name,'ash_evidence_review_v139')
        const candidate=payloads.find(item=>item.candidate).candidate
        const issues=[]
        if(candidate.analysis?.topics?.some(item=>item.conclusion.includes('SYNTHETIC_UNSUPPORTED_BASIS')))issues.push({code:'source',location:'analysis.topics[0]',reason:'Synthetic basis assertion lacks source support.'})
        if(candidate.opening?.includes('UNSUPPORTED_ACTION'))issues.push({code:'meaning',location:'opening',reason:'Synthetic opening wrongly treats an action as supported.'})
        if(mode==='foundation_again'&&candidate.opening)issues.push({code:'source',location:'analysis.topics[0]',reason:'Controlled second foundation objection; the same phase cannot be corrected again.'})
        if(corrections.length===2)reviewsAfterPlanRepair.push(assignment.scope)
        output={issues}
      }
      return Response.json({id:'phase-'+mode+'-'+calls.length,status:'completed',model:request.model,output_text:JSON.stringify(output)})
    }catch(error){fixtureFailure=error;throw error}
  }
  let flow={status:'processing',state:structuredClone(initial)},failure
  try{
    for(let n=0;flow.status==='processing'&&n<35;n++){
      // Resume through the same encryption boundary as worker invocations.
      const token=await sealModelCheckpoint({state:flow.state,binding,secret,runId,issuedAt})
      const restored=await openModelCheckpoint({token,binding,secret})
      flow=await advanceCompleteAnalysis({...args,state:restored.state,fetchImpl})
      if(flow.state?.foundationReview?.status==='passed'&&flow.state.draftAnalysis&&!flow.state.localizedRepair)firstPlanStages.push(completeAnalysisStage(flow.state))
    }
  }catch(error){failure=error}
  assert.ifError(fixtureFailure)
  return {flow,failure,calls,corrections,reviewsAfterPlanRepair,firstPlanStages}
}

const fixed=await correctionPhaseScenario()
export const completedCorrectionPhaseResult=fixed.flow.result
assert.ifError(fixed.failure)
assert(fixed.firstPlanStages.length&&fixed.firstPlanStages.every(stage=>stage==='generation'),'the next step is the first plan generation, not a second foundation correction')
assert.equal(fixed.flow.status,'completed','a first-draft plan defect must remain repairable after the separately approved foundation correction')
assert.equal(fixed.flow.attempts,3)
assert.deepEqual(fixed.corrections,[['analysis.topics[0]'],['opening']])
assert.deepEqual(fixed.flow.result.analysis.verification.content_correction_phases,[['foundation'],['roadmap']])
assert.equal(fixed.flow.result.analysis.verification.correction_response_ids.length,2)
assert.equal(fixed.flow.result.opening,caseLegalWorkingBasisNotice(source.case,'de')+'\n\n'+plan.opening)
assert.equal(fixed.flow.result.analysis.topics[0].conclusion,topic.conclusion)
assert(fixed.reviewsAfterPlanRepair.includes('roadmap'),'changed plan requires independent approval')
assert(!fixed.reviewsAfterPlanRepair.some(scope=>['analysis','calculations'].includes(scope)),'the unchanged foundation retains its exact comparison and approvals after a roadmap-only patch')

for(const mode of ['unfixed','wider','foundation_again']){
  const result=await correctionPhaseScenario(mode)
  assert.equal(result.failure?.code,'review_unresolved')
  assert(!result.flow.result,'unresolved material defects never become customer output')
  assert.equal(result.corrections.length,mode==='foundation_again'?1:2)
}
// The budget is not reset by a new worker, a mixed replacement, malformed
// checkpoint metadata, or an old checkpoint without phase accounting.
const foundationTarget=[{path:['analysis','topics',0]}],roadmapTarget=[{path:['opening']}]
const mixed=nextCaseCorrectionPhases([],foundationTarget.concat(roadmapTarget))
assert.deepEqual(mixed,[['foundation','roadmap']])
assert.equal(nextCaseCorrectionPhases(mixed,foundationTarget),null)
assert.equal(nextCaseCorrectionPhases(mixed,roadmapTarget),null)
assert.deepEqual(completeCaseCorrectionPhases({modelState:{attempt:2}}),mixed,'legacy used correction cannot acquire new permission')
for(const history of [[['foundation'],['foundation']],[['roadmap'],['roadmap']],[['unknown']],[],[['foundation','roadmap'],['roadmap']]]){
  const state={...initial,modelState:{stage:'generation',attempt:history.length+1},contentCorrectionPhases:history}
  if(!history.length)state.modelState.attempt=2
  let calls=0
  await assert.rejects(advanceCompleteAnalysis({...args,state,fetchImpl:async()=>{calls++;throw Error('Invalid history must stop before transport')}}),/Korrekturrunde/)
  assert.equal(calls,0)
}
console.log('Separate foundation/roadmap correction: sealed continuation, one first plan, both independent re-reviews, unchanged foundation preserved, repeated/wider defects rejected. Controlled replies only; no real provider calls or live-quality claim.')
