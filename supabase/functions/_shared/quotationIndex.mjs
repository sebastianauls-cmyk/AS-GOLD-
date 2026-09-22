// The model chooses a source passage; the server copies its exact original text.
// This avoids turning a transcription typo into an invented or altered quote.
function passages(value,prefix,origin){
  const normalized=String(value||'').replace(/\s+/gu,' ').trim()
  const chunks=[];let rest=normalized
  while(rest){
    let end=rest.length<=260?rest.length:rest.lastIndexOf(' ',260)
    // Long unbroken strings must not disappear from the model's originals.
    if(end<1)end=rest.indexOf(' ',260)
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
export function resolveQuotationIds(raw,index,{pathPrefix=''}={}){
  const issues=[]
  const visit=(value,path)=>{
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
    return result
  }
  const result=visit(raw,pathPrefix)
  if(issues.length)throw Object.assign(new Error(issues.map(issue=>issue.reason).join('\n')),{analysisIssues:issues})
  return result
}
