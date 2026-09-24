import assert from 'node:assert/strict'
import {offlineFixtures} from './offline/fixtures.mjs'
import {roadmapModelSource,roadmapFingerprint,roadmapStyle} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapModelContext} from '../supabase/functions/_shared/roadmapModelContext.mjs'
import {quotationIndex,indexedModelData} from '../supabase/functions/_shared/quotationIndex.mjs'
import {advanceCompleteAnalysis,validateCompleteAnalysis} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'

// The responses and customer notes are wholly invented. This checks transport,
// evidence boundaries and call counts, not a real model's interpretation.
const marker='SYNTHETIC_CUSTOMER_NOTE_777'
const note=marker+': Nach meiner Erinnerung wurden weitere 777 EUR bezahlt; der Beleg fehlt. Bitte den Widerspruch klären.'
for(const id of ['invoice','authority','bilingual']){
  const fixture=structuredClone(offlineFixtures.find(item=>item.id===id))
  const unchanged=structuredClone(fixture.source)
  fixture.source.documents[0].voice_context=note
  fixture.source.documents[0].analysis_summary='PRIOR_AI_SUMMARY_MUST_NOT_BECOME_EVIDENCE'
  const source=fixture.source,model=roadmapModelSource(source)
  assert.deepEqual(model.customer_notes,[{document_id:source.documents[0].id,text:note,verification:'unverified_customer_statement'}],id+': saved customer notes must reach the model separately from originals')
  assert.ok(!JSON.stringify(model).includes('PRIOR_AI_SUMMARY'))
  assert.notEqual(await roadmapFingerprint(source),await roadmapFingerprint(unchanged))
  const index=quotationIndex(source,[])
  assert.ok([...index.values()].every(item=>!item.quote.includes(marker)),'customer notes never enter the original quotation index')
  assert.deepEqual(indexedModelData(model,[],index).source.customer_notes,model.customer_notes)
  const valid=validateCompleteAnalysis(structuredClone(fixture.reply),source,fixture.context)
  const invalid=structuredClone(valid);invalid.facts[0].evidence[0].quote=note
  assert.throws(()=>validateCompleteAnalysis(invalid,source,fixture.context),'a note cannot be laundered into a quoted document fact')
  if(valid.analysis.calculations.length){
    const invalidNumber=structuredClone(valid)
    Object.assign(invalidNumber.analysis.calculations[0].inputs[0],{value:'777',quote:note})
    assert.throws(()=>validateCompleteAnalysis(invalidNumber,source,fixture.context),'a reported amount cannot become a document-backed calculation input')
  }
  const args={source,style:roadmapStyle({}),outputLanguage:fixture.context.outputLanguage,referenceLanguage:fixture.context.referenceLanguage,permissions:{draft_letters:true}}
  const context=roadmapModelContext(args)
  assert.ok(context.request.instructions.includes('customer_notes'))
  assert.ok(context.reviewContent.some(part=>part.text.includes(marker)),'the independent reviewer also receives the unverified note')
  const scope={issues:fixture.reply.analysis.topics.map(topic=>({id:topic.id,title:topic.title,reason:'Synthetische Prüfung',calculation_needed:fixture.reply.analysis.calculations.some(calc=>calc.topic_ids.includes(topic.id))})),research_topics:[]}
  const withQuoteIds=value=>{
    if(Array.isArray(value))return value.map(withQuoteIds)
    if(!value||typeof value!=='object')return value
    const copy=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,withQuoteIds(item)]))
    if(copy.quote&&copy.document_id){
      const passage=[...index.values()].find(item=>item.document_id===copy.document_id&&item.quote.includes(copy.quote.replace(/\s+/g,' ').trim()))
      assert.ok(passage);copy.quote=passage.id;delete copy.document_id
    }
    return copy
  }
  async function simulate(inputSource){
    const base=roadmapModelContext({...args,source:inputSource}),requests=[]
    const transport=async(url,options)=>{
      if(String(url).startsWith('https://raw.githubusercontent.com/'))return new Response('',{status:404})
      assert.equal(url,'https://api.openai.com/v1/responses')
      const request=JSON.parse(options.body),name=request.text.format.name;requests.push(request)
      const {analysis,...plan}=structuredClone(fixture.reply)
      let output={issues:[]}
      if(name==='ash_case_scope')output=scope
      else if(name==='ash_complete_topics_v167')output={topics:analysis.topics.map(topic=>({...topic,step_ids:[]})),limitations:analysis.limitations}
      else if(name==='ash_complete_outline_v166')output={calculation_plan:analysis.calculations.map(calc=>({id:calc.id,title:calc.title,topic_ids:calc.topic_ids,purpose:calc.explanation,depends_on:calc.inputs.filter(input=>input.kind==='calculation').map(input=>input.calculation_id)}))}
      else if(name==='ash_complete_numbers_v157')output={calculations:analysis.calculations}
      else if(name==='ash_complete_plan_v157')output={...plan,topic_steps:analysis.topics.map(({id,step_ids})=>({id,step_ids}))}
      return Response.json({id:'synthetic-notes-'+requests.length,status:'completed',model:request.model,output_text:JSON.stringify(withQuoteIds(output))})
    }
    let flow
    for(let round=0;round<30;round++){
      flow=await advanceCompleteAnalysis({...args,source:inputSource,providerKey:'offline-unused',baseRequest:base.request,baseReviewContent:base.reviewContent,fetchImpl:transport,state:flow?.state})
      if(flow.status==='completed')break
    }
    assert.equal(flow.status,'completed')
    return requests
  }
  const without=await simulate(unchanged),withNotes=await simulate(source)
  assert.equal(withNotes.length,without.length,'retaining notes does not add a model request or correction loop')
  for(const request of withNotes)assert.ok(JSON.stringify(request.input).includes(marker),id+': every planning, generation and review request retains the customer note')
  const publicRequests=[]
  await advanceCompleteAnalysis({...args,providerKey:'offline-unused',baseRequest:context.request,baseReviewContent:context.reviewContent,state:{stage:'research',scope:{...scope,research_topics:['Allgemeine Belege bei Zahlungsabweichungen']},research:[],discovery_gaps:[]},fetchImpl:async(url,options)=>{
    if(String(url).startsWith('https://raw.githubusercontent.com/'))return new Response('',{status:404})
    const request=JSON.parse(options.body);publicRequests.push(request)
    return Response.json({id:'synthetic-public-search',status:'completed',model:request.model,output_text:JSON.stringify({sources:[],gaps:[]}),output:[{type:'web_search_call',status:'completed',action:{sources:[]}}]})
  }})
  assert.equal(publicRequests.length,1)
  assert.ok(!JSON.stringify(publicRequests[0].input).includes(marker),'the public research request must not directly receive private notes')
  assert.ok(!JSON.stringify(publicRequests[0].input).includes(source.documents[0].id))
}
const blank=structuredClone(offlineFixtures[0].source);blank.documents[0].voice_context='   '
assert.equal(roadmapModelSource(blank).customer_notes,undefined,'empty notes add no prompt content')
console.log('Customer notes: three case types, planning/generation/review delivery, explicit unverified origin, unchanged call counts, original/number evidence rejection and separate abstract public research passed. All responses simulated.')
