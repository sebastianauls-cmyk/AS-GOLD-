'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, BG, DE, FR, GB, IR, PL, RO, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../../lib/v30Languages.mjs'

const flags={AF,AE,BG,DE,FR,GB,IR,PL,RO,RU,SA,TR,US}

function FlagSet({countryCodes=[],fallback=''}){
  const usable=countryCodes.filter(code=>flags[code])
  return <span aria-hidden="true" style={{display:'inline-flex',gap:4,alignItems:'center'}}>
    {usable.map(code=>{const Flag=flags[code];return <Flag key={code} focusable="false" style={{width:30,height:20,borderRadius:2,boxShadow:'0 0 0 1px rgba(24,30,38,.28)'}}/>})}
    {!usable.length&&<span>{fallback}</span>}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false}){
  const [open,setOpen]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]

  useEffect(()=>{
    if(!open) return
    const closeOutside=event=>{if(!rootRef.current?.contains(event.target))setOpen(false)}
    const closeEscape=event=>{if(event.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',closeOutside)
    document.addEventListener('keydown',closeEscape)
    return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeEscape)}
  },[open])

  return <div className={`flagLanguage flagLanguageModular ${showLabel?'flagLanguageLabeled':''} ${className}`.trim()} ref={rootRef} style={{position:'relative'}}>
    {showLabel&&<span className="flagLanguageLabel">{label}</span>}
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>setOpen(v=>!v)}>
      <FlagSet countryCodes={active.countryCodes} fallback={active.flags}/><strong>{active.label}</strong><span aria-hidden="true">{open?'▴':'▾'}</span>
    </button>
    {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label}>
      <button type="button" className="flagLanguageClose" onClick={()=>setOpen(false)}>← Zurück</button>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}>
        <span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small>
      </button>)}
    </div>}
  </div>
}
