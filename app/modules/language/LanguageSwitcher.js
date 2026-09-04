'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, BG, DE, FR, GB, IR, PL, RO, RU, SA, TR, US, VN } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from './v36Languages.mjs'

const flagComponents={AF,AE,BG,DE,FR,GB,IR,PL,RO,RU,SA,TR,US,VN}
const explainerButtonText={de:'Erklärvideo',en:'Explainer video',fr:'Vidéo explicative',tr:'Tanıtım videosu',pl:'Film objaśniający',ru:'Объясняющее видео',ar:'فيديو توضيحي',fa:'ویدیوی توضیحی',ro:'Videoclip explicativ',bg:'Обяснително видео',vi:'Video giải thích'}
const backButtonText={de:'← Zurück',en:'← Back',fr:'← Retour',tr:'← Geri',pl:'← Wstecz',ru:'← Назад',ar:'الرجوع →',fa:'بازگشت →',ro:'← Înapoi',bg:'← Назад',
  vi:'← Quay lại'}

function FlagSet({countryCodes=[],fallback='',className=''}){
  const usable=countryCodes.filter(code=>flagComponents[code])
  return <span className={`flagIconSet ${className}`.trim()} aria-hidden="true">
    {usable.map(code=>{const Flag=flagComponents[code];return <Flag className="flagIcon" key={code} focusable="false"/>})}
    {!usable.length&&<span>{fallback}</span>}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false,publicPicker=false,onExplainer=null}){
  const [open,setOpen]=useState(false)
  const [mobilePublic,setMobilePublic]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const menuRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]
  const backLabel=backButtonText[value]||backButtonText.de

  useEffect(()=>{
    if(!publicPicker)return
    const mq=window.matchMedia('(max-width: 560px)')
    const apply=()=>setMobilePublic(mq.matches)
    apply()
    mq.addEventListener?.('change',apply)
    return()=>mq.removeEventListener?.('change',apply)
  },[publicPicker])

  useEffect(()=>{
    if(!open)return
    const closeOutside=event=>{if(!rootRef.current?.contains(event.target))setOpen(false)}
    const closeEscape=event=>{if(event.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',closeOutside)
    document.addEventListener('keydown',closeEscape)
    return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeEscape)}
  },[open])

  useEffect(()=>{
    if(!open)return
    const frame=window.requestAnimationFrame(()=>{
      if(menuRef.current)menuRef.current.scrollTop=0
    })
    return()=>window.cancelAnimationFrame(frame)
  },[open])

  useEffect(()=>{
    if(!open||!window.matchMedia('(max-width: 700px)').matches)return
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    return()=>{document.body.style.overflow=previousOverflow}
  },[open])

  const mobileBackdrop=open&&<div className="flagLanguageBackdrop" aria-hidden="true" onPointerDown={()=>setOpen(false)}/>

  if(publicPicker){
    return <div className={`flagLanguage flagLanguagePublicPicker ${open?'flagLanguageOpen':''} ${className}`.trim()} ref={rootRef} style={{position:'relative',zIndex:open?300:120,direction:'ltr',display:'inline-flex',alignItems:'center',gap:8,width:'auto',maxWidth:'100%',minWidth:0,flexWrap:'wrap'}}>
      <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)} style={{minWidth:mobilePublic?'150px':0}}>
        <FlagSet countryCodes={active.countryCodes} fallback={active.flags}/>
        <span className="flagLanguagePublicText"><small>{label}</small><strong>{active.label}</strong></span>
        <span className="flagLanguageChevron" aria-hidden="true">{open?'▴':'▾'}</span>
      </button>
      {onExplainer&&<button type="button" className="secondary explainerVideoTrigger" onClick={()=>{setOpen(false);onExplainer(value)}}>▶ {explainerButtonText[value]||explainerButtonText.de}</button>}
      {mobileBackdrop}
      {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label} ref={menuRef}>
        <button type="button" className="flagLanguageMenuBack" onClick={()=>setOpen(false)} aria-label={backLabel.replace(/^←\s*|\s*→$/g,'')}>{backLabel}</button>
        {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}>
          <span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small>
        </button>)}
      </div>}
    </div>
  }

  return <div className={`flagLanguage flagLanguageModular ${showLabel?'flagLanguageLabeled':''} ${open?'flagLanguageOpen':''} ${className}`.trim()} ref={rootRef}>
    {showLabel&&<span className="flagLanguageLabel">{label}</span>}
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)}>
      <FlagSet countryCodes={active.countryCodes} fallback={active.flags}/><strong>{active.label}</strong><span className="flagLanguageChevron" aria-hidden="true">{open?'▴':'▾'}</span>
    </button>
    {mobileBackdrop}
    {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label} ref={menuRef}>
      <button type="button" className="flagLanguageMenuBack" onClick={()=>setOpen(false)} aria-label={backLabel.replace(/^←\s*|\s*→$/g,'')}>{backLabel}</button>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}>
        <span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small>
      </button>)}
    </div>}
  </div>
}
