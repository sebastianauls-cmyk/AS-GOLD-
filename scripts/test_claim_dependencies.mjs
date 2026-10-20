import assert from 'node:assert/strict'
import {advanceCompleteAnalysis,COMPLETE_ANALYSIS_SCHEMA} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {localizedRepairTargets,resolveQuotedTopicIssueLocations} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {repairReplyWithFieldDecisions} from './fixtures/repairFieldDecisions.mjs'

// Fictional regression cases. No real law, customer record, completed answer,
// or live reviewer is supplied. The controlled reviewer tests the gates and
// repair boundary; it does not measure the model's ability to find these errors.
const unsupported='Die rechtliche Abrechnungsreife setzt den feststehenden Gesamtbetrag sämtlicher Erträge voraus.'
const topics=[
  {id:'total',title:'Bezifferung',status:'conditional',conclusion:'Ein rechnerischer Saldo lässt sich als Formel darstellen.',conditions:'Für den Bruttosaldo fehlen Ertragssumme, Anlageform, Zeitraum und Zinssatz.',sources:[],step_ids:[]},
  {id:'timing',title:'Rechtliche Einordnung',status:'open',conclusion:'Ein anwendbarer Primärtext zur Abrechnungsreife ist nicht vorhanden.',conditions:unsupported,sources:[],step_ids:[]},
  {id:'allocation',title:'Vergleichsszenario',status:'conditional',conclusion:'Bei beiden Abzügen verbleiben ausschließlich Erträge.',conditions:'Die Zusammensetzung der Zahlung ist nicht dokumentiert.',sources:[],step_ids:[]}
]
const findings=[
  {code:'meaning',location:'analysis.topics[0]',reason:'conditions: For this gross formula the missing direct input is the total earnings. Rate, period and investment type concern reconstruction or verification of that total.'},
  {code:'invention',location:'analysis.topics[1]',reason:'conditions: No supplied source supports the asserted legal dependency on the earnings amount.'},
  {code:'meaning',location:'analysis.topics[2]',reason:'conclusion: Equal numerical amounts do not prove that the remaining balance consists of earnings.'}
]
const precise=[
  {...topics[0],conditions:'Für einen numerischen Bruttosaldo fehlt unmittelbar die Summe sämtlicher Erträge. Ist diese Summe nicht belegt oder zu prüfen, sind dafür die Anlageunterlagen, insbesondere Zeitraum, Anlageform und Zinssatz, einzuholen.'},
  {...topics[1],conditions:'Ob und wann Abrechnungsreife vorliegt, ist anhand eines einschlägigen Primärtexts zu klären. Unabhängig davon fehlen der Ertragsbetrag und Belege zur Berechtigung der Abzüge; ihre Beziehung zur Abrechnungsreife ist nicht belegt.'},
  {...topics[2],conclusion:'Unter der Annahme beider Abzüge ergibt sich rechnerisch ein Restbetrag in Höhe der gesamten Erträge. Seine Zusammensetzung aus Kapital und Erträgen ist damit nicht belegt; ebenso wenig die Berechtigung der Abzüge.'}
]

// Invention findings must include the same explicitly linked repair units as
// source/meaning findings. Otherwise correcting a false prerequisite leaves
// its duplicate in limitations and its dependent instruction locked in place.
for(const code of ['source','meaning','invention']){
  const candidate={analysis:{topics:[{...topics[1],step_ids:['check']}],calculations:[],limitations:[unsupported]},open_questions:[],steps:[{id:'check',conditions:unsupported}]}
  const selected=localizedRepairTargets(candidate,[{...findings[1],code,location:'analysis.topics[0]'}],COMPLETE_ANALYSIS_SCHEMA)
  assert.deepEqual(selected.map(item=>item.location),['analysis.limitations','analysis.topics[0]','steps[0]'],'every unsupported claim class keeps its explicit dependencies editable within the existing bound')
  const quoted={code,location:'analysis.topics',reason:'Unsupported condition: „'+unsupported+'“'}
  assert.equal(resolveQuotedTopicIssueLocations([quoted],candidate)[0].location,'analysis.topics[0]')
  const ambiguous=structuredClone(candidate)
  ambiguous.analysis.topics.push({...topics[1],id:'duplicate'})
  assert.equal(resolveQuotedTopicIssueLocations([quoted],ambiguous)[0].location,'analysis.topics','a repeated quotation cannot select an arbitrary topic')
}

// A numerical identity is not component attribution. Two different complete
// allocations have identical observed totals and different remaining earnings.
const observed={principal:2400,earnings:60,payment:400,deductions:2000}
const residual=observed.principal+observed.earnings-observed.payment-observed.deductions
const allocations=[
  {paymentPrincipal:400,paymentEarnings:0,deductionPrincipal:2000,deductionEarnings:0},
  {paymentPrincipal:360,paymentEarnings:40,deductionPrincipal:1980,deductionEarnings:20}
]
const components=allocations.map(a=>{
  assert.equal(a.paymentPrincipal+a.paymentEarnings,observed.payment)
  assert.equal(a.deductionPrincipal+a.deductionEarnings,observed.deductions)
  const principal=observed.principal-a.paymentPrincipal-a.deductionPrincipal
  const earnings=observed.earnings-a.paymentEarnings-a.deductionEarnings
  assert.equal(principal+earnings,residual)
  return {principal,earnings}
})
assert.equal(residual,observed.earnings)
assert.deepEqual(components,[{principal:0,earnings:60},{principal:60,earnings:0}])

const document={id:'66666666-6666-4666-8666-666666666666',owner_id:roadmapTestCase.owner_id,case_id:roadmapTestCase.id,title:'Erfundener Bestandsabgleich',data_classification:'synthetic',extracted_text:'SYNTHETISCHER TEST. Keine echte Zahlung. Anfangskapital 2.400 EUR. Zahlung 400 EUR. Abzüge laut Aussteller zusammen 2.000 EUR. Ertragssumme, Anlagebedingungen und Zusammensetzung der Zahlung sind unbekannt. Die Abzüge sind nicht unabhängig geprüft. Es liegt keine Quelle zur rechtlichen Abrechnungsreife vor.'}
const source=roadmapSource({...roadmapTestCase,title:'Interner Abhängigkeitstest',goal:'Betrag, Zahlungsaufteilung und rechtliche Fragen getrennt prüfen.',summary:'Nur erfundene Unterlagen.'},[document],[])
const initial={stage:'analysis',scope:{issues:topics.map(t=>({id:t.id,title:t.title,reason:'Belegte Aussagen von offenen Beziehungen trennen.',calculation_needed:false})),research_topics:[]},research:[],discovery_gaps:[],draftAnalysis:{topics,calculations:[],limitations:[unsupported]},reconciliation_response_id:'controlled-reconciliation',modelState:{stage:'generation',attempt:1,feedback:[],previous:null}}
const args={providerKey:'synthetic-only',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{instructions:'Internal synthetic test. Original evidence only.',input:[]},baseReviewContent:[]}

// Preserve each defect in turn after the sole repair, then use a precisely
// conditional correction. An earlier review's bad suggested remedy must not
// become evidence or exempt the resulting claim from independent re-review.
for(const mode of ['all_precise','unfixed_total','unfixed_timing','bad_review_suggestion']){
  const calls=[],seen=[],mutable=structuredClone(initial)
  const firstFindings=findings.map(f=>({...f,reason:f.reason+(mode==='bad_review_suggestion'&&f.location==='analysis.topics[2]'?' Suggested remedy: describe the remaining amount as entirely earnings.':'')}))
  let repairs=0,afterReviews=0,fixtureFailure
  const transport=async(url,options)=>{
    try{
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),name=request.text.format.name
      const instructions=[request.instructions,...request.input.filter(message=>message.role==='developer').flatMap(message=>message.content.map(item=>item.text))].join('\n')
      calls.push(name)
      const payloads=request.input.flatMap(message=>message.content).map(item=>{try{return JSON.parse(item.text)}catch{return {}}})
      let output
      if(name==='ash_complete_repair_v169'){
        assert.equal(++repairs,1,'no second repair is authorized')
        const assigned=payloads.find(p=>p.assigned_replacements).assigned_replacements
        assert(assigned.some(a=>a.location==='analysis.limitations'))
        const result=precise.map(t=>({...t}))
        if(mode==='unfixed_total')result[0]=topics[0]
        if(mode==='unfixed_timing')result[1]=topics[1]
        if(mode==='bad_review_suggestion')result[2]=topics[2]
        output=repairReplyWithFieldDecisions({requires_full_correction:false,reason:'',changes:Object.fromEntries(assigned.map(a=>[a.key,a.location==='analysis.limitations'?['Ein Primärtext zur Abrechnungsreife fehlt; die rechtliche Frage bleibt offen.']:result.find(t=>t.id===a.previous.id)]))},assigned)
        seen.push({instructions,kind:'repair'})
      }else{
        assert.equal(name,'ash_evidence_review_v139','unapproved foundation never reaches roadmap generation')
        const candidate=payloads.find(p=>p.candidate).candidate
        const assignment=payloads.find(p=>p.assigned_review).assigned_review
        if(repairs)afterReviews++
        if(repairs&&assignment.scope==='analysis'){
          assert(!JSON.stringify(candidate).includes('topic_checks'),'self-assessments never become evidence')
          const audit=payloads.find(p=>p.correction_comparison).correction_comparison
          assert(audit.previous_findings.length)
        }
        const unresolved=repairs?findings.filter((_,i)=>candidate.analysis?.topics?.[i]?.[i===2?'conclusion':'conditions']===topics[i][i===2?'conclusion':'conditions']):firstFindings
        output={issues:assignment.scope==='analysis'?unresolved:[]}
        seen.push({instructions,kind:'review'})
      }
      return Response.json({id:'dependency-'+mode+'-'+calls.length,status:'completed',model:request.model,output_text:JSON.stringify(output)})
    }catch(error){fixtureFailure=error;throw error}
  }
  let flow={status:'processing',state:mutable},failure
  try{for(let n=0;flow.state.foundationReview?.status!=='passed'&&n<20;n++)flow=await advanceCompleteAnalysis({...args,state:flow.state,fetchImpl:transport})}catch(error){failure=error}
  assert.ifError(fixtureFailure)
  assert.equal(repairs,1);assert(!flow.result);assert(!calls.includes('ash_complete_plan_v157'))
  assert.deepEqual(mutable,initial,'the caller-held checkpoint remains immutable')
  if(mode==='all_precise'){
    assert.ifError(failure);assert.equal(flow.state.foundationReview.status,'passed');assert.equal(afterReviews,2)
    assert.deepEqual(flow.state.draftAnalysis.topics,precise)
  }else{
    assert.equal(failure?.code,'review_unresolved');assert.equal(afterReviews,1)
    assert(failure.issues?.length||failure.correctionDiagnostics,'a rejected correction remains inspectable')
  }
  // Verify transport to both independent roles, not accuracy of simulated text.
  for(const request of seen){
    assert.match(request.instructions,/reconstruction or verification/)
    assert.match(request.instructions,/numerical equality does not establish component identity/)
    assert.match(request.instructions,/unresolved questions do not establish a dependency/)
  }
  assert.match(seen.find(r=>r.kind==='repair').instructions,/review findings are not evidence/i)
}
console.log('Claim dependencies: invented prerequisites retain linked repair scope; amount identity does not imply component allocation; each unresolved defect blocks after one repair, including bad reviewer advice. Replies simulated; no live accuracy claim.')
