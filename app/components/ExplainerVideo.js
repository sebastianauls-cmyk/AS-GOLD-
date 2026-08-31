'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی'],
  ['ro','🇷🇴','Română'],['bg','🇧🇬','Български']
]

const copy={
  de:{title:'AS Gold kurz erklärt',lead:'Das aktuelle Erklärvideo zum neuesten AS-Gold-Stand.',language:'Videosprache',voice:'Video-Ausgabe',female:'Weiblich',male:'Männlich',loading:'Video wird geladen …'},
  en:{title:'AS Gold explained briefly',lead:'The current explainer video for the latest AS Gold version.',language:'Video language',voice:'Presenter',female:'Female',male:'Male',loading:'Loading video …'},
  fr:{title:'AS Gold expliqué brièvement',lead:'La vidéo explicative actuelle de la dernière version d’AS Gold.',language:'Langue de la vidéo',voice:'Présentation',female:'Femme',male:'Homme',loading:'Chargement de la vidéo …'},
  tr:{title:'AS Gold kısaca anlatılıyor',lead:'En güncel AS Gold sürümünün açıklayıcı videosu.',language:'Video dili',voice:'Video sunumu',female:'Kadın',male:'Erkek',loading:'Video yükleniyor …'},
  pl:{title:'AS Gold w skrócie',lead:'Aktualny film objaśniający najnowszą wersję AS Gold.',language:'Język filmu',voice:'Prowadzący',female:'Kobieta',male:'Mężczyzna',loading:'Ładowanie filmu …'},
  ru:{title:'AS Gold — краткое объяснение',lead:'Актуальное объясняющее видео для последней версии AS Gold.',language:'Язык видео',voice:'Ведущий',female:'Женщина',male:'Мужчина',loading:'Видео загружается …'},
  ar:{title:'شرح مختصر لـ AS Gold',lead:'الفيديو التوضيحي الحالي لأحدث إصدار من AS Gold.',language:'لغة الفيديو',voice:'مقدم الفيديو',female:'امرأة',male:'رجل',loading:'جارٍ تحميل الفيديو …'},
  fa:{title:'معرفی کوتاه AS Gold',lead:'ویدیوی توضیحی فعلی برای جدیدترین نسخه AS Gold.',language:'زبان ویدیو',voice:'ارائه‌دهنده ویدیو',female:'زن',male:'مرد',loading:'در حال بارگذاری ویدیو …'},
  ro:{title:'AS Gold explicat pe scurt',lead:'Videoclipul explicativ actual pentru cea mai nouă versiune AS Gold.',language:'Limba videoclipului',voice:'Prezentator',female:'Femeie',male:'Bărbat',loading:'Se încarcă videoclipul …'},
  bg:{title:'AS Gold накратко',lead:'Актуалното обяснително видео за най-новата версия на AS Gold.',language:'Език на видеото',voice:'Водещ',female:'Жена',male:'Мъж',loading:'Видеото се зарежда …'}
}

const femaleLocalVideos={
  de:'/videos/as-gold-v35-de.mp4',en:'/videos/as-gold-v35-en.mp4',fr:'/videos/as-gold-v35-fr.mp4',tr:'/videos/as-gold-v35-tr.mp4',pl:'/videos/as-gold-v35-pl.mp4',
  ru:'/videos/as-gold-v35-ru.mp4',ar:'/videos/as-gold-v35-ar.mp4',fa:'/videos/as-gold-v35-fa.mp4',ro:'/videos/as-gold-v35-ro.mp4',bg:'/videos/as-gold-v35-bg.mp4'
}

const femaleRemoteVideos={
  de:'https://resource2.heygen.ai/video_translate/6b18109b292448afb9fedf930f8ccdbb-de/original.mp4',
  en:'https://resource2.heygen.ai/video_translate/3ccf94ed801641f585cd0620cc97de38-en/original.mp4',
  fr:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-fr/original.mp4',
  tr:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-tr/original.mp4',
  pl:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-pl/original.mp4',
  ru:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ru/original.mp4',
  ar:'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ar/original.mp4',
  fa:'https://resource2.heygen.ai/video_translate/4378b94dc0e84ad598a3742c105bbda7-fa_fa-IR/original.mp4',
  ro:'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-ro/original.mp4',
  bg:'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-bg/original.mp4'
}

const maleRemoteVideos={
  de:'https://resource2.heygen.ai/video_translate/a2b05b0034dd4ab8910e619c01867bb5-de/original.mp4',
  en:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-en/original.mp4',
  fr:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-fr/original.mp4',
  tr:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-tr/original.mp4',
  pl:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-pl/original.mp4',
  ru:'https://resource2.heygen.ai/video_translate/2014388e973a4723907ce6f55851921d-ru/original.mp4',
  ar:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-ar/original.mp4',
  fa:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-fa_fa-IR/original.mp4',
  ro:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-ro/original.mp4',
  bg:'https://resource2.heygen.ai/video_translate/9d9a4ec98ad0459c9d5f144372ae6931-bg/original.mp4'
}

export function ExplainerVideo(){
  const [host,setHost]=useState(null)
  const [uiLanguage,setUiLanguage]=useState('de')
  const [videoLanguage,setVideoLanguage]=useState('de')
  const [presenter,setPresenter]=useState('female')

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
    const savedPresenter=localStorage.getItem('asgold-video-presenter')
    if(savedPresenter==='male'||savedPresenter==='female') setPresenter(savedPresenter)
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

  useEffect(()=>{localStorage.setItem('asgold-video-presenter',presenter)},[presenter])

  if(!host) return null
  const c=copy[uiLanguage]||copy.de
  const femaleLocal=femaleLocalVideos[videoLanguage]||femaleLocalVideos.de
  const femaleRemote=femaleRemoteVideos[videoLanguage]||femaleRemoteVideos.de
  const maleRemote=maleRemoteVideos[videoLanguage]||maleRemoteVideos.de
  const rtl=uiLanguage==='ar'||uiLanguage==='fa'

  return createPortal(<section dir={rtl?'rtl':'ltr'} style={{margin:'16px 0 10px',padding:16,border:'1px solid #d9c792',borderRadius:18,background:'#fff',boxShadow:'0 8px 26px rgba(72,55,18,.06)'}}>
    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'6px 0 13px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:12}}>
      <label style={{display:'grid',gap:5,fontWeight:800,color:'#5d4a1e'}}>{c.language}
        <select value={videoLanguage} onChange={e=>setVideoLanguage(e.target.value)} style={{width:'100%',padding:'10px 11px',border:'1px solid #d8d1bd',borderRadius:11,background:'#fff',color:'#27303b'}}>
          {languages.map(([code,flag,label])=><option value={code} key={code}>{flag} {label}</option>)}
        </select>
      </label>
      <label style={{display:'grid',gap:5,fontWeight:800,color:'#5d4a1e'}}>{c.voice}
        <select value={presenter} onChange={e=>setPresenter(e.target.value)} style={{width:'100%',padding:'10px 11px',border:'1px solid #d8d1bd',borderRadius:11,background:'#fff',color:'#27303b'}}>
          <option value='female'>👩 {c.female}</option>
          <option value='male'>👨 {c.male}</option>
        </select>
      </label>
    </div>
    <video key={`${videoLanguage}-${presenter}`} controls playsInline preload='metadata' aria-label={`${c.title} – ${presenter==='male'?c.male:c.female}`} style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}>
      {presenter==='female'&&<source src={femaleLocal} type='video/mp4'/>}
      <source src={presenter==='male'?maleRemote:femaleRemote} type='video/mp4'/>
      {c.loading}
    </video>
  </section>,host)
}
