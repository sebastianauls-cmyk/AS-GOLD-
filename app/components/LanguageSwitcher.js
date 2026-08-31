'use client'

import { useEffect, useRef, useState } from 'react'
import { supportedLanguages } from '../lib/v30Languages.mjs'

export function LanguageSwitcher({value,onChange,label='Sprache',className=''}){
  const [open,setOpen]=useState(false)
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

  return <div className={`flagLanguage ${className}`.trim()} ref={rootRef}>
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)}>
      <span className="flagLanguageActive" aria-hidden="true">{active.flags}</span><span className="flagLanguageChevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="flagLanguageMenu" role="listbox" aria-label={label}>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}><span aria-hidden="true">{item.flags}</span><small>{item.short}</small></button>)}
    </div>}
  </div>
}
