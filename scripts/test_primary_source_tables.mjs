import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readableSourceText,retrieveOfficialEvidence} from '../supabase/functions/_shared/verifiedResearch.mjs'
import {quoteContainsNumber} from '../supabase/functions/_shared/checkedCalculations.mjs'
import {quotationIndex,resolveQuotationIds} from '../supabase/functions/_shared/quotationIndex.mjs'
import {validateCompleteAnalysis} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestResult} from '../app/modules/testing/customerRoadmapFixture.mjs'

// Reproduce separate three-digit cells being combined into a false amount.
// Within-cell thousands, empty cells and row boundaries must stay distinct.
const markup='<p>Public table fixture for extraction and numerical provenance only; no case applicability is established.</p><table><tr><th>Year</th><th>Rate</th><th>Cap</th><th>Supplement</th></tr><tr><td>2024</td><td>13,6</td><td>1&nbsp;020</td><td>306</td></tr><tr><td>2026</td><td>12,8</td><td>960</td><td>288</td></tr><tr><td>2027</td><td>12,4</td><td>930</td><td>279</td></tr><tr><td>1 440</td><td></td><td>432</td><td>125</td></tr></table><p>87 separate trailing units.</p>'
const pythonText=execFileSync('python3',['-B','-c',`import importlib.util,re,sys
spec=importlib.util.spec_from_file_location('refresh','scripts/refresh_primary_sources.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
parser=module.Text();parser.feed(sys.stdin.read())
print(re.sub(r'\\s+',' ',' '.join(parser.parts)).strip())`],{input:markup,encoding:'utf8'}).trim()
const directText=readableSourceText(markup,'text/html')
for(const [name,text] of [['edge extraction',directText],['snapshot extraction',pythonText]]){
  for(const value of ['2026','12.8','960.00','288.00','1020','306','1440','432','125','87'])assert(quoteContainsNumber(text,value),`${name} must retain the separate literal ${value}`)
  for(const value of ['960288','930279','1020306','1440432','12587','020','88','0.128','961'])assert(!quoteContainsNumber(text,value),`${name} must reject a merged, partial, rescaled or absent amount ${value}`)
  assert.match(text,/1 440\s*\|\s*\|\s*432/,'empty table cells retain their place')
}
assert.equal(directText,pythonText,'live and scheduled extraction preserve the same table structure')
for(const type of ['text/plain','text/html'])assert.equal(quoteContainsNumber(readableSourceText('Grundfreibetrag 12 348 Euro',type),'348'),false,'a thousands-group suffix is still unsupported')
const url='https://authority.example/table',item={url,title:'Synthetic primary table'}
const digest=async text=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex')
const snapshot={...item,source_text:pythonText,content_sha256:await digest(pythonText),checked_at:new Date().toISOString(),retrieval_mode:'verified_snapshot'}
const live=(await retrieveOfficialEvidence([item],['authority.example'],{fetchImpl:async()=>new Response(markup,{headers:{'content-type':'text/html'}})})).get(url)
const cached=(await retrieveOfficialEvidence([item],['authority.example'],{fetchImpl:async()=>new Response('Unavailable',{status:503}),snapshotRecords:[snapshot]})).get(url)
const source=roadmapSource(roadmapTestCase,roadmapTestDocuments,[])
for(const evidence of [live,cached]){
  assert(evidence)
  assert.equal(evidence.content_sha256,await digest(evidence.source_text),'the hash binds the exact extracted text including cell boundaries')
  const quotes=quotationIndex(source,[evidence])
  const [quoteId]=[...quotes].find(([,part])=>part.url===url&&quoteContainsNumber(part.quote,'960')&&quoteContainsNumber(part.quote,'288'))
  const inputs=[['cap','960.00'],['supplement','288.00']].map(([name,value])=>resolveQuotationIds({name,label:name,kind:'source',value,quote:quoteId},quotes))
  const candidate={...structuredClone(roadmapTestResult),analysis:{topics:[{id:'table',title:'Numerical control',status:'conditional',conclusion:'Two separate printed values can be read.',conditions:'No legal applicability is established by this fixture.',sources:[{url,quote:inputs[0].quote}],step_ids:['anfragen']}],calculations:[{id:'table_sum',title:'Mechanical test sum',topic_ids:['table'],inputs,expression:'cap+supplement',decimal_places:2,unit:'test units',conditions:'Arithmetic and provenance test only.',explanation:'Sum of two distinct source cells.'}],limitations:[]}}
  const options={scope:{issues:[{id:'table'}]},research:[evidence],outputLanguage:'de',referenceLanguage:'de'}
  assert.equal(validateCompleteAnalysis(candidate,source,options).analysis.calculations[0].result,'1248.00','retrieval, indexed quotation and the real source/arithmetic gate preserve distinct table values')
  candidate.analysis.calculations[0].inputs[0].value='960288'
  assert.throws(()=>validateCompleteAnalysis(candidate,source,options),/steht nicht/,'a spurious cross-cell amount is rejected by the real provenance gate')
}
console.log('Primary tables: live and snapshot extraction retain cells, rows, empty cells and within-cell thousands; exact hashes, indexed quotes and real arithmetic provenance pass; merged or partial numbers remain rejected.')
