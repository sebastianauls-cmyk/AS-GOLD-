'use client'

import { useEffect, useMemo, useState } from 'react'
import { countryByKey } from './countryRegistry.mjs'
import { CASE_LEGAL_COMPARISON_LIGHTS, CASE_LEGAL_COMPARISON_TOPICS, normalizeCaseLegalComparisonRecord } from './caseLegalComparison.mjs'
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

function listBlock(title,items=[]){
  if(!items.length)return null
  return <section className="legalComparisonList"><h4>{title}</h4><ul>{items.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></section>
}

export function LegalComparisonPanel({supabase,ownerId,language='de',outputLanguage='de',item,workspaceCopy,onPrivacyUpdate}){
  const ui=legalComparisonUi(language)
  const topicLabels=legalComparisonTopicLabels(language)
  const home=countryByKey(item?.home_country||'DE')
  const target=countryByKey(item?.target_country||'DE')
  const [records,setRecords]=useState([])
  const [activeId,setActiveId]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [showForm,setShowForm]=useState(true)
  const [topic,setTopic]=useState('applicable_law_jurisdiction')
  const [question,setQuestion]=useState(String(item?.goal||'').slice(0,1200))
  const [classification,setClassification]=useState('synthetic')
  const [confirmed,setConfirmed]=useState(false)

  useEffect(()=>{
    let cancelled=false
    setRecords([])
    setActiveId('')
    setShowForm(true)
    setError('')
    setLoading(true)
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
  },[supabase,item.id,home.key,target.key,ui.loadFailed])

  const activeRecord=useMemo(()=>records.find(record=>record.id===activeId)||records[0]||null,[records,activeId])
  const comparison=useMemo(()=>activeRecord?normalizeCaseLegalComparisonRecord(activeRecord):null,[activeRecord])
  const sources=comparison?.sources||[]

  async function createComparison(event){
    event.preventDefault()
    setError('')
    const cleanQuestion=question.trim()
    if(cleanQuestion.length<12){setError(ui.questionRequired);return}
    if(!confirmed){setError(ui.privacyRequired);return}
    setBusy(true)
    try{
      const authorization=await authorizeLegalComparison(supabase,{ownerId})
      if(authorization.error){setError(authorization.error.message||ui.createFailed);return}
      onPrivacyUpdate?.(authorization.data)
      const {data,error:invokeError}=await invokeCaseLegalComparison(supabase,{caseId:item.id,topic,question:cleanQuestion,outputLanguage,dataClassification:classification})
      if(invokeError){setError(await legalComparisonErrorMessage(invokeError,ui.createFailed));return}
      if(data?.status==='configuration_required'){setError(data.message||ui.createFailed);return}
      if(!data?.comparison){setError(ui.createFailed);return}
      setRecords(previous=>[data.comparison,...previous.filter(record=>record.id!==data.comparison.id)])
      setActiveId(data.comparison.id)
      setShowForm(false)
      setConfirmed(false)
    }finally{setBusy(false)}
  }

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
        <label>{ui.history}<select value={activeRecord?.id||''} onChange={event=>{setActiveId(event.target.value);setShowForm(false)}}>{records.map(record=><option value={record.id} key={record.id}>{lightSymbol(record.overall_light)} {topicLabels[record.topic]||record.topic} · {formatDate(record.created_at,language)}</option>)}</select></label>
        <button className="secondary" type="button" onClick={()=>setShowForm(value=>!value)}>{showForm?workspaceCopy.cancel:`＋ ${ui.newComparison}`}</button>
      </div>}

      {showForm&&<form className="legalComparisonForm" onSubmit={createComparison}>
        <label>{ui.topic}<select value={topic} onChange={event=>setTopic(event.target.value)}>{CASE_LEGAL_COMPARISON_TOPICS.map(key=><option value={key} key={key}>{topicLabels[key]||key}</option>)}</select></label>
        <label className="legalComparisonQuestion">{ui.question}<textarea value={question} maxLength="1200" rows="4" onChange={event=>setQuestion(event.target.value)} aria-describedby={`legal-comparison-help-${item.id}`} required/></label>
        <small id={`legal-comparison-help-${item.id}`} className="legalComparisonHelp">{ui.questionHelp}</small>
        <label>{ui.classification}<select value={classification} onChange={event=>{setClassification(event.target.value);setConfirmed(false)}}><option value="synthetic">{ui.synthetic}</option><option value="anonymized">{ui.anonymized}</option></select></label>
        <label className="legalComparisonConsent"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{ui.consent}</span></label>
        <button className="primary" type="submit" disabled={busy}>{busy?ui.creating:ui.create}</button>
      </form>}

      {error&&<div className="legalComparisonError" role="alert">⚪ {error}</div>}
      {loading?<div className="legalComparisonLoading">{ui.creating}</div>:!activeRecord&&!showForm?<div className="emptyState legalComparisonEmpty">{ui.noResults}</div>:null}

      {activeRecord&&comparison&&!showForm&&<article className="legalComparisonResult">
        <div className="legalComparisonResultHead"><div><span className={`comparisonLight ${comparison.light.key}`}>{comparison.light.symbol} {ui.result}</span><h4>{comparison.title||topicLabels[activeRecord.topic]||ui.result}</h4><p className="legalComparisonAsked"><b>{ui.requestedQuestion}:</b> {activeRecord.question}</p><p>{comparison.overall_summary||'—'}</p></div><small>{ui.sourceChecked}: {formatDate(comparison.source_checked_at,language)}</small></div>

        <section className="applicableLawCard">
          <div><h4>{ui.applicableLaw}</h4><span className={`comparisonStatus ${comparison.applicable_law.status}`}>{ui[comparison.applicable_law.status]||ui.unclear}</span></div>
          <p>{comparison.applicable_law.explanation||ui.noSources}<CitationLinks urls={comparison.applicable_law.source_urls} sources={sources} label={ui.sources}/></p>
          {listBlock(ui.missingFactors,comparison.applicable_law.missing_factors)}
        </section>

        <section className="legalComparisonRows"><h4>{ui.comparisonPoints}</h4>{comparison.rows.map((row,index)=><article className={`legalComparisonRow ${row.difference_status}`} key={`${index}-${row.issue}`}>
          <header><span>{lightSymbol(row.difference_status==='same'?'green':row.difference_status==='different'?'yellow':row.difference_status==='risk'?'red':'white')}</span><div><h5>{row.issue||'—'}</h5><small>{ui[row.difference_status]||ui.unclear} · {ui.confidence}: {ui[row.confidence]||row.confidence}</small></div></header>
          <div className="legalComparisonSides"><section><b>{workspaceCopy.homeCountry}: {home.flag} {home.label}</b><p>{row.home.explanation||ui.noSources}<CitationLinks urls={row.home.source_urls} sources={sources} label={ui.sources}/></p></section><section><b>{workspaceCopy.targetCountry}: {target.flag} {target.label}</b><p>{row.target.explanation||ui.noSources}<CitationLinks urls={row.target.source_urls} sources={sources} label={ui.sources}/></p></section></div>
          <p className="legalComparisonMeaning"><b>{ui.practicalMeaning}:</b> {row.practical_meaning||ui.noSources}</p>
        </article>)}</section>

        {comparison.customer_explanation&&<section className="legalCustomerExplanation"><h4>{ui.customerExplanation}</h4><p>{comparison.customer_explanation}</p></section>}
        <div className="legalComparisonLists">{listBlock(ui.openQuestions,comparison.open_questions)}{listBlock(ui.nextSteps,comparison.next_steps)}</div>
        <section className="legalComparisonSources"><h4>{ui.sources}</h4>{sources.length?<ol>{sources.map((source,index)=>{const metadata=[source.publisher,source.country,ui[`sourceType_${source.source_type}`]||ui.sourceType_other].filter(Boolean).join(' · ');return <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{sourceLabel(source,index)}</a>{metadata&&<small>{metadata}</small>}</li>})}</ol>:<p>{ui.noSources}</p>}</section>
        <p className="legalReviewRequired">⚪ {ui.reviewRequired}</p>
      </article>}
    </>}
  </section>
}
