'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, DE, FR, GB, IR, PL, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../lib/v30Languages.mjs'

const flagComponents={AF,AE,DE,FR,GB,IR,PL,RU,SA,TR,US}

function FlagSet({countryCodes=[],fallback='',className=''}){
  const supported=countryCodes.filter(code=>flagComponents[code])
  return <span className={`flagIconSet ${className}`.trim()} aria-hidden="true">
    {supported.map(code=>{const CountryFlag=flagComponents[code];return <CountryFlag className="flagIcon" focusable="false" key={code}/>})}
    {!supported.length&&fallback}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false}){
  const [open,setOpen]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]

  useEffect(()=>{
    if(!open) return
    function close(event){ if(!rootRef.current?.contains(event.target)) setOpen(false) }
    function escape(event){ if(event.key==='Escape') setOpen(false) }
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',escape)
    return ()=>{
      document.removeEventListener('pointerdown',close)
      document.removeEventListener('keydown',escape)
    }
  },[open])

  return <div className={`flagLanguage ${showLabel?'flagLanguageLabeled':''} ${className}`.trim()} ref={rootRef}>
    {showLabel&&<span className="flagLanguageLabel">{label}</span>}
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)}>
      <FlagSet countryCodes={active.countryCodes} fallback={active.flags} className="flagLanguageActive"/><strong>{active.label}</strong><span className="flagLanguageChevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label}>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}><span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small></button>)}
    </div>}
  </div>
}
