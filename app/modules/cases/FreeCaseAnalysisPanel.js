'use client'

import {useEffect,useMemo,useRef,useState} from 'react'
import {analyzeFreeCase,freeAnalysisInput,hasFreeAnalysisAccess} from './lib/freeCaseAnalysis.mjs'
import {freeAnalysisCopy,freeAnalysisLanguage,freeCheckTitle,freeCheckEquation} from './lib/freeAnalysisCopy.mjs'
import {createFreeAnalysisExport} from '../services/freeAnalysisExport.mjs'
import {downloadExportArtifact} from '../services/exportService'
import './freeCaseAnalysis.css'

function Status({light,children}){
  return <span className="freeAnalysisStatus"><span className={`freeAnalysisDot ${light}`} aria-hidden="true"/>{children}</span>
}

export function CaseAnalysisModes({access,item,documents,language='de',onOpenDocument,children}){
  const [paid,setPaid]=useState(false)
  const allowed=hasFreeAnalysisAccess(access)
  const ui=freeAnalysisCopy(language)
  if(!allowed)return children
  return <div className="caseAnalysisModes">
    <div className="freeAnalysisModes" role="group" aria-label={ui.mode}>
      <button type="button" className={paid?'secondary':'primary'} aria-pressed={!paid} onClick={()=>setPaid(false)}>{ui.local}</button>
      <button type="button" className={paid?'primary':'secondary'} aria-pressed={paid} onClick={()=>setPaid(true)}>{ui.paid}</button>
    </div>
    {paid?<><p className="roadmapMeta">{ui.paidHint}</p>{children}</>:<FreeCaseAnalysisPanel key={`${item.owner_id}:${item.id}`} item={item} documents={documents} language={language} onOpenDocument={onOpenDocument}/>}
  </div>
}

export function FreeCaseAnalysisPanel({item,documents,language='de',onOpenDocument}){
  const ui=freeAnalysisCopy(language)
  const [saved,setSaved]=useState(null),[exporting,setExporting]=useState(false),[error,setError]=useState('')
  const input=useMemo(()=>freeAnalysisInput(item,documents),[item,documents])
  const signature=useMemo(()=>JSON.stringify(input),[input])
  const scopeRef=useRef(signature),mountedRef=useRef(true),exportBusy=useRef(false)
  scopeRef.current=signature
  useEffect(()=>{mountedRef.current=true;return()=>{mountedRef.current=false}},[])
  const current=saved?.signature===signature
  const result=current?saved.result:null
  function analyse(){
    setError('')
    setSaved({signature,result:analyzeFreeCase(input),createdAt:new Date().toISOString()})
  }
  async function download(type){
    if(!current||exportBusy.current)return
    exportBusy.current=true
    setExporting(true);setError('')
    try{
      const artifact=await createFreeAnalysisExport(result,type,{language,createdAt:saved.createdAt})
      if(mountedRef.current&&scopeRef.current===signature)downloadExportArtifact(artifact)
    }catch{if(mountedRef.current)setError(ui.exportError)}
    finally{exportBusy.current=false;if(mountedRef.current)setExporting(false)}
  }
  function source(doc){
    const original=documents.find(entry=>entry.id===doc.id&&entry.case_id===item.id&&entry.owner_id===item.owner_id)
    return original&&onOpenDocument?<button className="secondary" type="button" onClick={()=>onOpenDocument(original)}>{ui.openDocument}: {doc.title}</button>:null
  }
  return <section className="freeCaseAnalysis" aria-label={ui.title} lang={freeAnalysisLanguage(language)} dir="ltr">
    <h3>{ui.title}</h3><p>{ui.lead}</p><p className="freeAnalysisScope">{ui.scope}</p>
    <button className="primary" type="button" onClick={analyse}>{saved?ui.refresh:ui.start}</button>
    {saved&&!current&&<p role="status">{ui.changed}</p>}
    {error&&<p role="alert">{error}</p>}
    {result&&<div className="freeAnalysisResult">
      <h4>{ui.result}</h4><p role="status">{ui.counts(result.summary)}</p>
      <p className="freeAnalysisScope">{ui.boundary}</p><small>{ui.current}</small>
      {result.omitted_documents>0&&<p>{ui.omitted(result.omitted_documents)}</p>}
      <div className="freeAnalysisActions"><button type="button" className="secondary" disabled={exporting} onClick={()=>download('docx')}>Word</button><button type="button" className="secondary" disabled={exporting} onClick={()=>download('pdf')}>PDF</button></div>
      <h4>{ui.next}</h4><ul>
        {result.documents.some(doc=>!doc.has_text)&&<li>{ui.nextMissing}</li>}
        {result.summary.differences>0&&<li>{ui.nextMath}</li>}
        <li>{ui.nextOpen}</li>
      </ul>
      <h4>{ui.documents}</h4>
      {!result.documents.length&&<p>{ui.noDocuments}</p>}
      {result.documents.map(doc=><article key={doc.id} className="freeAnalysisDocument">
        <h5>{doc.title}</h5><Status light={doc.has_text?'green':'yellow'}>{doc.has_text?ui.available:ui.missing}</Status>
        {doc.truncated&&<p>{ui.truncated}</p>}
        {source(doc)}
        {doc.checks.length>0&&<section><h5>{ui.checks}</h5>{doc.checks.map((check,index)=><div key={index} className="freeAnalysisCheck">
          <b>{freeCheckTitle(check,language)}</b><p><Status light={check.matches?'green':'red'}>{check.matches?ui.mathOk:ui.mathDiff}</Status></p>
          <p>{freeCheckEquation(check,language)}</p>
          <details><summary>{ui.source}</summary>{[...check.inputs,check.target].map((row,i)=><blockquote key={i}><small>{doc.title} · {ui.line} {row.line_start}</small><p>{row.quote}</p></blockquote>)}</details>
        </div>)}</section>}
        {doc.open.length>0&&<section><h5>{ui.open}</h5>{doc.open.map((entry,index)=><blockquote key={index}><Status light="yellow">{entry.quote}</Status></blockquote>)}</section>}
        {doc.dates.length>0&&<details><summary>{ui.dates}</summary><ul>{doc.dates.map(entry=><li key={entry.date}><b>{entry.date}</b><p>{entry.quote}</p></li>)}</ul></details>}
        {doc.tables.length>0&&<details><summary>{ui.table}</summary>{doc.tables.map((table,i)=><div key={i}>{table.rows.map((row,j)=><blockquote key={j}><small>{ui.line} {row.line_start}</small><p>{row.quote}</p></blockquote>)}</div>)}</details>}
      </article>)}
      {!result.summary.checks&&<p>{ui.noChecks}</p>}
      {!result.summary.open&&<p>{ui.noOpen}</p>}
    </div>}
  </section>
}
