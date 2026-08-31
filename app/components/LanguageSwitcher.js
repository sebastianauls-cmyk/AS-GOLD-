'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, DE, FR, GB, IR, PL, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../lib/v30Languages.mjs'

const flagComponents={AF,AE,DE,FR,GB,IR,PL,RU,SA,TR,US}
const backLabels={de:'Zurück',en:'Back',fr:'Retour',tr:'Geri',pl:'Wstecz',ru:'Назад',ar:'عودة',fa:'بازگشت'}
const rtlLanguageKeys=new Set(['ar','fa'])

function FlagSet({countryCodes=[],fallback='',className=''}){
  const supported=countryCodes.filter(code=>flagComponents[code])
  return <span className={`flagIconSet ${className}`.trim()} aria-hidden="true">
    {supported.map(code=>{const CountryFlag=flagComponents[code];return <CountryFlag className="flagIcon" focusable="false" key={code}/>})}
    {!supported.length&&fallback}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false,uiLanguage}){
  const [open,setOpen]=useState(false)
  const rootRef=useRef(null)
  const triggerRef=useRef(null)
  const optionsRef=useRef(null)
  const menuId=useId()
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]
  const documentLanguage=typeof document==='undefined'?'':document.documentElement.lang.split('-')[0]
  const interfaceLanguage=uiLanguage||documentLanguage||value
  const backLabel=backLabels[interfaceLanguage]||backLabels.de
  const backArrow=rtlLanguageKeys.has(interfaceLanguage)?'→':'←'

  function closeMenu({restoreFocus=false}={}){
    setOpen(false)
    if(restoreFocus) requestAnimationFrame(()=>triggerRef.current?.focus())
  }

  useEffect(()=>{
    if(!open) return
    const focusFrame=requestAnimationFrame(()=>optionsRef.current?.querySelector('[aria-selected="true"]')?.focus())
    function close(event){ if(!rootRef.current?.contains(event.target)) closeMenu() }
    function escape(event){ if(event.key==='Escape') closeMenu({restoreFocus:true}) }
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',escape)
    return ()=>{
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown',close)
      document.removeEventListener('keydown',escape)
    }
  },[open])

  return <div className={`flagLanguage ${showLabel?'flagLanguageLabeled':''} ${className}`.trim()} ref={rootRef}>
    {showLabel&&<span className="flagLanguageLabel">{label}</span>}
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="dialog" aria-controls={menuId} aria-expanded={open} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)} ref={triggerRef}>
      <FlagSet countryCodes={active.countryCodes} fallback={active.flags} className="flagLanguageActive"/><span className="flagLanguageCurrent">{active.label}</span><span className="flagLanguageChevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="flagLanguageMenu" role="dialog" aria-label={label} id={menuId}>
      <div className="flagLanguageMenuHead"><strong>{label}</strong><button type="button" className="flagLanguageBack" onClick={()=>closeMenu({restoreFocus:true})}><span aria-hidden="true">{backArrow}</span><span>{backLabel}</span></button></div>
      <div className="flagLanguageOptions" role="listbox" aria-label={label} ref={optionsRef}>
        {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);closeMenu({restoreFocus:true})}} key={item.key}><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageOptionName">{item.label}</span><small>{item.short}</small></button>)}
      </div>
    </div>}
  </div>
}
