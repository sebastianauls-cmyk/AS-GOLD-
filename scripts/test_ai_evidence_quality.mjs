import assert from 'node:assert/strict'
import fs from 'node:fs'
import {originalPlainText,finalizeDocumentResult,runReviewedModel,validateQualityReview} from '../supabase/functions/_shared/modelQuality.mjs'
import {searchRetrievedSources,retrieveOfficialEvidence,officialUrl,readableSourceText} from '../supabase/functions/_shared/verifiedResearch.mjs'
import {historyCaseCorpus} from '../app/modules/testing/historyCaseCorpus.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {roadmapSource,validateRoadmapResult} from '../supabase/functions/_shared/customerRoadmap.mjs'

const encode=value=>new TextEncoder().encode(value)
const docCode=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const schemaLiteral=docCode.slice(docCode.indexOf('const schema=')+13,docCode.indexOf(';\n\n  const spokenContextInstruction'))
const schema=Function('return ('+schemaLiteral+')')()
const base={source_language:'de',extracted_text:'',document_translation:'Original',document_type:'Notiz',summary:'Eine Entscheidung fehlt.',next_step:'Bitte Absenderrolle, Empfänger und Zweck klären.',response_sender:null,response_role_evidence:'',reference_copy:'Wir bestätigen den Eingang Ihres Antrags.',customer_copy:'Wrong role',response_recipient:null,response_subject:'Eingang',traffic_light:'yellow',assessment_reasoning:'Entscheidung nicht bestätigt.',document_date:null,sender_or_author:null,recipient:null,reference_numbers:[],deadlines:[],monetary_amounts:[],confidence:'niedrig'}
for(const item of historyCaseCorpus)for(const doc of item.documents){
  const original=originalPlainText(encode(doc.extracted_text),'text/plain')
  const result=finalizeDocumentResult({...base,extracted_text:'Kein Dokument vorgelegt.'},{schema,originalText:original,referenceLanguage:'de',outputLanguage:'de'})
  assert.equal(result.extracted_text,doc.extracted_text)
  assert.equal(result.reference_copy,'');assert.equal(result.customer_copy,'')
  const sameLanguage=finalizeDocumentResult({...base,extracted_text:'',document_translation:'Unbelegte Umformulierung'},{schema,originalText:original,referenceLanguage:'de',outputLanguage:'de-DE'})
  assert.equal(sameLanguage.document_translation,doc.extracted_text,'same-language output preserves every source proposition')
}
const translated=finalizeDocumentResult({...base,source_language:'pl',extracted_text:'Umowa istnieje.',document_translation:'Der Vertrag besteht.'},{schema,originalText:'Umowa istnieje.',referenceLanguage:'de',outputLanguage:'de'})
assert.equal(translated.document_translation,'Der Vertrag besteht.','a real translation must not be overwritten with a foreign original')
const scanned=finalizeDocumentResult({...base,extracted_text:'Ein Vertrag besteht.',document_translation:'Ein Vertrag besteht.'},{schema,referenceLanguage:'de',outputLanguage:'de'})
assert.equal(scanned.document_translation,'Ein Vertrag besteht.','image/PDF transcription still needs model review')
for(const original of ['  Zeile 1\r\nZeile 2\n','§ 5 – Grüße, 1.000 €','Zażółć gęślą jaźń','متن اصلی','Dữ liệu gốc'])assert.equal(originalPlainText(encode(original),'text/plain; charset=utf-8'),original)
assert.equal(originalPlainText(new Uint8Array([0xff,0xfe,0x41,0,0xe4,0]),'text/plain'),'Aä')
assert.equal(originalPlainText(new Uint8Array([0xfe,0xff,0,0x41,0,0xe4]),'text/plain'),'Aä')
assert.throws(()=>originalPlainText(new Uint8Array([0xff]),'text/plain'),/Textkodierung/)
assert.throws(()=>originalPlainText(encode(' '),'text/plain'),/Originaltext/)
assert.equal(originalPlainText(encode('PDF bytes'),'application/pdf'),null)
assert.throws(()=>finalizeDocumentResult(base,{schema}),/Transkription/)
assert.throws(()=>finalizeDocumentResult({...base,extracted_text:'Original',traffic_light:'blue'},{schema}),/Pflichtfeld/)
const known=finalizeDocumentResult({...base,extracted_text:'Original',sender_or_author:'Behörde',recipient:'Nora Beispiel',response_recipient:'Behörde',reference_copy:'Sehr geehrte Damen und Herren, ich bitte um Auskunft.'},{schema,referenceLanguage:'de',outputLanguage:'pl'})
assert.ok(known.reference_copy);assert.equal(known.customer_copy,'Wrong role','role grounding is not a translation rewrite')

const explicitOriginal='Absender eines Schreibens soll Mara Beispiel selbst sein, keine Vertretung.'
const explicit=finalizeDocumentResult({...base,extracted_text:explicitOriginal,response_sender:'Mara Beispiel',response_role_evidence:explicitOriginal,response_recipient:'TEST-Unternehmen B',reference_copy:'Sehr geehrte Damen und Herren, ich bitte um Erläuterung.'},{schema,referenceLanguage:'de',outputLanguage:'de'})
assert.ok(explicit.reference_copy,'unknown author of a compiled note does not erase a directly evidenced own-reply role')
const inventedRole=finalizeDocumentResult({...base,extracted_text:'Eine Zahlung wurde erwähnt.',response_sender:'Mara Beispiel',response_role_evidence:explicitOriginal,response_recipient:'TEST-Unternehmen B'},{schema,referenceLanguage:'de',outputLanguage:'de'})
assert.equal(inventedRole.reference_copy,'','an invented role quote cannot unlock a letter')

const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
const invalid=structuredClone(roadmapTestResult);invalid.facts[0].evidence[0].quote='Invented research quotation'
const semantic={issues:[{code:'meaning',location:'facts[0]',reason:'A confirmed first clause was negated.'}]}
function provider(outputs){const requests=[];const fetchImpl=async(_url,options)=>{requests.push(JSON.parse(options.body));const output=outputs.shift();assert.ok(output,'unexpected provider request');return new Response(JSON.stringify({id:'test-'+requests.length,model:'mock',status:'completed',output_text:JSON.stringify(output)}),{status:200})};return {fetchImpl,requests}}
const baseRequest={model:'mock',instructions:'Original evidence only',input:[]}
const validation=raw=>validateRoadmapResult(raw,source)
let mock=provider([invalid,roadmapTestResult,{issues:[]}])
let checked=await runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,fetchImpl:mock.fetchImpl})
assert.equal(checked.attempts,2);assert.equal(mock.requests.length,3)
mock=provider([roadmapTestResult,semantic,roadmapTestResult,{issues:[]}])
checked=await runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,fetchImpl:mock.fetchImpl})
assert.equal(checked.attempts,2);assert.equal(mock.requests.length,4)
mock=provider([roadmapTestResult,semantic,roadmapTestResult,semantic])
await assert.rejects(runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,fetchImpl:mock.fetchImpl}),/kein Ergebnis gespeichert/)
assert.equal(mock.requests.length,4,'no unlimited repair or unchecked result')
assert.throws(()=>validateQualityReview({}),/Gegenprüfung/)
assert.throws(()=>validateQualityReview({issues:[{code:'made_up',location:'x',reason:'x'}]}),/Gegenprüfung/)
await assert.rejects(runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,budgetMs:0,fetchImpl:()=>{throw Error('must not call provider')}}),/zu lange/)
mock=provider([roadmapTestResult,{approved:true}])
await assert.rejects(runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,fetchImpl:mock.fetchImpl}),/Gegenprüfung/)
// A review that spends its token budget without a verdict must never approve.
let incompleteCalls=0
const incompleteFetch=async()=>{
  incompleteCalls++
  return new Response(JSON.stringify(incompleteCalls===1
    ?{id:'complete-generation',status:'completed',output_text:JSON.stringify(roadmapTestResult)}
    :{id:'incomplete-review',status:'incomplete',output:[]}),{status:200})
}
await assert.rejects(runReviewedModel({providerKey:'synthetic-test-key',request:baseRequest,reviewContent:[],validate:validation,fetchImpl:incompleteFetch}),/unvollständig/)
assert.equal(incompleteCalls,2,'no accepted result or unbounded retry after an incomplete review')

const domains=['gesetze-im-internet.de']
const url='https://www.gesetze-im-internet.de/bgb/__286.html'
assert.equal(officialUrl(url,domains),url)
for(const invalidUrl of ['http://gesetze-im-internet.de/x','https://gesetze-im-internet.de.evil.test/x','https://user:secret@gesetze-im-internet.de/x','https://127.0.0.1/x','https://gesetze-im-internet.de:8443/x'])assert.equal(officialUrl(invalidUrl,domains),null)
assert.equal(searchRetrievedSources({output:[{type:'message',content:[{annotations:[{type:'url_citation',url}]}]}]},domains).size,0,'citation alone is not retrieval')
assert.equal(searchRetrievedSources({output:[{type:'web_search_call',status:'failed',action:{sources:[{url}]}}]},domains).size,0)
assert.equal(searchRetrievedSources({output:[{type:'web_search_call',status:'completed',action:{sources:[{url}]}}]},domains).size,1)
const html='<html><script>invented rule</script><style>bad</style><p>Amtliche Quelle &sect; 286 &amp; weitere Angaben. '+('Lesbarer Originalinhalt. '.repeat(8))+'</p></html>'
assert.doesNotMatch(readableSourceText(html,'text/html'),/invented|bad/)
const pages=await retrieveOfficialEvidence([{url,title:'Test source'}],domains,{fetchImpl:async()=>new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}})})
assert.equal(pages.size,1);assert.match(pages.get(url).content_sha256,/^[a-f0-9]{64}$/)
const latinHtml='<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"></head><body>'+('Änderung gemäß amtlicher Quelle. '.repeat(8))+'</body></html>'
const latinBytes=Uint8Array.from([...latinHtml].map(character=>character.charCodeAt(0)))
const latinPages=await retrieveOfficialEvidence([{url,title:'Legacy encoding'}],domains,{fetchImpl:async()=>new Response(latinBytes,{headers:{'content-type':'text/html'}})})
assert.match(latinPages.get(url).source_text,/Änderung gemäß/)
let destinations=[]
const redirected=await retrieveOfficialEvidence([{url}],domains,{fetchImpl:async target=>{destinations.push(target);return new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}})}})
assert.equal(redirected.size,0);assert.equal(destinations.length,1,'untrusted redirect is never fetched')
for(const response of [new Response('Not found',{status:404}),new Response('PDF',{headers:{'content-type':'application/pdf'}}),new Response(html,{headers:{'content-type':'text/html','content-length':'2000000'}})])assert.equal((await retrieveOfficialEvidence([{url}],domains,{fetchImpl:async()=>response})).size,0)
console.log('V139: 104 original texts and same-language copies preserved; foreign translation, role gate, bounded repair, mandatory review, time budget, real-search provenance and safe official retrieval passed. Mocked provider checks are not live model acceptance.')
