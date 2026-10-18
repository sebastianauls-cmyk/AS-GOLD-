import assert from 'node:assert/strict'
import {validateCompleteAnalysis,advanceCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {validateQuestionActionCoverage,questionActionStep} from '../supabase/functions/_shared/questionActionCoverage.mjs'
import {localizedRepairTargets,applyLocalizedRepair} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {roadmapSteps,roadmapSource,ROADMAP_LANGUAGES} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult,roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'

// Reproduce the observed omission using the exact rejected action text.
// The question is a synthetic regression fixture, not a claimed recovered
// historical candidate or a determination of the housing status.
const omittedAction='Die simulierte Antwort nach Positionen erfassen: Parkett, Betriebskostenreserve, Anlageform, Anlagezeitraum, Zinssatz, Vermögenstrennung, Gesamterträge und etwaige weitere Auszahlung.'
const question={question:'Handelt es sich tatsächlich um Wohnraum in einem Studenten- oder Jugendwohnheim?',who:'Testkundin und Mustervermietung',why:'Der tatsächliche Status ist noch ungeklärt.',collect_step_id:'anfragen',check_step_id:'antworten'}
const candidate={...structuredClone(roadmapTestResult),open_questions:[question],analysis:{topics:[{id:'scope',title:'Klärung',status:'open',conclusion:'Der Sachverhalt bleibt zu klären.',conditions:'Die angeforderte Angabe fehlt.',sources:[],step_ids:['anfragen','antworten']}],calculations:[],limitations:[]}}
candidate.steps[2].action=omittedAction
const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
const options={outputLanguage:'de',referenceLanguage:'de',scope:{issues:[{id:'scope'}]},research:[]}
const validate=process.env.ASH_COVERAGE_BASE?(await import(process.env.ASH_COVERAGE_BASE)).validateCompleteAnalysis:validateCompleteAnalysis
const old=structuredClone(candidate)
delete old.open_questions[0].collect_step_id;delete old.open_questions[0].check_step_id
assert.throws(()=>validate(old,source,options),error=>error.analysisIssues?.some(issue=>issue.location==='open_questions[0]'),'the original unmapped question must fail the real complete-candidate gate before paid review')
const accepted=validate(candidate,source,options)
assert.equal(accepted.steps[2].action,omittedAction,'stored base prose is preserved, never silently repaired as evidence')
const record={...roadmapTestRecord(),result:accepted}
const rendered=roadmapSteps(record)
assert(rendered[1].action.includes(question.question),'collection visibly carries the complete question')
assert(rendered[2].action.includes(question.question),'answer checking visibly carries the complete question despite the historical omission')
assert.equal(rendered[2].action,questionActionStep(accepted.steps[2],accepted.open_questions).action,'review and customer action use the identical function')
assert.deepEqual(roadmapSteps(record),rendered,'repeated rendering adds no duplicates or mutations')
assert.equal(record.result.steps[2].action,omittedAction)
const blocks=roadmapExportBlocks(record)
assert(blocks.some(block=>block.text.includes('Antwort prüfen: '+question.question)),'actual Word/PDF block builder preserves the complete checklist')
for(const language of ROADMAP_LANGUAGES)assert(questionActionStep(candidate.steps[2],[question],language).action.includes(question.question),'all supported languages preserve the complete question')

for(const mutate of [
  x=>{delete x.open_questions[0].collect_step_id},
  x=>{x.open_questions[0].check_step_id='missing'},
  x=>{x.open_questions[0].check_step_id='frist'},
  x=>{x.steps[2].depends_on=[]},
  x=>{x.open_questions[0].who=' '},
  x=>{x.open_questions[0].question=''},
]){
  const invalid=structuredClone(candidate);mutate(invalid)
  assert.throws(()=>validateQuestionActionCoverage(invalid),error=>error.analysisIssues?.[0].location==='open_questions[0]')
}
const same=structuredClone(candidate);same.open_questions[0].check_step_id='anfragen';validateQuestionActionCoverage(same)
const transitive=structuredClone(candidate);transitive.open_questions[0].check_step_id='abschluss';validateQuestionActionCoverage(transitive)
const legacy=structuredClone(roadmapTestResult);legacy.open_questions=legacy.open_questions.map(({question,who,why})=>({question,who,why}))
assert.equal(roadmapSteps({...record,result:legacy})[2].action,legacy.steps[2].action,'historical records do not acquire guessed links')
const oversized=structuredClone(candidate)
oversized.open_questions=Array.from({length:9},()=>structuredClone(question))
assert.equal(localizedRepairTargets(oversized,[{code:'meaning',location:'steps[2]',reason:'Synthetic task defect.'}],COMPLETE_ANALYSIS_SCHEMA),null,'question/task dependencies cannot enlarge the existing eight-item repair budget')

for(const location of ['open_questions[0]','steps[2]']){
  const targets=localizedRepairTargets(candidate,[{code:'meaning',location,reason:'Die Frage und ihre Aufgaben passen noch nicht zusammen.'}],COMPLETE_ANALYSIS_SCHEMA)
  assert.deepEqual(new Set(targets.map(target=>target.location)),new Set(['open_questions[0]','steps[1]','steps[2]']),'both task references stay editable in the existing single correction')
  const changes=Object.fromEntries(targets.map(target=>[target.key,structuredClone(target.path.reduce((value,key)=>value[key],candidate))]))
  const q=targets.find(target=>target.path[0]==='open_questions');changes[q.key].question='Welche konkrete Wohnform ist anhand der Unterlagen belegt?'
  const patched=applyLocalizedRepair({requires_full_correction:false,reason:'',changes},targets,candidate,COMPLETE_ANALYSIS_SCHEMA,value=>value)
  validateQuestionActionCoverage(patched)
  const action=questionActionStep(patched.steps[2],patched.open_questions).action
  assert(action.includes(changes[q.key].question));assert(!action.includes(question.question),'correction regenerates tasks from the current question, with no stale checklist')
  assert.deepEqual(patched.analysis,candidate.analysis,'unrelated substantive findings remain unchanged')
}

// Exercise the real persisted state machine with controlled reviewer replies.
// Mechanical coverage must never act as semantic approval or add retry rounds.
for(const mode of ['covered','unchanged','reordered','changed_wrong','corrected']){
  const initial=structuredClone(candidate)
  if(mode!=='covered')Object.assign(initial.open_questions[0],{collect_step_id:'frist',check_step_id:'frist'})
  let calls=0,repairs=0,reviewedTasks=0,reviewsAfterRepair=0
  const fetchImpl=async(_url,init)=>{
    const request=JSON.parse(init.body)
    const payloads=request.input.flatMap(message=>message.content).flatMap(item=>{try{return [JSON.parse(item.text)]}catch{return []}})
    let parsed
    if(request.text.format.name==='ash_complete_repair_v169'){
      repairs++
      const assignments=payloads.find(item=>item.assigned_replacements).assigned_replacements
      const changes=Object.fromEntries(assignments.map(item=>[item.key,structuredClone(item.previous)]))
      const questionKey=assignments.find(item=>item.location==='open_questions[0]').key
      if(mode==='changed_wrong')changes[questionKey].why+=' Die Wohnform muss noch erfragt werden.'
      if(mode==='corrected')Object.assign(changes[questionKey],{collect_step_id:'anfragen',check_step_id:'antworten'})
      if(mode==='reordered')for(const key of Object.keys(changes))changes[key]=Object.fromEntries(Object.entries(changes[key]).reverse())
      parsed={requires_full_correction:false,reason:'',changes}
    }else{
      assert.equal(request.text.format.name,'ash_evidence_review_v139')
      if(repairs)reviewsAfterRepair++
      const assignment=payloads.find(item=>item.assigned_review).assigned_review
      const part=payloads.find(item=>item.candidate).candidate
      for(const step of part.steps||[])if(step.id==='antworten'&&mode==='covered'){
        assert(step.action.includes(question.question),'the actual paid-review payload carries the complete generated task')
        reviewedTasks++
      }
      parsed={issues:assignment.question_indexes?.includes(0)&&part.open_questions[0].collect_step_id==='frist'?[{code:'meaning',location:'open_questions[0]',reason:'Der zugewiesene Fristschritt beschafft und prüft die Angabe zur Wohnform nicht sachgerecht.'}]:[]}
    }
    return new Response(JSON.stringify({status:'completed',id:'question-regression-'+mode+'-'+(++calls),model:request.model,output_text:JSON.stringify(parsed)}))
  }
  let run={status:'processing',state:{stage:'analysis',scope:options.scope,research:[],discovery_gaps:[],modelState:{stage:'review',attempt:1,candidate:initial,structuralFeedback:[],feedback:[],model:'synthetic',response_id:'synthetic-plan'}}},failure
  try{
    for(let i=0;i<30&&run.status==='processing';i++)run=await advanceCompleteAnalysis({providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Internal synthetic regression.',input:[]},baseReviewContent:[],fetchImpl,state:run.state})
  }catch(error){failure=error}
  if(mode==='covered'){
    assert.ifError(failure);assert.equal(run.status,'completed');assert(reviewedTasks>0);assert.equal(repairs,0)
    assert.equal(run.result.analysis.verification.question_action_version,'v1')
    assert(roadmapSteps({...record,result:run.result})[2].action.includes(question.question))
  }else if(mode==='corrected'){
    assert.ifError(failure);assert.equal(run.status,'completed');assert.equal(repairs,1);assert(reviewsAfterRepair>0)
    assert.equal(run.result.analysis.verification.question_action_version,'v1')
    assert.equal(run.result.open_questions[0].collect_step_id,'anfragen')
    assert(roadmapSteps({...record,result:run.result})[2].action.includes(question.question))
  }else{
    assert.equal(failure?.code,'review_unresolved');assert.equal(repairs,1);assert.notEqual(run.status,'completed')
    assert(!run.result,'a syntactically valid but semantically wrong assignment never becomes an accepted result')
    if(mode==='changed_wrong')assert(reviewsAfterRepair>0,'a real text change is independently reviewed and can still be rejected')
    else{
      assert.equal(reviewsAfterRepair,0,'an unchanged rejected candidate must stop before another paid review')
      assert(failure.issues.some(item=>item.reason.includes('nicht verändert')),'terminal feedback explains the ineffective correction')
    }
  }
}
console.log('Question action coverage: missing/invalid links rejected; collection, assessment, repair and exports retain the complete question. Unchanged repairs stop without another review; actual changes still require review. Synthetic, no live model calls.')
