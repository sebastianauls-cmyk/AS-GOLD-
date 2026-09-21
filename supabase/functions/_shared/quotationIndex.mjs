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
export function resolveQuotationIds(raw,index){
  const visit=value=>{
    if(!value||typeof value!=='object')return value
    if(Array.isArray(value))return value.map(visit)
    const result=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item)]))
    if(typeof result.quote==='string'&&result.quote.startsWith('@')){
      const passage=index.get(result.quote)
      if(!passage)throw new Error('Unbekannter Belegverweis: '+result.quote)
      if(passage.document_id&&passage.document_id!==result.document_id||passage.url&&passage.url!==result.url)throw new Error('Belegverweis gehört zu einer anderen Quelle: '+result.quote)
      result.quote=passage.quote
    }
    return result
  }
  return visit(raw)
}
