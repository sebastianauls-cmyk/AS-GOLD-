'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, DE, FR, GB, IR, PL, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../lib/v30Languages.mjs'

const flagComponents={AF,AE,DE,FR,GB,IR,PL,RU,SA,TR,US}

function FlagSet({countryCodes=[],fallback='',className=''}){
  const supported=countryCodes.filter(code=>flagComponents[code])
  return <div className={`flagIconSet ${className}`.trim()} aria-hidden="true" style={{display:'inline-flex',alignItems:'center',gap:'4px',minWidth:'30px',flex:'0 0 auto'}}>
    {supported.map(code=>{const CountryFlag=flagComponents[code];return <CountryFlag style={{width:'30px',height:'20px',display:'block',borderRadius:'2px',boxShadow:'0 0 0 1px rgba(24,30,38,.28)'}} focusable="false" key={code}/>})}
    {!supported.length&&<b style={{fontSize:'1.2rem'}}>{fallback}</b>}
  </div>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false}){
  const [open,setOpen]=useState(false)
  const [publicPicker,setPublicPicker]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]

  useEffect(()=>{
    setPublicPicker(Boolean(rootRef.current?.closest('.publicTop')))
  },[])

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

  if(publicPicker){
    return <div
      className={`flagLanguage flagLanguagePublicPicker ${className}`.trim()}
      ref={rootRef}
      style={{position:'relative',zIndex:120,direction:'ltr',display:'inline-flex'}}
    >
      <button
        type="button"
        aria-label={`${label}: ${active.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open?menuId:undefined}
        title={`${label}: ${active.label}`}
        onClick={()=>setOpen(current=>!current)}
        style={{display:'flex',alignItems:'center',gap:'9px',minHeight:'46px',padding:'8px 10px',border:'1px solid #c9ad66',borderRadius:'12px',background:'#fff',color:'#2f291b',fontWeight:850,boxShadow:'0 4px 14px rgba(27,31,37,.10)',maxWidth:'100%'}}
      >
        <FlagSet countryCodes={active.countryCodes} fallback={active.flags}/>
        <strong style={{display:'inline-block',fontSize:'.9rem',whiteSpace:'nowrap'}}>Sprache</strong>
        <b aria-hidden="true" style={{fontSize:'.8rem'}}>{open?'▴':'▾'}</b>
      </button>
      {open&&<div
        id={menuId}
        role="listbox"
        aria-label={label}
        style={{position:'absolute',top:'calc(100% + 7px)',left:0,width:'230px',maxWidth:'calc(100vw - 24px)',maxHeight:'calc(100dvh - 110px)',overflowY:'auto',padding:'7px',display:'flex',flexDirection:'column',gap:'6px',background:'#fff',border:'1px solid #d8dbe0',borderRadius:'14px',boxShadow:'0 16px 42px rgba(27,31,37,.22)'}}
      >
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
      {supportedLanguages.map(item=><button type="button" role="option" aria-selected={item.key===value} aria-label={item.label} title={item.label} className={item.key===value?'active':''} onClick={()=>{onChange(item.key);setOpen(false)}} key={item.key}><span className="flagLanguageOptionMain"><FlagSet countryCodes={item.countryCodes} fallback={item.flags}/><span className="flagLanguageName">{item.label}</span></span><small>{item.short}</small></button>)}
    </div>}
  </div>
}
