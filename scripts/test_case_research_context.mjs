import assert from 'node:assert/strict'
import {selectCaseResearch,caseResearchManifest,reviewResearchAssignment} from '../supabase/functions/_shared/caseResearchContext.mjs'
import {quotationIndex,indexedModelData} from '../supabase/functions/_shared/quotationIndex.mjs'
import {reviewModelCandidate} from '../supabase/functions/_shared/modelQuality.mjs'

// Fabricated source content for routing tests; these are not fetched legal texts.
const url=(act,section=1)=>`https://www.gesetze-im-internet.de/${act}/__${section}.html`
const research=[url('bgb'),url('bgb',2),url('estg'),url('estg',2),url('sgb_11'),url('pbav_2025'),url('pbav_2025',2),url('unassigned'),'https://authority.example/guidance'].map((url,i)=>({url,title:'Synthetic source '+i,source_text:`Fictional routing evidence ${i}. `+'Full clause and exception. '.repeat(100),checked_at:'2026-09-23T00:00:00Z'}))
const topic=(id,act)=>({id,sources:[{url:url(act),quote:'Fictional routing evidence'}],step_ids:[id]})
const analysis={topics:[topic('assets','bgb'),topic('tax','estg'),topic('care','sgb_11')],calculations:[]}
const choose=delta=>selectCaseResearch({research,analysis,topicIds:['care'],...delta})
assert.deepEqual(choose({}).research.map(i=>i.url),[...research.slice(4)].map(i=>i.url),'rate adjustment, commencement, unassigned and unclassified sources remain in full')
const care=choose({})
assert.equal(care.mode,'module')
for(const item of care.research)assert.equal(item,research.find(original=>original.url===item.url),'complete source objects remain unchanged')
const reversed={...analysis,topics:[...analysis.topics.slice(0,2),topic('care','pbav_2025')]}
assert(choose({analysis:reversed}).research.some(item=>item.url===url('sgb_11')),'an adjustment also retains its base act')
assert.deepEqual(choose({topicIds:['assets']}).research.map(i=>i.url),[research[0],research[1],research[7],research[8]].map(i=>i.url),'uncited provisions of the selected act cannot disappear')

const dependent={...analysis,calculations:[
  {id:'tax_base',topic_ids:['tax'],inputs:[{kind:'source',url:url('estg',2)}]},
  {id:'care_base',topic_ids:['care'],inputs:[{kind:'calculation',calculation_id:'tax_base'}]},
]}
assert(choose({analysis:dependent,topicIds:[],calculationIds:['care_base']}).research.some(item=>item.url===url('estg',2)),'transitive numerical dependencies retain their full sources')
const planned=choose({calculationIds:['planned'],topicIds:[],calculationPlan:[{id:'planned',topic_ids:['care'],depends_on:[]}]})
assert.equal(planned.mode,'module','a validated numerical manifest can route before the inputs are generated')
for(const delta of [
  {topicIds:[]},{topicIds:['unknown']},{calculationIds:['missing']},
  {analysis:{...analysis,topics:analysis.topics.map(t=>t.id==='care'?{...t,sources:[]}:t)}},
  {analysis:{...analysis,topics:analysis.topics.map(t=>t.id==='care'?{...t,sources:[{url:'https://absent.example/rule'}]}:t)}},
  {analysis:{...analysis,topics:[...analysis.topics,analysis.topics[0]]}},
  {calculationIds:['loop'],calculationPlan:[{id:'loop',topic_ids:['care'],depends_on:['loop']}]},
  {analysis:{...dependent,calculations:[dependent.calculations[1]]},calculationIds:['care_base']},
])assert.equal(choose(delta).mode,'complete','unknown, incomplete or ambiguous dependencies restore all research')
const candidate={analysis,steps:analysis.topics.map(t=>({id:t.id,depends_on:[]}))}
assert.deepEqual(reviewResearchAssignment({scope:'analysis',topic_ids:['care']},candidate,0),{},'the first topical completeness review retains all sources')
for(const section of [{scope:'letters'},{scope:'roadmap',part:'overview'},{scope:'roadmap',part:'records'}])assert.deepEqual(reviewResearchAssignment(section,candidate,3),{})
candidate.steps[2].depends_on=['tax']
assert.deepEqual(reviewResearchAssignment({scope:'roadmap',part:'steps',step_ids:['care']},candidate,3).topicIds,['tax','care'])
candidate.steps[1].depends_on=['care']
assert.deepEqual(reviewResearchAssignment({scope:'roadmap',part:'steps',step_ids:['care']},candidate,3),{},'cyclic action dependencies restore the whole context')

const originals={documents:[{id:'document',extracted_text:'Every original word remains available.'}]}
const quotes=quotationIndex(originals,research),indexed=indexedModelData(originals,care.research,quotes)
assert.equal(indexed.source.documents[0].passages.map(p=>p.text).join(' '),originals.documents[0].extracted_text)
assert.equal(indexed.research[0].passages[0].id,'@s4_0','selection never renumbers quotation IDs')
assert.equal(indexed.research[0].passages.map(p=>p.text).join(' '),research[4].source_text.trim())

let calls=0
const manifest=await caseResearchManifest(research)
const reviewConfig={providerKey:'synthetic-only',candidate:{result:'Fictional result'},reviewContent:[{type:'input_text',text:JSON.stringify({retrieved_sources:care.research,available_sources:manifest})}],fetchImpl:async()=>{calls++;return Response.json({id:'scoped-review-'+calls,status:'completed',output_text:JSON.stringify({issues:[]})})}}
const approval=await reviewModelCandidate(reviewConfig)
assert((await reviewModelCandidate({...reviewConfig,previousReview:approval.receipt})).reused)
const changed=structuredClone(research);changed[0].source_text+=' Changed exception in an omitted source.'
const nextManifest=await caseResearchManifest(changed)
assert.notEqual(nextManifest[0].context_sha256,manifest[0].context_sha256)
assert.equal(nextManifest[4].context_sha256,manifest[4].context_sha256)
assert(!(await reviewModelCandidate({...reviewConfig,previousReview:approval.receipt,reviewContent:[{type:'input_text',text:JSON.stringify({retrieved_sources:care.research,available_sources:nextManifest})}]})).reused,'even an omitted source change invalidates the receipt')
assert.equal(calls,2)
console.log('Module evidence routing: complete clauses, dependencies, conservative fallback and omitted-source receipt invalidation passed (synthetic).')
