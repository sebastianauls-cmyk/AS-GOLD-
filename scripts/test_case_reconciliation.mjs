import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,validateCompleteAnalysis,completeReviewGroups} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'

// Entirely fictional reproduction of the two live defects. It exercises the
// real orchestration, merge, source/arithmetic checks and review gates; model
// responses are controlled. This is not evidence of live model correctness.
const doc={id:'88888888-8888-4888-8888-888888888888',title:'Synthetischer Nettoabgleich',data_classification:'synthetic',extracted_text:'SYNTHETISCHER INTERNER TEST. Keine echte Zahlung. Kind A: Brutto 31.200,00 EUR, Lohnsteuer 3.000,00 EUR, Kirchensteuer 270,00 EUR, Netto 27.930,00 EUR. Kind B: Brutto 31.800,00 EUR, Lohnsteuer 3.100,00 EUR, Kirchensteuer 279,00 EUR, Netto 28.421,00 EUR. Die Auszahlung ist laut Mandantenangabe im August 2026 eingegangen. Das Empfangskonto und die Zuordnung sind noch offen.'}
doc.owner_id=roadmapTestCase.owner_id;doc.case_id=roadmapTestCase.id
const source=roadmapSource({...roadmapTestCase,title:'Interner Nettoabgleich',goal:'Beide Nettobeträge abgleichen; Eingang beibehalten und nur Konto/Zuordnung klären.',summary:'Nur erfundene Unterlagen.'},[doc],[])
const scope={issues:[{id:'payout',title:'Nettoabgleich und Eingang',reason:'Abgleich beider Zahlungen.',calculation_needed:true}],research_topics:[]}
const stale={id:'payout',title:'Nettoabgleich und Eingang',status:'open',conclusion:'Die Nettoauszahlungen sollen im nächsten Rechenschritt geprüft werden. Der tatsächlich gutgeschriebene Betrag ist noch zu bestätigen.',conditions:'Kontoauszug anfordern, um den Zahlungseingang und die Beträge zu bestätigen.',sources:[],step_ids:[]}
const fixed={id:'payout',sources:[],status:'open',conclusion:'Der Nettoabgleich ist für beide Kinder rechnerisch abgeschlossen: Kind A 27.930,00 EUR, Kind B 28.421,00 EUR. Laut Mandantenangabe ist die Auszahlung im August 2026 eingegangen.',conditions:'Offen sind nur Empfangskonto und Zuordnung der beiden Beträge. Eine Kontoangabe soll diese Zuordnung klären; Eingang und Beträge werden nicht erneut angefordert.'}
const calculations=[['a','31200','3000','270'],['b','31800','3100','279']].map(([id,gross,tax,church])=>({id:'net_'+id,title:'Netto Kind '+id.toUpperCase(),topic_ids:['payout'],inputs:[['gross',gross],['tax',tax],['church',church]].map(([name,value])=>({name,value,label:name,kind:'document',document_id:doc.id,quote:doc.extracted_text})),expression:'gross-tax-church',decimal_places:2,unit:'EUR',conditions:'',explanation:'Brutto abzüglich Lohnsteuer und Kirchensteuer.'}))
const plan={...structuredClone(roadmapTestResult),title:'Interner Zahlungsabgleich',opening:fixed.conclusion,key_points:['Beide Nettobeträge sind rechnerisch abgeglichen.','Der Eingang ist laut Mandantenangabe bestätigt.','Konto und Zuordnung bleiben offen.'],meaning:fixed.conclusion,next:'Empfangskonto und Zuordnung intern klären.',customer_action:'Nur die Kontoangabe und Zuordnung ergänzen.',facts:[{text:'Eingang laut Mandantenangabe im August 2026.',evidence:[{document_id:doc.id,quote:'Die Auszahlung ist laut Mandantenangabe im August 2026 eingegangen.'}]}],open_questions:[{question:'Auf welchem Konto sind die beiden Beträge zugeordnet?',who:'Testkundin',why:'Nur Empfangskonto und Zuordnung sind noch offen.'}],steps:[{id:'account',title:'Kontozuordnung intern klären',phase:'now',light:'yellow',reason:'Die Kontoangabe fehlt.',owner:'Interner Test',action:'Im Test Empfangskonto und Zuordnung ergänzen.',waiting_for:'Kontoangabe und Zuordnung.',after_response:'Angaben intern zuordnen.',done_when:'Beide Beträge sind einem Konto zugeordnet.',follow_up:'Offene Zuordnung intern nachfragen.',depends_on:[],deadline:null,evidence:[{document_id:doc.id,quote:'Das Empfangskonto und die Zuordnung sind noch offen.'}]}],letters:[],closing:'Interner Test abgeschlossen, sobald die Zuordnung geklärt ist.'}
const checked=validateCompleteAnalysis({...plan,analysis:{topics:[{...stale,step_ids:['account']}],calculations,limitations:[]}},source,{scope,research:[],outputLanguage:'de',referenceLanguage:'de'})
const draft=structuredClone(checked.analysis);draft.topics[0].step_ids=[]
const start={stage:'analysis',scope,research:[],discovery_gaps:[],draftAnalysis:draft,analysis_response_ids:['checked-numbers'],modelState:{stage:'generation',attempt:1,feedback:[],previous:null}}
const args={providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Use original quotes. Internal no-sending test.',input:[]},baseReviewContent:[]}
const reply=(request,output,id)=>Response.json({status:'completed',id,model:request.model,output_text:JSON.stringify(output)})
let reconciliations=0,plans=0,reviews=0
const transport=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses')
  const request=JSON.parse(options.body),name=request.text.format.name
  if(!reconciliations)assert.equal(name,'ash_complete_reconciliation_v170','final topic narratives must be reconciled after checked arithmetic and before the plan')
  if(name==='ash_complete_reconciliation_v170'){
    reconciliations++
    const payload=JSON.parse(request.input.at(-1).content[0].text)
    assert.deepEqual(payload.checked_analysis.calculations.map(item=>item.result),['27930.00','28421.00'])
    assert(request.input.some(message=>message.content.some(item=>item.text.includes('Die Auszahlung ist laut Mandantenangabe im August 2026 eingegangen.'))))
    assert.deepEqual(Object.keys(request.text.format.schema.properties.topics.items.properties),['id','status','conclusion','conditions','sources'])
    assert.match(request.instructions,/document-reported receipt/i)
    return reply(request,{topics:[fixed]},'reconciled-net-and-receipt')
  }
  if(name==='ash_complete_plan_v157'){
    plans++
    const analysis=JSON.parse(request.input.at(-1).content[0].text).analysis
    assert.equal(analysis.topics[0].conclusion,fixed.conclusion,'the plan must consume the updated numerical and receipt conclusion')
    assert.equal(analysis.topics[0].conditions,fixed.conditions,'only the genuine remaining gap reaches plan generation')
    return reply(request,{...plan,topic_steps:[{id:'payout',step_ids:['account']}]},'aligned-plan')
  }
  assert.equal(name,'ash_evidence_review_v139');reviews++
  assert.equal(request.reasoning.effort,'high')
  const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
  const part=payloads.find(item=>item.candidate).candidate
  if(part.analysis?.topics){assert.equal(part.analysis.topics[0].conclusion,fixed.conclusion);assert.equal(part.analysis.topics[0].conditions,fixed.conditions)}
  return reply(request,{issues:[]},'independent-review-'+reviews)
}
let flow={status:'processing',state:structuredClone(start)}
for(let n=0;flow.status==='processing'&&n<12;n++){
  assert(!flow.result,'no intermediate reconciliation is a customer result')
  flow=await advanceCompleteAnalysis({...args,fetchImpl:transport,state:flow.state})
}
assert.equal(flow.status,'completed');assert.equal(flow.attempts,1)
assert.equal(reconciliations,1);assert.equal(plans,1)
assert.equal(reviews,completeReviewGroups(flow.result).length)
assert.deepEqual(flow.result.analysis.calculations,checked.analysis.calculations,'reconciliation cannot change checked inputs, formulas or results')
assert.deepEqual(flow.result.analysis.topics[0].sources,stale.sources)
assert.equal(flow.result.analysis.topics[0].conclusion,fixed.conclusion)
assert(flow.result.analysis.verification.analysis_response_ids.includes('reconciled-net-and-receipt'))
assert.deepEqual(start.draftAnalysis,draft,'the previous checkpoint is immutable')

for(const defect of ['missing','id','extra','empty','truncated']){
  let calls=0
  await assert.rejects(advanceCompleteAnalysis({...args,state:structuredClone(start),fetchImpl:async(url,options)=>{
    calls++;const request=JSON.parse(options.body)
    assert.equal(request.text.format.name,'ash_complete_reconciliation_v170')
    if(defect==='truncated')return Response.json({status:'incomplete',id:'truncated-reconciliation',incomplete_details:{reason:'max_output_tokens'},output_text:'{"topics":'})
    const topic=structuredClone(fixed)
    if(defect==='id')topic.id='unassigned'
    if(defect==='extra')topic.title='Unassigned title'
    if(defect==='empty')topic.conclusion=''
    return reply(request,{topics:defect==='missing'?[]:[topic]},'invalid-reconciliation')
  }}),error=>error.code===(defect==='truncated'?'provider_token_limit':'source_unresolved'))
  assert.equal(calls,1,'invalid reconciliation stops; it does not add another correction loop')
}
// A source defect must stop before the added paid synthesis stage.
const invalid=structuredClone(start);invalid.draftAnalysis.calculations[0].inputs[0].value='99999'
let unexpected=0
await assert.rejects(advanceCompleteAnalysis({...args,state:invalid,fetchImpl:async()=>{unexpected++;throw Error('Must not call a provider')}}),error=>error.code==='source_unresolved')
assert.equal(unexpected,0)

// A seemingly well-shaped but semantically bad synthesis is still rejected by
// the independent reviewer. Its one failed local repair may never publish it.
let rejectedReviews=0,repairs=0
const rejectionTransport=async(url,options)=>{
  const request=JSON.parse(options.body),name=request.text.format.name
  if(name==='ash_complete_reconciliation_v170')return reply(request,{topics:[{id:stale.id,status:stale.status,conclusion:stale.conclusion,conditions:stale.conditions,sources:stale.sources}]},'bad-meaning')
  if(name==='ash_complete_plan_v157')return reply(request,{...plan,topic_steps:[{id:'payout',step_ids:['account']}]},'bad-plan')
  if(name==='ash_complete_repair_v169'){
    repairs++
    const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_replacements
    return reply(request,{requires_full_correction:false,reason:'',changes:Object.fromEntries(assigned.map(item=>[item.key,item.previous]))},'still-bad')
  }
  assert.equal(name,'ash_evidence_review_v139');rejectedReviews++
  const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
  const part=payloads.find(item=>item.candidate).candidate
  return reply(request,{issues:part.analysis?.topics?[{code:'meaning',location:'analysis.topics[0]',reason:'The computed net amounts and document-reported receipt must not be reopened.'}]:[]},'reject-'+rejectedReviews)
}
let rejected={status:'processing',state:structuredClone(start)}
await assert.rejects(async()=>{for(let n=0;rejected.status==='processing'&&n<16;n++)rejected=await advanceCompleteAnalysis({...args,fetchImpl:rejectionTransport,state:rejected.state})},error=>error.code==='review_unresolved')
assert.equal(repairs,1);assert(!rejected.result)

// A later regression adds a future first due date and two deliberately
// different benefit categories. These are invented rules, not legal advice.
const temporalSource=structuredClone(source)
temporalSource.documents[0].extracted_text+=' Die erste Zahlung für September ist am 15. Oktober 2099 fällig. Die Kinder beziehen eine gesetzliche Halbwaisenrente. Die Jahresbescheinigung fehlt.'
const research=[
  {url:'https://authority.example/contract',title:'Fiktive Vertragsregel',source_text:'SYNTHETISCHE REGEL: Nur ein Anbieter eines privaten Altersvorsorgevertrags erteilt die hier beschriebene Mitteilung.',checked_at:new Date().toISOString()},
  {url:'https://authority.example/statutory',title:'Fiktive gesetzliche Rentenregel',source_text:'SYNTHETISCHE REGEL: Die gesetzliche Rentenversicherung stellt für die gesetzliche Halbwaisenrente eine Jahresbescheinigung bereit.',checked_at:new Date().toISOString()}
]
const temporalStart=structuredClone(start)
temporalStart.research=research
temporalStart.draftAnalysis.topics[0].conclusion='Mögliche Rückstände sind nicht dokumentiert. Die Jahresbescheinigung bei der gesetzlichen Rentenversicherung anfordern.'
temporalStart.draftAnalysis.topics[0].sources=[{url:research[0].url,quote:research[0].source_text}]
const temporalFixed={...fixed,conclusion:fixed.conclusion+' Die erste Zahlung ist erst am 15. Oktober 2099 fällig; aus dieser Forderung besteht bis zum Prüfdatum kein Rückstand. Die fehlende Jahresbescheinigung bei der gesetzlichen Rentenversicherung anfordern.',sources:[{quote:'@s1_0'}]}
let temporalCalls=0
const temporal=await advanceCompleteAnalysis({...args,source:temporalSource,state:temporalStart,fetchImpl:async(url,options)=>{
  temporalCalls++
  const request=JSON.parse(options.body)
  assert.equal(request.text.format.name,'ash_complete_reconciliation_v170')
  assert.equal(request.reasoning.effort,'high')
  assert.equal(request.max_output_tokens,12000)
  const originals=JSON.parse(request.input[0].content[0].text)
  assert.equal(originals.review_date,new Date().toISOString().slice(0,10))
  assert.match(request.instructions,/first due date is still in the future/)
  assert.match(request.instructions,/payer or institution, benefit\/product category/)
  assert.equal(request.text.format.schema.properties.topics.items.properties.sources.items.properties.url,undefined)
  return reply(request,{topics:[temporalFixed]},'temporal-and-source-synthesis')
}})
assert.equal(temporalCalls,1)
assert.equal(temporal.status,'processing')
assert.deepEqual(temporal.state.draftAnalysis.topics[0].sources,[{url:research[1].url,quote:research[1].source_text}],'a mismatched citation can be replaced by a verbatim passage from the supplied appropriate source')
assert.deepEqual(temporal.state.draftAnalysis.calculations,draft.calculations,'citation correction does not alter checked arithmetic')
assert.deepEqual(temporalStart.draftAnalysis.topics[0].sources,[{url:research[0].url,quote:research[0].source_text}],'the old checkpoint is immutable')
let planSawReconciled=false
await advanceCompleteAnalysis({...args,source:temporalSource,state:temporal.state,fetchImpl:async(url,options)=>{
  const request=JSON.parse(options.body)
  assert.equal(request.text.format.name,'ash_complete_plan_v157')
  const analysis=JSON.parse(request.input.at(-1).content[0].text).analysis
  assert.equal(analysis.topics[0].conclusion,temporalFixed.conclusion)
  assert.equal(analysis.topics[0].sources[0].url,research[1].url)
  planSawReconciled=true
  return reply(request,{...plan,topic_steps:[{id:'payout',step_ids:['account']}]},'temporal-plan')
}})
assert(planSawReconciled,'the practical plan sees both the revised due-date status and corrected source')
for(const invalidSource of [
  {quote:'@s99_0'},
  {quote:'@d0_0'},
  {url:'https://authority.example/unfetched',quote:research[1].source_text},
  {url:research[1].url,quote:'An invented statement absent from this source.'}
]){
  let calls=0
  await assert.rejects(advanceCompleteAnalysis({...args,source:temporalSource,state:structuredClone(temporalStart),fetchImpl:async(url,options)=>{
    calls++;return reply(JSON.parse(options.body),{topics:[{...temporalFixed,sources:[invalidSource]}]},'invalid-citation')
  }}),error=>error.code==='source_unresolved')
  assert.equal(calls,1,'unknown, wrong-kind and fabricated citations stop before plan generation')
}
console.log('Case reconciliation: checked payouts, reported receipt, due-date context and source replacement reach the plan; literal source/math gates, all reviews, immutable fields and one-correction stop passed. Model responses simulated; no live model cost.')
