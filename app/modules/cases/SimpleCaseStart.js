'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { simpleCaseCopy } from './lib/simpleCaseCopy.mjs'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'
import { localizedCountryName } from '../country/countryLabels.mjs'
import { localeForIntakeLanguage } from '../documents/documentIntakeLanguages.mjs'
import { voiceErrorMessage } from '../documents/voiceErrorCopy.mjs'
import { intakeCopy } from '../documents/documentIntakeCopy.mjs'

export function SimpleCaseStart({language='de',copy,draft,setDraft,clients=[],onSubmit}) {
  const ui=simpleCaseCopy(language),id=useId()
  const [busy,setBusy]=useState(false),[listening,setListening]=useState(false),[error,setError]=useState('')
  const busyRef=useRef(false),recognitionRef=useRef(null)
  useEffect(()=>()=>{const recorder=recognitionRef.current;if(recorder){recorder.onresult=null;recorder.onend=null;recorder.onerror=null;recorder.abort()}},[])
  function speak(){
    if(listening){recognitionRef.current?.stop();return}
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition){setError(intakeCopy(language).voiceUnsupported);return}
    setError('')
    const recorder=new SpeechRecognition()
    recorder.lang=localeForIntakeLanguage(language);recorder.continuous=true;recorder.interimResults=false
    recorder.onresult=event=>{
      const text=Array.from(event.results).slice(event.resultIndex).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ')
      if(text)setDraft(previous=>({...previous,goal:`${previous.goal||''} ${text}`.trim()}))
    }
    recorder.onerror=event=>{setError(voiceErrorMessage(language,event.error));setListening(false)}
    recorder.onend=()=>setListening(false)
    recognitionRef.current=recorder
    try{recorder.start();setListening(true)}catch{setError(voiceErrorMessage(language,'default'))}
  }
  async function submit(event){
    event.preventDefault()
    if(busyRef.current||!draft.goal?.trim())return
    recognitionRef.current?.stop()
    busyRef.current=true;setBusy(true)
    try{await onSubmit(event,{...draft,title:draft.title?.trim()||draft.goal.trim().replace(/\s+/g,' ').slice(0,90)})}
    finally{busyRef.current=false;setBusy(false)}
  }
  const field=(key,type='input')=><label key={key} htmlFor={`${id}-${key}`}>{copy[{client_id:'client',reference_no:'reference',deadline_at:'deadline',next_action:'nextAction'}[key]||key]}{type==='textarea'?<textarea id={`${id}-${key}`} value={draft[key]||''} onChange={event=>setDraft({...draft,[key]:event.target.value})}/>:<input id={`${id}-${key}`} type={key==='deadline_at'?'datetime-local':'text'} value={draft[key]||''} onChange={event=>setDraft({...draft,[key]:event.target.value})}/>}</label>
  return <form className="simpleCaseStart" onSubmit={submit} dir={['ar','fa'].includes(language)?'rtl':'ltr'}>
    <h2><label htmlFor={`${id}-goal`}>{ui.ask}</label></h2>
    <p id={`${id}-help`}>{ui.help}</p>
    <textarea id={`${id}-goal`} aria-describedby={`${id}-help`} value={draft.goal||''} onChange={event=>setDraft({...draft,goal:event.target.value})} placeholder={ui.placeholder} required maxLength={12000} rows={4}/>
    {error&&<p role="alert">{error}</p>}
    <div className="simpleCaseButtons"><button className="secondary" type="button" disabled={busy} aria-pressed={listening} onClick={speak}>{listening?ui.stop:ui.speak}</button><button className="primary" disabled={busy||listening||!draft.goal?.trim()}>{busy?'…':ui.continue}</button></div>
    <details className="simpleCaseOptions"><summary>{ui.options} · {localizedCountryName(draft.home_country||'DE',language)} / {localizedCountryName(draft.target_country||'DE',language)}</summary>
      <div className="coreForm">
        {['home_country','target_country'].map(key=><label key={key}>{copy[key==='home_country'?'homeCountry':'targetCountry']}<select value={draft[key]||'DE'} onChange={event=>setDraft({...draft,[key]:event.target.value})}>{COUNTRY_CATALOG.map(country=><option key={country.key} value={country.key}>{localizedCountryName(country.key,language)}</option>)}</select></label>)}
        {field('title')}
        <label>{copy.client}<select value={draft.client_id||''} onChange={event=>setDraft({...draft,client_id:event.target.value})}><option value="">{copy.noClient}</option>{clients.map(client=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        {field('reference_no')}{field('summary','textarea')}{field('deadline_at')}{field('next_action','textarea')}
      </div>
    </details>
  </form>
}
