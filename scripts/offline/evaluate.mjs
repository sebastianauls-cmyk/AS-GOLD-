import {validateCompleteAnalysis} from '../../supabase/functions/_shared/completeCaseAnalysis.mjs'

const normalized=value=>String(value??'').normalize('NFKC').replace(/\s+/gu,' ').trim().toLowerCase()
const contains=(value,part)=>normalized(value).includes(normalized(part))
const at=(value,path)=>path.split('.').reduce((item,key)=>item?.[key],value)
const list=value=>Array.isArray(value)?value:[]

// The oracle is fixture-specific and intentionally separate from production
// validation. An exact quotation alone does not establish topical relevance;
// fixed expected findings catch known omissions without asking another model.
// It is not a general legal/semantic judge or a new-generation quality score.
export function evaluateOfflineResponse(fixture,response){
  const issues=[]
  const issue=(code,path,message)=>issues.push({code,path,message})
  let checked
  try{
    checked=validateCompleteAnalysis(structuredClone(response),fixture.source,fixture.context)
  }catch(error){
    issue('production_validation','',error.message)
  }
  const actual=checked??response
  for(const expected of fixture.expected.calculations){
    const calculation=list(actual?.analysis?.calculations).find(item=>item?.id===expected.id)
    if(!calculation)issue('calculation_missing',expected.id,'Erwartete Berechnung fehlt.')
    else if(calculation.result!==expected.result||calculation.unit!==expected.unit)issue('calculation_result',expected.id,`Erwartet: ${expected.result} ${expected.unit}.`)
  }
  for(const expected of fixture.expected.topics){
    const topic=list(actual?.analysis?.topics).find(item=>item?.id===expected.id)
    if(!topic){issue('topic_missing',expected.id,'Erwartete Fallfrage fehlt.');continue}
    if(topic.status!==expected.status)issue('topic_status',expected.id,'Gesicherte und offene Ergebnisse werden falsch eingeordnet.')
    const urls=list(topic.sources).map(item=>item?.url)
    if(urls.some(url=>!expected.allowed_sources.includes(url)))issue('source_relevance',expected.id,'Diese Quelle belegt die konkrete Fallfrage im Referenzfall nicht.')
    for(const url of expected.required_sources??[])if(!urls.includes(url))issue('source_missing',expected.id,'Die festgelegte Beleggrundlage fehlt.')
  }
  for(const expected of fixture.expected.steps){
    const step=list(actual?.steps).find(item=>item?.id===expected.id)
    if(!step){issue('step_missing',expected.id,'Ein erforderlicher Handlungsschritt fehlt.');continue}
    for(const id of expected.depends_on??[])if(!list(step.depends_on).includes(id))issue('dependency_missing',expected.id,`Erforderliche Voraussetzung fehlt: ${id}.`)
    if(Object.hasOwn(expected,'deadline')&&step.deadline?.date!==expected.deadline)issue('deadline',expected.id,'Die maßgebliche belegte Frist fehlt oder ist falsch.')
  }
  for(const rule of fixture.expected.text){
    const value=at(actual,rule.path)
    if(rule.any&&!rule.any.some(part=>contains(value,part)))issue(rule.code,rule.path,rule.reason)
    if(rule.none&&rule.none.some(part=>contains(value,part)))issue(rule.code,rule.path,rule.reason)
  }
  return {passed:issues.length===0,production_validation:checked?'passed':'failed',issues,checked}
}

export function applyCounterexample(response,changes){
  const result=structuredClone(response)
  for(const {path,value} of changes){
    const keys=path.split('.'),key=keys.pop()
    const parent=keys.reduce((item,name)=>item[name],result)
    parent[key]=structuredClone(value)
  }
  return result
}
