'use client'

import { useMemo, useRef, useState } from 'react'
import { documentIntakeLanguages, localeForIntakeLanguage } from './documentIntakeLanguages.mjs'
import { intakeCopy } from './documentIntakeCopy.mjs'
import { voiceErrorMessage } from './voiceErrorCopy.mjs'

export default function VoiceContextInput({language='de'}){
  const c=intakeCopy(language)
  const [voiceLanguage,setVoiceLanguage]=useState(language)
  const [draft,setDraft]=useState('')
  const [interim,setInterim]=useState('')
  const [confirmed,setConfirmed]=useState('')
  const [listening,setListening]=useState(false)
  const [error,setError]=useState('')
  const recognitionRef=useRef(null)
  const SpeechRecognition=useMemo(()=>typeof window==='undefined'?null:(window.SpeechRecognition||window.webkitSpeechRecognition),[])

  function fail(code){
    setError(voiceErrorMessage(language,code))
    setListening(false)
    setInterim('')
  }

  function start(){
    if(!SpeechRecognition){setError(c.voiceUnsupported);return}
    setError('');setInterim('')
    const recognition=new SpeechRecognition()
    recognition.lang=localeForIntakeLanguage(voiceLanguage)
    recognition.continuous=true
    recognition.interimResults=true
    recognition.onresult=event=>{
      let finalText=''; let interimText=''
      for(let i=event.resultIndex;i<event.results.length;i++){
        const text=event.results[i][0]?.transcript||''
        if(event.results[i].isFinal) finalText+=`${text} `
        else interimText+=text
      }
      if(finalText) setDraft(previous=>`${previous} ${finalText}`.trim())
      setInterim(interimText)
    }
    recognition.onerror=event=>fail(event?.error||'default')
    recognition.onnomatch=()=>fail('no-speech')
    recognition.onend=()=>{setListening(false);setInterim('')}
    recognitionRef.current=recognition
    try{recognition.start();setListening(true)}catch{fail('default')}
  }

  function stop(){recognitionRef.current?.stop();setListening(false);setInterim('')}
  function accept(){setConfirmed(draft.trim());setError('')}
  function clear(){recognitionRef.current?.stop();setDraft('');setInterim('');setConfirmed('');setError('');setListening(false)}

  return <section className="detailCard" aria-live="polite">
    <div className="detailCardHead"><div><b>🎤 {c.voiceTitle}</b><p className="muted">{c.voiceHelp}</p></div></div>
    <label>{c.voiceLanguage}<select value={voiceLanguage} onChange={e=>{setVoiceLanguage(e.target.value);setError('')}}>{documentIntakeLanguages.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    <div className="modeSwitch"><button type="button" className={listening?'active':''} onClick={listening?stop:start}>{listening?c.voiceStop:c.voiceStart}</button><button type="button" onClick={clear}>{c.voiceClear}</button></div>
    {error&&<p className="analysisUnsupported" role="alert">{error}</p>}
    <label>{c.voiceDraft}<textarea value={draft+(interim?`${draft?' ':''}${interim}`:'')} onChange={e=>{setDraft(e.target.value);setInterim('');setError('')}} placeholder="…"/></label>
    <button type="button" className="secondary" disabled={!draft.trim()} onClick={accept}>{c.voiceConfirm}</button>
    {confirmed&&<p><b>🟢 {c.voiceConfirmed}</b></p>}
    <input type="hidden" name="voice_context" value={confirmed}/>
    <input type="hidden" name="voice_language" value={confirmed?localeForIntakeLanguage(voiceLanguage):''}/>
  </section>
}
