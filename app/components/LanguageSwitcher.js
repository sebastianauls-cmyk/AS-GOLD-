'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AF, AE, BG, DE, FR, GB, IR, PL, RO, RU, SA, TR, US } from 'country-flag-icons/react/3x2'
import { supportedLanguages } from '../lib/v30Languages.mjs'

const flagComponents={AF,AE,BG,DE,FR,GB,IR,PL,RO,RU,SA,TR,US}

const explainerVideos={
  de:'/videos/as-gold-v35-de.mp4',
  en:'/videos/as-gold-v35-en.mp4',
  fr:'/videos/as-gold-v35-fr.mp4',
  tr:'/videos/as-gold-v35-tr.mp4',
  pl:'/videos/as-gold-v35-pl.mp4',
  ru:'/videos/as-gold-v35-ru.mp4',
  ar:'/videos/as-gold-v35-ar.mp4',
  fa:'/videos/as-gold-v35-fa.mp4',
  ro:'/videos/as-gold-v35-ro.mp4',
  bg:'/videos/as-gold-v35-bg.mp4'
}

const videoLanguages=[
  {key:'de',label:'Deutsch',flag:'🇩🇪'},
  {key:'en',label:'English',flag:'🇬🇧'},
  {key:'fr',label:'Français',flag:'🇫🇷'},
  {key:'tr',label:'Türkçe',flag:'🇹🇷'},
  {key:'pl',label:'Polski',flag:'🇵🇱'},
  {key:'ru',label:'Русский',flag:'🇷🇺'},
  {key:'ar',label:'العربية',flag:'🇸🇦'},
  {key:'fa',label:'فارسی',flag:'🇮🇷'},
  {key:'ro',label:'Română',flag:'🇷🇴'},
  {key:'bg',label:'Български',flag:'🇧🇬'}
]

const videoButtonText={de:'Erklärvideo',en:'Explainer video',fr:'Vidéo explicative',tr:'Tanıtım videosu',pl:'Film objaśniający',ru:'Объясняющее видео',ar:'فيديو توضيحي',fa:'ویدیوی توضیحی',ro:'Videoclip explicativ',bg:'Обяснително видео'}
const videoCloseText={de:'Schließen',en:'Close',fr:'Fermer',tr:'Kapat',pl:'Zamknij',ru:'Закрыть',ar:'إغلاق',fa:'بستن',ro:'Închide',bg:'Затвори'}

function FlagSet({countryCodes=[],fallback='',className=''}){
  const supported=countryCodes.filter(code=>flagComponents[code])
  return <div className={`flagIconSet ${className}`.trim()} aria-hidden="true" style={{display:'inline-flex',alignItems:'center',gap:'4px',minWidth:'30px',flex:'0 0 auto'}}>
    {supported.map(code=>{const CountryFlag=flagComponents[code];return <CountryFlag style={{width:'30px',height:'20px',display:'block',borderRadius:'2px',boxShadow:'0 0 0 1px rgba(24,30,38,.28)'}} focusable="false" key={code}/>})}
    {!supported.length&&<b style={{fontSize:'1.2rem'}}>{fallback}</b>}
  </div>
}

export function LanguageSwitcher({value,onChange,label='Sprache',className='',showLabel=false}){
  const [open,setOpen]=useState(false)
  const [videoOpen,setVideoOpen]=useState(false)
  const [videoLanguage,setVideoLanguage]=useState(explainerVideos[value]?value:'de')
  const [publicPicker,setPublicPicker]=useState(false)
  const [mobilePublic,setMobilePublic]=useState(false)
  const menuId=useId()
  const rootRef=useRef(null)
  const active=supportedLanguages.find(item=>item.key===value)||supportedLanguages[0]

  useEffect(()=>{
    if(explainerVideos[value]) setVideoLanguage(value)
  },[value])

  useEffect(()=>{
    const isPublic=Boolean(rootRef.current?.closest('.publicTop'))
    setPublicPicker(isPublic)
    if(!isPublic) return
    const mq=window.matchMedia('(max-width: 560px)')
    const apply=()=>{
      setMobilePublic(mq.matches)
      const parent=rootRef.current?.parentElement
      if(parent?.classList?.contains('languageSwitch')){
        parent.style.gridColumn=mq.matches?'1 / -1':''
        parent.style.width=mq.matches?'100%':''
        parent.style.minWidth='0'
        parent.style.display=mq.matches?'flex':''
        parent.style.justifyContent=mq.matches?'flex-start':''
      }
    }
    apply()
    mq.addEventListener?.('change',apply)
    return ()=>mq.removeEventListener?.('change',apply)
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
    const explainerLabel=videoButtonText[value]||videoButtonText.de
    const closeLabel=videoCloseText[value]||videoCloseText.de
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
        <div style={{display:'inline-flex',alignItems:'center',gap:'9px',minWidth:0}}><FlagSet countryCodes={active.countryCodes} fallback={active.flags}/><strong style={{display:'inline-block',fontSize:'.9rem',whiteSpace:'nowrap'}}>{label}</strong></div>
        <b aria-hidden="true" style={{fontSize:'.8rem',flex:'0 0 auto',marginLeft:'2px'}}>{open?'▴':'▾'}</b>
      </button>
      <button type="button" onClick={()=>setVideoOpen(current=>!current)} aria-expanded={videoOpen} style={{minHeight:'46px',padding:'8px 12px',border:'1px solid #c9ad66',borderRadius:'12px',background:'#2f291b',color:'#fff',fontWeight:850,boxShadow:'0 4px 14px rgba(27,31,37,.10)',whiteSpace:'nowrap'}}>▶ {explainerLabel}</button>
      {open&&<button
        type="button"
        onClick={()=>setOpen(false)}
        aria-label="Zurück"
        style={{flex:'1 0 100%',width:'100%',minHeight:'48px',padding:'10px 14px',borderRadius:'12px',border:'1px solid #c9ad66',background:'#2f291b',color:'#fff',fontWeight:900,fontSize:'1rem',textAlign:'left',boxShadow:'0 4px 14px rgba(27,31,37,.12)'}}
      >← Zurück</button>}
      {open&&<div
        id={menuId}
        role="listbox"
        aria-label={label}
        style={{position:'absolute',top:'calc(100% + 7px)',left:0,width:'230px',maxWidth:'calc(100vw - 24px)',maxHeight:'calc(100dvh - 150px)',overflowY:'auto',padding:'7px',display:'flex',flexDirection:'column',gap:'6px',background:'#fff',border:'1px solid #d8dbe0',borderRadius:'14px',boxShadow:'0 16px 42px rgba(27,31,37,.22)'}}
      >
        <button
          type="button"
          onClick={()=>setOpen(false)}
          aria-label="Zurück"
          style={{display:'flex',alignItems:'center',justifyContent:'flex-start',width:'100%',minHeight:'46px',padding:'9px 11px',borderRadius:'10px',border:'1px solid #c9ad66',background:'#2f291b',color:'#fff',fontWeight:900,textAlign:'left',position:'sticky',top:0,zIndex:2}}
        >← Zurück</button>
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
      {videoOpen&&<div role="dialog" aria-label={explainerLabel} style={{position:'fixed',inset:0,zIndex:500,background:'rgba(20,24,30,.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:'18px'}} onClick={()=>setVideoOpen(false)}>
        <div style={{width:'min(960px,100%)',maxHeight:'92dvh',overflow:'auto',background:'#fff',borderRadius:'18px',padding:'14px',boxShadow:'0 24px 70px rgba(0,0,0,.34)'}} onClick={event=>event.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginBottom:'10px'}}><strong style={{fontSize:'1.05rem'}}>AS Gold · {explainerLabel}</strong><button type="button" onClick={()=>setVideoOpen(false)} aria-label={closeLabel} style={{border:0,background:'#eef0f2',borderRadius:'999px',width:'36px',height:'36px',fontSize:'1.25rem'}}>×</button></div>
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'10px'}}>{videoLanguages.map(item=><button key={item.key} type="button" onClick={()=>setVideoLanguage(item.key)} title={item.label} aria-pressed={videoLanguage===item.key} style={{border:videoLanguage===item.key?'2px solid #9b792b':'1px solid #d8dbe0',background:videoLanguage===item.key?'#fff8e8':'#fff',borderRadius:'10px',padding:'7px 9px',fontWeight:800,whiteSpace:'nowrap'}}>{item.flag} {item.label}</button>)}</div>
          <video key={videoLanguage} controls playsInline preload="metadata" style={{display:'block',width:'100%',maxHeight:'68dvh',background:'#000',borderRadius:'12px'}}><source src={explainerVideos[videoLanguage]} type="video/mp4"/></video>
        </div>
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
