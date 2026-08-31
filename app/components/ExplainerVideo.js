'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی'],
  ['ro','🇷🇴','Română'],['bg','🇧🇬','Български']
]

const copy={
  de:{title:'AS Gold kurz erklärt',lead:'Das aktuelle Erklärvideo zum neuesten AS-Gold-Stand.',language:'Videosprache',loading:'Video wird geladen …'},
  en:{title:'AS Gold explained briefly',lead:'The current explainer video for the latest AS Gold version.',language:'Video language',loading:'Loading video …'},
  fr:{title:'AS Gold expliqué brièvement',lead:'La vidéo explicative actuelle de la dernière version d’AS Gold.',language:'Langue de la vidéo',loading:'Chargement de la vidéo …'},
  tr:{title:'AS Gold kısaca anlatılıyor',lead:'En güncel AS Gold sürümünün açıklayıcı videosu.',language:'Video dili',loading:'Video yükleniyor …'},
  pl:{title:'AS Gold w skrócie',lead:'Aktualny film objaśniający najnowszą wersję AS Gold.',language:'Język filmu',loading:'Ładowanie filmu …'},
  ru:{title:'AS Gold — краткое объяснение',lead:'Актуальное объясняющее видео для последней версии AS Gold.',language:'Язык видео',loading:'Видео загружается …'},
  ar:{title:'شرح مختصر لـ AS Gold',lead:'الفيديو التوضيحي الحالي لأحدث إصدار من AS Gold.',language:'لغة الفيديو',loading:'جارٍ تحميل الفيديو …'},
  fa:{title:'معرفی کوتاه AS Gold',lead:'ویدیوی توضیحی فعلی برای جدیدترین نسخه AS Gold.',language:'زبان ویدیو',loading:'در حال بارگذاری ویدیو …'},
  ro:{title:'AS Gold explicat pe scurt',lead:'Videoclipul explicativ actual pentru cea mai nouă versiune AS Gold.',language:'Limba videoclipului',loading:'Se încarcă videoclipul …'},
  bg:{title:'AS Gold накратко',lead:'Актуалното обяснително видео за най-новата версия на AS Gold.',language:'Език на видеото',loading:'Видеото се зарежда …'}
}

const videos={
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

export function ExplainerVideo(){
  const [host,setHost]=useState(null)
  const [uiLanguage,setUiLanguage]=useState('de')
  const [videoLanguage,setVideoLanguage]=useState('de')

  useEffect(()=>{
    if(location.pathname!=='/') return
    let observer
    const mount=()=>{
      const heroMain=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      const introSlot=document.getElementById('asgold-product-intro-compact-slot')
      const problemSlot=document.getElementById('asgold-problem-slot')
      if(!heroMain||(!introSlot&&!problemSlot)) return false
      let slot=document.getElementById('asgold-explainer-video-slot')
      if(!slot){
        slot=document.createElement('div')
        slot.id='asgold-explainer-video-slot'
        if(problemSlot) heroMain.insertBefore(slot,problemSlot)
        else introSlot.insertAdjacentElement('afterend',slot)
      }
      setHost(slot)
      return true
    }
    if(!mount()){
      observer=new MutationObserver(()=>{if(mount()) observer?.disconnect()})
      observer.observe(document.body,{subtree:true,childList:true})
    }
    const sync=()=>{
      const lang=(document.documentElement.lang||'de').split('-')[0]
      setUiLanguage(lang)
      if(languages.some(([code])=>code===lang)) setVideoLanguage(lang)
    }
    sync()
    const langObserver=new MutationObserver(sync)
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    return()=>{observer?.disconnect();langObserver.disconnect()}
  },[])

  if(!host) return null
  const c=copy[uiLanguage]||copy.de
  const source=videos[videoLanguage]||videos.de
  const rtl=uiLanguage==='ar'||uiLanguage==='fa'

  return createPortal(<section dir={rtl?'rtl':'ltr'} style={{margin:'16px 0 10px',padding:16,border:'1px solid #d9c792',borderRadius:18,background:'#fff',boxShadow:'0 8px 26px rgba(72,55,18,.06)'}}>
    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'6px 0 13px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>
    <label style={{display:'grid',gap:5,fontWeight:800,color:'#5d4a1e',maxWidth:320,marginBottom:12}}>{c.language}
      <select value={videoLanguage} onChange={e=>setVideoLanguage(e.target.value)} style={{width:'100%',padding:'10px 11px',border:'1px solid #d8d1bd',borderRadius:11,background:'#fff',color:'#27303b'}}>
        {languages.map(([code,flag,label])=><option value={code} key={code}>{flag} {label}</option>)}
      </select>
    </label>
    <video key={source} controls playsInline preload='metadata' aria-label={c.title} style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}>
      <source src={source} type='video/mp4'/>
      {c.loading}
    </video>
  </section>,host)
}
