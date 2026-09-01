'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, BG, DE, FR, GB, IR, PL, RO, RU, SA, TR, US, VN } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../lib/v30Languages.mjs'

const flagComponents={AF,AE,BG,DE,FR,GB,IR,PL,RO,RU,SA,TR,US,VN}

const videoButtonText={de:'Erklärvideo',en:'Explainer video',fr:'Vidéo explicative',tr:'Tanıtım videosu',pl:'Film objaśniający',ru:'Объясняющее видео',ar:'فيديو توضيحي',fa:'ویدیوی توضیحی',ro:'Videoclip explicativ',bg:'Обяснително видео',vi:'Video giải thích'}
const backButtonText={de:'← Zurück',en:'← Back',fr:'← Retour',tr:'← Geri',pl:'← Wstecz',ru:'← Назад',ar:'الرجوع →',fa:'بازگشت →',ro:'← Înapoi',bg:'← Назад',vi:'← Quay lại'}
function FlagSet({countryCodes=[],fallback='',className=''}){
  const supported=countryCodes.filter(code=>flagComponents[code])
  return <span className={`flagIconSet ${className}`.trim()} aria-hidden="true">
    {supported.map(code=>{const CountryFlag=flagComponents[code];return <CountryFlag className="flagIcon" focusable="false" key={code}/>})}
    {!supported.length&&<b>{fallback}</b>}
  </span>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false,publicPicker=false}){
  const [open,setOpen]=useState(false)
  const [mobilePublic,setMobilePublic]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]
  const backLabel=backButtonText[value]||backButtonText.de

  useEffect(()=>{
    if(!publicPicker) return
    const mq=window.matchMedia('(max-width: 560px)')
    const apply=()=>setMobilePublic(mq.matches)
    apply()
    mq.addEventListener?.('change',apply)
    return ()=>mq.removeEventListener?.('change',apply)
  },[publicPicker])

  useEffect(()=>{
    if(!open) return
    function close(event){if(!rootRef.current?.contains(event.target))setOpen(false)}
    function escape(event){if(event.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}
  },[open])

  if(publicPicker){
    const explainerLabel=videoButtonText[value]||videoButtonText.de
    const showExplainer=()=>{
      setOpen(false)
      document.dispatchEvent(new CustomEvent('asgold:open-explainer',{detail:{language:value}}))
    }
    return <div
      className={`flagLanguage flagLanguagePublicPicker ${className}`.trim()}
      ref={rootRef}
      style={{position:'relative',zIndex:120,direction:'ltr',display:'inline-flex',alignItems:'center',gap:'8px',width:'auto',maxWidth:'100%',minWidth:0,flexWrap:'wrap'}}
    >
      <button
        type="button"
        aria-label={`${label}: ${active.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open?menuId:undefined}
        title={`${label}: ${active.label}`}
        onClick={()=>setOpen(current=>!current)}
        style={{display:'inline-flex',alignItems:'center',justifyContent:'flex-start',gap:'9px',width:'auto',minWidth:mobilePublic?'150px':0,minHeight:'46px',padding:'8px 11px',border:'1px solid #c9ad66',borderRadius:'12px',background:'#fff',color:'#2f291b',fontWeight:850,boxShadow:'0 4px 14px rgba(27,31,37,.10)',maxWidth:'100%'}}
      >
        <div style={{display:'inline-flex',alignItems:'center',gap:'9px',minWidth:0}}><FlagSet countryCodes={active.countryCodes} fallback={active.flags}/><span style={{display:'grid',textAlign:'left',lineHeight:1.15}}><small style={{fontSize:'.68rem',color:'#6b6250'}}>{label}</small><strong style={{display:'inline-block',fontSize:'.9rem',whiteSpace:'nowrap'}}>{active.label}</strong></span></div>
        <b aria-hidden="true" style={{fontSize:'.8rem',flex:'0 0 auto',marginLeft:'2px'}}>{open?'▴':'▾'}</b>
      </button>
      <button type="button" onClick={showExplainer} style={{minHeight:'46px',padding:'8px 12px',border:'1px solid #c9ad66',borderRadius:'12px',background:'#2f291b',color:'#fff',fontWeight:850,boxShadow:'0 4px 14px rgba(27,31,37,.10)',whiteSpace:'nowrap'}}>▶ {explainerLabel}</button>
      {open&&<div
        id={menuId}
        role="listbox"
        aria-label={label}
        style={{position:'absolute',top:'calc(100% + 7px)',left:0,width:'230px',maxWidth:'calc(100vw - 24px)',maxHeight:'calc(100dvh - 150px)',overflowY:'auto',padding:'7px',display:'flex',flexDirection:'column',gap:'6px',background:'#fff',border:'1px solid #d8dbe0',borderRadius:'14px',boxShadow:'0 16px 42px rgba(27,31,37,.22)'}}
      >
        <button
          type="button"
          onClick={()=>setOpen(false)}
          aria-label={backLabel.replace(/^←\s*|\s*→$/g,'')}
          style={{display:'flex',alignItems:'center',justifyContent:'flex-start',width:'100%',minHeight:'46px',padding:'9px 11px',borderRadius:'10px',border:'1px solid #c9ad66',background:'#2f291b',color:'#fff',fontWeight:900,textAlign:'left',position:'sticky',top:0,zIndex:2}}
        >{backLabel}</button>
        {supportedLanguages.map(item=><button
          type="button"
          role="option"
          aria-selected={item.key===value}
          aria-label={item.label}
          title={item.label}
          onClick={()=>{onChange(item.key);setOpen(false)}}
          key={item.key}
          style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',width:'100%',minHeight:'50px',padding:'8px 10px',borderRadius:'10px',border:item.key===value?'2px solid #9b792b':'1px solid #e0e3e7',background:item.key===value?'#fff8e8':'#fff',color:'#27303b',fontWeight:800,textAlign:'left'}}
        ><div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><strong style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</strong></div><small>{item.short}</small></button>)}
      </div>}
    </div>
  }
  return <div className={`flagLanguage ${showLabel?'flagLanguageLabeled':''} ${className}`.trim()} ref={rootRef}>
    {showLabel&&<span className="flagLanguageLabel">{label}</span>}
    <button type="button" className="flagLanguageTrigger" aria-label={`${label}: ${active.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?menuId:undefined} title={`${label}: ${active.label}`} onClick={()=>setOpen(current=>!current)}>
      <FlagSet countryCodes={active.countryCodes} fallback={active.flags} className="flagLanguageActive"/><strong>{active.label}</strong><span className="flagLanguageChevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="flagLanguageMenu" id={menuId} role="listbox" aria-label={label}>
      <button type="button" className="flagLanguageMenuBack" onClick={()=>setOpen(false)} aria-label={backLabel.replace(/^←\s*|\s*→$/g,'')}>{backLabel}</button>
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}><span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small></button>)}
    </div>}
  </div>
}
