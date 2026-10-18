import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,completeReviewGroups} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {reconciliationFixture} from './fixtures/completeCaseReconciliation.mjs'

// Fictional values and controlled model replies. Exercise orchestration and
// rejection, not a test-specific rule or a substitute for live model acceptance.
const doc={id:'77777777-7777-4777-8777-777777777777',owner_id:roadmapTestCase.owner_id,case_id:roadmapTestCase.id,title:'Erfundener Abgleich',data_classification:'synthetic',extracted_text:'SYNTHETISCHER TEST. Keine echte Zahlung. Anfangskapital 80 EUR. Bestätigte Rückzahlung 20 EUR. Laut Aussteller einbehalten 60 EUR. Erträge und Aufteilung der Rückzahlung sind nicht beziffert. Eine Bewertungsmethode für den behaupteten Schaden ist nicht belegt.'}
const source=roadmapSource({...roadmapTestCase,title:'Erfundener Bestandsabgleich',goal:'Angaben abgleichen und fehlende Belege bestimmen.',summary:'Nur erfundene Testdaten.'},[doc],[])
const scope={issues:[{id:'balance',title:'Bestand und Abzüge',reason:'Erfundene Zahlen abgleichen.',calculation_needed:true}],research_topics:[]}
const topic={id:'balance',title:'Bestand und Abzüge',status:'open',conclusion:'Die Zahlen sind abzugleichen.',conditions:'Erträge, Zahlungsaufteilung und Bewertungsmethode fehlen.',sources:[],step_ids:[]}
const gap={id:'valuation',topic_ids:['balance'],unavailable:'unsupported_method_or_inputs',reason:'Für die Schadensbewertung fehlt eine belegte anwendbare Bewertungsmethode. Im internen Test die Berechnungsgrundlage und ihren Anwendungsbereich anfordern und prüfen.'}
const input=(name,value,label)=>({name,value,label,kind:'document',quote:'@d0_0'})
const baseline={id:'baseline',title:'Kapitalrest',topic_ids:['balance'],inputs:[input('initial','80','Anfangskapital'),input('refund','20','Bestätigte Rückzahlung')],expression:'initial-refund',decimal_places:2,unit:'EUR',conditions:'Erträge und Zahlungsaufteilung offen.',explanation:'Anfangskapital minus vollständige Rückzahlung.'}
const comparison={id:'comparison',title:'Vergleich mit dem behaupteten Einbehalt',topic_ids:['balance'],inputs:[{name:'baseline',value:'60.00',label:'Kapitalrest',kind:'calculation',calculation_id:'baseline'},input('retained','60','Vom Aussteller genannter Einbehalt')],expression:'baseline-retained',decimal_places:2,unit:'EUR',conditions:'Keine Aussage über die Berechtigung des Einbehalts.',explanation:'Nur Vergleich der genannten Zahlen.'}
const calculations=[baseline,comparison]
const analysis={topics:[topic],calculations:[],limitations:[]}
const calculation_plan=[gap,...calculations].map(item=>({id:item.id,title:item.title||'Schadensbewertung',topic_ids:item.topic_ids,purpose:item.explanation||'Bewertung prüfen.',depends_on:item.id==='comparison'?['baseline']:[]}))
const start={stage:'analysis',scope,research:[],discovery_gaps:[],analysisOutline:{analysis,calculation_plan,next:0,response_ids:[]},generationBatchSizes:{calculations:1},modelState:{stage:'generation',attempt:1,feedback:[],previous:null}}
const args={providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Internal synthetic no-sending test.',input:[]},baseReviewContent:[]}
const reply=(request,output)=>Response.json({id:'mock-'+request.text.format.name,status:'completed',model:request.model,output_text:JSON.stringify(output)})
const description=calculation=>({id:calculation.id,title:calculation.id==='baseline'?'Rechnerischer Ausgangswert vor sämtlichen Erträgen':calculation.title,input_labels:calculation.inputs.map(item=>({name:item.name,label:item.name==='baseline'?'Rechnerischer Ausgangswert vor sämtlichen Erträgen':item.label})),conditions:calculation.conditions,explanation:calculation.explanation})
const plan={...structuredClone(roadmapTestResult),title:'Interner Bestandsabgleich',opening:'Der rechnerische Ausgangswert vor sämtlichen Erträgen beträgt 60 EUR.',key_points:['Die Zahlungsaufteilung ist offen.','Die Bewertungsmethode fehlt.'],meaning:'Der Ausgangswert beweist keinen verbleibenden Kapitalanteil.',next:'Fehlende Grundlagen intern beschaffen.',customer_action:'Erträge, Zahlungsaufteilung und Bewertungsmethode im Test klären.',facts:[],open_questions:[],letters:[],steps:[{id:'clarify',title:'Grundlagen intern klären',phase:'now',light:'yellow',reason:gap.reason,owner:'Interner Test',action:'Im Test Erträge, Zahlungsaufteilung und Bewertungsgrundlage anfordern und prüfen.',waiting_for:'Diese fehlenden Grundlagen.',after_response:'Angaben anhand ihrer Belege abgleichen.',done_when:'Die Grundlagen sind belegt und geprüft.',follow_up:'Offene Fragen zur konkreten Bewertungsmethode im Test nachfassen.',depends_on:[],deadline:null,evidence:[]}],closing:'Erst nach Klärung der offenen Grundlagen abschließen.',topic_steps:[{id:'balance',step_ids:['clarify']}]}
let numbers=0,syntheses=0,reviews=0,checkedBeforeSynthesis,reconciledState
let flow={status:'processing',state:structuredClone(start)}
const transport=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses')
  const request=JSON.parse(options.body),name=request.text.format.name
  if(name==='ash_complete_numbers_v172'){
    numbers++
    const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
    assert.equal(assigned.length,1)
    const item=[gap,...calculations].find(item=>item.id===assigned[0].id)
    return reply(request,{calculations:[item]})
  }
  if(name==='ash_complete_reconciliation_v172'){
    syntheses++
    checkedBeforeSynthesis=JSON.parse(request.input.at(-1).content[0].text).checked_analysis
    assert.deepEqual(checkedBeforeSynthesis.calculations.map(item=>item.result),['60.00','0.00'])
    assert(checkedBeforeSynthesis.limitations.includes(gap.reason))
    const output=reconciliationFixture(request)
    output.topics[0].conclusion='Der rechnerische Ausgangswert vor sämtlichen Erträgen beträgt 60 EUR; die Zahlungsaufteilung bleibt offen.'
    output.calculation_descriptions=checkedBeforeSynthesis.calculations.map(description)
    return reply(request,output)
  }
  if(name==='ash_complete_plan_v157'){
    const supplied=JSON.parse(request.input.at(-1).content[0].text).analysis
    assert.equal(supplied.calculations[0].title,'Rechnerischer Ausgangswert vor sämtlichen Erträgen')
    assert.equal(supplied.calculations[1].inputs[0].label,supplied.calculations[0].title)
    assert(supplied.limitations.includes(gap.reason))
    return reply(request,plan)
  }
  assert.equal(name,'ash_evidence_review_v139');reviews++
  const content=request.input.flatMap(item=>item.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
  assert.deepEqual(content.find(item=>item.complete_analysis_context).unavailable_calculations,[gap],'an omitted proposed formula reaches independent review even though its topic has other calculations')
  return reply(request,{issues:[]})
}
for(let i=0;flow.status==='processing'&&i<20;i++){
  if(flow.state.draftAnalysis&&!flow.state.reconciliation_response_id)reconciledState=structuredClone(flow.state)
  assert(!flow.result)
  flow=await advanceCompleteAnalysis({...args,state:flow.state,fetchImpl:transport})
}
assert.equal(flow.status,'completed')
assert.equal(numbers,3,'a missing method in the first batch does not corrupt the next batch offset')
assert.equal(syntheses,1)
assert.equal(reviews,completeReviewGroups(flow.result).length)
assert.deepEqual(flow.result.analysis.calculations.map(item=>item.id),['baseline','comparison'])
for(const [index,actual] of flow.result.analysis.calculations.entries()){
  const before=checkedBeforeSynthesis.calculations[index]
  for(const key of ['id','topic_ids','expression','decimal_places','unit','result'])assert.deepEqual(actual[key],before[key])
  assert.deepEqual(actual.inputs.map(({label,...input})=>input),before.inputs.map(({label,...input})=>input),'labels cannot change any input value, source or dependency')
}
assert.deepEqual(start.analysisOutline.analysis,analysis,'the original checkpoint is unchanged')

for(const defect of ['formula','result','value','unknown','duplicate','input_name','input_order','missing_descriptions']){
  let calls=0
  await assert.rejects(advanceCompleteAnalysis({...args,state:structuredClone(reconciledState),fetchImpl:async(url,options)=>{
    calls++;const request=JSON.parse(options.body),output=reconciliationFixture(request)
    output.calculation_descriptions=[description(checkedBeforeSynthesis.calculations[0])]
    const edit=output.calculation_descriptions[0]
    if(defect==='formula')edit.expression='initial+refund'
    if(defect==='result')edit.result='100.00'
    if(defect==='value')edit.input_labels[0].value='999'
    if(defect==='unknown')edit.id='unassigned'
    if(defect==='duplicate')output.calculation_descriptions.push(structuredClone(edit))
    if(defect==='input_name')edit.input_labels[0].name='refund'
    if(defect==='input_order')edit.input_labels.reverse()
    if(defect==='missing_descriptions')delete output.calculation_descriptions
    return reply(request,output)
  }}),error=>error.code==='source_unresolved')
  assert.equal(calls,1,'invalid synthesis never adds another repair call')
}

for(const defect of ['empty_reason','invented_formula','wrong_id','missing_assignment','unavailable_dependency']){
  let current=structuredClone(start),calls=0
  const badReply=async(url,options)=>{
    calls++;const request=JSON.parse(options.body),bad=structuredClone(gap)
    if(defect==='empty_reason')bad.reason=' '
    if(defect==='invented_formula')bad.expression='cost*remaining/total'
    if(defect==='wrong_id')bad.id='other'
    let output={calculations:defect==='missing_assignment'?[]:[bad]}
    if(defect==='unavailable_dependency')output={calculations:[{...comparison,inputs:comparison.inputs.map(input=>input.kind==='calculation'?{...input,calculation_id:'valuation'}:input)}]}
    return reply(request,output)
  }
  if(defect==='unavailable_dependency')current.analysisOutline={...current.analysisOutline,next:2,analysis:{...analysis,calculations:[checkedBeforeSynthesis.calculations[0]],limitations:[gap.reason]},unavailable:[gap]}
  const first=await advanceCompleteAnalysis({...args,state:current,fetchImpl:badReply})
  assert(first.state.inputRepair?.feedback.length)
  assert(!first.result)
  await assert.rejects(advanceCompleteAnalysis({...args,state:first.state,fetchImpl:badReply}),error=>error.code==='source_unresolved')
  assert.equal(calls,2,'invalid unresolved items share the existing single mechanical repair')
}

// A gap is not an automatic approval. An unjustified omission must still stop.
const rejected=structuredClone(reconciledState)
rejected.draftAnalysis=structuredClone(flow.result.analysis)
rejected.reconciliation_response_id='already-reconciled'
await assert.rejects(advanceCompleteAnalysis({...args,state:rejected,fetchImpl:async(url,options)=>{
  const request=JSON.parse(options.body)
  assert.equal(request.text.format.name,'ash_evidence_review_v139','an unsupported omission stops before plan generation')
  return reply(request,{issues:[{code:'meaning',location:'analysis.calculations',reason:'The missing calculation is supported by the evidence; the supplied reason does not justify omitting it.'}]})
}}),error=>error.code==='review_unresolved')
console.log('Calculation grounding: unsupported proposals remain visible and independently reviewed; later batches continue; descriptive correction preserves exact arithmetic/provenance; malformed gaps and numerical edits fail. Model replies simulated.')
