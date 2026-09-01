'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, BG, DE, FR, GB, IR, PL, RO, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../../lib/v30Languages.mjs'
import { ExplainerVideoDialog, explainerVideos, videoButtonText } from './ExplainerVideoDialog'

const flagComponents={AF,AE,BG,DE,FR,GB,IR,PL,RO,RU,SA,TR,US}

function FlagSet({countryCodes=[],fallback=''}){
  const usable=countryCodes.filter(code=>flagComponents[code])
  return <span className="flagIconSet" aria-hidden="true">
    {usable.map(code=>{const Flag=flagComponents[code];return <Flag key={code} focusable="false"/>})}
    {!usable.length&&<span>{fallback}</span>}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false}){
  const [open,setOpen]=useState(false)
  const [videoOpen,setVideoOpen]=useState(false)
  const [videoLanguage,setVideoLanguage]=useState(explainerVideos[value]?value:'de')
  const [publicPicker,setPublicPicker]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]

  useEffect(()=>{setPublicPicker(Boolean(rootRef.current?.closest('.publicTop')))},[])
  useEffect(()=>{if(explainerVideos[value])setVideoLanguage(value)},[value])
  useEffect(()=>{
    if(!open)return
    const closeOutside=event=>{if(!rootRef.current?.contains(event.target))setOpen(false)}
    const closeEscape=event=>{if(event.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',closeOutside)
    document.addEventListener('keydown',closeEscape)
    return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeEscape)}
  },[open])

  const trigger=<button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} title={`${label}: ${active.label}`} onClick={()=>setOpen(v=>!v)}>
    <FlagSet countryCodes={active.countryCodes} fallback={active.flags}/><strong>{publicPicker?label:active.label}</strong><span className="flagLanguageChevron" aria-hidden="true">{open?'▴':'▾'}</span>
  </button>

  return <div className={`flagLanguage flagLanguageModular ${publicPicker?'flagLanguagePublicPicker':''} ${showLabel?'flagLanguageLabeled':''} ${className}`.trim()} ref={rootRef}>
    {showLabel&&!publicPicker&&<span className="flagLanguageLabel">{label}</span>}
    {trigger}
    {publicPicker&&<button type="button" className="explainerVideoTrigger" onClick={()=>setVideoOpen(true)} aria-expanded={videoOpen}>▶ {videoButtonText[value]||videoButtonText.de}</button>}
    {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label}>
      <button type="button" className="flagLanguageClose" onClick={()=>setOpen(false)}>← Zurück</button>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}>
        <span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small>
      </button>)}
    </div>}
    {videoOpen&&<ExplainerVideoDialog language={value} videoLanguage={videoLanguage} setVideoLanguage={setVideoLanguage} onClose={()=>setVideoOpen(false)}/>} 
  </div>
}
