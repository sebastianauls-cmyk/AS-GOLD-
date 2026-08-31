'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی']
]

const copy={
  de:{title:'AS Gold in 60 Sekunden',lead:'Lernen Sie kurz kennen, was AS Gold für komplexe Vorgänge leisten kann.',language:'Videosprache',speaker:'Sprecher',male:'Männlich',female:'Weiblich',pending:'Diese Sprachfassung wird nach Freigabe der deutschen Mastervideos erstellt.',rendering:'Das deutsche Mastervideo wird gerade vorbereitet.'},
  en:{title:'AS Gold in 60 seconds',lead:'See briefly how AS Gold helps with complex matters.',language:'Video language',speaker:'Presenter',male:'Male',female:'Female',pending:'This language version will be created after the German master videos are approved.',rendering:'The German master video is currently being prepared.'},
  fr:{title:'AS Gold en 60 secondes',lead:'Découvrez rapidement ce qu’AS Gold peut faire pour les dossiers complexes.',language:'Langue de la vidéo',speaker:'Présentateur',male:'Homme',female:'Femme',pending:'Cette version linguistique sera créée après validation des masters allemands.',rendering:'La vidéo master allemande est en cours de préparation.'},
  tr:{title:'60 saniyede AS Gold',lead:'AS Gold’un karmaşık işlemlerde neler yapabildiğini kısaca görün.',language:'Video dili',speaker:'Sunucu',male:'Erkek',female:'Kadın',pending:'Bu dil sürümü Almanca ana videolar onaylandıktan sonra hazırlanacaktır.',rendering:'Almanca ana video hazırlanıyor.'},
  pl:{title:'AS Gold w 60 sekund',lead:'Zobacz krótko, jak AS Gold pomaga w złożonych sprawach.',language:'Język filmu',speaker:'Prezenter',male:'Mężczyzna',female:'Kobieta',pending:'Ta wersja językowa powstanie po zatwierdzeniu niemieckich filmów głównych.',rendering:'Niemiecki film główny jest właśnie przygotowywany.'},
  ru:{title:'AS Gold за 60 секунд',lead:'Кратко узнайте, как AS Gold помогает в сложных делах.',language:'Язык видео',speaker:'Ведущий',male:'Мужчина',female:'Женщина',pending:'Эта языковая версия будет создана после утверждения немецких мастер-видео.',rendering:'Немецкое мастер-видео сейчас готовится.'},
  ar:{title:'AS Gold في 60 ثانية',lead:'تعرّف باختصار على ما يمكن أن يقدمه AS Gold للمعاملات المعقدة.',language:'لغة الفيديو',speaker:'المقدّم',male:'رجل',female:'امرأة',pending:'سيتم إنشاء هذه النسخة بعد اعتماد الفيديوهين الألمانيين الأساسيين.',rendering:'يتم الآن إعداد الفيديو الألماني الأساسي.'},
  fa:{title:'AS Gold در ۶۰ ثانیه',lead:'کوتاه ببینید AS Gold برای موضوعات پیچیده چه کاری انجام می‌دهد.',language:'زبان ویدیو',speaker:'ارائه‌دهنده',male:'مرد',female:'زن',pending:'این نسخه پس از تأیید ویدیوهای اصلی آلمانی ساخته می‌شود.',rendering:'ویدیوی اصلی آلمانی در حال آماده‌سازی است.'}
}

const videos={
  de:{
    male:'https://files2.heygen.ai/aws_pacific/avatar_tmp/969e7dea31614703a4c738c751f0195f/a9f64e0a49d407631331eb59ac9d7ae0.mp4?Expires=1788811447&Signature=IU~7E2J0FxNmWDwMhQaYv6KHNTT3MbKjnmQOt-7AIz~G26QT6po2PDg3tgtdHPEU9jP3E9juOvZ29M6r4DGQ7G6Yb8NRBa2yEEzaGIbgk4pJjAife7w-uUsU-aBcULvq1hulI1hWnWS1dPs34TRirikD7h~67My90eAIiRwjeMjP1GXaHXTHtjQI7sbvSOVbe8S3laOcXxltSrA2qD4B5pUkHxqvM8keM-loO9MsNjkdPoBgWDgSU7qHfzBHKGM8pYczQ5X8qG4DJA3SMwboIDKyhuSV5OeEl-aVuRdFlpLMisxM4ZRqDqorf0ZySL7Ydtuef-rZOegih3qy4BJBAw__&Key-Pair-Id=K38HBHX5LX3X2H',
    female:'https://files2.heygen.ai/aws_pacific/avatar_tmp/969e7dea31614703a4c738c751f0195f/8c396922b110ea1a7a59411a8d8e1fa5.mp4?Expires=1788811604&Signature=RnGhwBkMar1aRLlWpBZiTgwP3h1v88ui~7PiEZ6Y749UqGprJ3kpFFBGeB01e1jj0ueq3BizEtSdZA2txmct5erxXGJ6OZZMyTnr3Ni8z6hMS0b57KXAlKDBy2FFiNp2~LXHk4nK3U7isPFP5PYdSqgnGHdCUwsxdWjCLwMTHBZqQ6rrDZlwDgWqLxOe8PijtH1I5cryEYtPpzaat7JoS6ZGjB0pAYMrX7Eqoqe0y5yuQfGXHX4nFN4jfh7S01YpCEEH5JVtHLyBfardRvF8FIpbaVGj7LW56usa6Crbi8g82cBh8ea5gF9CkP4YfQTA6NtRQXOC3PaLDRrQdFmPHw__&Key-Pair-Id=K38HBHX5LX3X2H'
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
