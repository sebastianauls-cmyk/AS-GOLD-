// A correction may replace only server-selected, existing parts of a candidate.
// The full candidate is assembled locally; the model cannot rewrite unrelated
// parts, change identities, or turn a partial correction into an accepted result.
const collections=[['analysis','topics'],['analysis','calculations'],['facts'],['open_questions'],['steps'],['letters']]
const scalarPaths=[['title'],['opening'],['key_points'],['meaning'],['next'],['customer_action'],['closing'],['analysis','limitations']]
const get=(value,path)=>path.reduce((item,key)=>item?.[key],value)
const label=path=>path.map((key,index)=>typeof key==='number'?`[${key}]`:(index?'.':'')+key).join('')
const own=(value,key)=>value!==null&&typeof value==='object'&&Object.hasOwn(value,key)

// Reviewers may return the original item ID instead of a full-result path.
// Resolve only exact IDs assigned by the server to this review. The same ID
// in a different collection must never redirect a correction to that item.
export function resolveReviewIssueLocations(issues,candidate,sections,schema=null){
  const assignments={analysis:['topic_ids',['analysis','topics']],calculations:['calculation_ids',['analysis','calculations']],roadmap:['step_ids',['steps']],letters:['letter_ids',['letters']]}
  const locations=new Map()
  for(const section of sections){
    const assignment=assignments[section.scope]
    if(!assignment)continue
    const [key,prefix]=assignment
    for(const [index,item] of (get(candidate,prefix)||[]).entries()){
      if(typeof item?.id!=='string'||!item.id||!(section[key]||[]).includes(item.id))continue
      const paths=locations.get(item.id)||new Set()
      paths.add(label([...prefix,index]));locations.set(item.id,paths)
    }
  }
  return issues.map(issue=>{
    const paths=locations.get(issue.location)
    // An item ID matching a scalar field is ambiguous: never let that
    // collision select either the item or the overview field by accident.
    if(scalarPaths.some(path=>issue.location===label(path)))return paths?.size?{...issue,location:'ambiguous:'+issue.location}:issue
    // Unknown, ambiguous and unassigned IDs remain unresolved, not guessed.
    const resolved=paths?.size===1?{...issue,location:[...paths][0]}:issue
    // Legacy exact field/ID paths remain readable, but only server-assigned
    // canonical locations can pass the complete-review schema below.
    const path=schema?locate(candidate,resolved.location,schema):null
    return path?{...resolved,location:label(path)}:resolved
  })
}

export function completeReviewLocations(candidate,sections){
  // Collection/global markers report a missing item or a genuinely wider
  // defect. They deliberately cannot select an automatic local replacement.
  const locations=new Set(['output','analysis',...collections.map(label)])
  const addItems=(prefix,ids)=>{
    for(const [index,item] of (get(candidate,prefix)||[]).entries())if(ids===null||ids.includes(item.id))locations.add(label([...prefix,index]))
  }
  for(const section of sections){
    if(section.scope==='analysis'){
      addItems(['analysis','topics'],section.topic_ids||[])
      if((section.topic_ids||[]).includes(candidate.analysis?.topics?.[0]?.id))locations.add('analysis.limitations')
    }
    if(section.scope==='calculations')addItems(['analysis','calculations'],section.calculation_ids||[])
    if(section.scope==='letters')addItems(['letters'],section.letter_ids||[])
    if(section.scope==='roadmap'){
      if(section.part==='overview'){
        scalarPaths.forEach(path=>locations.add(label(path)))
        // The overview independently audits cross-topic source applicability.
        addItems(['analysis','topics'],null)
      }
      for(const index of section.fact_indexes||[])locations.add(`facts[${index}]`)
      for(const index of section.question_indexes||[])locations.add(`open_questions[${index}]`)
      addItems(['steps'],section.step_ids||[])
    }
  }
  return [...locations]
}

function schemaAt(schema,path){
  for(const key of path)schema=typeof key==='number'?schema?.items:schema?.properties?.[key]
  return schema
}

function locate(candidate,location,schema){
  if(typeof location!=='string')return null
  for(const path of scalarPaths)if(location===label(path))return path
  for(const prefix of collections){
    const start=label(prefix)+'['
    if(!location.startsWith(start))continue
    const end=location.indexOf(']',start.length)
    if(end<0)return null
    let selector=location.slice(start.length,end)
    const quoted=/^(['"]).*\1$/.test(selector)
    if(quoted)selector=selector.slice(1,-1)
    const items=get(candidate,prefix)
    if(!Array.isArray(items))return null
    const indexes=new Set()
    // Server-assigned canonical paths use unquoted zero-based indices.
    // Numeric item IDs must never compete with those positions. Quoted
    // selectors (or legacy non-numeric selectors) identify original IDs.
    if(!quoted&&/^(0|[1-9]\d*)$/.test(selector)){
      if(Number(selector)<items.length)indexes.add(Number(selector))
    }else items.forEach((item,index)=>{if(item?.id===selector)indexes.add(index)})
    if(indexes.size!==1)return null
    const index=[...indexes][0],path=[...prefix,index],suffix=location.slice(end+1)
    // Unknown field names and ambiguous/global findings cannot select a patch.
    if(suffix){
      if(!suffix.startsWith('.'))return null
      const field=suffix.slice(1).split(/[.\[]/,1)[0]
      if(!own(schemaAt(schema,path)?.properties,field))return null
    }
    return path
  }
  return null
}

export function localizedRepairTargets(candidate,feedback,schema){
  if(!Array.isArray(feedback)||!feedback.length)return null
  // Source findings may correct an existing local claim. Wider source gaps
  // still fail location/size checks; every replacement is independently
  // reviewed again and must pass the unchanged literal-source/math gates.
  const selected=new Map()
  for(const issue of feedback){
    const path=locate(candidate,issue.location,schema)
    if(!path||!schemaAt(schema,path)||get(candidate,path)===undefined)return null
    selected.set(label(path),path)
  }
  // A changed computed value cannot leave a later calculation using its old
  // result. Include every transitive consumer in original dependency order.
  const affected=new Set([...selected.values()].filter(path=>path[0]==='analysis'&&path[1]==='calculations').map(path=>get(candidate,path).id))
  for(const [index,item] of (candidate.analysis?.calculations||[]).entries()){
    if(item.inputs?.some(input=>input.kind==='calculation'&&affected.has(input.calculation_id))){
      affected.add(item.id)
      const path=['analysis','calculations',index];selected.set(label(path),path)
    }
  }
  const paths=[...selected.values()].sort((a,b)=>a.slice(0,-1).join('.')===b.slice(0,-1).join('.')&&typeof a.at(-1)==='number'?a.at(-1)-b.at(-1):label(a).localeCompare(label(b)))
  // This is one bounded request, not another unbounded generation loop.
  if(paths.length>8||JSON.stringify(paths.map(path=>get(candidate,path))).length>20000)return null
  return paths.map((path,index)=>({key:'edit_'+index,path,location:label(path)}))
}

export function localizedRepairSchema(targets,candidate,schema){
  const properties={}
  for(const target of targets){
    const original=get(candidate,target.path),spec=structuredClone(schemaAt(schema,target.path))
    if(spec?.properties?.id&&original?.id!==undefined)spec.properties.id={type:'string',enum:[original.id]}
    properties[target.key]=spec
  }
  return {type:'object',additionalProperties:false,properties:{
    requires_full_correction:{type:'boolean'},reason:{type:'string'},
    changes:{anyOf:[{type:'object',additionalProperties:false,properties,required:Object.keys(properties)},{type:'null'}]}
  },required:['requires_full_correction','reason','changes']}
}

function matches(value,spec){
  if(!spec)return false
  if(spec.anyOf)return spec.anyOf.some(option=>matches(value,option))
  const type=value===null?'null':Array.isArray(value)?'array':typeof value
  if(spec.type==='integer'?!Number.isInteger(value):spec.type&&spec.type!==type)return false
  if(spec.enum&&!spec.enum.includes(value))return false
  if(type==='array')return (spec.minItems===undefined||value.length>=spec.minItems)&&(spec.maxItems===undefined||value.length<=spec.maxItems)&&value.every(item=>matches(item,spec.items))
  if(type==='object')return (spec.required||[]).every(key=>own(value,key))&&Object.keys(value).every(key=>own(spec.properties,key)&&matches(value[key],spec.properties[key]))
  return type!=='string'||!spec.pattern||new RegExp(spec.pattern).test(value)
}

export function applyLocalizedRepair(raw,targets,candidate,schema,resolve){
  const fail=reason=>{throw Object.assign(new Error(reason),{analysisIssues:[{code:'source',location:'correction',reason}]})}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!=='changes,reason,requires_full_correction'||typeof raw.requires_full_correction!=='boolean'||typeof raw.reason!=='string')fail('Die gezielte Korrektur hat kein gültiges Antwortformat.')
  if(raw.requires_full_correction){
    if(raw.changes!==null||!raw.reason.trim())fail('Eine erforderliche Gesamtkorrektur muss ohne Teiländerungen begründet werden.')
    return null
  }
  if(!raw.changes||typeof raw.changes!=='object'||Array.isArray(raw.changes)||Object.keys(raw.changes).sort().join(',')!==targets.map(target=>target.key).sort().join(','))fail('Die Korrektur muss genau die zugewiesenen Abschnitte enthalten.')
  const result=structuredClone(candidate),spec=localizedRepairSchema(targets,candidate,schema).properties.changes.anyOf[0]
  for(const target of targets){
    const value=resolve(raw.changes[target.key],target.location)
    if(!matches(value,spec.properties[target.key]))fail('Die Korrektur verändert die Struktur oder Kennung des Abschnitts '+target.location+'.')
    const parent=get(result,target.path.slice(0,-1))
    parent[target.path.at(-1)]=value
  }
  return result
}

export function localizedRepairAssignments(targets,candidate){
  return targets.map(target=>({key:target.key,location:target.location,previous:get(candidate,target.path)}))
}
