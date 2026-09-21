'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { roadmapStyle, roadmapSource, roadmapFingerprint, roadmapSteps, ROADMAP_COLORS, validateRoadmapInput } from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import { readableStepText, roadmapProgressLabel, roadmapStepReference } from './lib/roadmapDisplay.mjs'
import { roadmapCurrentCopy, roadmapCurrentStatus } from './lib/roadmapCurrentStatus.mjs'
import { roadmapUi } from './lib/customerRoadmapCopy.mjs'
import { OUTPUT_LANGUAGES, outputLanguageLabels } from '../language/outputLanguage'
import { listCustomerRoadmaps, generateCustomerRoadmap, saveRoadmapProgress, authorizeRoadmap, roadmapErrorMessage } from '../services/customerRoadmap'
import { createRoadmapExport } from '../services/customerRoadmapExport.mjs'
import { downloadExportArtifact } from '../services/exportService'
import { ResultContinuation } from './ResultContinuation'
import { simpleCaseCopy } from './lib/simpleCaseCopy.mjs'
import { caseDocuments, preparationContext, prepareCaseDocuments, savePreparedCaseDocuments } from './lib/casePreparation.mjs'
import './customerRoadmap.css'

function Dot({light,label}) {return <span className="roadmapLight"><span aria-hidden="true" style={{backgroundColor:ROADMAP_COLORS[light]}}/>{label}</span>}
function Evidence({items,documents,ui,onOpenDocument}) {
  if(!items?.length)return null
  return <details className="roadmapEvidence"><summary>{ui.evidence}</summary>{items.map((entry,index)=>{
    const doc=documents.find(item=>item.id===entry.document_id)
    return <blockquote key={index}><p>{entry.quote}</p>{doc&&onOpenDocument?<button type="button" className="secondary" onClick={()=>onOpenDocument(doc)}>{ui.newDocument}: {doc.title}</button>:<cite>{doc?.title||entry.document_id}</cite>}</blockquote>
  })}</details>
}

export function CustomerRoadmapView({record,stale=false,documents=[],onOpenDocument,onProgress,onExport,busy=false,full=false,onFull,continuation={},language='de'}) {
  const ui=roadmapUi(record.output_language)
  const controls=roadmapUi(language)
  const [editing,setEditing]=useState('')
  const [note,setNote]=useState('')
  const [focusStep,setFocusStep]=useState('')
  const stepRefs=useRef(new Map())
  const result=record.result
  const steps=roadmapSteps(record,{stale})
  const current=roadmapCurrentStatus(record,{stale})
  const currentCopy=roadmapCurrentCopy(record.output_language)
  const controlCopy=roadmapCurrentCopy(language)
  useEffect(()=>{
    if(!full||!focusStep)return
    const element=stepRefs.current.get(focusStep)
    if(element){element.scrollIntoView({behavior:'smooth',block:'start'});element.focus({preventScroll:true})}
    setFocusStep('')
  },[full,focusStep])
  function openCurrentStep(){if(current.step)setFocusStep(current.step.id);onFull?.()}
  const rtl=['ar','fa'].includes(record.output_language)
  const safeExport=type=>onExport?.(type)
  const assessment=<><p className="roadmapOpening">{result.opening}</p><ul>{result.key_points.map((point,index)=><li key={index}>{point}</li>)}</ul><p><b>{ui.meaning}</b><br/>{result.meaning}</p></>
  return <div className="customerRoadmapView" lang={record.output_language} dir={rtl?'rtl':'ltr'}>
    <div className="roadmapLetterhead">{record.style.letterhead||record.style.sender_name}</div>
    <h3>{result.title}</h3><p className="roadmapMeta">{ui.draft}</p>
    {record.style.salutation&&<p>{record.style.salutation}</p>}
    {current.historical?<details className="roadmapOriginalAssessment"><summary>{currentCopy.original}</summary>{assessment}</details>:assessment}
    <div className="roadmapCurrentStatus" role="status" aria-live="polite"><b>{currentCopy.current}</b><Dot light={current.light} label={current.label}/>{!stale&&<span>{currentCopy.confirmed}: {current.completed} / {current.total}</span>}</div>
    <div className="roadmapSummary" data-roadmap-state={current.state}>
      <div><b>{ui.next}</b><p>{current.next}</p>{current.step&&onFull&&continuation.canContinue!==false&&<button type="button" className="secondary" disabled={busy} onClick={openCurrentStep}>{controlCopy.open}</button>}</div>
      <div><b>{ui.action}</b><p>{current.action}</p>{current.step&&<p className="roadmapMeta">{ui.owner}: {current.step.owner}</p>}</div>
    </div>
    <ResultContinuation {...continuation} language={language} onContinue={openCurrentStep}/>
    {full&&<>
      <div className="roadmapLegend">{['green','yellow','red','white'].map(light=><Dot key={light} light={light} label={ui[light]}/>)}</div>
      <div className="roadmapActions"><button className="secondary" type="button" disabled={busy||stale} onClick={()=>safeExport('docx')}>Word</button><button className="secondary" type="button" disabled={busy||stale} onClick={()=>safeExport('pdf')}>PDF</button></div>
      {result.facts.length>0&&<section><h4>{ui.facts}</h4>{result.facts.map((fact,index)=><div key={index}><p>{fact.text}</p><Evidence items={fact.evidence} documents={documents} ui={ui} onOpenDocument={onOpenDocument}/></div>)}</section>}
      {result.open_questions.length>0&&<section><h4>{ui.questions}</h4><ul>{result.open_questions.map((question,index)=><li key={index}><b>{question.question}</b><p>{ui.owner}: {question.who}<br/>{ui.reason}: {question.why}</p></li>)}</ul></section>}
      <h4>{ui.steps}</h4>
      <ol className="roadmapStepList">{steps.map((step,index)=><li key={step.id} className="roadmapStep" data-step-id={step.id} tabIndex={-1} ref={element=>{if(element)stepRefs.current.set(step.id,element);else stepRefs.current.delete(step.id)}}>
        <div className="roadmapStepHead"><h4>{index+1}. {step.title}</h4><Dot light={step.light} label={ui[step.light]}/></div>
        <p className="roadmapPhase">{ui[step.phase]}</p>
        <dl>{[['owner',step.owner],['reason',step.reason],['action',step.action],['waitFor',step.waiting_for],['afterReply',step.after_response],['doneWhen',step.done_when],['followUp',step.follow_up],['deadline',step.deadline?.date]].filter(([,value])=>value).map(([key,value])=><div key={key}><dt>{ui[key]}</dt><dd>{readableStepText(value,result.steps,result.letters)}</dd></div>)}</dl>
        {step.depends_on.length>0&&<p className="roadmapMeta">{ui.prerequisites}: {step.depends_on.map(id=>roadmapStepReference(id,steps)).join(' · ')}</p>}
        <Evidence items={step.evidence} documents={documents} ui={ui} onOpenDocument={onOpenDocument}/>
        {!step.done&&step.update?.reopened_by_step&&<p className="roadmapMeta">{ui.reopenedAfter}: {roadmapStepReference(step.update.reopened_by_step,steps)}</p>}
        {step.update?.note&&<p className="roadmapRecorded"><b>{ui.progress}:</b> {step.update.note}</p>}
        {step.blocked&&<p className="roadmapMeta">{ui.blocked}</p>}
        {onProgress&&<button className="secondary" type="button" disabled={busy||stale||(!step.done&&step.blocked)} onClick={()=>{setEditing(step.id);setNote('')}}>{step.done?controls.reopen:controls.done}</button>}
        {editing===step.id&&<form className="roadmapProgressForm" onSubmit={async event=>{event.preventDefault();if(await onProgress(step.id,!step.done,note)){setEditing('');setNote('')}}}>
          <label>{controls.note}<textarea required minLength={5} maxLength={1200} value={note} onChange={event=>setNote(event.target.value)}/></label>
          <div className="roadmapActions"><button className="primary" disabled={busy||stale||note.trim().length<5}>{controls.save}</button><button type="button" className="secondary" onClick={()=>setEditing('')}>{controls.cancel}</button></div>
        </form>}
      </li>)}</ol>
      <p className="roadmapClosing">{record.style.closing||result.closing}{record.style.sender_name?'\n'+record.style.sender_name:''}</p>
      {result.letters.length>0&&<section className="roadmapLetters"><h4>{ui.letters}</h4>{result.letters.map(letter=><details key={letter.id}>
        <summary>{letter.recipient} · {letter.subject}</summary>
        <div dir={['ar','fa'].includes(record.reference_language)?'rtl':'ltr'} className="roadmapFormalLetter"><p>{letter.recipient}</p><h4>{letter.subject}</h4><p>{letter.body}</p></div>
        {letter.customer_translation&&<details><summary>{ui.translation}</summary><p className="roadmapFormalLetter">{letter.customer_translation}</p></details>}
        <div className="roadmapActions"><button type="button" className="secondary" disabled={busy||stale} onClick={()=>onExport?.('docx',letter.id)}>Word</button><button type="button" className="secondary" disabled={busy||stale} onClick={()=>onExport?.('pdf',letter.id)}>PDF</button></div>
      </details>)}</section>}
      {record.events?.length>0&&<details><summary>{ui.progress}</summary><ul>{record.events.map((entry,index)=><li key={index}>{new Date(entry.at).toLocaleString(record.output_language)} · {result.steps.find(step=>step.id===entry.step_id)?.title}: {entry.done?ui.complete:ui.reopen}<p>{entry.note}</p></li>)}</ul></details>}
    </>}
  </div>
}

export function CustomerRoadmapPanel({supabase,ownerId,item,client,documents,assessments,language='de',outputLanguage='de',onOpenDocument,onPrivacyUpdate,onAnalyzeDocument,onRecoverDocument,onSaveDocument,onAddDocument,continuation={}}) {
  const ui=roadmapUi(language)
  const simple=simpleCaseCopy(language)
  const [records,setRecords]=useState([]),[activeId,setActiveId]=useState(''),[loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[full,setFull]=useState(false),[showForm,setShowForm]=useState(true)
  const [style,setStyle]=useState(()=>roadmapStyle({customer_name:client?.name||''}))
  const [referenceLanguage,setReferenceLanguage]=useState(outputLanguage),[confirmed,setConfirmed]=useState(false),[fingerprint,setFingerprint]=useState('')
  const [processingStage,setProcessingStage]=useState('')
  const [documentProgress,setDocumentProgress]=useState(null)
  const [failedDocument,setFailedDocument]=useState(null)
  const mountedRef=useRef(true)
  useEffect(()=>{mountedRef.current=true;return ()=>{mountedRef.current=false}},[])
  const activeCaseRef=useRef(item.id)
  activeCaseRef.current=item.id
  const busyRef=useRef(false)
  const formRef=useRef(null)
  const source=useMemo(()=>roadmapSource(item,documents,assessments),[item,documents,assessments])
  const caseRecords=records.filter(entry=>entry.case_id===item.id)
  const record=caseRecords.find(entry=>entry.id===activeId)||caseRecords[0]
  const stale=!!record&&(!fingerprint||record.source_fingerprint!==fingerprint||record.id!==caseRecords[0]?.id)
  const canCreate=continuation.canContinue!==false
  const ownDocuments=caseDocuments(item,documents)
  const context=preparationContext(item,documents,outputLanguage,referenceLanguage)
  const contextRef=useRef(context)
  contextRef.current=context
  const scope=JSON.stringify([item.id,item.home_country,item.target_country,outputLanguage,referenceLanguage,ownDocuments.map(doc=>[doc.id,doc.file_path,doc.data_classification])])
  const scopeRef=useRef(scope)
  scopeRef.current=scope
  useEffect(()=>{if(!busyRef.current)setConfirmed(false)},[context])
  useEffect(()=>{
    let cancelled=false
    setFingerprint('')
    roadmapFingerprint(source).then(value=>{if(!cancelled)setFingerprint(value)}).catch(()=>{if(!cancelled)setError(ui.error)})
    return ()=>{cancelled=true}
  },[source,ui.error])
  useEffect(()=>{
    let cancelled=false
    listCustomerRoadmaps(supabase,item.id).then(({data,error})=>{
      if(cancelled)return
      if(error)setError(ui.error)
      else {setRecords(data||[]);if(data?.length){setActiveId(data[0].id);setStyle(roadmapStyle(data[0].style));setReferenceLanguage(data[0].reference_language);setShowForm(false)}}
      setLoading(false)
    }).catch(()=>{if(!cancelled){setError(ui.error);setLoading(false)}})
    return ()=>{cancelled=true}
  },[supabase,item.id,ui.error])
  async function run(task) {
    if(busyRef.current)return false
    busyRef.current=true;setBusy(true);setError('');setFailedDocument(null)
    try{return await task()}catch(error){
      if(mountedRef.current){setError(error.code==='changed'?simple.changed:error.code?simple.failed:error?.message||ui.error);setFailedDocument(error.document||null)}
      return false
    }finally{busyRef.current=false;if(mountedRef.current){setBusy(false);setProcessingStage('');setDocumentProgress(null)}}
  }
  async function create(event) {
    event.preventDefault()
    if(!confirmed||!canCreate||loading)return
    const creatingCaseId=item.id
    const initialContext=context
    const initialScope=scope
    return run(async()=>{
      let sourceDocuments=documents
      const isCurrent=()=>mountedRef.current&&activeCaseRef.current===creatingCaseId&&scopeRef.current===initialScope
      if(onAnalyzeDocument&&onRecoverDocument&&onSaveDocument){
        setProcessingStage('documents')
        const drafts=await prepareCaseDocuments({item,documents,outputLanguage,referenceLanguage,onAnalyze:onAnalyzeDocument,onRecover:onRecoverDocument,onProgress:setDocumentProgress,isCurrent:()=>isCurrent()&&contextRef.current===initialContext})
        setProcessingStage('saving')
        const saved=await savePreparedCaseDocuments({drafts,onSave:onSaveDocument,onProgress:setDocumentProgress,isCurrent})
        sourceDocuments=documents.map(doc=>saved.find(entry=>entry.id===doc.id)||doc)
      }
      if(!isCurrent())return false
      setProcessingStage('generation')
      setDocumentProgress(null)
      try{validateRoadmapInput(roadmapSource(item,sourceDocuments,assessments))}catch(error){throw new Error(await roadmapErrorMessage(error,ui.error,language))}
      const authorization=await authorizeRoadmap(supabase,{ownerId})
      if(authorization.error)throw new Error(ui.error)
      if(!isCurrent())return false
      onPrivacyUpdate?.(authorization.data)
      const {data,error}=await generateCustomerRoadmap(supabase,{caseId:item.id,style,outputLanguage,referenceLanguage,onProgress:({stage})=>{if(!isCurrent())throw new Error(ui.stale);setProcessingStage(stage)}})
      if(error)throw new Error(await roadmapErrorMessage(error,ui.error,language))
      if(!data?.roadmap)throw new Error(ui.error)
      if(!isCurrent())return false
      setRecords(previous=>[data.roadmap,...previous]);setActiveId(data.roadmap.id);setShowForm(false);setFull(false);setConfirmed(false)
      return true
    })
  }
  async function progress(stepId,done,note) {
    return run(async()=>{
      const {data,error}=await saveRoadmapProgress(supabase,{caseId:item.id,roadmapId:record.id,stepId,done,note})
      if(error)throw new Error(await roadmapErrorMessage(error,ui.error,language))
      if(!data?.roadmap)throw new Error(ui.error)
      setRecords(previous=>previous.map(entry=>entry.id===record.id?data.roadmap:entry));return true
    })
  }
  const exportFile=(type,letterId)=>run(async()=>{
    if(stale)throw new Error(ui.stale)
    downloadExportArtifact(await createRoadmapExport(record,type,{letterId}));return true
  })
  function expandForm() {setShowForm(true);requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}))}
  return <section className="customerRoadmapPanel" id="customer-roadmap" aria-labelledby={`roadmap-title-${item.id}`}>
    <header className="roadmapPanelHead"><div><h3 id={`roadmap-title-${item.id}`}>{simple.title}</h3><p>{simple.intro}</p></div>{record&&canCreate&&<button type="button" className="secondary" disabled={busy} onClick={expandForm}>{ui.refresh}</button>}</header>
    {loading&&<p role="status">{ui.loading}</p>}
    {busy&&processingStage&&<div className="caseReadingProgress" role="status" aria-live="polite"><b>{processingStage==='documents'?simple.reading:simple.saving}{documentProgress?` · ${documentProgress.index} / ${documentProgress.total}`:' …'}</b>{documentProgress&&<p>{documentProgress.document.title}</p>}<p>{simple.working}</p><details><summary>{simple.details}</summary>{roadmapProgressLabel(language,processingStage)}</details></div>}
    {error&&<p className="roadmapError" role="alert">{error}</p>}
    {failedDocument&&<button type="button" className="secondary" onClick={()=>onOpenDocument?.(failedDocument)}>{ui.newDocument}: {failedDocument.title}</button>}
    {stale&&<p className="roadmapStale" role="status">{ui.stale}</p>}
    {caseRecords.length>1&&<label className="roadmapVersionSelect">{ui.history}<select value={activeId} onChange={event=>{setActiveId(event.target.value);setFull(false)}}>{caseRecords.map(entry=><option key={entry.id} value={entry.id}>{new Date(entry.created_at).toLocaleString(language)} · {outputLanguageLabels[entry.output_language]}</option>)}</select></label>}
    {!canCreate&&!record&&<ResultContinuation {...continuation} language={language}/>}
    {showForm&&canCreate&&!ownDocuments.length&&<div className="simpleCaseEmpty"><p>{simple.noDocuments}</p>{onAddDocument&&<button className="primary" type="button" onClick={onAddDocument}>＋ {simple.add}</button>}</div>}
    {showForm&&canCreate&&ownDocuments.length>0&&<form ref={formRef} className="roadmapSetup" onSubmit={create}>
      <p>{simple.files}: <b>{ownDocuments.length}</b> · {ui.output}: <b>{outputLanguageLabels[outputLanguage]}</b></p>
      <details className="caseFileList"><summary>{simple.files}</summary><ul>{ownDocuments.map(doc=><li key={doc.id}>{doc.title}</li>)}</ul></details>
      <fieldset disabled={busy}>
      <label className="roadmapConsent"><input type="checkbox" required checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{onAnalyzeDocument?simple.consent:ui.confirm}</span></label>
      <button type="submit" className="primary" disabled={busy||!confirmed||loading}>{busy?simple.saving:error?simple.retry:simple.start}</button>
      {onAddDocument&&<button type="button" className="linkBtn" onClick={onAddDocument}>＋ {simple.add}</button>}
      <details className="caseMoreOptions"><summary>{simple.options}</summary>
      <label>{ui.reference}<select value={referenceLanguage} onChange={event=>{setReferenceLanguage(event.target.value);setConfirmed(false)}}>{OUTPUT_LANGUAGES.map(key=><option key={key} value={key}>{outputLanguageLabels[key]}</option>)}</select></label>
      <h4>{ui.style}</h4><div className="roadmapFields">
        {['customer_name','salutation','sender_name','letterhead','closing'].map((key,index)=><label key={key}>{ui[['customer','salutation','sender','letterhead','closing'][index]]}{['letterhead','closing'].includes(key)?<textarea maxLength={600} value={style[key]} onChange={event=>setStyle({...style,[key]:event.target.value})}/>:<input maxLength={180} value={style[key]} onChange={event=>setStyle({...style,[key]:event.target.value})}/>}</label>)}
        <label>{ui.tone}<select value={style.tone} onChange={event=>setStyle({...style,tone:event.target.value})}><option value="personal">{ui.personal}</option><option value="formal">{ui.formal}</option></select></label>
      </div></details></fieldset>
    </form>}
    {busy&&!processingStage&&<p role="status" aria-live="polite">{ui.loading}</p>}
    {record&&<CustomerRoadmapView key={record.id} record={record} stale={stale} documents={documents} onOpenDocument={onOpenDocument} onProgress={progress} onExport={exportFile} busy={busy} full={full} onFull={()=>setFull(true)} continuation={continuation} language={language}/>}
  </section>
}
