'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی']
]

const copy={
  de:{title:'AS Gold in 60 Sekunden',lead:'Lernen Sie kurz kennen, was AS Gold für komplexe Vorgänge leisten kann.',language:'Videosprache',speaker:'Sprecher',male:'Männlich',female:'Weiblich',pending:'Diese Sprachfassung befindet sich in Produktion.',rendering:'Das deutsche Mastervideo wird gerade vorbereitet.'},
  en:{title:'AS Gold in 60 seconds',lead:'See briefly how AS Gold helps with complex matters.',language:'Video language',speaker:'Presenter',male:'Male',female:'Female',pending:'This language version is currently in production.',rendering:'The German master video is currently being prepared.'},
  fr:{title:'AS Gold en 60 secondes',lead:'Découvrez rapidement ce qu’AS Gold peut faire pour les dossiers complexes.',language:'Langue de la vidéo',speaker:'Présentateur',male:'Homme',female:'Femme',pending:'Cette version linguistique est actuellement en production.',rendering:'La vidéo master allemande est en cours de préparation.'},
  tr:{title:'60 saniyede AS Gold',lead:'AS Gold’un karmaşık işlemlerde neler yapabildiğini kısaca görün.',language:'Video dili',speaker:'Sunucu',male:'Erkek',female:'Kadın',pending:'Bu dil sürümü şu anda hazırlanıyor.',rendering:'Almanca ana video hazırlanıyor.'},
  pl:{title:'AS Gold w 60 sekund',lead:'Zobacz krótko, jak AS Gold pomaga w złożonych sprawach.',language:'Język filmu',speaker:'Prezenter',male:'Mężczyzna',female:'Kobieta',pending:'Ta wersja językowa jest obecnie w przygotowaniu.',rendering:'Niemiecki film główny jest właśnie przygotowywany.'},
  ru:{title:'AS Gold за 60 секунд',lead:'Кратко узнайте, как AS Gold помогает в сложных делах.',language:'Язык видео',speaker:'Ведущий',male:'Мужчина',female:'Женщина',pending:'Эта языковая версия сейчас находится в производстве.',rendering:'Немецкое мастер-видео сейчас готовится.'},
  ar:{title:'AS Gold في 60 ثانية',lead:'تعرّف باختصار على ما يمكن أن يقدمه AS Gold للمعاملات المعقدة.',language:'لغة الفيديو',speaker:'المقدّم',male:'رجل',female:'امرأة',pending:'هذه النسخة اللغوية قيد الإنتاج حالياً.',rendering:'يتم الآن إعداد الفيديو الألماني الأساسي.'},
  fa:{title:'AS Gold در ۶۰ ثانیه',lead:'کوتاه ببینید AS Gold برای موضوعات پیچیده چه کاری انجام می‌دهد.',language:'زبان ویدیو',speaker:'ارائه‌دهنده',male:'مرد',female:'زن',pending:'این نسخه زبانی در حال تولید است.',rendering:'ویدیوی اصلی آلمانی در حال آماده‌سازی است.'}
}

const videos={
  de:{
    male:'/videos/as-gold-explainer-de-male.mp4',
    female:'/videos/as-gold-explainer-de-female.mp4'
  }
}

export function ExplainerVideo(){
  const [host,setHost]=useState(null)
  const [uiLanguage,setUiLanguage]=useState('de')
  const [videoLanguage,setVideoLanguage]=useState('de')
  const [gender,setGender]=useState('male')

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
  const source=videos[videoLanguage]?.[gender]||''
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
      <div style={{display:'grid',gap:5}}><b style={{color:'#5d4a1e'}}>{c.speaker}</b><div style={{display:'flex',gap:7}}>
        <button type='button' aria-pressed={gender==='male'} onClick={()=>setGender('male')} style={{flex:1,padding:'10px 8px',borderRadius:11,border:gender==='male'?'2px solid #8f6e25':'1px solid #d8d1bd',background:gender==='male'?'#fff8df':'#fff',fontWeight:800}}>👨 {c.male}</button>
        <button type='button' aria-pressed={gender==='female'} onClick={()=>setGender('female')} style={{flex:1,padding:'10px 8px',borderRadius:11,border:gender==='female'?'2px solid #8f6e25':'1px solid #d8d1bd',background:gender==='female'?'#fff8df':'#fff',fontWeight:800}}>👩 {c.female}</button>
      </div></div>
    </div>
    {source?<video key={source} controls playsInline preload='metadata' style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}><source src={source} type='video/mp4'/></video>:<div style={{minHeight:130,display:'grid',placeItems:'center',textAlign:'center',padding:18,borderRadius:14,background:'#f8f5ed',border:'1px solid #e7ddc4',color:'#596472',lineHeight:1.45}}>{videoLanguage==='de'?c.rendering:c.pending}</div>}
  </section>,host)
}
