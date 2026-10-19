// A correction may replace only server-selected, existing parts of a candidate.
// The full candidate is assembled locally; the model cannot rewrite unrelated
// parts, change identities, or turn a partial correction into an accepted result.
const collections=[['analysis','topics'],['analysis','calculations'],['facts'],['open_questions'],['steps'],['letters']]
const scalarPaths=[['title'],['opening'],['key_points'],['meaning'],['next'],['customer_action'],['closing'],['analysis','limitations']]
const get=(value,path)=>path.reduce((item,key)=>item?.[key],value)
const label=path=>path.map((key,index)=>typeof key==='number'?`[${key}]`:(index?'.':'')+key).join('')
const own=(value,key)=>value!==null&&typeof value==='object'&&Object.hasOwn(value,key)

// Foundation and roadmap are generated at different times. A correction of
// the foundation cannot consume the first correction of a not-yet-created
// roadmap. Each phase may be corrected ONCE, including mixed replacements.
// Keep the phase ledger in the sealed state; neither a worker restart nor a
// new review group resets it. Legacy second-attempt checkpoints are treated
// conservatively as having spent both phases, not granted a new allowance.
export function completeCaseCorrectionPhases(state){
  const attempt=state.modelState?.attempt??1
  const history=state.contentCorrectionPhases??(attempt===1?[]:attempt===2?[['foundation','roadmap']]:null)
  if(!Number.isInteger(attempt)||attempt<1||attempt>3||!Array.isArray(history)||history.length!==attempt-1)throw new Error('Ungültige Korrekturrunde.')
  const used=new Set()
  for(const phases of history){
    if(!Array.isArray(phases)||!phases.length||phases.length>2)throw new Error('Ungültige Korrekturrunde.')
    for(const phase of phases){
      if(!['foundation','roadmap'].includes(phase)||used.has(phase))throw new Error('Ungültige Korrekturrunde.')
      used.add(phase)
    }
  }
  return history.map(phases=>[...phases])
}

export function nextCaseCorrectionPhases(history,targets){
  if(!Array.isArray(targets)||!targets.length)return null
  const phases=[...new Set(targets.map(target=>target.path[0]==='analysis'?'foundation':'roadmap'))].sort()
  if(phases.some(phase=>history.some(previous=>previous.includes(phase))))return null
  return [...history.map(previous=>[...previous]),phases]
}

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
  // defect. A marker alone cannot select an automatic local replacement.
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

// Output schemas precede the source prefix in the provider's prompt. Use one
// bounded catalogue for every complete-case review, including foundation
// reviews before the roadmap exists. Actual assignments remain a separate,
// server-validated allowlist and are never widened by this catalogue.
export function completeReviewLocationCatalogue(limits){
  const locations=new Set(['output','analysis',...collections.map(label),...scalarPaths.map(label)])
  for(const path of collections){
    const limit=limits[label(path)]
    if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new Error('Invalid complete-review catalogue limit')
    for(let index=0;index<limit;index++)locations.add(label([...path,index]))
  }
  return Object.freeze([...locations])
}

// Run only AFTER the review's assignment/schema validation. All reviews see
// topic conclusions and conditions in related_output; an accepted collection
// finding can quote one of those claims without supplying its exact path.
// Narrow only an exact, substantial quotation unique to one existing topic.
// Never infer a location from paraphrases, source citations, IDs or a guessed
// batch index. Keep the full objection for correction and independent re-review.
export function resolveQuotedTopicIssueLocations(issues,candidate){
  const topics=candidate.analysis?.topics
  if(!Array.isArray(topics))return issues
  return issues.map(issue=>{
    if(issue.location!=='analysis.topics'||!['source','meaning'].includes(issue.code)||typeof issue.reason!=='string')return issue
    const quotes=[...issue.reason.matchAll(/"([^"]+)"|„([^„“]+)“|“([^“”]+)”|«([^«»]+)»/gu)]
      .map(match=>match.slice(1).find(value=>value!==undefined))
      .filter(quote=>quote.length>=32&&!/(?:…|\.{3})/.test(quote))
    const indexes=new Set()
    for(const quote of quotes)for(const [index,topic] of topics.entries()){
      if(['conclusion','conditions'].some(field=>typeof topic?.[field]==='string'&&topic[field].includes(quote)))indexes.add(index)
    }
    return indexes.size===1?{...issue,location:label(['analysis','topics',[...indexes][0]])}:issue
  })
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
  let selected=new Map()
  const affectedTopicIds=new Set()
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
  // limitation. Preserve supported unrelated limitations, while checking every
  // claim in this assigned replacement against the sources before re-review.
  if(affectedTopicIds.size&&candidate.analysis?.limitations?.length){
    const path=['analysis','limitations']
    if(!schemaAt(schema,path))return null
    selected.set(label(path),path)
  }
  // Questions and their collection/assessment steps are connected repair
  // units. Expand to a fixed point: a newly included step may serve another
  // question, even one earlier in the array. Never infer links from prose.
  const questionUnits=paths=>{
    const expanded=new Map(paths)
    let size
    do{
      size=expanded.size
      const stepIds=new Set([...expanded.values()].filter(path=>path[0]==='steps').map(path=>get(candidate,path).id))
      for(const [index,question] of (candidate.open_questions||[]).entries()){
        const ids=[question.collect_step_id,question.check_step_id].filter(id=>typeof id==='string')
        const path=['open_questions',index]
        if(!expanded.has(label(path))&&!ids.some(id=>stepIds.has(id)))continue
        expanded.set(label(path),path)
        for(const [stepIndex,step] of (candidate.steps||[]).entries())if(ids.includes(step.id)){
          const path=['steps',stepIndex];expanded.set(label(path),path)
        }
      }
    }while(expanded.size!==size)
    return expanded
  }
  selected=questionUnits(selected)
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
    if(!selected.has(key)){
      // Include the complete connected unit or none of it. Adding a linked
      // topic step alone used to leave its required question update forbidden.
      const proposed=questionUnits(new Map([...selected,[key,path]]))
      if(fits([...proposed.values()]))selected=proposed
    }
  }
  const paths=[...selected.values()].sort((a,b)=>a.slice(0,-1).join('.')===b.slice(0,-1).join('.')&&typeof a.at(-1)==='number'?a.at(-1)-b.at(-1):label(a).localeCompare(label(b)))
  return paths.map((path,index)=>({key:'edit_'+index,path,location:label(path)}))
}

const topicTextFields=['conclusion','conditions']
const isTopicTarget=target=>target.path.length===3&&target.path[0]==='analysis'&&target.path[1]==='topics'
const exactObject=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)})
const topicFieldCheck=exactObject({action:{type:'string',enum:['preserve','replace']},reason:{type:'string',minLength:1,maxLength:500,description:'One concise field-specific justification: identify its supported facts/rules or precise unresolved question, and the unsupported assertion removed if changed. This is a correction decision, not an independent approval.'}})

export function localizedRepairSchema(targets,candidate,schema){
  const properties={}
  for(const target of targets){
    const original=get(candidate,target.path),spec=structuredClone(schemaAt(schema,target.path))
    if(spec?.properties?.id&&original?.id!==undefined)spec.properties.id={type:'string',enum:[original.id]}
    properties[target.key]=spec
  }
  const topicChecks=Object.fromEntries(targets.filter(isTopicTarget).map(target=>[target.key,exactObject(Object.fromEntries(topicTextFields.map(field=>[field,structuredClone(topicFieldCheck)])))]))
  return exactObject({
    requires_full_correction:{type:'boolean'},reason:{type:'string'},
    // Decide separately for BOTH fields before returning the complete patch.
    // A valid decision proves coverage/consistency, never factual correctness.
    ...(Object.keys(topicChecks).length?{topic_checks:{anyOf:[exactObject(topicChecks),{type:'null'}]}}:{}),
    changes:{anyOf:[{type:'object',additionalProperties:false,properties,required:Object.keys(properties)},{type:'null'}]}
  })
}

function matches(value,spec){
  if(!spec)return false
  if(spec.anyOf)return spec.anyOf.some(option=>matches(value,option))
  const type=value===null?'null':Array.isArray(value)?'array':typeof value
  if(spec.type==='integer'?!Number.isInteger(value):spec.type&&spec.type!==type)return false
  if(spec.enum&&!spec.enum.includes(value))return false
  if(type==='array')return (spec.minItems===undefined||value.length>=spec.minItems)&&(spec.maxItems===undefined||value.length<=spec.maxItems)&&value.every(item=>matches(item,spec.items))
  if(type==='object')return (spec.required||[]).every(key=>own(value,key))&&Object.keys(value).every(key=>own(spec.properties,key)&&matches(value[key],spec.properties[key]))
  return type!=='string'||(spec.minLength===undefined||[...value].length>=spec.minLength)&&(spec.maxLength===undefined||[...value].length<=spec.maxLength)&&(!spec.pattern||new RegExp(spec.pattern).test(value))
}

export function applyLocalizedRepair(raw,targets,candidate,schema,resolve){
  const fail=reason=>{throw Object.assign(new Error(reason),{analysisIssues:[{code:'source',location:'correction',reason}]})}
  const repairSchema=localizedRepairSchema(targets,candidate,schema),hasTopicChecks=own(repairSchema.properties,'topic_checks')
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!==repairSchema.required.slice().sort().join(',')||typeof raw.requires_full_correction!=='boolean'||typeof raw.reason!=='string')fail('Die gezielte Korrektur hat kein gültiges Antwortformat.')
  if(raw.requires_full_correction){
    if(raw.changes!==null||hasTopicChecks&&raw.topic_checks!==null||!raw.reason.trim())fail('Eine erforderliche Gesamtkorrektur muss ohne Teiländerungen begründet werden.')
    return null
  }
  if(!raw.changes||typeof raw.changes!=='object'||Array.isArray(raw.changes)||Object.keys(raw.changes).sort().join(',')!==targets.map(target=>target.key).sort().join(','))fail('Die Korrektur muss genau die zugewiesenen Abschnitte enthalten.')
  if(hasTopicChecks&&(!raw.topic_checks||!matches(raw.topic_checks,repairSchema.properties.topic_checks.anyOf[0])))fail('Die Korrektur muss Ergebnis und Voraussetzungen jedes zugewiesenen Themas einzeln prüfen.')
  const result=structuredClone(candidate),spec=repairSchema.properties.changes.anyOf[0]
  for(const target of targets){
    const value=resolve(raw.changes[target.key],target.location)
    if(!matches(value,spec.properties[target.key]))fail('Die Korrektur verändert die Struktur oder Kennung des Abschnitts '+target.location+'.')
    if(isTopicTarget(target))for(const field of topicTextFields){
      const check=raw.topic_checks[target.key][field],changed=value[field]!==get(candidate,target.path)[field]
      // Compare resolved text, not passage-ID spelling. No self-assessment
      // can waive the following provenance, arithmetic or semantic reviews.
      if(!check.reason.trim()||changed!==(check.action==='replace'))fail('Die Feldprüfung stimmt nicht mit der Änderung von '+target.location+'.'+field+' überein.')
    }
    const parent=get(result,target.path.slice(0,-1))
    parent[target.path.at(-1)]=value
  }
  return result
}

export function localizedRepairAssignments(targets,candidate){
  return targets.map(target=>({key:target.key,location:target.location,previous:get(candidate,target.path),...(isTopicTarget(target)?{check_fields:topicTextFields.slice()}:{})}))
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
// Compare the complete resolved, validated candidates. Key ordering, passage
// IDs and omitted server-computed fields must not buy a repeat of a failed
// review. Any actual change still requires independent semantic review.
export const localizedRepairChanged=(previous,candidate)=>JSON.stringify(canonical(previous))!==JSON.stringify(canonical(candidate))
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
export function mergeCorrectionTraces(previous,current){
  if(previous?.version!==1||!Array.isArray(previous.entries))return current
  const changed=new Set(current.entries.map(entry=>entry.location))
  // Preserve exact earlier comparisons for untouched fields. Removing their
  // comparison would unnecessarily invalidate an identical approved review.
  return {version:1,findings:[...previous.findings.filter(item=>!changed.has(item.location)),...current.findings],entries:[...previous.entries.filter(item=>!changed.has(item.location)),...current.entries]}
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
