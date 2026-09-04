'use client'

import { useMemo, useRef, useState } from 'react'
import { documentIntakeLanguages, localeForIntakeLanguage } from './documentIntakeLanguages.mjs'

const copy={
  de:{title:'Problem sprechen',help:'Sprechen Sie frei. Der erkannte Text wird zuerst angezeigt und erst nach Ihrer Bestätigung übernommen.',language:'Gesprochene Sprache',start:'Mikrofon starten',stop:'Aufnahme stoppen',unsupported:'Spracherkennung wird von diesem Browser nicht unterstützt.',draft:'Erkannter Text',confirm:'Text übernehmen',confirmed:'Gesprochener Kontext übernommen',clear:'Löschen'},
  en:{title:'Speak about the problem',help:'Speak freely. The transcript is shown first and is only accepted after confirmation.',language:'Spoken language',start:'Start microphone',stop:'Stop recording',unsupported:'Speech recognition is not supported by this browser.',draft:'Transcript',confirm:'Accept text',confirmed:'Spoken context accepted',clear:'Clear'}
}

export default function VoiceContextInput({language='de'}){
  const c=copy[language]||copy.en
  const [voiceLanguage,setVoiceLanguage]=useState(language)
  const [draft,setDraft]=useState('')
  const [confirmed,setConfirmed]=useState('')
  const [listening,setListening]=useState(false)
  const [error,setError]=useState('')
  const recognitionRef=useRef(null)
  const SpeechRecognition=useMemo(()=>typeof window==='undefined'?null:(window.SpeechRecognition||window.webkitSpeechRecognition),[])

  function start(){
    if(!SpeechRecognition){setError(c.unsupported);return}
    setError('')
    const recognition=new SpeechRecognition()
    recognition.lang=localeForIntakeLanguage(voiceLanguage)
    recognition.continuous=true
    recognition.interimResults=true
    recognition.onresult=event=>{
      let finalText=''; let interim=''
      for(let i=event.resultIndex;i<event.results.length;i++){
        const text=event.results[i][0]?.transcript||''
        if(event.results[i].isFinal) finalText+=`${text} `
        else interim+=text
      }
      if(finalText) setDraft(previous=>`${previous} ${finalText}`.trim())
      else if(interim) setDraft(previous=>previous||interim)
    }
    recognition.onerror=event=>{setError(event.error||'speech_error');setListening(false)}
    recognition.onend=()=>setListening(false)
    recognitionRef.current=recognition
    recognition.start();setListening(true)
  }

  function stop(){recognitionRef.current?.stop();setListening(false)}
  function accept(){setConfirmed(draft.trim())}
  function clear(){setDraft('');setConfirmed('');setError('')}

  return <section className="detailCard" aria-live="polite">
    <div className="detailCardHead"><div><b>🎤 {c.title}</b><p className="muted">{c.help}</p></div></div>
    <label>{c.language}<select value={voiceLanguage} onChange={e=>setVoiceLanguage(e.target.value)}>{documentIntakeLanguages.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    <div className="modeSwitch"><button type="button" className={listening?'active':''} onClick={listening?stop:start}>{listening?c.stop:c.start}</button><button type="button" onClick={clear}>{c.clear}</button></div>
    {error&&<p className="analysisUnsupported">{error}</p>}
    <label>{c.draft}<textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="…"/></label>
    <button type="button" className="secondary" disabled={!draft.trim()} onClick={accept}>{c.confirm}</button>
    {confirmed&&<p><b>🟢 {c.confirmed}</b></p>}
    <input type="hidden" name="voice_context" value={confirmed}/>
    <input type="hidden" name="voice_language" value={confirmed?localeForIntakeLanguage(voiceLanguage):''}/>
  </section>
}
