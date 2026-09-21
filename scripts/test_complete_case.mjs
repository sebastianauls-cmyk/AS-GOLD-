import assert from 'node:assert/strict'
import {calculateExpression,quoteContainsNumber} from '../supabase/functions/_shared/checkedCalculations.mjs'
import {validateCompleteAnalysis,advanceCompleteAnalysis,completeResearchScope} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult,roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {completeAnalysisBlocks,completeAnalysisCopy} from '../app/modules/cases/lib/completeAnalysisDisplay.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'

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

const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
assert(completeResearchScope(source).domains.includes('bundesfinanzministerium.de'),'domestic research has tax authority sources')
const scope={issues:[{id:'settlement',title:'Auszahlung',reason:'Brutto und Netto sind genannt.',calculation_needed:true}],research_topics:[]}
const evidence='Die einmalige Kapitalzahlung beträgt 18.000 EUR brutto und 17.000 EUR netto.'
const value=(name,amount)=>({name,label:name,value:amount,kind:'document',document_id:source.documents[0].id,url:'',quote:evidence,calculation_id:'',explanation:''})
const candidate={...structuredClone(roadmapTestResult),analysis:{topics:[{id:'settlement',title:'Abzüge',status:'conditional',conclusion:'Die Differenz beträgt 1.000 EUR; ihre Zusammensetzung ist noch offen.',conditions:'Die Abrechnung muss den Abzug erklären.',sources:[],step_ids:['anfragen']}],calculations:[{id:'difference',title:'Brutto minus netto',topic_ids:['settlement'],inputs:[value('gross','18000'),value('net','17000')],expression:'gross-net',decimal_places:2,unit:'EUR',conditions:'Keine Feststellung, dass die Differenz vollständig Steuer ist.',explanation:'Vom Bruttobetrag wird der Nettobetrag abgezogen.'}],limitations:['Die Art der Abzüge ist in den vorliegenden Texten nicht aufgeschlüsselt.']}}
const options={scope,research:[],outputLanguage:'de',referenceLanguage:'de'}
const checked=validateCompleteAnalysis(candidate,source,options)
assert.equal(checked.analysis.calculations[0].result,'1000.00')
let bad=structuredClone(candidate);bad.analysis.calculations[0].inputs[0].value='19000';assert.throws(()=>validateCompleteAnalysis(bad,source,options),/steht nicht/)
bad=structuredClone(candidate);bad.analysis.topics=[];assert.throws(()=>validateCompleteAnalysis(bad,source,options),/ausgelassen/)
bad=structuredClone(candidate);bad.analysis.topics[0].sources=[{url:'https://gesetze-im-internet.de/made-up',quote:'This source was never fetched.'}];assert.throws(()=>validateCompleteAnalysis(bad,source,options),/beleg/i)
bad=structuredClone(candidate);bad.analysis.calculations[0].inputs[0]={...value('gross','19000'),kind:'assumption'};assert.throws(()=>validateCompleteAnalysis(bad,source,options),/annahme/i)

let calls=0
const fetchImpl=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');const request=JSON.parse(options.body);calls++
  const name=request.text.format.name
  if(name==='ash_complete_case_v157')assert(!request.instructions.includes('No external research has been performed in this workflow.'))
  const output=name==='ash_case_scope'?scope:name==='ash_complete_case_v157'?candidate:{issues:[]}
  return new Response(JSON.stringify({status:'completed',id:'mock-'+calls,model:'mock-model',output_text:JSON.stringify(output)}))
}
const args={providerKey:'synthetic',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{model:'mock-model',instructions:'No external research has been performed in this workflow. Do not invent.\nUse original quotes.',input:[]},baseReviewContent:[],fetchImpl}
let flow=await advanceCompleteAnalysis(args);assert.equal(flow.state.stage,'analysis');assert(!flow.result)
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert.equal(flow.state.modelState.stage,'review')
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert.equal(flow.status,'completed');assert.equal(flow.result.analysis.calculations[0].result,'1000.00');assert.equal(flow.result.analysis.verification.search_response_id,null)
assert.equal(calls,3,'no external research is claimed for an arithmetic-only case')
const record=roadmapTestRecord();record.result=flow.result
const blocks=completeAnalysisBlocks(flow.result.analysis,'de'),exported=roadmapExportBlocks(record)
for(const block of blocks)assert(exported.some(item=>item.text===block.text),'visible analysis must also appear in Word/PDF')
for(const lang of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])for(const value of Object.values(completeAnalysisCopy(lang)))assert(value.trim())
console.log('Complete analysis: exact arithmetic, source-bound inputs, incomplete coverage rejection, untranslated-source integrity, staged review, domestic research configuration and display/export parity passed (provider mocked).')
