// The model chooses a source passage; the server copies its exact original text.
// This avoids turning a transcription typo into an invented or altered quote.
function passages(value,prefix,origin){
  const normalized=String(value||'').replace(/\s+/gu,' ').trim()
  const chunks=[];let rest=normalized
  while(rest){
    // Prefer a complete sentence, so a factor and its following duration or
    // qualification are not separated merely by the old character boundary.
    // Long sentences still have a bounded word-safe fallback.
    const boundaries=[...rest.slice(0,602).matchAll(/[.!?](?=\s+(?:\p{Lu}|§)|$)/gu)].map(match=>match.index+1).filter(index=>index<=600)
    let end=rest.length<=600?rest.length:boundaries.find(index=>index>=260)||boundaries.at(-1)||rest.lastIndexOf(' ',600)
    // Long unbroken strings must not disappear from the model's originals.
    if(end<1)end=rest.indexOf(' ',600)
    if(end<1)end=rest.length
    chunks.push(rest.slice(0,end));rest=rest.slice(end).trimStart()
  }
  return chunks.map((quote,index)=>({id:`@${prefix}_${index}`,quote,...origin}))
}
export function quotationIndex(source,research){
  const entries=[...source.documents.flatMap((doc,index)=>passages(doc.extracted_text,'d'+index,{document_id:doc.id})),...research.flatMap((item,index)=>passages(item.source_text,'s'+index,{url:item.url}))]
  return new Map(entries.map(item=>[item.id,item]))
}
export function indexedModelData(modelSource,research,index){
  const values=[...index.values()]
  return {source:{...modelSource,documents:modelSource.documents.map(({extracted_text,...doc})=>({...doc,passages:values.filter(item=>item.document_id===doc.id).map(({id,quote})=>({id,text:quote}))}))},research:research.map(({source_text,...item})=>({...item,passages:values.filter(entry=>entry.url===item.url).map(({id,quote})=>({id,text:quote}))}))}
}
// The model selects a passage once. Its original ID/URL and literal text come
// from that same server-owned index; they are not independent model choices.
export function indexedQuotationSchema(schema){
  if(!schema||typeof schema!=='object')return schema
  if(Array.isArray(schema))return schema.map(indexedQuotationSchema)
  const result=Object.fromEntries(Object.entries(schema).map(([key,value])=>[key,indexedQuotationSchema(value)]))
  const origin=schema.properties?.quote&&(schema.properties.document_id?'document_id':schema.properties.url?'url':null)
  if(origin){
    delete result.properties[origin]
    result.required=result.required.filter(key=>key!==origin)
    result.properties.quote={type:'string',pattern:origin==='document_id'?'^@d[0-9]+_[0-9]+$':'^@s[0-9]+_[0-9]+$'}
  }
  return result
}

// Operative legal wording can be selected directly in a topic conclusion.
// Expansion happens before provenance checks and every independent review.
// It proves transcription only, never relevance, completeness or applicability.
const ruleMarker=/\[\[rule\b/i
const ruleSelection=/\[\[rule:(@s[0-9]+_[0-9]+)(?:\.\.(@s[0-9]+_[0-9]+))?\]\]/g
function resolveRuleWording(text,sources,index,issue){
  const citations=Array.isArray(sources)?sources:[]
  if(ruleMarker.test(text.replace(ruleSelection,'')))issue('Ungültiger Regelbeleg: einen Quellenverweis oder einen zusammenhängenden Bereich derselben Quelle auswählen.')
  return text.replace(ruleSelection,(marker,startId,endId=startId)=>{
    const start=index.get(startId),end=index.get(endId)
    if(!start?.url||!end?.url){issue('Unbekannter Recherchebeleg für den Regeltext: '+marker);return marker}
    const [startPrefix,startNumber]=startId.split('_'),[endPrefix,endNumber]=endId.split('_')
    const first=Number(startNumber),last=Number(endNumber)
    if(startPrefix!==endPrefix||start.url!==end.url||!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||first>last){issue('Ein Regelbeleg muss einen geordneten, zusammenhängenden Bereich derselben Recherchequelle verwenden.');return marker}
    // Filter the finite index instead of iterating over a model-supplied bound.
    const selected=[...index.values()].filter(item=>{
      const [prefix,number]=item.id.split('_')
      return prefix===startPrefix&&Number(number)>=first&&Number(number)<=last
    }).sort((a,b)=>Number(a.id.split('_')[1])-Number(b.id.split('_')[1]))
    const norm=value=>String(value||'').replace(/\s+/gu,' ').trim()
    if(selected.length!==last-first+1||selected.some(item=>item.url!==start.url||!citations.some(citation=>citation?.url===item.url&&norm(citation.quote)===item.quote))){issue('Jeder Teil des Regeltexts braucht seinen unveränderten Quellenbeleg in sources derselben Fallfrage.');return marker}
    if(selected.some(item=>ruleMarker.test(item.quote))){issue('Der ausgewählte Quelltext enthält selbst reservierte Regelverweise und kann nicht als Regeltext-Vorlage eingesetzt werden.');return marker}
    return '„'+selected.map(item=>item.quote).join(' ')+'“'
  })
}
export function resolveQuotationIds(raw,index,{pathPrefix=''}={}){
  const issues=[]
  const visit=(value,path)=>{
    if(typeof value==='string'&&ruleMarker.test(value)&&!/(?:^|\.)topics\[\d+\]\.conclusion$|(?:^|\.)quote$/.test(path))issues.push({code:'source',location:path,reason:'Regelbeleg-Verweise sind nur in der Schlussfolgerung einer Fallfrage zulässig. Bedingungen beschreiben die offenen Falltatsachen; andere Texte dürfen keine unaufgelösten Verweise enthalten.'})
    if(!value||typeof value!=='object')return value
    if(Array.isArray(value))return value.map((item,i)=>visit(item,`${path}[${i}]`))
    const result=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item,path?path+'.'+key:key)]))
    if(typeof result.quote==='string'&&result.quote.startsWith('@')){
      const passage=index.get(result.quote)
      const issue=reason=>issues.push({code:'source',location:path?path+'.quote':'quote',reason})
      if(!passage){issue('Unbekannter Belegverweis: '+result.quote);return result}
      const requiresSource=result.kind==='source'||/(?:^|\.)sources\[\d+\]$/.test(path)
      const requiresDocument=result.kind==='document'||/(?:^|\.)evidence\[\d+\]$|(?:^|\.)deadline$/.test(path)
      if(requiresSource&&!passage.url||requiresDocument&&!passage.document_id){issue('Falsche Belegart: '+result.quote+' muss aus '+(requiresDocument?'einer Fallunterlage':'einer Recherchequelle')+' stammen.');return result}
      if(passage.document_id&&(result.url||result.document_id!==undefined&&passage.document_id!==result.document_id)||passage.url&&(result.document_id||result.url!==undefined&&passage.url!==result.url)){
        issue(`Belegverweis gehört zu einer anderen Quelle: ${result.quote}. Ausgewählt: ${result.document_id||result.url||'keine'}. Indexquelle: ${passage.document_id||passage.url}.`)
        return result
      }
      if(passage.document_id)result.document_id=passage.document_id
      if(passage.url)result.url=passage.url
      result.quote=passage.quote
    }
    if(/(?:^|\.)topics\[\d+\]$/.test(path)&&typeof result.conclusion==='string'&&ruleMarker.test(result.conclusion))result.conclusion=resolveRuleWording(result.conclusion,result.sources,index,reason=>issues.push({code:'source',location:path+'.conclusion',reason}))
    return result
  }
  const result=visit(raw,pathPrefix)
  if(issues.length)throw Object.assign(new Error(issues.map(issue=>issue.reason).join('\n')),{analysisIssues:issues})
  return result
}
