import assert from 'node:assert/strict'
import {calculateExpression,quoteContainsNumber} from '../supabase/functions/_shared/checkedCalculations.mjs'
import {validateCompleteAnalysis,advanceCompleteAnalysis,completeResearchScope} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult,roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {completeAnalysisBlocks,completeAnalysisCopy} from '../app/modules/cases/lib/completeAnalysisDisplay.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'
import {quotationIndex,resolveQuotationIds} from '../supabase/functions/_shared/quotationIndex.mjs'
import {loadPrimarySources,primarySourceCatalogue,retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'

const original='Original '+('x'.repeat(310))+' Ende. Betrag 2.345,67 EUR.'
const quoteMap=quotationIndex({documents:[{id:'original',extracted_text:original}]},[])
assert.equal([...quoteMap.values()].map(item=>item.quote).join(' '),original,'indexing never drops long tokens or short final passages')
assert.equal(resolveQuotationIds({document_id:'original',quote:'@d0_0'},quoteMap).quote,[...quoteMap.values()][0].quote)
assert.throws(()=>resolveQuotationIds({document_id:'different',quote:'@d0_0'},quoteMap),/anderen Quelle/)
assert.throws(()=>resolveQuotationIds({document_id:'original',quote:'@d0_99'},quoteMap),/Unbekannter/)

const cachedText='An original public statutory text containing conditions and limitations, retrieved from its official publisher. Amount: 1250 EUR.'
const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(cachedText))),b=>b.toString(16).padStart(2,'0')).join('')
const snapshot={url:'https://authority.example/provision',title:'Public provision',source_text:cachedText,checked_at:new Date().toISOString(),content_sha256:digest,retrieval_mode:'verified_snapshot'}
const cacheFetch=record=>async url=>String(url).startsWith('https://raw.githubusercontent.com/')?new Response(JSON.stringify([record])):new Response('Unavailable',{status:503})
let cacheTransport=cacheFetch(snapshot)
assert((await loadPrimarySources(cacheTransport)).some(item=>item.url===snapshot.url))
assert.equal((await retrieveOfficialEvidence([snapshot],['authority.example'],{fetchImpl:cacheTransport,snapshotRecords:await loadPrimarySources(cacheTransport)})).get(snapshot.url).source_text,cachedText,'fallback uses actual recently fetched text when direct retrieval fails')
assert.equal((await retrieveOfficialEvidence([snapshot],['authority.example'],{fetchImpl:cacheFetch(snapshot),snapshotRecords:[{...snapshot,content_sha256:'a'.repeat(64)}]})).size,0,'tampered text is rejected')
const stale={...snapshot,checked_at:new Date(Date.now()-3*86400000).toISOString()}
assert.equal(primarySourceCatalogue(['authority.example'],Date.now(),[stale]).length,0)
assert.equal((await retrieveOfficialEvidence([snapshot],['authority.example'],{fetchImpl:cacheFetch(stale),snapshotRecords:[stale]})).size,0,'failed refresh cannot silently renew old legal text')

assert.equal(calculateExpression('a+b',{a:'0.1',b:'0.2'}),'0.30')
assert.equal(calculateExpression('a',{a:'1.005'}),'1.01')
assert.equal(calculateExpression('-a',{a:'1.005'}),'-1.01')
assert.equal(calculateExpression('floor(a/b)',{a:'-11',b:'3'},0),'-4')
assert.equal(calculateExpression('a^b',{a:'1.2',b:'2'}),'1.44')
assert.equal(calculateExpression('max(a-b,0)',{a:'10.25',b:'12'}),'0.00')
assert.throws(()=>calculateExpression('globalThis.fetch(a)',{a:'1'}),/erlaubt/)
assert.throws(()=>calculateExpression('a/0',{a:'1'}),/null/)
assert.throws(()=>calculateExpression('a/120',{a:'1000'}),/belegten/)
for(const [quote,value] of [['Betrag 1.234,56 EUR','1234.56'],['Amount 1,234.56 EUR','1234.56'],['Beitrag 2,69 %','2.69'],['Summe 18.000 EUR','18000']])assert(quoteContainsNumber(quote,value))
assert(!quoteContainsNumber('Betrag 123,45 EUR','23.45'))

// Regressions from the live case: statutory words and flattened table cells
// must remain readable without accepting a suffix or merging unrelated values.
const numericalEvidenceCases=[
  ['ein Einhundertzwanzigstel der Leistung', '120', true],
  ['längstens jedoch für einhundertzwanzig Monate.', '120', true],
  ['2026 84,0 2053 97,5 2027 84,5 2054 98,0', '84.0', true],
  ['2026 84,0 2053 97,5 2027 84,5 2054 98,0', '2026', true],
  ['Beträge 27.930,00 28.421,00 EUR', '28421', true],
  ['Beträge 31 454,48 31 690,98 EUR', '31690.98', true],
  ['Grundfreibetrag 12 348 Euro', '12348', true],
  ['Grundfreibetrag 12\u202f348,00 Euro', '12348', true],
  ['Saldo −1 234,50 EUR', '-1234.50', true],
  ['Betrag 1’234.50 CHF', '1234.50', true],
  ['Monatliches Einkommen: 1/120', '120', true],
  ['2026 84,0 2053 97,5', '2026840205397.5', false],
  ['Grundfreibetrag 12 348 Euro', '348', false],
  ['Betrag 123,45 EUR', '23.45', false],
  ['Saldo -123,45 EUR', '123.45', false],
  ['Kennzeichen A120B', '120', false],
  ['Kennzeichen code120', '120', false],
  ['Kennzeichen 120x', '120', false],
  ['einhundertzwanzigtausend Euro', '120', false],
  ['einhundertzwanzig Monate', '100', false],
  ['fünfundzwanzig Euro', '5', false],
]
assert.deepEqual(numericalEvidenceCases.map(([quote,value])=>quoteContainsNumber(quote,value)),numericalEvidenceCases.map(([, ,expected])=>expected),'statutory table cells, spelled factors and whole-number boundaries')

const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
assert(completeResearchScope(source).domains.includes('bundesfinanzministerium.de'),'domestic research has tax authority sources')
const scope={issues:[{id:'settlement',title:'Auszahlung',reason:'Brutto und Netto sind genannt.',calculation_needed:true}],research_topics:[]}
const evidence='Die einmalige Kapitalzahlung beträgt 18.000 EUR brutto und 17.000 EUR netto.'
const value=(name,amount)=>({name,label:name,value:amount,kind:'document',document_id:source.documents[0].id,url:'',quote:evidence,calculation_id:'',explanation:''})
const candidate={...structuredClone(roadmapTestResult),analysis:{topics:[{id:'settlement',title:'Abzüge',status:'conditional',conclusion:'Die Differenz beträgt 1.000 EUR; ihre Zusammensetzung ist noch offen.',conditions:'Die Abrechnung muss den Abzug erklären.',sources:[],step_ids:['anfragen']}],calculations:[{id:'difference',title:'Brutto minus netto',topic_ids:['settlement'],inputs:[value('gross','18000'),value('net','17000')],expression:'gross-net',decimal_places:2,unit:'EUR',conditions:'Keine Feststellung, dass die Differenz vollständig Steuer ist.',explanation:'Vom Bruttobetrag wird der Nettobetrag abgezogen.'}],limitations:['Die Art der Abzüge ist in den vorliegenden Texten nicht aufgeschlüsselt.']}}
const options={scope,research:[],outputLanguage:'de',referenceLanguage:'de'}
const checked=validateCompleteAnalysis(candidate,source,options)
assert.equal(checked.analysis.calculations[0].result,'1000.00')
const legalEvidence=[
  {url:'https://www.gesetze-im-internet.de/sgb_5/__229.html',source_text:'gilt ein Einhundertzwanzigstel der Leistung als monatlicher Zahlbetrag der Versorgungsbezüge, längstens jedoch für einhundertzwanzig Monate.'},
  {url:'https://www.gesetze-im-internet.de/estg/__22.html',source_text:'2025 83,5 2052 97,0 2026 84,0 2053 97,5 2027 84,5 2054 98,0'},
]
const sourced=structuredClone(candidate)
sourced.analysis.calculations[0].inputs=[{name:'months',label:'Monate',value:'120',kind:'source',...{url:legalEvidence[0].url,quote:legalEvidence[0].source_text}},{name:'percent',label:'Prozent',value:'84.0',kind:'source',...{url:legalEvidence[1].url,quote:legalEvidence[1].source_text}}]
sourced.analysis.calculations[0].expression='months+percent'
assert.equal(validateCompleteAnalysis(sourced,source,{...options,research:legalEvidence}).analysis.calculations[0].result,'204.00','valid statutory words and table values pass the complete source gate before computation')
sourced.analysis.calculations[0].inputs[1].value='84.1'
assert.throws(()=>validateCompleteAnalysis(sourced,source,{...options,research:legalEvidence}),error=>error.analysisIssues?.[0]?.reason.includes('84.1')&&error.analysisIssues[0].reason.includes('Belegauszug: 2025 83,5'),'a wrong value remains rejected with the actual cited excerpt for diagnosis')
let bad=structuredClone(candidate);bad.analysis.calculations[0].inputs[0].value='19000';assert.throws(()=>validateCompleteAnalysis(bad,source,options),/steht nicht/)
bad=structuredClone(candidate);bad.analysis.topics=[];assert.throws(()=>validateCompleteAnalysis(bad,source,options),/ausgelassen/)
bad=structuredClone(candidate);bad.analysis.topics[0].sources=[{url:'https://gesetze-im-internet.de/made-up',quote:'This source was never fetched.'}];assert.throws(()=>validateCompleteAnalysis(bad,source,options),/beleg/i)
bad=structuredClone(candidate);bad.analysis.calculations[0].inputs[0]={...value('gross','19000'),kind:'assumption'};assert.throws(()=>validateCompleteAnalysis(bad,source,options),/annahme/i)
bad=structuredClone(candidate)
bad.analysis.topics[0].sources=[{url:'https://authority.example/not-retrieved',quote:'This text was not supplied as research.'}]
bad.analysis.calculations[0].inputs[0].value='19000'
bad.analysis.calculations[0].inputs[1].quote='A different amount: 17.000 EUR.'
assert.throws(()=>validateCompleteAnalysis(bad,source,options),error=>{
  assert.deepEqual(error.analysisIssues.map(issue=>issue.location),['analysis.topics[0].sources[0].quote','analysis.calculations[0].inputs[0].value','analysis.calculations[0].inputs[1].quote'])
  return true
},'unfetched sources, unsupported numbers and altered original quotes are reported together')
const linked=structuredClone(candidate)
linked.analysis.calculations.push({...structuredClone(candidate.analysis.calculations[0]),id:'twice',inputs:[{name:'prior',label:'Vorherige Differenz',value:'1000.00',kind:'calculation',calculation_id:'difference'}],expression:'prior+prior'})
assert.equal(validateCompleteAnalysis(linked,source,options).analysis.calculations[1].result,'2000.00')
linked.analysis.calculations[1].inputs[0].value='999.00'
assert.throws(()=>validateCompleteAnalysis(linked,source,options),/weiterverwendetes/,'derived values must still equal the checked prior result')
linked.analysis.calculations[1].inputs[0].value='1000.00'
linked.analysis.calculations.reverse()
assert.throws(()=>validateCompleteAnalysis(linked,source,options),/weiterverwendetes/,'forward references remain invalid')

let calls=0
const fetchImpl=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');const request=JSON.parse(options.body);calls++
  const name=request.text.format.name
  assert.equal(request.model,'gpt-5.6-sol','complete planning, generation and independent review use the higher-capability model')
  if(name==='ash_evidence_review_v139')assert.equal(request.reasoning.effort,'high','the complete assembled result retains the full independent review')
  if(name.startsWith('ash_complete_'))assert(!request.instructions.includes('No external research has been performed in this workflow.'))
  const {analysis,...plan}=candidate
  const output=name==='ash_case_scope'?scope:name==='ash_complete_numbers_v157'?analysis:name==='ash_complete_plan_v157'?{...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}:{issues:[]}
  return new Response(JSON.stringify({status:'completed',id:'mock-'+calls,model:'mock-model',output_text:JSON.stringify(output)}))
}
const args={providerKey:'synthetic',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{model:'mock-model',instructions:'No external research has been performed in this workflow. Do not invent.\nUse original quotes.',input:[]},baseReviewContent:[],fetchImpl}
let flow=await advanceCompleteAnalysis(args);assert.equal(flow.state.stage,'analysis');assert(!flow.result)
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert(flow.state.draftAnalysis);assert.equal(flow.state.modelState.stage,'generation')
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert.equal(flow.state.modelState.stage,'review')
for(let part=0;part<3;part++){flow=await advanceCompleteAnalysis({...args,state:flow.state});assert.equal(flow.status,'processing');assert(!flow.result,'letters still require their separate review before acceptance')}
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert.equal(flow.status,'completed');assert.equal(flow.result.analysis.calculations[0].result,'1000.00');assert.equal(flow.result.analysis.verification.search_response_id,null)
assert.equal(calls,7,'no external research is claimed for an arithmetic-only case')
const researchedTopics=[],batchedScope={...scope,research_topics:Array.from({length:8},(_,i)=>'Abstract legal topic '+i)}
const official='https://www.gesetze-im-internet.de/estg/__34.html'
const batchFetch=async(url,options)=>{
  if(String(url).startsWith('https://raw.githubusercontent.com/'))return new Response('',{status:404})
  if(url===official)return new Response('<html><title>Official provision</title><main>'+cachedText+'</main></html>',{headers:{'Content-Type':'text/html'}})
  const request=JSON.parse(options.body),name=request.text.format.name
  let output=batchedScope,search=[]
  if(name==='ash_case_research'){
    const input=JSON.parse(request.input);assert.equal(input.research_topics.length,2)
    assert(!request.input.includes(source.documents[0].id),'public research receives no document identifiers')
    researchedTopics.push(...input.research_topics)
    output={sources:[{url:official,title:'Official provision'}],gaps:[]}
    search=[{type:'web_search_call',status:'completed',action:{sources:[{url:official}]}}]
  }
  return new Response(JSON.stringify({status:'completed',id:'batch',model:request.model,output_text:JSON.stringify(output),output:search}))
}
let batched=await advanceCompleteAnalysis({...args,fetchImpl:batchFetch})
for(let i=0;i<4;i++)batched=await advanceCompleteAnalysis({...args,fetchImpl:batchFetch,state:batched.state})
assert.equal(batched.state.stage,'analysis');assert.deepEqual(researchedTopics,batchedScope.research_topics,'every planned topic is researched exactly once in bounded batches')
const record=roadmapTestRecord();record.result=flow.result
const blocks=completeAnalysisBlocks(flow.result.analysis,'de'),exported=roadmapExportBlocks(record)
for(const block of blocks)assert(exported.some(item=>item.text===block.text),'visible analysis must also appear in Word/PDF')
const large=structuredClone(flow.result.analysis);large.calculations[0].result='9999999999999999.99'
assert(completeAnalysisBlocks(large,'de').some(block=>block.text.includes('9.999.999.999.999.999,99')),'display/export cannot lose exact cents through floating-point conversion')
for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])for(const value of Object.values(completeAnalysisCopy(lang)))assert(value.trim())

// Wrong source numbers are repaired before generating a plan. This remains
// bounded by the existing two attempts and never skips the four reviews.
for(const repairOutcome of ['complete','partial','none']){
  const stages=[]
  let analysisCalls=0
  const repairFetch=async(url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    stages.push(name)
    let output
    if(name==='ash_case_scope')output=scope
    else if(name==='ash_complete_numbers_v157'){
      analysisCalls++
      output=structuredClone(candidate.analysis)
      if(analysisCalls===1||repairOutcome==='none')output.calculations[0].inputs[0].value='19000'
      if(analysisCalls===1||repairOutcome!=='complete')output.calculations[0].inputs[1].value='16000'
      if(analysisCalls===2){
        const feedback=JSON.parse(request.input.at(-1).content[0].text).correction.issues
        assert.equal(feedback.length,2,'the one correction receives every invalid number, not only the first')
        assert.deepEqual(feedback.map(issue=>issue.location),['analysis.calculations[0].inputs[0].value','analysis.calculations[0].inputs[1].value'])
        assert(feedback.every(issue=>issue.reason.includes('steht nicht im angegebenen Beleg')))
      }
    }else if(name==='ash_complete_plan_v157'){
      const component=JSON.parse(request.input.at(-1).content[0].text)
      assert.equal(component.analysis.calculations[0].result,'1000.00','plan receives only successfully checked arithmetic')
      const {analysis,...plan}=candidate
      output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
    }else output={issues:[]}
    return new Response(JSON.stringify({status:'completed',id:'repair-'+stages.length,model:request.model,output_text:JSON.stringify(output)}))
  }
  let repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch})
  repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state})
  assert.equal(repairFlow.state.draftAnalysis,null)
  assert.equal(repairFlow.state.modelState.attempt,2)
  assert.equal(repairFlow.state.modelState.feedback.length,2,'both wrong source amounts must reach the single correction')
  if(repairOutcome!=='complete'){
    await assert.rejects(advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state}),error=>error.code==='source_unresolved'&&error.issues.length===(repairOutcome==='partial'?1:2))
    assert.equal(stages.length,3,'a second bad number stops before any plan or reviews')
    continue
  }
  while(repairFlow.status==='processing')repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state})
  assert.equal(repairFlow.result.analysis.calculations[0].result,'1000.00')
  assert.equal(repairFlow.result.analysis.verification.review_response_ids.length,4)
  assert.equal(stages.length,8,'one source correction, one plan and all four reviews')
}
console.log('Complete analysis: exact arithmetic, source-bound inputs, incomplete coverage rejection, untranslated-source integrity, staged review, domestic research configuration and display/export parity passed (provider mocked).')
