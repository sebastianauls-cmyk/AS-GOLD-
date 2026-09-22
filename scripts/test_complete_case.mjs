import assert from 'node:assert/strict'
import {calculateExpression,quoteContainsNumber} from '../supabase/functions/_shared/checkedCalculations.mjs'
import {validateCompleteAnalysis,advanceCompleteAnalysis,completeResearchScope,completeReviewCoverage} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult,roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {completeAnalysisBlocks,completeAnalysisCopy} from '../app/modules/cases/lib/completeAnalysisDisplay.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'
import {quotationIndex,resolveQuotationIds,indexedQuotationSchema} from '../supabase/functions/_shared/quotationIndex.mjs'
import {loadPrimarySources,primarySourceCatalogue,retrieveOfficialEvidence,supportingPrimaryEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'

const original='Original '+('x'.repeat(310))+' Ende. Betrag 2.345,67 EUR.'
const quoteMap=quotationIndex({documents:[{id:'original',extracted_text:original}]},[])
assert.equal([...quoteMap.values()].map(item=>item.quote).join(' '),original,'indexing never drops long tokens or short final passages')
const durationClause='Tritt an die Stelle der Versorgungsbezüge eine nicht regelmäßig wiederkehrende Leistung, gilt ein Einhundertzwanzigstel der Leistung als monatlicher Zahlbetrag der Versorgungsbezüge, längstens jedoch für einhundertzwanzig Monate.'
const durationText='Vorbemerkung zur Einordnung. '.repeat(8)+durationClause+' Weitere Erläuterungen folgen. '.repeat(30).trim()
const durationPassages=[...quotationIndex({documents:[]},[{url:'https://authority.example/duration',source_text:durationText}]).values()]
assert(durationPassages.some(item=>item.quote.includes(durationClause)),'the factor and its complete duration clause remain together beyond the old 260-character cut')
assert.equal(durationPassages.map(item=>item.quote).join(' '),durationText.replace(/\s+/g,' ').trim())
assert(durationPassages.every(item=>item.quote.length<=600),'ordinary sentence passages have a bounded context size')
const longTokenText='Start '+ 'x'.repeat(900)+' Ende.'
assert.equal([...quotationIndex({documents:[{id:'long-token',extracted_text:longTokenText}]},[]).values()].map(item=>item.quote).join(' '),longTokenText)
assert.equal(resolveQuotationIds({document_id:'original',quote:'@d0_0'},quoteMap).quote,[...quoteMap.values()][0].quote)
assert.throws(()=>resolveQuotationIds({document_id:'different',quote:'@d0_0'},quoteMap),/anderen Quelle/)
assert.throws(()=>resolveQuotationIds({document_id:'original',quote:'@d0_99'},quoteMap),/Unbekannter/)
assert.equal(resolveQuotationIds({kind:'document',quote:'@d0_0'},quoteMap).document_id,'original','a selected indexed passage supplies its canonical document origin')
const origins=quotationIndex({documents:[{id:'case-document',extracted_text:'Document amount 100 EUR. Payment remains due.'}]},[{url:'https://authority.example/rule',source_text:'Official rule: payment remains due after an objection.'}])
assert.deepEqual(resolveQuotationIds({analysis:{topics:[{sources:[{quote:'@s0_0'}]}]}},origins).analysis.topics[0].sources[0],{url:'https://authority.example/rule',quote:'Official rule: payment remains due after an objection.'})
for(const wrong of [
  {kind:'source',quote:'@d0_0'},
  {kind:'document',quote:'@s0_0'},
  {facts:[{evidence:[{quote:'@s0_0'}]}]},
  {analysis:{topics:[{sources:[{quote:'@d0_0'}]}]}},
  {steps:[{deadline:{quote:'@s0_0',date:'2026-10-15'}}]},
])assert.throws(()=>resolveQuotationIds(wrong,origins),/Falsche Belegart/,'research cannot be relabeled as original customer evidence or vice versa')
assert.throws(()=>resolveQuotationIds({topics:[{sources:[{url:'https://authority.example/other',quote:'@s0_0'},{quote:'@s99_0'}]}],calculations:[{inputs:[{quote:'@d99_0'}]}]},origins,{pathPrefix:'analysis'}),error=>{
  assert.deepEqual(error.analysisIssues.map(issue=>issue.location),['analysis.topics[0].sources[0].quote','analysis.topics[0].sources[1].quote','analysis.calculations[0].inputs[0].quote'])
  assert(error.analysisIssues[0].reason.includes('https://authority.example/other'))
  assert(error.analysisIssues[0].reason.includes('https://authority.example/rule'))
  return true
},'all invalid IDs and conflicting explicit origins reach correction with exact paths; no silent rebinding')
const literalSchema={type:'object',properties:{document_id:{type:'string'},quote:{type:'string'}},required:['document_id','quote'],additionalProperties:false}
const indexedSchema=indexedQuotationSchema(literalSchema)
assert.deepEqual(indexedSchema.required,['quote']);assert.equal(indexedSchema.properties.document_id,undefined)
assert(new RegExp(indexedSchema.properties.quote.pattern).test('@d0_1'))
assert(!new RegExp(indexedSchema.properties.quote.pattern).test('@s0_1'))
assert(!new RegExp(indexedSchema.properties.quote.pattern).test('Rewritten quotation'))
assert(literalSchema.properties.document_id,'schema conversion must not mutate legacy contracts')

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

// The base contribution statute delegates its current rate to a separate act.
// A same-act-only fallback omitted that operative text even when freshly fetched.
const statuteUrl='https://www.gesetze-im-internet.de/sgb_11/__55.html'
const adjustedRateUrl='https://www.gesetze-im-internet.de/pbav_2025/__1.html'
const effectiveDateUrl='https://www.gesetze-im-internet.de/pbav_2025/__2.html'
const rateSources=[statuteUrl,adjustedRateUrl,effectiveDateUrl].map(url=>({...snapshot,url}))
assert.deepEqual((await supportingPrimaryEvidence([statuteUrl],['gesetze-im-internet.de'],rateSources)).map(item=>item.url),[statuteUrl,adjustedRateUrl,effectiveDateUrl],'the current rate and commencement provision accompany the selected base statute')
assert.deepEqual((await supportingPrimaryEvidence(['https://www.gesetze-im-internet.de/sgb_11/__57.html'],['gesetze-im-internet.de'],rateSources)).map(item=>item.url),[statuteUrl,adjustedRateUrl,effectiveDateUrl],'the dependency is retained when the base rate enters via another provision of the same act')
assert.equal((await supportingPrimaryEvidence(['https://www.gesetze-im-internet.de/bgb/__1642.html'],['gesetze-im-internet.de'],rateSources)).length,0,'unrelated cases are not given the rate adjustment as applicable law')
assert.equal((await supportingPrimaryEvidence([statuteUrl],['authority.example'],rateSources)).length,0,'cross-act support does not bypass the country allowlist')
for(const rejected of [{...rateSources[1],checked_at:stale.checked_at},{...rateSources[1],content_sha256:'a'.repeat(64)}]){
  const valid=await supportingPrimaryEvidence([statuteUrl],['gesetze-im-internet.de'],[rateSources[0],rejected])
  assert.deepEqual(valid.map(item=>item.url),[statuteUrl],'stale or altered adjustments remain unavailable, not invented or renewed')
}

assert.equal(calculateExpression('a+b',{a:'0.1',b:'0.2'}),'0.30')
assert.equal(calculateExpression('amount*percent(rate)',{amount:'2520',rate:'84.0'}),'2116.80','a quoted percentage is converted explicitly without changing the source value')
assert.equal(calculateExpression('amount*percent(base+extra)',{amount:'62.25',base:'14.6',extra:'2.69'}),'10.76')
assert.equal(calculateExpression('percent(rate)',{rate:'-2.69'},8),'-0.02690000')
assert.equal(calculateExpression('percent(percent)',{percent:'84'}),'0.84','legacy input names remain unambiguous because a conversion requires call syntax')
assert.throws(()=>calculateExpression('percent(a,b)',{a:'84',b:'100'}),/Rechenfunktion/)
assert.throws(()=>calculateExpression('a/100',{a:'84'}),/belegten/,'unit conversion does not permit arbitrary unsourced numeric literals')
assert(!quoteContainsNumber('2026 84,0 2053 97,5','0.84'),'a normalized factor must never be passed off as the literal source number')
assert.equal(calculateExpression('a',{a:'1.005'}),'1.01')
assert.equal(calculateExpression('-a',{a:'1.005'}),'-1.01')
assert.equal(calculateExpression('floor(a/b)',{a:'-11',b:'3'},0),'-4')
assert.equal(calculateExpression('a^b',{a:'1.2',b:'2'}),'1.44')
assert.equal(calculateExpression('round(a,2)',{a:'1.005'}),'1.01','rounding precision is syntax, not a case amount')
assert.equal(calculateExpression('round(-a,2)',{a:'1.005'}),'-1.01')
assert.equal(calculateExpression('round(a,8)',{a:'1.12345678'},8),'1.12345678')
assert.equal(calculateExpression('a^2',{a:'1.2'}),calculateExpression('a*a',{a:'1.2'}),'squaring is identical to multiplying the same verified input twice')
assert.equal(calculateExpression('a^(2)',{a:'1.2'}),'1.44')
assert.equal(calculateExpression('round(a^2,2)+round(b,2)',{a:'1.2',b:'0.005'}),'1.45')
for(const expression of ['round(a,9)','round(a,-1)','round(a,1.5)'])assert.throws(()=>calculateExpression(expression,{a:'1.2'}),/Rundung|Rechenfunktion/)
for(const expression of ['a+2','a/2','2*a','round(2,2)','round(a/2,2)','round(a,2+1)','a^3','a^(2+1)','a^2/100'])assert.throws(()=>calculateExpression(expression,{a:'1.2'}),/belegten/,'structural syntax must not allow unverified amounts, divisors or periods')
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
  ['Die Größe „y“ ist ein Zehntausendstel des übersteigenden Teils.', '10000', true],
  ['der Wert eines Zehntausendstels', '10000', true],
  ['ein Tausendstel der Summe', '1000', true],
  ['ein Hundertstel der Summe', '100', true],
  ['Die Größe „y“ ist ein Zehntausendstel des übersteigenden Teils.', '1000', false],
  ['Die Größe „y“ ist ein Zehntausendstel des übersteigenden Teils.', '0.0001', false],
  ['eintausendzweihundert Euro', '1000', false],
  ['Die Zehntausendstelle ist belegt.', '10000', false],
  ['Die Summe wird zu gleichen Teilen auf die beiden Kinder verteilt.', '2', true],
  ['Both beneficiaries receive the same share.', '2', true],
  ['Beiderseitige Ansprüche sind noch offen.', '2', false],
  ['Die drei Kinder erhalten eine Zahlung.', '2', false],
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
for(const [analysis,location] of [[null,'analysis'],[{...candidate.analysis,topics:null},'analysis.topics'],[{...candidate.analysis,calculations:null},'analysis.calculations'],[{...candidate.analysis,limitations:null},'analysis.limitations']]){
  assert.throws(()=>validateCompleteAnalysis({...candidate,analysis},source,options),error=>error.analysisIssues?.[0]?.location===location,'a missing component is identified precisely')
}
const overBudget=structuredClone(candidate)
overBudget.analysis.calculations=Array.from({length:25},(_,i)=>({...structuredClone(candidate.analysis.calculations[0]),id:'calculation_'+i}))
assert.throws(()=>validateCompleteAnalysis(overBudget,source,options),error=>error.analysisIssues?.[0]?.location==='analysis.calculations'&&error.analysisIssues[0].reason.includes('25')&&error.analysisIssues[0].reason.includes('24'),'an oversized analysis is not misreported as a missing analysis')
const overInputs=structuredClone(candidate)
overInputs.analysis.calculations[0].inputs=Array.from({length:25},(_,i)=>({...value('value_'+i,'18000')}))
assert.throws(()=>validateCompleteAnalysis(overInputs,source,options),error=>error.analysisIssues?.[0]?.location==='analysis.calculations[0].inputs'&&error.analysisIssues[0].reason.includes('25'),'input overflow identifies the calculation and actual count')
const roundedCase=structuredClone(candidate)
roundedCase.analysis.calculations[0].expression='round(gross-net,2)'
assert.equal(validateCompleteAnalysis(roundedCase,source,options).analysis.calculations[0].result,'1000.00','rounding syntax still runs through original-input validation')
roundedCase.analysis.calculations[0].expression='(gross-net)^2'
assert.equal(validateCompleteAnalysis(roundedCase,source,options).analysis.calculations[0].result,'1000000.00')
const invalidFormulas=structuredClone(candidate)
invalidFormulas.analysis.calculations[0].expression='gross/2'
invalidFormulas.analysis.calculations.push({...structuredClone(candidate.analysis.calculations[0]),id:'other_formula',expression:'net/3'})
invalidFormulas.analysis.calculations.push({...structuredClone(candidate.analysis.calculations[0]),id:'dependent',inputs:[{name:'prior',label:'Ungültiger Vorwert',kind:'calculation',calculation_id:'difference',value:'9000'}],expression:'prior'})
assert.throws(()=>validateCompleteAnalysis(invalidFormulas,source,options),error=>{
  assert.deepEqual(error.analysisIssues.map(issue=>issue.location),['analysis.calculations[0].expression','analysis.calculations[1].expression','analysis.calculations[2].inputs[0].value'])
  assert(error.analysisIssues[0].reason.includes('gross/2'));assert(error.analysisIssues[1].reason.includes('net/3'))
  assert(error.analysisIssues[2].reason.includes('vorherigen gültigen Berechnung'))
  return true
},'repair receives all independent formula errors and no dependent value can consume a rejected calculation')
const twoChildrenQuote='Die Summe wird zu gleichen Teilen auf die beiden Kinder verteilt.'
const twoChildrenSource={...source,documents:source.documents.map((doc,index)=>index?doc:{...doc,extracted_text:doc.extracted_text+' '+twoChildrenQuote})}
const divided=structuredClone(candidate)
divided.analysis.calculations[0].inputs=[value('gross','18000'),{name:'children',label:'Kinderzahl',value:'2',kind:'document',document_id:source.documents[0].id,quote:twoChildrenQuote}]
divided.analysis.calculations[0].expression='gross/children'
assert.equal(validateCompleteAnalysis(divided,twoChildrenSource,options).analysis.calculations[0].result,'9000.00','a documented quantity stated as beiden is sourced from the original, not demoted to an assumption')
const legalEvidence=[
  {url:'https://www.gesetze-im-internet.de/sgb_5/__229.html',source_text:'gilt ein Einhundertzwanzigstel der Leistung als monatlicher Zahlbetrag der Versorgungsbezüge, längstens jedoch für einhundertzwanzig Monate.'},
  {url:'https://www.gesetze-im-internet.de/estg/__22.html',source_text:'2025 83,5 2052 97,0 2026 84,0 2053 97,5 2027 84,5 2054 98,0'},
  {url:'https://www.gesetze-im-internet.de/estg/__32a.html',source_text:'Die Größe „y“ ist ein Zehntausendstel des den Grundfreibetrag übersteigenden Teils.'},
]
const scaled=structuredClone(candidate)
scaled.analysis.calculations[0].inputs=[value('gross','18000'),{name:'divisor',label:'Rechenteiler',value:'10000',kind:'source',url:legalEvidence[2].url,quote:legalEvidence[2].source_text}]
scaled.analysis.calculations[0].expression='gross/divisor'
assert.equal(validateCompleteAnalysis(scaled,source,{...options,research:legalEvidence}).analysis.calculations[0].result,'1.80','a written statutory denominator passes the real provenance and arithmetic gate')
scaled.analysis.calculations[0].inputs[1].value='1000'
assert.throws(()=>validateCompleteAnalysis(scaled,source,{...options,research:legalEvidence}),/steht nicht/,'a different denominator remains rejected')
const sourced=structuredClone(candidate)
sourced.analysis.calculations[0].inputs=[{name:'months',label:'Monate',value:'120',kind:'source',...{url:legalEvidence[0].url,quote:legalEvidence[0].source_text}},{name:'percent',label:'Prozent',value:'84.0',kind:'source',...{url:legalEvidence[1].url,quote:legalEvidence[1].source_text}}]
sourced.analysis.calculations[0].expression='months+percent'
assert.equal(validateCompleteAnalysis(sourced,source,{...options,research:legalEvidence}).analysis.calculations[0].result,'204.00','valid statutory words and table values pass the complete source gate before computation')
sourced.analysis.calculations[0].inputs[1].value='84.1'
assert.throws(()=>validateCompleteAnalysis(sourced,source,{...options,research:legalEvidence}),error=>error.analysisIssues?.[0]?.reason.includes('84.1')&&error.analysisIssues[0].reason.includes('Belegauszug: 2025 83,5'),'a wrong value remains rejected with the actual cited excerpt for diagnosis')
const percentageCase=structuredClone(candidate)
percentageCase.analysis.calculations[0].inputs=[value('gross','18000'),{name:'taxable_rate',label:'Prozentsatz',value:'84.0',kind:'source',url:legalEvidence[1].url,quote:legalEvidence[1].source_text}]
percentageCase.analysis.calculations[0].expression='gross*percent(taxable_rate)'
assert.equal(validateCompleteAnalysis(percentageCase,source,{...options,research:legalEvidence}).analysis.calculations[0].result,'15120.00')
percentageCase.analysis.calculations[0].inputs[1].value='0.84'
assert.throws(()=>validateCompleteAnalysis(percentageCase,source,{...options,research:legalEvidence}),/steht nicht/,'percentage support never silently rescales a source input')
let bad=structuredClone(candidate);bad.analysis.calculations[0].inputs[0].value='19000';assert.throws(()=>validateCompleteAnalysis(bad,source,options),/steht nicht/)
bad=structuredClone(candidate);bad.analysis.topics=[];assert.throws(()=>validateCompleteAnalysis(bad,source,options),error=>error.analysisIssues?.[0]?.location==='analysis.topics'&&error.analysisIssues[0].reason.includes('0 Fallfragen'))
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

const topicFixture=(analysis,request)=>{
  const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_topics.map(item=>item.id)
  return {topics:structuredClone(analysis.topics.filter(item=>assigned.includes(item.id))),limitations:analysis.limitations}
}
const outlineFixture=analysis=>({calculation_plan:analysis.calculations.map(item=>({id:item.id,title:item.title,topic_ids:item.topic_ids,purpose:item.explanation,depends_on:item.inputs.filter(input=>input.kind==='calculation').map(input=>input.calculation_id)}))})
let calls=0
const fetchImpl=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');const request=JSON.parse(options.body);calls++
  const name=request.text.format.name
  assert.equal(request.model,'gpt-5.6-sol','complete planning, generation and independent review use the higher-capability model')
  if(name==='ash_evidence_review_v139')assert.equal(request.reasoning.effort,'high','the complete assembled result retains the full independent review')
  if(name.startsWith('ash_complete_')){
    assert.equal(request.reasoning.effort,'medium','separate bounded analysis and plan calls get substantive reasoning; review remains independent and high')
    assert(!request.instructions.includes('No external research has been performed in this workflow.'))
    const inspect=schema=>{if(!schema||typeof schema!=='object')return;if(schema.properties?.quote){assert.equal(schema.properties.document_id,undefined);assert.equal(schema.properties.url,undefined);assert(schema.properties.quote.pattern)};Object.values(schema).forEach(inspect)}
    inspect(request.text.format.schema)
  }
  if(name==='ash_complete_topics_v167'){
    const fields=request.text.format.schema.properties,assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_topics
    assert(assigned.length<=3)
    assert.equal(fields.topics.minItems,assigned.length);assert.equal(fields.topics.maxItems,assigned.length)
    assert.deepEqual(fields.topics.items.properties.id.enum,assigned.map(item=>item.id))
    assert.equal(fields.calculation_plan,undefined);assert.equal(fields.calculations,undefined)
  }
  if(name==='ash_complete_outline_v166'){
    const fields=request.text.format.schema.properties
    assert.equal(fields.topics,undefined,'saved topic explanations are not generated again with the numerical manifest')
    assert.equal(fields.calculation_plan.maxItems,24,'the complete numerical manifest is bounded before generation')
    assert.equal(fields.calculations,undefined,'the outline cannot generate all detailed calculations in one request')
  }
  if(name==='ash_complete_numbers_v157'){
    const fields=request.text.format.schema.properties,assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
    assert(assigned.length<=6)
    assert.equal(fields.calculations.maxItems,assigned.length)
    assert.equal(fields.calculations.minItems,assigned.length)
    assert.equal(fields.calculations.items.properties.inputs.minItems,1)
    assert.equal(fields.calculations.items.properties.inputs.maxItems,24)
  }
  if(name==='ash_complete_plan_v157'){
    const fields=request.text.format.schema.properties
    for(const [key,maximum] of [['key_points',3],['facts',24],['open_questions',24],['steps',12],['letters',6]])assert.equal(fields[key].maxItems,maximum)
    assert.equal(fields.key_points.minItems,1);assert.equal(fields.steps.minItems,1)
  }
  const {analysis,...plan}=candidate
  const output=name==='ash_case_scope'?scope:name==='ash_complete_topics_v167'?topicFixture(analysis,request):name==='ash_complete_outline_v166'?outlineFixture(analysis):name==='ash_complete_numbers_v157'?{calculations:structuredClone(analysis.calculations)}:name==='ash_complete_plan_v157'?{...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}:{issues:[]}
  if(name==='ash_complete_numbers_v157')for(const calculation of output.calculations)for(const input of calculation.inputs){
    const passage=[...quotationIndex(source,[]).values()].find(entry=>entry.document_id===input.document_id&&entry.quote.includes(input.quote))
    assert(passage,'integration fixture must select a real containing passage')
    delete input.document_id;delete input.url;input.quote=passage.id
  }
  return new Response(JSON.stringify({status:'completed',id:'mock-'+calls,model:'mock-model',output_text:JSON.stringify(output)}))
}
const args={providerKey:'synthetic',source,style:{},outputLanguage:'de',referenceLanguage:'de',baseRequest:{model:'mock-model',instructions:'No external research has been performed in this workflow. Do not invent.\nUse original quotes.',input:[]},baseReviewContent:[],fetchImpl}
// Reproduce a provider exceeding the old hidden calculation cap. The bounded
// repair receives the exact count/path, then every final review is still needed.
for(const repeatOverflow of [false,true]){
  let generations=0,reviews=0
  const boundedFetch=async(_url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=scope
    else if(name==='ash_complete_topics_v167')output=topicFixture(candidate.analysis,request)
    else if(name==='ash_complete_outline_v166'){
      generations++
      assert.equal(request.text.format.schema.properties.calculation_plan.maxItems,24)
      if(generations===2){
        const correction=JSON.parse(request.input.at(-1).content[0].text).correction
        assert(correction.issues.some(issue=>issue.location==='analysis.calculation_plan'&&issue.reason.includes('25')&&issue.reason.includes('24')))
      }
      output=generations===1||repeatOverflow?outlineFixture(overBudget.analysis):outlineFixture(candidate.analysis)
    }else if(name==='ash_complete_numbers_v157')output={calculations:structuredClone(candidate.analysis.calculations)}
    else if(name==='ash_complete_plan_v157'){
      const {analysis,...plan}=candidate;output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
    }else {reviews++;output={issues:[]}}
    return Response.json({status:'completed',id:`bounded-${generations}-${reviews}`,output_text:JSON.stringify(output)})
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:boundedFetch}),failure
  try{for(let i=0;run.status==='processing'&&i<16;i++)run=await advanceCompleteAnalysis({...args,fetchImpl:boundedFetch,state:run.state})}catch(error){failure=error}
  assert.equal(generations,2,'only one mechanical repair')
  if(repeatOverflow){assert.equal(failure?.code,'source_unresolved');assert.equal(failure.issues[0].location,'analysis.calculation_plan');assert.equal(reviews,0);assert(!run.result)}
  else {assert.equal(failure,undefined);assert.equal(run.status,'completed');assert.equal(reviews,8);assert.equal(run.result.analysis.calculations.length,1)}
}
// Scope bounds must be sent to structured generation, not only checked after
// spending a live planning call. Invalid provider output still fails closed.
for(const [invalid,locations] of [
  [{...scope,issues:[]},['scope.issues']],
  [{...scope,issues:Array.from({length:11},(_,i)=>({...scope.issues[0],id:'item_'+i}))},['scope.issues']],
  [{...scope,issues:[scope.issues[0],scope.issues[0]]},['scope.issues[1].id']],
  [{...scope,issues:[{...scope.issues[0],id:'ä'.repeat(51)}]},['scope.issues[0].id']],
  [{...scope,research_topics:Array.from({length:9},()=> 'Abstract topic')},['scope.research_topics']],
  [{...scope,research_topics:['private@example.test','https://example.test','x'.repeat(1201)]},['scope.research_topics[0]','scope.research_topics[1]','scope.research_topics[2]']],
]){
  let invoked=0
  const invalidPlanner=async(url,options)=>{
    invoked++
    const request=JSON.parse(options.body),schema=request.text.format.schema
    assert.equal(schema.properties.issues.minItems,1)
    assert.equal(schema.properties.issues.maxItems,10)
    assert.equal(schema.properties.research_topics.maxItems,8)
    assert(!new RegExp(schema.properties.issues.items.properties.id.pattern).test('ä'))
    assert(!new RegExp(schema.properties.research_topics.items.pattern).test('private@example.test'))
    return new Response(JSON.stringify({status:'completed',id:'invalid-planning',model:request.model,output_text:JSON.stringify(invalid)}))
  }
  await assert.rejects(advanceCompleteAnalysis({...args,fetchImpl:invalidPlanner}),error=>error.code==='scope_invalid'&&JSON.stringify(error.issues.map(issue=>issue.location))===JSON.stringify(locations))
  assert.equal(invoked,1,'invalid planning must not reach public research')
}
let flow=await advanceCompleteAnalysis(args);assert.equal(flow.state.stage,'analysis');assert(!flow.result)
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert(flow.state.topicDraft);assert.equal(flow.state.draftAnalysis,null)
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert(flow.state.analysisOutline);assert.equal(flow.state.draftAnalysis,null)
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert(flow.state.draftAnalysis);assert.equal(flow.state.modelState.stage,'generation')
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert(!flow.result);assert.equal(flow.state.modelState.stage,'review')
for(let part=0;part<7;part++){
  flow=await advanceCompleteAnalysis({...args,state:flow.state});assert.equal(flow.status,'processing');assert(!flow.result,'letters still require their separate review before acceptance')
  if(part===0)for(const reviewCoverage of [undefined,[]])await assert.rejects(advanceCompleteAnalysis({...args,state:{...flow.state,reviewCoverage}}),error=>error.code==='review_coverage_changed','old review receipts cannot be reassigned after a batching change')
}
flow=await advanceCompleteAnalysis({...args,state:flow.state});assert.equal(flow.status,'completed');assert.equal(flow.result.analysis.calculations[0].result,'1000.00');assert.equal(flow.result.analysis.verification.search_response_id,null)
assert.equal(calls,13,'no external research is claimed for an arithmetic-only case')
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

// A mechanical input repair must not consume the later content correction.
// Reproduce both defects in one workflow, and require all four reviews again.
for(const correctedContent of [true,false,'new_input','repeated_input']){
  let generatedAnalyses=0,generatedPlans=0,reviewed=0
  const contentIssue={code:'meaning',location:'analysis.topics[0].conclusion',reason:'Synthetic material omission: distinguish withholding from the final assessment.'}
  const repairBoth=async(url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=scope
    else if(name==='ash_complete_topics_v167')output=topicFixture(candidate.analysis,request)
    else if(name==='ash_complete_outline_v166')output=outlineFixture(candidate.analysis)
    else if(name==='ash_complete_numbers_v157'){
      generatedAnalyses++
      output=structuredClone(candidate.analysis)
      if(generatedAnalyses===1)output.calculations[0].inputs[0].value='19000'
      if(generatedAnalyses===3&&['new_input','repeated_input'].includes(correctedContent)||generatedAnalyses===4&&correctedContent==='repeated_input')output.calculations[0].inputs[0].value='19000'
      if(generatedAnalyses===3){
        const correction=JSON.parse(request.input.at(-1).content[0].text).correction
        assert(correction.issues.some(issue=>issue.reason===contentIssue.reason),'substantive feedback still reaches a correction after input repair')
        assert(correction.previous_candidate.analysis,'the full prior result is available for a bounded content correction')
      }
      if(generatedAnalyses===4&&['new_input','repeated_input'].includes(correctedContent)){
        const correction=JSON.parse(request.input.at(-1).content[0].text).correction
        assert(correction.issues.some(issue=>issue.reason===contentIssue.reason))
        assert(correction.issues.some(issue=>issue.reason.includes('19000')),'the corrected candidate receives both substantive and new mechanical feedback')
      }
    }else if(name==='ash_complete_plan_v157'){
      generatedPlans++
      const {analysis,...plan}=candidate
      output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
    }else{
      reviewed++
      output={issues:reviewed%8===1&&(!correctedContent||reviewed<=8)?[contentIssue]:[]}
    }
    return new Response(JSON.stringify({status:'completed',id:`both-${generatedAnalyses}-${generatedPlans}-${reviewed}`,model:request.model,output_text:JSON.stringify(output)}))
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:repairBoth})
  let failure
  try{for(let i=0;run.status==='processing'&&i<44;i++)run=await advanceCompleteAnalysis({...args,fetchImpl:repairBoth,state:run.state})}catch(error){failure=error}
  if(correctedContent===true||correctedContent==='new_input'){
    assert.equal(failure,undefined,'a successful input repair must leave one content correction available')
    assert.equal(run.status,'completed')
    assert.equal(run.result.analysis.verification.review_response_ids.length,8)
    assert(run.result.analysis.verification.review_response_ids.every(id=>Number(id.split('-').at(-1))>8),'acceptance uses only all eight final reviews')
  }else assert.equal(failure?.code,correctedContent==='repeated_input'?'source_unresolved':'review_unresolved','a second bad input in the same candidate or final material rejection still stops')
  assert.equal(generatedAnalyses,correctedContent===false||['new_input','repeated_input'].includes(correctedContent)?4:3);assert.equal(generatedPlans,correctedContent==='repeated_input'?1:correctedContent===false?3:2);assert.equal(reviewed,correctedContent==='repeated_input'?8:correctedContent===false?24:16)
}

// Wrong source numbers are repaired before generating a plan. This remains
// bounded by one input repair per substantive candidate and never skips reviews.
for(const repairOutcome of ['complete','partial','none']){
  const stages=[]
  let analysisCalls=0
  const repairFetch=async(url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    stages.push(name)
    let output
    if(name==='ash_case_scope')output=scope
    else if(name==='ash_complete_topics_v167')output=topicFixture(candidate.analysis,request)
    else if(name==='ash_complete_outline_v166')output=outlineFixture(candidate.analysis)
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
  assert(repairFlow.state.topicDraft);assert.equal(repairFlow.state.inputRepair,null)
  repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state})
  assert(repairFlow.state.analysisOutline);assert.equal(repairFlow.state.inputRepair,null)
  repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state})
  assert.equal(repairFlow.state.draftAnalysis,null)
  assert.equal(repairFlow.state.modelState.attempt,1,'the substantive correction is still unused')
  assert.equal(repairFlow.state.inputRepair.feedback.length,2,'both wrong source amounts must reach the single input correction')
  if(repairOutcome!=='complete'){
    await assert.rejects(advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state}),error=>error.code==='source_unresolved'&&error.issues.length===(repairOutcome==='partial'?1:2))
    assert.equal(stages.length,5,'a second bad number stops before any plan or reviews')
    continue
  }
  while(repairFlow.status==='processing')repairFlow=await advanceCompleteAnalysis({...args,fetchImpl:repairFetch,state:repairFlow.state})
  assert.equal(repairFlow.result.analysis.calculations[0].result,'1000.00')
  assert.equal(repairFlow.result.analysis.verification.review_response_ids.length,8)
  assert.equal(stages.length,14,'one source correction, one plan and all eight reviews')
}
// A provider may not omit, rename, reorder or reassign the stored work plan.
for(const defect of ['missing','extra','renamed','topic','forward_dependency']){
  let outlineCalls=0,numberCalls=0,laterCalls=0
  const malformed=async(_url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=scope
    else if(name==='ash_complete_topics_v167')output=topicFixture(candidate.analysis,request)
    else if(name==='ash_complete_outline_v166'){
      outlineCalls++;output=outlineFixture(candidate.analysis)
      if(defect==='forward_dependency')output.calculation_plan[0].depends_on=[output.calculation_plan[0].id]
    }else if(name==='ash_complete_numbers_v157'){
      numberCalls++;output={calculations:structuredClone(candidate.analysis.calculations)}
      if(defect==='missing')output.calculations=[]
      if(defect==='extra')output.calculations.push(structuredClone(output.calculations[0]))
      if(defect==='renamed')output.calculations[0].id='unplanned'
      if(defect==='topic')output.calculations[0].topic_ids=['unplanned']
    }else {laterCalls++;throw Error('Rejected components must never reach a plan or review')}
    return Response.json({status:'completed',id:'malformed-'+outlineCalls+'-'+numberCalls,output_text:JSON.stringify(output)})
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:malformed}),failure
  try{for(let i=0;i<5&&run.status==='processing';i++)run=await advanceCompleteAnalysis({...args,fetchImpl:malformed,state:run.state})}catch(error){failure=error}
  assert.equal(failure?.code,'source_unresolved')
  assert.equal(laterCalls,0);assert(!run.result)
  assert.equal(outlineCalls,defect==='forward_dependency'?2:1)
  assert.equal(numberCalls,defect==='forward_dependency'?0:2)
}

// Maximum supported case: every topic and calculation is audited exactly once
// per round. A timed-out middle batch resumes alone; a material finding still
// triggers a full correction and a fresh complete set of final reviews.
const big=structuredClone(candidate)
big.facts=Array.from({length:24},()=>structuredClone(candidate.facts[0]))
big.open_questions=Array.from({length:24},()=>structuredClone(candidate.open_questions[0]))
big.steps=Array.from({length:12},(_,i)=>({...structuredClone(candidate.steps[0]),id:'step_'+i,depends_on:i?['step_'+(i-1)]:[]}))
big.letters=Array.from({length:6},(_,i)=>({...structuredClone(candidate.letters[0]),id:'letter_'+i}))
big.analysis.topics=Array.from({length:10},(_,i)=>({...candidate.analysis.topics[0],id:'topic_'+i,step_ids:['step_0']}))
big.analysis.calculations=Array.from({length:24},(_,i)=>({...structuredClone(candidate.analysis.calculations[0]),id:'difference_'+i,topic_ids:['topic_'+(i%10)]}))
const bigScope={issues:big.analysis.topics.map(({id,title})=>({id,title,reason:'Synthetic coverage boundary',calculation_needed:true})),research_topics:[]}
const expectedCoverage=completeReviewCoverage(big),observedBatches=[]
assert.equal(expectedCoverage.length,25)
assert.deepEqual(expectedCoverage.filter(p=>p.part==='records').flatMap(p=>p.fact_indexes),Array.from({length:24},(_,i)=>i))
assert.deepEqual(expectedCoverage.filter(p=>p.part==='records').flatMap(p=>p.question_indexes),Array.from({length:24},(_,i)=>i))
assert.deepEqual(expectedCoverage.filter(p=>p.part==='steps').flatMap(p=>p.step_ids),big.steps.map(s=>s.id))
assert.deepEqual(expectedCoverage.filter(p=>p.scope==='letters').flatMap(p=>p.letter_ids),big.letters.map(s=>s.id))
for(const key of ['facts','open_questions','steps','letters']){const tooLarge=structuredClone(big);tooLarge[key].push(structuredClone(tooLarge[key][0]));assert.throws(()=>completeReviewCoverage(tooLarge),error=>error.code==='review_coverage_invalid'&&error.issues[0].location===key)}
let bigCalls=0,bigRound=0,bigGenerated=0,batchTimedOut=false,generationTimedOut=false,topicTimedOut=false
const badInputRounds=new Set(),generatedAssignments=[],generatedTopics=[]
const bigFetch=async(url,options)=>{
  if(!options?.body)return new Response('',{status:404})
  const request=JSON.parse(options.body),name=request.text.format.name
  bigCalls++
  let output
  if(name==='ash_case_scope')output=bigScope
  else if(name==='ash_complete_topics_v167'){
    const component=JSON.parse(request.input.at(-1).content[0].text),assigned=component.assigned_topics
    assert(assigned.length<=3)
    const supplied=JSON.parse(request.input[0].content[0].text)
    assert.deepEqual(supplied.scope,bigScope,'every topic batch retains the complete scope')
    assert.deepEqual(supplied.source.documents.map(item=>({id:item.id,text:item.passages.map(p=>p.text).join(' ')})),source.documents.map(item=>({id:item.id,text:item.extracted_text.replace(/\s+/gu,' ').trim()})),'every topic generation receives all original passages')
    assert.deepEqual(request.text.format.schema.properties.topics.items.properties.id.enum,assigned.map(item=>item.id))
    generatedTopics.push({round:bigRound+1,ids:assigned.map(item=>item.id)})
    if(assigned[0].id==='topic_3'&&!topicTimedOut){
      topicTimedOut=true
      assert.deepEqual(component.completed_analysis.topics.map(item=>item.id),['topic_0','topic_1','topic_2'])
      throw new DOMException('Synthetic second topic batch timeout','TimeoutError')
    }
    output=topicFixture(big.analysis,request)
  }
  else if(name==='ash_complete_outline_v166'){bigRound++;output=outlineFixture(big.analysis)}
  else if(name==='ash_complete_numbers_v157'){
    bigGenerated++
    const component=JSON.parse(request.input.at(-1).content[0].text),assigned=component.assigned_calculations
    assert(assigned.length<=6)
    generatedAssignments.push({round:bigRound,ids:assigned.map(item=>item.id)})
    assert.deepEqual(request.text.format.schema.properties.calculations.items.properties.id.enum,assigned.map(item=>item.id))
    if(assigned[0].id==='difference_6'&&!generationTimedOut){
      generationTimedOut=true
      assert.equal(component.completed_analysis.calculations.length,6,'first checked batch is retained before a later request times out')
      throw new DOMException('Synthetic numeric-batch timeout','TimeoutError')
    }
    output={calculations:structuredClone(big.analysis.calculations.filter(item=>assigned.some(plan=>plan.id===item.id)))}
    if(!badInputRounds.has(bigRound)){badInputRounds.add(bigRound);output.calculations[0].inputs[0].value='19000'}
    if(bigRound>1)assert(component.correction.issues.some(issue=>issue.location==='analysis.calculations[difference_18]'))
    if(bigRound===3)assert(component.correction.previously_addressed_issues.some(issue=>issue.reason.endsWith('round 1.')),'the third candidate must retain the previously addressed findings')
  }else if(name==='ash_complete_plan_v157'){
    const {analysis,...plan}=big;output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
  }else{
    assert.equal(request.reasoning.effort,'high')
    assert(request.input[0].content.some(item=>item.text==='SYNTHETIC_COMPLETE_ORIGINALS'),'every batch retains the complete original evidence')
    const payloads=request.input[0].content.flatMap(item=>{try{return [JSON.parse(item.text)]}catch{return []}})
    const assignment=payloads.find(item=>item.assigned_review).assigned_review,part=payloads.find(item=>item.candidate).candidate
    assert.deepEqual(payloads.find(item=>item.required_reviews).required_reviews,expectedCoverage)
    assert((part.analysis?.topics?.length||0)<=3);assert((part.analysis?.calculations?.length||0)<=6)
    assert((part.facts?.length||0)<=4);assert((part.open_questions?.length||0)<=4);assert((part.steps?.length||0)<=3);assert((part.letters?.length||0)<=1)
    if(assignment.scope==='roadmap'||assignment.scope==='letters'){
      assert.deepEqual(payloads.find(item=>item.related_output).related_output.steps,big.steps,'every action/letter audit retains complete cross-step context')
      if(assignment.part==='overview')assert.deepEqual(Object.keys(part).sort(),Object.keys(big).filter(k=>!['analysis','facts','open_questions','steps','letters'].includes(k)).sort(),'all remaining customer fields belong to the overview audit')
    }
    observedBatches.push({round:bigRound,...assignment})
    if(assignment.calculation_ids[0]==='difference_6'&&!batchTimedOut){batchTimedOut=true;throw new DOMException('Synthetic middle-batch timeout','TimeoutError')}
    output={issues:bigRound<3&&assignment.calculation_ids.includes('difference_18')?[{code:'meaning',location:'analysis.calculations[difference_18]',reason:`Synthetic material defect in the last calculation batch, round ${bigRound}.`}]:[]}
  }
  return new Response(JSON.stringify({status:'completed',id:`batch-round-${bigRound}-call-${bigCalls}`,model:request.model,output_text:JSON.stringify(output)}))
}
const bigArgs={...args,fetchImpl:bigFetch,baseReviewContent:[{type:'input_text',text:'SYNTHETIC_COMPLETE_ORIGINALS'}]}
let bigFlow=await advanceCompleteAnalysis(bigArgs),transportFailures=0
for(let i=0;bigFlow.status==='processing'&&i<120;i++){
  try{bigFlow=await advanceCompleteAnalysis({...bigArgs,state:bigFlow.state})}
  catch(error){if(error.code!=='provider_timeout')throw error;assert(++transportFailures<=3)}
}
assert.equal(bigFlow.status,'completed');assert.equal(bigCalls,112);assert.equal(bigGenerated,16);assert.equal(bigFlow.attempts,3)
assert.equal(transportFailures,3)
assert.equal(bigFlow.result.analysis.verification.analysis_response_ids.length,9,'each topic batch, manifest and final numeric batch has a separate receipt')
for(const round of [1,2,3]){
  const expected=Array.from({length:4},(_,i)=>big.analysis.topics.slice(i*3,i*3+3).map(item=>item.id))
  if(round===1)expected.splice(2,0,expected[1])
  assert.deepEqual(generatedTopics.filter(item=>item.round===round).map(item=>item.ids),expected,'each topic batch is generated once per candidate; only the interrupted batch repeats')
}
for(const round of [1,2,3])assert.deepEqual([...new Set(generatedAssignments.filter(item=>item.round===round).flatMap(item=>item.ids))],big.analysis.calculations.map(item=>item.id),'every planned calculation is generated in every complete candidate')
assert.deepEqual(bigFlow.result.analysis.verification.review_coverage,expectedCoverage)
assert.equal(bigFlow.result.analysis.verification.review_response_ids.length,25)
assert(bigFlow.result.analysis.verification.review_response_ids.every(id=>id.startsWith('batch-round-3-')))
assert.deepEqual(observedBatches.filter(item=>item.round===2).map(({round,...item})=>item),expectedCoverage,'all batches repeat after substantive correction')
assert.deepEqual(observedBatches.filter(item=>item.round===3).map(({round,...item})=>item),expectedCoverage,'a second correction also requires every batch again')
const firstRound=observedBatches.filter(item=>item.round===1).map(({round,...item})=>item)
assert.deepEqual(firstRound,[...expectedCoverage.slice(0,6),expectedCoverage[5],...expectedCoverage.slice(6)],'only the interrupted middle batch is repeated')
// The one input repair is shared across batches, not reset after each success.
{
  let outlines=0,numbers=0,plans=0
  const multi=structuredClone(big.analysis);multi.calculations=multi.calculations.slice(0,7)
  const failAcrossBatches=async(_url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=bigScope
    else if(name==='ash_complete_topics_v167')output=topicFixture(multi,request)
    else if(name==='ash_complete_outline_v166'){outlines++;output=outlineFixture(multi)}
    else if(name==='ash_complete_numbers_v157'){
      numbers++
      const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
      output={calculations:structuredClone(multi.calculations.filter(item=>assigned.some(entry=>entry.id===item.id)))}
      if(numbers===1||numbers===3)output.calculations[0].inputs[0].value='19000'
    }else{plans++;throw Error('Second source failure must stop before a plan')}
    return Response.json({status:'completed',id:'shared-'+outlines+'-'+numbers,output_text:JSON.stringify(output)})
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:failAcrossBatches}),failure
  try{for(let i=0;i<8&&run.status==='processing';i++)run=await advanceCompleteAnalysis({...args,fetchImpl:failAcrossBatches,state:run.state})}catch(error){failure=error}
  assert.equal(failure?.code,'source_unresolved')
  assert.equal(failure.issues[0].location,'analysis.calculations[6].inputs[0].value')
  assert.equal(outlines,1);assert.equal(numbers,3);assert.equal(plans,0)
  assert.equal(run.state.analysisOutline.analysis.calculations.length,6)
  assert(!run.result)
}
// Strict provider schemas are not trusted: reject omitted, duplicated,
// reordered and unrelated topic answers before numerical generation.
for(const defect of ['missing','duplicate','reordered','unrelated']){
  let topicCalls=0,laterCalls=0
  const malformedTopics=async(_url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=bigScope
    else if(name==='ash_complete_topics_v167'){
      topicCalls++;output=topicFixture(big.analysis,request)
      if(defect==='missing')output.topics.pop()
      if(defect==='duplicate')output.topics[1]=structuredClone(output.topics[0])
      if(defect==='reordered')output.topics.reverse()
      if(defect==='unrelated')output.topics[1].id='not_assigned'
    }else{laterCalls++;throw Error('Invalid topics cannot reach numerical generation or a customer result')}
    return Response.json({status:'completed',id:'invalid-topics-'+topicCalls,output_text:JSON.stringify(output)})
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:malformedTopics})
  run=await advanceCompleteAnalysis({...args,fetchImpl:malformedTopics,state:run.state})
  assert.equal(run.state.inputRepair.component,'topics');assert(!run.result)
  await assert.rejects(advanceCompleteAnalysis({...args,fetchImpl:malformedTopics,state:run.state}),error=>error.code==='source_unresolved'&&error.issues[0].location==='analysis.topics')
  assert.equal(topicCalls,2);assert.equal(laterCalls,0)
}
// A repaired topic batch consumes the same candidate-wide repair allowance
// as a later bad manifest or number; successful batches cannot reset it.
for(const failingComponent of ['outline','calculations']){
  let topicCalls=0,manifestCalls=0,numberCalls=0
  const sharedRepair=async(_url,options)=>{
    const request=JSON.parse(options.body),name=request.text.format.name
    let output
    if(name==='ash_case_scope')output=bigScope
    else if(name==='ash_complete_topics_v167'){
      topicCalls++;output=topicFixture(big.analysis,request)
      if(topicCalls===1)output.topics.pop()
    }else if(name==='ash_complete_outline_v166'){
      manifestCalls++;output=outlineFixture(big.analysis)
      if(failingComponent==='outline')output.calculation_plan[0].depends_on=[output.calculation_plan[0].id]
    }else if(name==='ash_complete_numbers_v157'){
      numberCalls++
      const assigned=JSON.parse(request.input.at(-1).content[0].text).assigned_calculations
      output={calculations:structuredClone(big.analysis.calculations.filter(item=>assigned.some(entry=>entry.id===item.id)))}
      output.calculations[0].inputs[0].value='19000'
    }else throw Error('A second component defect must stop before publication')
    return Response.json({status:'completed',id:`shared-topic-${topicCalls}-${manifestCalls}-${numberCalls}`,output_text:JSON.stringify(output)})
  }
  let run=await advanceCompleteAnalysis({...args,fetchImpl:sharedRepair}),failure
  try{for(let i=0;i<12&&run.status==='processing';i++)run=await advanceCompleteAnalysis({...args,fetchImpl:sharedRepair,state:run.state})}catch(error){failure=error}
  assert.equal(failure?.code,'source_unresolved');assert(!run.result)
  assert.equal(topicCalls,5);assert.equal(manifestCalls,1);assert.equal(numberCalls,failingComponent==='calculations'?1:0)
}
console.log('Complete analysis: exact arithmetic, provenance, bounded generation, complete batched reviews, single-batch transport resumption, full correction/review coverage and display/export parity passed (provider mocked).')
