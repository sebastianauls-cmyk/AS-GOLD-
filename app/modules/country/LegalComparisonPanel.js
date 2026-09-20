'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {roadmapProgressLabel} from '../cases/lib/roadmapDisplay.mjs'
import { localizedCountryName } from './countryLabels.mjs'
import { COUNTRY_CATALOG, countryByKey } from './countryRegistry.mjs'
import { CASE_LEGAL_COMPARISON_LIGHTS, CASE_LEGAL_COMPARISON_TOPICS, normalizeCaseLegalComparisonRecord } from './caseLegalComparison.mjs'
import { LANGUAGE_CATALOG, outputLanguageNames } from '../language/languageRegistry.mjs'
import { legalComparisonPresentation } from './legalComparisonPresentation.mjs'
import { legalComparisonTopicLabels, legalComparisonUi } from './legalComparisonCopy.mjs'
import { authorizeLegalComparison, invokeCaseLegalComparison, legalComparisonErrorMessage, listCaseLegalComparisons } from '../services/legalComparison'

function formatDate(value,language){
  if(!value)return '—'
  try{return new Intl.DateTimeFormat(language||'de',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch{return new Date(value).toLocaleString()}
}

function lightSymbol(key){return CASE_LEGAL_COMPARISON_LIGHTS[key]?.symbol||CASE_LEGAL_COMPARISON_LIGHTS.white.symbol}

function sourceLabel(source,index){
  const title=source?.title||source?.publisher||source?.url
  return `[${index+1}] ${title}`
}

function CitationLinks({urls=[],sources=[],label='Sources'}){
  const indexes=new Map(sources.map((source,index)=>[source.url,index]))
  const cited=[...new Set(urls)].map(url=>({url,index:indexes.get(url)})).filter(item=>Number.isInteger(item.index))
  if(!cited.length)return null
  return <span className="legalComparisonCitations" aria-label={label}>{cited.map(item=><a href={item.url} target="_blank" rel="noreferrer" key={item.url}>[{item.index+1}]</a>)}</span>
}

function listBlock(title,items=[],textProps={}){
  if(!items.length)return null
  return <section className="legalComparisonList"><h4>{title}</h4><ul>{items.map((item,index)=><li {...textProps} key={`${index}-${item}`}>{item}</li>)}</ul></section>
}

export function LegalComparisonPanel({supabase,ownerId,language='de',outputLanguage='de',item,workspaceCopy,onPrivacyUpdate}){
  const ui=legalComparisonUi(language)
  const brief=legalComparisonPresentation(language)
  const supportedPair=[item?.home_country||'DE',item?.target_country||'DE'].every(code=>COUNTRY_CATALOG.some(country=>country.key===String(code).toUpperCase()))
  const topicLabels=legalComparisonTopicLabels(language)
  const homeCountry=countryByKey(item?.home_country||'DE')
  const home={...homeCountry,label:localizedCountryName(homeCountry.key,language)}
  const targetCountry=countryByKey(item?.target_country||'DE')
  const target={...targetCountry,label:localizedCountryName(targetCountry.key,language)}
  const [records,setRecords]=useState([])
  const [activeId,setActiveId]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [processingStage,setProcessingStage]=useState('')
  const [error,setError]=useState('')
  const [showForm,setShowForm]=useState(true)
  const [topic,setTopic]=useState('applicable_law_jurisdiction')
  const [question,setQuestion]=useState(String(item?.goal||'').slice(0,1200))
  const [classification,setClassification]=useState('synthetic')
  const [confirmed,setConfirmed]=useState(false)
  const scope=`${item.id}|${home.key}|${target.key}`
  const currentScope=useRef(scope),busyRef=useRef(false)
  currentScope.current=scope
  useEffect(()=>{setQuestion(String(item?.goal||'').slice(0,1200));setConfirmed(false)},[item.id])

  useEffect(()=>{
    let cancelled=false
    setRecords([])
    setActiveId('')
    setShowForm(true)
    setError('')
    setLoading(true)
    if(!supportedPair){setLoading(false);return}
    listCaseLegalComparisons(supabase,{caseId:item.id,homeCountry:home.key,targetCountry:target.key}).then(({data,error:loadError})=>{
      if(cancelled)return
      if(loadError){setError(ui.loadFailed);setRecords([]);setActiveId('');setShowForm(true)}
      else{
        const found=data||[]
        setRecords(found)
        setActiveId(found[0]?.id||'')
        setShowForm(found.length===0)
      }
      setLoading(false)
    })
    return ()=>{cancelled=true}
  },[supabase,item.id,home.key,target.key,supportedPair,ui.loadFailed])

  const activeRecord=useMemo(()=>{const matching=records.filter(record=>record.case_id===item.id&&record.home_country===home.key&&record.target_country===target.key);return matching.find(record=>record.id===activeId)||matching[0]||null},[records,activeId,item.id,home.key,target.key])
  const comparison=useMemo(()=>activeRecord?normalizeCaseLegalComparisonRecord(activeRecord):null,[activeRecord])
  const sources=comparison?.sources||[]
  const resultLanguage=LANGUAGE_CATALOG.find(entry=>entry.key===activeRecord?.output_language)
  const resultDirection=resultLanguage?.rtl?'rtl':'ltr'
  const resultTextProps={lang:resultLanguage?.key,dir:resultDirection}
  const resultLanguageName=(outputLanguageNames[language]||outputLanguageNames.de)?.[resultLanguage?.key]||resultLanguage?.label||activeRecord?.output_language||'—'

  async function createComparison(event){
    event.preventDefault()
    if(busyRef.current||!supportedPair)return
    setError('')
    const cleanQuestion=question.trim()
    if(cleanQuestion.length<12){setError(ui.questionRequired);return}
    if(!confirmed){setError(ui.privacyRequired);return}
    const creatingScope=scope
    busyRef.current=true;setBusy(true);setProcessingStage('')
    try{
      const authorization=await authorizeLegalComparison(supabase,{ownerId})
      if(currentScope.current!==creatingScope)return
      if(authorization.error){setError(await legalComparisonErrorMessage(authorization.error,ui.createFailed,language));return}
      onPrivacyUpdate?.(authorization.data)
      const {data,error:invokeError}=await invokeCaseLegalComparison(supabase,{caseId:item.id,topic,question:cleanQuestion,outputLanguage,dataClassification:classification,onProgress:({stage})=>{if(currentScope.current!==creatingScope)throw new Error(ui.createFailed);setProcessingStage(stage)}})
      if(currentScope.current!==creatingScope)return
      if(invokeError){setError(await legalComparisonErrorMessage(invokeError,ui.createFailed,language));return}
      if(data?.status==='configuration_required'){setError(ui.createFailed);return}
      if(!data?.comparison){setError(ui.createFailed);return}
      setRecords(previous=>[data.comparison,...previous.filter(record=>record.id!==data.comparison.id)])
      setActiveId(data.comparison.id)
      setShowForm(false)
      setConfirmed(false)
    }catch(error){if(currentScope.current===creatingScope)setError(await legalComparisonErrorMessage(error,ui.createFailed,language))}finally{busyRef.current=false;setBusy(false);setProcessingStage('')}
  }

  if(!supportedPair)return <section className="legalComparisonPanel"><h3>{ui.title}</h3><p role="status">{brief.unsupported}</p></section>

  return <section className="legalComparisonPanel" aria-labelledby={`legal-comparison-${item.id}`}>
    <header className="legalComparisonHead">
      <div><span className="modeBadge">{ui.eyebrow}</span><h3 id={`legal-comparison-${item.id}`}>{ui.title}</h3><p>{ui.intro}</p></div>
      <div className="legalCountryPair" aria-label={`${home.label} → ${target.label}`}><span>{home.flag} {home.label}</span><b aria-hidden="true">→</b><span>{target.flag} {target.label}</span></div>
    </header>
    <p className="legalComparisonBaseline">⚪ {ui.baseline}</p>
    <div className="legalComparisonLegend" aria-label={ui.legend}>
      <span><b>🟢 {ui.greenLabel}</b>{ui.greenMeaning}</span>
      <span><b>🟡 {ui.yellowLabel}</b>{ui.yellowMeaning}</span>
      <span><b>🔴 {ui.redLabel}</b>{ui.redMeaning}</span>
      <span><b>⚪ {ui.whiteLabel}</b>{ui.whiteMeaning}</span>
    </div>

    {home.key===target.key?<div className="emptyState legalComparisonEmpty">{ui.sameCountry}</div>:<>
      {records.length>0&&<div className="legalComparisonToolbar">
        <label>{ui.history}<select value={activeRecord?.id||''} onChange={event=>{setActiveId(event.target.value);setShowForm(false)}}>{records.map(record=><option value={record.id} key={record.id}>{normalizeCaseLegalComparisonRecord(record).light.symbol} {topicLabels[record.topic]||record.topic} · {formatDate(record.created_at,language)}</option>)}</select></label>
        <button className="secondary" type="button" onClick={()=>setShowForm(value=>!value)}>{showForm?workspaceCopy.cancel:`＋ ${ui.newComparison}`}</button>
      </div>}

      {showForm&&<form className="legalComparisonForm" onSubmit={createComparison}>
        <label>{ui.topic}<select value={topic} onChange={event=>setTopic(event.target.value)}>{CASE_LEGAL_COMPARISON_TOPICS.map(key=><option value={key} key={key}>{topicLabels[key]||key}</option>)}</select></label>
        <label className="legalComparisonQuestion">{ui.question}<textarea value={question} maxLength="1200" rows="4" onChange={event=>setQuestion(event.target.value)} aria-describedby={`legal-comparison-help-${item.id}`} required/></label>
        <small id={`legal-comparison-help-${item.id}`} className="legalComparisonHelp">{ui.questionHelp}</small>
        <label>{ui.classification}<select value={classification} onChange={event=>{setClassification(event.target.value);setConfirmed(false)}}><option value="synthetic">{ui.synthetic}</option><option value="anonymized">{ui.anonymized}</option></select></label>
        <label className="legalComparisonConsent"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{ui.consent}</span></label>
        <button className="primary" type="submit" disabled={busy}>{busy?(processingStage?roadmapProgressLabel(language,processingStage):ui.creating):ui.create}</button>
      </form>}

      {error&&<div className="legalComparisonError" role="alert">⚪ {error}</div>}
      {loading?<div className="legalComparisonLoading">{ui.creating}</div>:!activeRecord&&!showForm?<div className="emptyState legalComparisonEmpty">{ui.noResults}</div>:null}

      {activeRecord&&comparison&&!showForm&&<article className="legalComparisonResult">
        <p className="legalResultLanguage" lang={language} dir={language==='ar'||language==='fa'?'rtl':'ltr'}>{brief.resultLanguage}: <b>{resultLanguageName}</b></p>
        {comparison.needs_source_refresh&&<p className="attentionBox" role="status">⚪ {ui.sourceRefresh}</p>}
        <div className="legalComparisonResultHead"><div><span className={`comparisonLight ${comparison.light.key}`}>{comparison.light.symbol} {ui.result}</span><h4 {...resultTextProps}>{comparison.title||topicLabels[activeRecord.topic]||ui.result}</h4><p className="legalComparisonAsked"><b>{ui.requestedQuestion}:</b> {activeRecord.question}</p><p {...resultTextProps}>{comparison.overall_summary||'—'}</p></div><small>{ui.sourceChecked}: {formatDate(comparison.source_checked_at,language)}</small></div>

        {comparison.customer_explanation&&<section className="legalCustomerExplanation"><h4>{ui.customerExplanation}</h4><p {...resultTextProps}>{comparison.customer_explanation}</p></section>}

        <section className="applicableLawCard">
          <div><h4>{ui.applicableLaw}</h4><span className={`comparisonStatus ${comparison.applicable_law.status}`}>{ui[comparison.applicable_law.status]||ui.unclear}</span></div>
          <p {...resultTextProps}>{comparison.applicable_law.explanation||ui.noSources}<CitationLinks urls={comparison.applicable_law.source_urls} sources={sources} label={ui.sources}/></p>
          {listBlock(ui.missingFactors,comparison.applicable_law.missing_factors,resultTextProps)}
        </section>

        <section className="legalComparisonRows"><h4>{ui.comparisonPoints}</h4>{comparison.rows.map((row,index)=><article className={`legalComparisonRow ${row.difference_status}`} key={`${index}-${row.issue}`}>
          <header><span>{lightSymbol(row.difference_status==='same'?'green':row.difference_status==='different'?'yellow':row.difference_status==='risk'?'red':'white')}</span><div><h5 {...resultTextProps}>{row.issue||'—'}</h5><small>{ui[row.difference_status]||ui.unclear} · {ui.confidence}: {ui[row.confidence]||row.confidence}</small></div></header>
          <div className="legalComparisonSides"><section><b>{brief.here} {home.flag} {home.label}</b><p {...resultTextProps}>{row.home.explanation||ui.noSources}<CitationLinks urls={row.home.source_urls} sources={sources} label={ui.sources}/></p></section><section><b>{brief.there} {target.flag} {target.label}</b><p {...resultTextProps}>{row.target.explanation||ui.noSources}<CitationLinks urls={row.target.source_urls} sources={sources} label={ui.sources}/></p></section></div>
          <p className="legalComparisonMeaning"><b>{brief.meaning}</b> <span {...resultTextProps}>{row.practical_meaning||ui.noSources}</span></p>
        </article>)}</section>

        <div className="legalComparisonLists">{listBlock(ui.openQuestions,comparison.open_questions,resultTextProps)}{listBlock(ui.nextSteps,comparison.next_steps,resultTextProps)}</div>
        <section className="legalComparisonSources"><h4>{ui.sources}</h4>{sources.length?<ol>{sources.map((source,index)=>{const metadata=[source.publisher,source.country,ui[`sourceType_${source.source_type}`]||ui.sourceType_other].filter(Boolean).join(' · ');return <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{sourceLabel(source,index)}</a>{metadata&&<small>{metadata}</small>}</li>})}</ol>:<p>{ui.noSources}</p>}</section>
        <p className="legalReviewRequired">⚪ {ui.reviewRequired}</p>
      </article>}
    </>}
  </section>
}
