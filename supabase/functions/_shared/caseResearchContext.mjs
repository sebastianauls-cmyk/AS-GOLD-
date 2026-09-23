import {primaryEvidenceAct,primaryEvidenceActs} from './verifiedResearch.mjs'

// Select complete fetched texts, never model summaries or isolated quotations.
// A source family can be excluded only after a different case topic has cited
// it. Unassigned sources and unfamiliar publishers remain in every module.
// This is context routing, not a legal determination that other law cannot apply.
export function selectCaseResearch({research,analysis,topicIds=[],calculationIds=[],calculationPlan=[]}){
  const full=reason=>({research,mode:'complete',reason,topic_ids:[],calculation_ids:[]})
  if(!research.length)return full('no_research')
  if(!topicIds.length&&!calculationIds.length)return full('whole_case')
  if(!Array.isArray(analysis?.topics)||!Array.isArray(analysis?.calculations))return full('unknown_analysis')
  const topics=new Map(analysis.topics.map(item=>[item.id,item]))
  const calculations=new Map(analysis.calculations.map(item=>[item.id,item]))
  const plans=new Map(calculationPlan.map(item=>[item.id,item]))
  if(topics.size!==analysis.topics.length||calculations.size!==analysis.calculations.length||plans.size!==calculationPlan.length)return full('ambiguous_ids')
  const selectedTopics=new Set(topicIds),selectedCalculations=new Set(),visiting=new Set(),urls=new Set()
  let unresolved=false
  const includeCalculation=id=>{
    if(selectedCalculations.has(id))return
    if(visiting.has(id)){unresolved=true;return}
    const calculation=calculations.get(id),plan=plans.get(id)
    if(!calculation&&!plan){unresolved=true;return}
    visiting.add(id)
    const item=calculation||plan
    if(!Array.isArray(item.topic_ids)||!item.topic_ids.length){unresolved=true;return}
    item.topic_ids.forEach(id=>selectedTopics.add(id))
    for(const input of calculation?.inputs||[]){
      if(input.kind==='source')urls.add(input.url)
      if(input.kind==='calculation')includeCalculation(input.calculation_id)
    }
    for(const dependency of plan?.depends_on||[])includeCalculation(dependency)
    visiting.delete(id);selectedCalculations.add(id)
  }
  calculationIds.forEach(includeCalculation)
  if(unresolved)return full('unknown_calculation_dependency')
  // Include all checked calculations belonging to a selected topic as well.
  // They can introduce another topic or a transitive source-bound calculation.
  let previousSize=-1
  while(previousSize!==selectedTopics.size+selectedCalculations.size){
    previousSize=selectedTopics.size+selectedCalculations.size
    for(const item of analysis.calculations)if(item.topic_ids?.some(id=>selectedTopics.has(id)))includeCalculation(item.id)
  }
  if(unresolved)return full('unknown_calculation_dependency')
  for(const id of selectedTopics){
    const topic=topics.get(id)
    if(!topic||!Array.isArray(topic.sources)||!topic.sources.length)return full('uncited_or_unknown_topic')
    for(const citation of topic.sources)urls.add(citation.url)
  }
  const available=new Set(research.map(item=>item.url))
  if(!urls.size||[...urls].some(url=>!available.has(url)))return full('unavailable_source')
  const assignedUrls=[...analysis.topics.flatMap(item=>(item.sources||[]).map(source=>source.url)),
    ...analysis.calculations.flatMap(item=>(item.inputs||[]).filter(input=>input.kind==='source').map(input=>input.url))]
  if(assignedUrls.some(url=>!available.has(url)))return full('unavailable_source')
  const selectedActs=primaryEvidenceActs([...urls],{bidirectional:true})
  const assignedActs=primaryEvidenceActs(assignedUrls,{bidirectional:true})
  const selected=research.filter(item=>{
    const act=primaryEvidenceAct(item.url)
    return urls.has(item.url)||!act||!assignedActs.has(act)||selectedActs.has(act)
  })
  if(selected.length===research.length)return full('all_sources_needed')
  return {research:selected,mode:'module',reason:'topic_and_calculation_dependencies',topic_ids:[...selectedTopics],calculation_ids:[...selectedCalculations]}
}

// Bind even an omitted source to a review receipt. Use the actual text, not a
// caller-supplied hash, so a changed exception invalidates an earlier approval.
export async function caseResearchManifest(research){
  return Promise.all(research.map(async source=>{
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(source)))
    return {url:source.url,title:source.title,checked_at:source.checked_at,truncated:!!source.truncated,
      context_sha256:Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')}
  }))
}

export function reviewResearchAssignment(section,candidate,partIndex){
  // Full-source audits independently check omissions and applicability across
  // the assembled case. Free-text facts/questions and letters have no reliable
  // topic links; retain all sources instead of guessing from recipient/keywords.
  if(section.scope==='analysis')return partIndex===0?{}:{topicIds:section.topic_ids}
  if(section.scope==='calculations')return {calculationIds:section.calculation_ids}
  if(section.scope!=='roadmap'||section.part!=='steps')return {}
  const steps=new Map(candidate.steps.map(item=>[item.id,item])),selected=new Set(),visiting=new Set()
  let unresolved=false
  const include=id=>{
    if(selected.has(id))return
    if(visiting.has(id)||!steps.has(id)){unresolved=true;return}
    visiting.add(id)
    for(const dependency of steps.get(id).depends_on||[])include(dependency)
    visiting.delete(id);selected.add(id)
  }
  section.step_ids.forEach(include)
  if(unresolved)return {}
  const topics=candidate.analysis.topics.filter(topic=>topic.step_ids?.some(id=>selected.has(id)))
  if([...selected].some(id=>!topics.some(topic=>topic.step_ids.includes(id))))return {}
  return {topicIds:topics.map(topic=>topic.id)}
}

export const MODULE_RESEARCH_INSTRUCTIONS='research_context identifies whether this module has the full research set or complete texts selected by topic/calculation dependencies. Every original document is still supplied. available_sources is only a catalogue, not evidence of the omitted text or its legal irrelevance. Use only supplied full texts for external claims. If a needed rule, exception or cross-topic dependency is not supplied, identify the missing source and dependency as a source issue; do not assume it away or approve unsupported applicability. Whole-case completeness and cross-topic applicability receive separate mandatory full-source audits.'
