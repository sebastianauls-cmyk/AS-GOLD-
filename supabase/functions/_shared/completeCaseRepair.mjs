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
  const selected=new Map(),affectedTopicIds=new Set()
  for(const issue of feedback){
    const path=locate(candidate,issue.location,schema)
    if(!path||!schemaAt(schema,path)||get(candidate,path)===undefined)return null
    selected.set(label(path),path)
    if(['source','meaning'].includes(issue.code)&&path[0]==='analysis'&&path[1]==='topics')affectedTopicIds.add(get(candidate,path).id)
  }
  // Global limitations may repeat the claim being corrected. Keep that
  // dependent text editable in the same single patch, even when the first
  // review located only the topic. Include it BEFORE the fixed size check:
  // if the necessary scope cannot fit, stop instead of locking in a stale
  // limitation. Unrelated limitations must be preserved and reviewed again.
  if(affectedTopicIds.size&&candidate.analysis?.limitations?.length){
    const path=['analysis','limitations']
    if(!schemaAt(schema,path))return null
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
  // Bound the editable replacement, not expanded evidence. The correction
  // schema returns passage IDs in quote fields; the server resolves them back
  // to the complete verified text. Counting those full passages here rejected
  // small local corrections solely because their citations were long.
  // This projection is for size accounting only: prompts, validation, review
  // and stored evidence still receive the original complete quotations.
  const fits=paths=>paths.length<=8&&JSON.stringify(paths.map(path=>get(candidate,path)),
    (key,value)=>key==='quote'&&typeof value==='string'?'@verified-passage-reference':value).length<=20000
  if(!fits([...selected.values()]))return null
  // Correcting a source or meaning defect can also require changing its actual
  // request or follow-through. Previously these explicitly linked steps were
  // immutable, forcing a needless full-correction stop or an inconsistent plan.
  // Include existing linked steps only within the SAME size budget. No new
  // steps, guessed links or additional repair calls are authorized here.
  const linkedSteps=new Set((candidate.analysis?.topics||[]).filter(topic=>affectedTopicIds.has(topic.id)).flatMap(topic=>topic.step_ids||[]))
  for(const [index,step] of (candidate.steps||[]).entries())if(linkedSteps.has(step.id)){
    const path=['steps',index],key=label(path)
    if(!selected.has(key)&&fits([...selected.values(),path]))selected.set(key,path)
  }
  const paths=[...selected.values()].sort((a,b)=>a.slice(0,-1).join('.')===b.slice(0,-1).join('.')&&typeof a.at(-1)==='number'?a.at(-1)-b.at(-1):label(a).localeCompare(label(b)))
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

// The one correction must remain inspectable after a terminal rejection. Keep
// bounded excerpts and hashes of the COMPLETE values, never provider requests,
// credentials or a second copy of the whole case. These excerpts are diagnostic
// drafts, not evidence or an accepted customer answer.
const TRACE_TEXT_LIMIT=4000
function traceExcerpt(text){
  const bytes=new TextEncoder().encode(text)
  let end=Math.min(bytes.length,TRACE_TEXT_LIMIT)
  // Cut only at a UTF-8 boundary: a diagnostic excerpt must not manufacture a
  // replacement character or multiply the sealed-state budget for CJK/emoji.
  if(end<bytes.length)while(end>0&&(bytes[end]&0xc0)===0x80)end--
  return {text:new TextDecoder().decode(bytes.subarray(0,end)),truncated:end<bytes.length}
}
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value
const traceFindings=issues=>(issues||[]).slice(0,30).map(issue=>({code:String(issue.code||'').slice(0,80),location:String(issue.location||'').slice(0,160),reason:String(issue.reason||'').slice(0,700)}))
async function traceValue(value){
  const text=JSON.stringify(canonical(value))
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))
  return {...traceExcerpt(text),sha256:Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')}
}
export async function createCorrectionTrace(targets,previous,candidate,findings){
  const entries=[]
  for(const target of targets){
    const before=await traceValue(get(previous,target.path)),after=await traceValue(get(candidate,target.path))
    entries.push({location:target.location,changed:before.sha256!==after.sha256,before,after})
  }
  return {version:1,findings:traceFindings(findings),entries}
}
export function correctionReviewComparison(trace,locations){
  if(trace?.version!==1||!Array.isArray(trace.entries))return null
  const changes=trace.entries.filter(entry=>entry.changed&&locations.includes(entry.location))
  if(!changes.length)return null
  return {previous_findings:trace.findings.filter(issue=>locations.includes(issue.location)),changes}
}
export async function correctionFailureDiagnostics(issues,candidate,trace,schema){
  if(trace?.version!==1||!Array.isArray(trace.entries))return []
  const diagnostics=[]
  for(const issue of issues.slice(0,8)){
    const path=locate(candidate,issue.location,schema)
    if(!path){diagnostics.push(null);continue}
    const location=label(path),entry=trace.entries.find(entry=>entry.location===location)
    // applyLocalizedRepair preserves every unassigned section verbatim. A new
    // finding on that section is not proof that the correction introduced it.
    const after=entry?.after||await traceValue(get(candidate,path))
    diagnostics.push({phase:'after_correction',section_changed:entry?.changed??false,
      previous_findings:trace.findings.filter(finding=>finding.location===location).slice(0,8),
      before:entry?.before||after,after})
  }
  return diagnostics
}
export function safeCorrectionDiagnostic(value){
  const snapshot=item=>{
    if(!item||typeof item.text!=='string'||typeof item.truncated!=='boolean'||!/^[a-f0-9]{64}$/.test(item.sha256))return null
    const excerpt=traceExcerpt(item.text)
    return {...excerpt,truncated:item.truncated||excerpt.truncated,sha256:item.sha256}
  }
  if(value?.phase!=='after_correction'||typeof value.section_changed!=='boolean'||!Array.isArray(value.previous_findings))return null
  const before=snapshot(value.before),after=snapshot(value.after)
  return before&&after?{phase:'after_correction',section_changed:value.section_changed,previous_findings:traceFindings(value.previous_findings).slice(0,8),before,after}:null
}
