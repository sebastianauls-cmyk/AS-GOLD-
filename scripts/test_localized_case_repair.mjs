import {repairReplyWithFieldDecisions} from './fixtures/repairFieldDecisions.mjs'
import {PAYMENT_DATE_ATTRIBUTION_RULES} from '../supabase/functions/_shared/caseEvidenceRules.mjs'
import {reconciliationFixture} from './fixtures/completeCaseReconciliation.mjs'
import assert from 'node:assert/strict'
import {RESEARCH_SCOPE_RULES,advanceCompleteAnalysis,foundationReviewCoverage,validateCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA,completeReviewCoverage,completeReviewGroups} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {completeReviewLocations,resolveReviewIssueLocations,localizedRepairTargets,localizedRepairSchema,applyLocalizedRepair,createCorrectionTrace,correctionFailureDiagnostics,safeCorrectionDiagnostic} from '../supabase/functions/_shared/completeCaseRepair.mjs'

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
    assert.deepEqual(targets.find(target=>JSON.stringify(target.path)===JSON.stringify([...path,1])).path,[...path,1],'the assigned original ID selects its whole-result item, not local index zero')
    assert.equal(resolved[0].reason,finding.reason);assert.equal(resolved[0].code,finding.code)
    assert.equal(finding.location,original.id,'normalization never mutates provider findings')
    assert.deepEqual(resolveReviewIssueLocations(resolved,data,sections),resolved,'full paths remain unchanged')
    for(const id of ['unknown_id',get(data,path)[0].id]){
      const unresolved=resolveReviewIssueLocations([issue(id)],data,sections)
      assert.equal(unresolved[0].location,id,'unknown and out-of-assignment IDs are never guessed')
      assert.equal(localizedRepairTargets(data,unresolved,schema),null)
    }
    const sourceFinding=resolveReviewIssueLocations([{...finding,code:'source'}],data,sections)
    assert.deepEqual(localizedRepairTargets(data,sourceFinding,schema).find(target=>JSON.stringify(target.path)===JSON.stringify([...path,1])).path,[...path,1],'a precisely located source finding uses the same bounded correction')
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
  assert.deepEqual(localizedRepairTargets(ambiguous,[issue('analysis.topics[0].conclusion')],schema).find(target=>target.location.startsWith('analysis.topics')).path,['analysis','topics',0],'a canonical index always selects the assigned position')
  assert.deepEqual(localizedRepairTargets(ambiguous,[issue('analysis.topics["0"].conclusion')],schema).find(target=>target.location.startsWith('analysis.topics')).path,['analysis','topics',1],'a quoted numeric ID selects that original ID instead of an index')
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
  assert.equal(localizedRepairTargets(data,data.analysis.topics.slice(0,8).map(t=>issue(`analysis.topics[${t.id}]`)),schema),null,'eight topics plus their existing limitations exceed the unchanged eight-replacement bound')
  const longLimitations=structuredClone(data)
  longLimitations.analysis.limitations=['An existing dependent limitation. '.repeat(700)]
  assert.equal(localizedRepairTargets(longLimitations,[issue('analysis.topics[0]')],schema),null,'a required limitation exceeding the text budget stops correction instead of being silently locked')
  // Expanded, verified quotations can dominate four otherwise small topic
  // replacements. The model returns passage IDs, never those literal texts.
  const heavilyCited=structuredClone(data)
  const longPassage='A long previously verified statutory passage. '.repeat(300)
  for(const topic of heavilyCited.analysis.topics.slice(0,4))topic.sources=[{url:'https://www.gesetze-im-internet.de/estg/__22.html',quote:longPassage}]
  const citedFindings=[0,1,2,3].map(index=>issue(`analysis.topics[${index}]`))
  assert(JSON.stringify(heavilyCited.analysis.topics.slice(0,4)).length>20000)
  assert.deepEqual(localizedRepairTargets(heavilyCited,citedFindings,schema)?.map(target=>target.path),[['analysis','limitations'],...[0,1,2,3].map(index=>['analysis','topics',index]),['steps',0]],'verified quote expansion must not block bounded topics, limitations and their existing linked step')
  assert(heavilyCited.analysis.topics.slice(0,4).every(topic=>topic.sources[0].quote===longPassage),'size accounting never truncates the evidence used by validation or review')
  heavilyCited.analysis.topics[0].conclusion='An oversized editable conclusion. '.repeat(800)
  assert.equal(localizedRepairTargets(heavilyCited,citedFindings,schema),null,'editable narrative still has the same size limit')
  const assignedLocations=completeReviewLocations(data,[{scope:'analysis',topic_ids:[data.analysis.topics[1].id]}])
  assert(assignedLocations.includes('analysis.topics[1]'))
  assert(!assignedLocations.includes('analysis.topics[0]'),'an unassigned full path cannot select a correction')
  assert(!assignedLocations.includes('analysis.topics[1] und Berechnungsabdeckung'),'compound prose is not a review location')

  // Replay a local unsupported eligibility detail through the actual workflow,
  // then prove that a failed correction, fabricated quote and invalid location
  // still cannot become an accepted customer result. No live API calls.
  for(const defect of ['source','meaning'])for(const outcome of ['fixed','unresolved','regression','bad_quote','unassigned','compound','global']){
    const previous=validateCompleteAnalysis(structuredClone(candidate),args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const original=structuredClone(previous)
    const defectText=defect==='meaning'?' Missing a concrete follow-up action for the documented payment question.':' Unsupported synthetic eligibility detail.'
    previous.analysis.topics[0].conditions+=defectText
    if(defect==='meaning')previous.steps[1].action='Wait indefinitely without a concrete next action.'
    const expectedReviews=completeReviewGroups(previous).length
    let repairCalls=0,reviewCalls=0,flaggedSource=false,fixtureFailure
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),payloads=request.input.flatMap(message=>message.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
      if(request.text.format.name!=='ash_case_scope')assert(request.instructions.includes(PAYMENT_DATE_ATTRIBUTION_RULES),'bounded corrections retain the same payment-date evidence conditions')
      if(request.text.format.name!=='ash_case_scope')assert([request.instructions,...request.input.filter(message=>message.role==='developer').flatMap(message=>message.content.map(item=>item.text))].some(text=>text.includes(RESEARCH_SCOPE_RULES)),'complete generation, reconciliation, local repair and review preserve partial research scope')
      let output
      if(request.text.format.name==='ash_complete_repair_v169'){
        repairCalls++
        assert.equal(reviewCalls,expectedReviews,'all initial mandatory reviews precede the single local correction')
        const assigned=payloads.find(p=>p.assigned_replacements).assigned_replacements
        assert.deepEqual(assigned.map(t=>t.location),['analysis.limitations','analysis.topics[0]','steps[1]'])
        const replacement=structuredClone((outcome==='unresolved'?previous:original).analysis.topics[0])
        if(outcome==='regression')replacement.conditions+=' New synthetic defect introduced in the changed section.'
        if(outcome==='bad_quote')replacement.sources=[{url:'https://example.invalid/not-fetched',quote:'A fabricated legal condition.'}]
        output=repairReplyWithFieldDecisions({requires_full_correction:false,reason:'',changes:{edit_0:original.analysis.limitations,edit_1:replacement,edit_2:original.steps[1]}},assigned)
      }else{
        assert.equal(request.text.format.name,'ash_evidence_review_v139')
        reviewCalls++
        const part=payloads.find(p=>p.candidate).candidate
        const locations=request.text.format.schema.properties.issues.items.properties.location.enum
        assert(Array.isArray(locations)&&locations.includes('analysis'),'a wider defect remains reportable')
        const comparison=payloads.find(p=>p.correction_comparison)?.correction_comparison
        if(repairCalls&&part.analysis?.topics&&['fixed','regression'].includes(outcome)){
          const change=comparison?.changes.find(change=>change.location==='analysis.topics[0]')
          assert(change,'the affected independent review receives the server-built before/after comparison')
          assert(change.before.text.includes(defectText.trim()))
          assert(!change.after.text.includes(defectText.trim()),'resolved old wording is not presented as the current candidate')
          assert.notEqual(change.before.sha256,change.after.sha256)
          assert(request.input.some(message=>message.role==='developer'&&message.content.some(block=>block.text.includes('never treat a corrected old finding as still present'))),'comparison rules stay in server instructions, not source data')
        }
        const regression=part.analysis?.topics?.some(t=>t.conditions.includes('New synthetic defect'))
        const reject=(regression||part.analysis?.topics?.some(t=>t.conditions.includes(defectText.trim())))&&(!flaggedSource||repairCalls)
        if(reject)flaggedSource=true
        const location=({unassigned:'analysis.topics[99]',compound:'analysis.topics[0] und Berechnungsabdeckung',global:'analysis'})[outcome]||'analysis.topics[0]'
        output={issues:reject?[{code:defect,location,reason:regression?'New unsupported condition in the corrected section.':defect==='meaning'?'The linked step lacks a concrete action to resolve the stated payment question.':'The supplied originals and fetched text do not support this eligibility example.'}]:[]}
      }
      return Response.json({status:'completed',id:`source-${outcome}-${reviewCalls}-${repairCalls}`,model:request.model,output_text:JSON.stringify(output)})
    }
    let flow={status:'processing',state:{stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],modelState:{stage:'review',attempt:1,candidate:previous,structuralFeedback:[],response_id:'synthetic-source-candidate'}}},failure
    try{for(let step=0;flow.status==='processing'&&step<30;step++){
      assert(!flow.result)
      flow=await advanceCompleteAnalysis({...args,fetchImpl:async(...input)=>{try{return await transport(...input)}catch(error){fixtureFailure=error;throw error}},state:flow.state})
    }}catch(error){failure=error}
    assert.ifError(fixtureFailure)
    if(outcome==='fixed'){
      assert.equal(failure,undefined);assert.equal(flow.status,'completed');assert.equal(flow.attempts,2)
      assert.equal(repairCalls,1);assert.equal(reviewCalls,2*expectedReviews,'changed topic dependencies invalidate all affected approvals')
      assert.deepEqual(flow.result.analysis.topics,original.analysis.topics)
      assert.deepEqual(flow.result.steps,original.steps);assert.deepEqual(flow.result.letters,original.letters)
    }else{
      assert(!flow.result)
      assert.equal(failure?.code,['unassigned','compound'].includes(outcome)?'review_invalid':outcome==='bad_quote'?'source_unresolved':'review_unresolved')
      assert.equal(repairCalls,['unresolved','regression','bad_quote'].includes(outcome)?1:0)
      if(outcome==='unresolved'){
        assert.equal(failure.correctionDiagnostics?.[0]?.section_changed,false,'a failed unchanged correction must retain a before/after diagnosis')
        assert.equal(failure.correctionDiagnostics[0].before.sha256,failure.correctionDiagnostics[0].after.sha256)
        assert(failure.correctionDiagnostics[0].previous_findings.length,'the first review finding must survive the final rejection')
      }
      if(outcome==='regression'){
        const diagnosis=failure.correctionDiagnostics[0]
        assert.equal(diagnosis.section_changed,true)
        assert(diagnosis.after.text.includes('New synthetic defect'))
        assert(!diagnosis.before.text.includes('New synthetic defect'))
        assert(!diagnosis.previous_findings.some(issue=>issue.reason===failure.issues[0].reason),'a new objection is not mislabelled as the original defect')
        assert.equal(failure.issues[0].reason,'New unsupported condition in the corrected section.')
      }
    }
  }

  // Bounded diagnostics do not turn excerpts into full originals or mistakes
  // outside the patch into regressions caused by it. Old checkpoints work too.
  {
    const previous=structuredClone(data),changed=structuredClone(data)
    changed.analysis.topics[0].conditions+=' A changed condition.'
    const targets=localizedRepairTargets(previous,[issue('analysis.topics[0]')],schema)
    const trace=await createCorrectionTrace(targets,previous,changed,[issue('analysis.topics[0]')])
    const untouched=await correctionFailureDiagnostics([issue('letters[0]')],changed,trace,schema)
    assert.equal(untouched[0].section_changed,false)
    assert.deepEqual(untouched[0].previous_findings,[])
    assert.equal(untouched[0].before.sha256,untouched[0].after.sha256)
    assert.deepEqual(await correctionFailureDiagnostics([issue('letters[0]')],changed,null,schema),[],'legacy checkpoints do not invent a prior comparison')
    changed.analysis.topics[0].conclusion='Long diagnostic text. '.repeat(1000)
    const long=await createCorrectionTrace(targets,previous,changed,[])
    const entry=long.entries.find(entry=>entry.location==='analysis.topics[0]')
    assert.equal(entry.after.text.length,4000);assert.equal(entry.after.truncated,true)
    changed.analysis.topics[0].conclusion+='A difference beyond the excerpt.'
    const later=await createCorrectionTrace(targets,previous,changed,[])
    const laterEntry=later.entries.find(entry=>entry.location==='analysis.topics[0]')
    assert.equal(entry.after.text,laterEntry.after.text)
    assert.notEqual(entry.after.sha256,laterEntry.after.sha256,'hashes cover the entire value, including the undisplayed tail')
    const safe=safeCorrectionDiagnostic({...untouched[0],provider_key:'must-not-leave',before:{...untouched[0].before,secret:'must-not-leave'}})
    assert(!JSON.stringify(safe).includes('must-not-leave'))
    assert.equal(safeCorrectionDiagnostic({...untouched[0],after:{text:'invalid'}}),null)
    const multilingual=safeCorrectionDiagnostic({...untouched[0],after:{...untouched[0].after,text:'日本語🙂'.repeat(2000)}}).after
    assert(new TextEncoder().encode(multilingual.text).length<=4000)
    assert.equal(multilingual.truncated,true)
    assert(!multilingual.text.includes('\ufffd'),'byte limits preserve complete Unicode characters')
  }

  // A corrected topic can contradict an unchanged global limitation. Exercise
  // the real single-repair workflow with synthetic provider responses: the
  // first review identifies only the topic; the second checks the assembled
  // topic AND limitation. This is dependency coverage, not a live model test.
  for(const defect of ['meaning','source'])for(const outcome of ['fixed','stale_limitation']){
    const previous=validateCompleteAnalysis(structuredClone(candidate),args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const unrelated=previous.analysis.limitations[0]
    const stale='Eine Gesamtabrechnung ist ohne Aufteilung der bestätigten Zahlung nicht möglich.'
    const corrected='Für einen bezifferten Bruttosaldo fehlt der Gesamtertrag; die Aufteilung der bestätigten Zahlung wird nur für getrennte Komponenten benötigt.'
    previous.analysis.topics[0].conditions=stale
    previous.analysis.limitations=[stale,unrelated]
    const fixedTopic={...previous.analysis.topics[0],conditions:corrected}
    let repairCalls=0,reviewCalls=0,initiallyFlagged=false
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body)
      const payloads=request.input.flatMap(message=>message.content).map(block=>{try{return JSON.parse(block.text)}catch{return {}}})
      let output
      if(request.text.format.name==='ash_complete_repair_v169'){
        repairCalls++
        assert.equal(reviewCalls,completeReviewGroups(previous).length,'all mandatory initial reviews still precede correction')
        const assigned=payloads.find(p=>p.assigned_replacements).assigned_replacements
        const replacements={
          'analysis.topics[0]':fixedTopic,
          'analysis.limitations':outcome==='fixed'?[corrected,unrelated]:previous.analysis.limitations,
          'steps[1]':previous.steps[1]
        }
        output=repairReplyWithFieldDecisions({requires_full_correction:false,reason:'',changes:Object.fromEntries(assigned.map(target=>[target.key,replacements[target.location]]))},assigned)
      }else{
        assert.equal(request.text.format.name,'ash_evidence_review_v139')
        reviewCalls++
        const part=payloads.find(p=>p.candidate).candidate
        let findings=[]
        if(!repairCalls&&!initiallyFlagged&&part.analysis?.topics?.some(topic=>topic.conditions===stale)){
          initiallyFlagged=true
          findings=[{code:defect,location:'analysis.topics[0]',reason:'The missing payment allocation does not itself block the gross balance.'}]
        }else if(repairCalls&&part.analysis?.limitations?.includes(stale)){
          findings=[issue('analysis.limitations','The global limitation still contradicts the corrected topic.')]
        }
        output={issues:findings}
      }
      return Response.json({status:'completed',id:`limitation-${defect}-${outcome}-${reviewCalls}-${repairCalls}`,model:request.model,output_text:JSON.stringify(output)})
    }
    let flow={status:'processing',state:{stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],modelState:{stage:'review',attempt:1,candidate:previous,structuralFeedback:[],response_id:'synthetic-limitation-candidate'}}},failure
    try{for(let step=0;flow.status==='processing'&&step<30;step++)flow=await advanceCompleteAnalysis({...args,fetchImpl:transport,state:flow.state})}catch(error){failure=error}
    assert.equal(repairCalls,1,'dependent limitation changes use the existing single correction')
    if(outcome==='fixed'){
      assert.equal(failure,undefined,'the bounded correction must be able to update a contradictory global limitation')
      assert.equal(flow.status,'completed')
      assert.deepEqual(flow.result.analysis.limitations,[corrected,unrelated])
      assert.deepEqual(flow.result.analysis.topics,[fixedTopic])
      assert.deepEqual(flow.result.steps,previous.steps)
      assert.deepEqual(flow.result.letters,previous.letters)
    }else{
      assert.equal(failure?.code,'review_unresolved','an unchanged contradiction still fails independent review')
      assert(!flow.result,'the single failed correction never becomes an accepted result or another paid correction')
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
    if(request.text.format.name!=='ash_case_scope')assert(request.instructions.includes(PAYMENT_DATE_ATTRIBUTION_RULES),'bounded corrections retain the same payment-date evidence conditions')
    counts.total++
    let output
    if(name==='ash_case_scope')output=bigScope
    else if(name==='ash_complete_topics_v167'){counts.topics++;output=topicFixture(big.analysis,request)}
    else if(name==='ash_complete_outline_v166'){counts.outlines++;output=outlineFixture(big.analysis)}
    else if(name==='ash_complete_numbers_v172'){
      counts.numbers++
      const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
      output={calculations:big.analysis.calculations.filter(c=>assigned.some(a=>a.id===c.id)).map(cleanCalculation)}
    }else if(name==='ash_complete_reconciliation_v172')output=reconciliationFixture(request)
    else if(name==='ash_complete_plan_v157'){
      counts.plans++
      const {analysis,...plan}=structuredClone(big);output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
    }else if(name==='ash_complete_repair_v169'){
      counts.repairs++;initialCalls=counts.total-1
      assert.equal(request.reasoning.effort,'high');assert.equal(request.max_output_tokens,8000)
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
  const foundationGroups=completeReviewGroups(data,foundationReviewCoverage(data)).length
  assert.equal(counts.total,initialCalls+3+groupCount-foundationGroups,'one correction, one changed foundation audit, then the first plan and its remaining audits')
  assert.equal(flow.result.analysis.verification.review_response_ids.length,groupCount)
  assert.equal(flow.result.analysis.verification.reused_review_response_ids.length,foundationGroups,'all unchanged foundation receipts are reused after plan assembly')
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
    if(request.text.format.name!=='ash_case_scope')assert(request.instructions.includes(PAYMENT_DATE_ATTRIBUTION_RULES),'bounded corrections retain the same payment-date evidence conditions')
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
    const previous=validateCompleteAnalysis(structuredClone(candidate),args.source,{scope:{issues:[{id:'settlement'}]},research:[],outputLanguage:'de',referenceLanguage:'de'})
    const before=structuredClone(previous)
    const state={stage:'analysis',scope:{issues:[{id:'settlement',calculation_needed:true}],research_topics:[]},research:[],discovery_gaps:[],localizedRepair:{},modelState:{stage:'generation',attempt:2,previous,feedback:[issue('analysis.calculations[difference].explanation')]}}
    const transport=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body)
      if(request.text.format.name!=='ash_case_scope')assert(request.instructions.includes(PAYMENT_DATE_ATTRIBUTION_RULES),'bounded corrections retain the same payment-date evidence conditions')
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
  assert.equal(initialCalls,15,'the maximum-size fixture finds its defect before paying for the plan and downstream audits')
  assert.equal(counts.total,23,'one local correction reduces the former 39-call scenario to 23')
  console.log(`Grouped complete-case correction: ${counts.total} simulated requests; ${initialCalls} for the first candidate, then 1 replacement + 1 changed foundation review + the plan and its downstream audits; all 25 sections covered by ${groupCount} current approvals. No live model cost measured.`)
}

