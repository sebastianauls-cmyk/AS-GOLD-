'use client'

import { useEffect, useRef, useState } from 'react'
import { getExplainerVideo, LEGACY_VIDEO_PRESENTER_STORAGE_KEY, VIDEO_PRESENTER_STORAGE_KEY } from './explainerVideoCatalogV133.mjs'

const languages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],
  ['pl','🇵🇱','Polski'],['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی'],
  ['ro','🇷🇴','Română'],['bg','🇧🇬','Български'],['vi','🇻🇳','Tiếng Việt']
]

const copy={
  de:{title:'ASH Workspace Gold kurz erklärt',lead:'Das aktuelle Erklärvideo zum neuesten ASH-Workspace-Gold-Stand.',language:'Videosprache',voice:'Video-Ausgabe',female:'Weiblich',male:'Männlich',loading:'Video wird geladen …',show:'▶ ASH Workspace Gold in etwa 2 Minuten ansehen',hide:'Video schließen'},
  en:{title:'ASH Workspace Gold explained briefly',lead:'The current explainer video for the latest ASH Workspace Gold version.',language:'Video language',voice:'Presenter',female:'Female',male:'Male',loading:'Loading video …',show:'▶ Watch ASH Workspace Gold in about 2 minutes',hide:'Close video'},
  fr:{title:'ASH Workspace Gold expliqué brièvement',lead:'La vidéo explicative actuelle de la dernière version d’ASH Workspace Gold.',language:'Langue de la vidéo',voice:'Présentation',female:'Femme',male:'Homme',loading:'Chargement de la vidéo …',show:'▶ Voir ASH Workspace Gold en environ 2 minutes',hide:'Fermer la vidéo'},
  tr:{title:'ASH Workspace Gold kısaca anlatılıyor',lead:'En güncel ASH Workspace Gold sürümünün açıklayıcı videosu.',language:'Video dili',voice:'Video sunumu',female:'Kadın',male:'Erkek',loading:'Video yükleniyor …',show:'▶ ASH Workspace Gold’u yaklaşık 2 dakikada izleyin',hide:'Videoyu kapat'},
  pl:{title:'ASH Workspace Gold w skrócie',lead:'Aktualny film objaśniający najnowszą wersję ASH Workspace Gold.',language:'Język filmu',voice:'Prowadzący',female:'Kobieta',male:'Mężczyzna',loading:'Ładowanie filmu …',show:'▶ Zobacz ASH Workspace Gold w około 2 minuty',hide:'Zamknij film'},
  ru:{title:'ASH Workspace Gold — краткое объяснение',lead:'Актуальное объясняющее видео для последней версии ASH Workspace Gold.',language:'Язык видео',voice:'Ведущий',female:'Женщина',male:'Мужчина',loading:'Видео загружается …',show:'▶ Посмотреть ASH Workspace Gold примерно за 2 минуты',hide:'Закрыть видео'},
  ar:{title:'شرح مختصر لـ ASH Workspace Gold',lead:'الفيديو التوضيحي الحالي لأحدث إصدار من ASH Workspace Gold.',language:'لغة الفيديو',voice:'مقدم الفيديو',female:'امرأة',male:'رجل',loading:'جارٍ تحميل الفيديو …',show:'▶ شاهد ASH Workspace Gold في نحو دقيقتين',hide:'إغلاق الفيديو'},
  fa:{title:'معرفی کوتاه ASH Workspace Gold',lead:'ویدیوی توضیحی فعلی برای جدیدترین نسخه ASH Workspace Gold.',language:'زبان ویدیو',voice:'ارائه‌دهنده ویدیو',female:'زن',male:'مرد',loading:'در حال بارگذاری ویدیو …',show:'▶ ASH Workspace Gold را در حدود ۲ دقیقه ببینید',hide:'بستن ویدیو'},
  ro:{title:'ASH Workspace Gold explicat pe scurt',lead:'Videoclipul explicativ actual pentru cea mai nouă versiune ASH Workspace Gold.',language:'Limba videoclipului',voice:'Prezentator',female:'Femeie',male:'Bărbat',loading:'Se încarcă videoclipul …',show:'▶ Vedeți ASH Workspace Gold în aproximativ 2 minute',hide:'Închideți videoclipul'},
  bg:{title:'ASH Workspace Gold накратко',lead:'Актуалното обяснително видео за най-новата версия на ASH Workspace Gold.',language:'Език на видеото',voice:'Водещ',female:'Жена',male:'Мъж',loading:'Видеото се зарежда …',show:'▶ Вижте ASH Workspace Gold за около 2 минути',hide:'Затворете видеото'},
  vi:{title:'Giới thiệu ngắn về ASH Workspace Gold',lead:'Video giải thích hiện tại cho phiên bản ASH Workspace Gold mới nhất.',language:'Ngôn ngữ video',voice:'Người thuyết trình',female:'Nữ',male:'Nam',loading:'Đang tải video …',show:'▶ Xem ASH Workspace Gold trong khoảng 2 phút',hide:'Đóng video'}
}

export function ExplainerVideo({language='de',openSignal=0}){
  const [videoLanguage,setVideoLanguage]=useState(language)
  const [presenter,setPresenter]=useState('female')
  const [open,setOpen]=useState(false)
  const sectionRef=useRef(null)
  const videoRef=useRef(null)
  useEffect(()=>{
    const savedPresenter=localStorage.getItem(VIDEO_PRESENTER_STORAGE_KEY)||localStorage.getItem(LEGACY_VIDEO_PRESENTER_STORAGE_KEY)
    if(savedPresenter==='male'||savedPresenter==='female') setPresenter(savedPresenter)
  },[])
  useEffect(()=>{if(languages.some(([code])=>code===language))setVideoLanguage(language)},[language])
  useEffect(()=>{localStorage.setItem(VIDEO_PRESENTER_STORAGE_KEY,presenter)},[presenter])
  useEffect(()=>{
    if(openSignal<=0)return
    const selectedPresenter=localStorage.getItem(VIDEO_PRESENTER_STORAGE_KEY)||localStorage.getItem(LEGACY_VIDEO_PRESENTER_STORAGE_KEY)
    if(selectedPresenter==='male'||selectedPresenter==='female')setPresenter(selectedPresenter)
    setOpen(true)
  },[openSignal])
  useEffect(()=>{
    if(!open)return
    const frame=requestAnimationFrame(()=>{
      sectionRef.current?.scrollIntoView({behavior:'smooth',block:'start'})
      const playback=videoRef.current?.play()
      playback?.catch(()=>{})
    })
    return()=>cancelAnimationFrame(frame)
  },[open,openSignal,videoLanguage,presenter])
  const c=copy[language]||copy.de
  const rtl=language==='ar'||language==='fa'
  const selectedVideo=getExplainerVideo(videoLanguage,presenter)
  const buttonStyle=active=>({flex:'1 1 150px',minHeight:46,padding:'10px 14px',border:active?'2px solid #8f6e25':'1px solid #d8d1bd',borderRadius:12,background:active?'#fff6d8':'#fff',color:'#4d3b14',fontWeight:900,cursor:'pointer'})
  return (<section ref={sectionRef} data-explainer-video-section dir={rtl?'rtl':'ltr'} style={{margin:'12px 0 10px',padding:open?16:10,border:'1px solid #d9c792',borderRadius:16,background:'#fff'}}>
    {!open?<button type='button' onClick={()=>setOpen(true)} aria-expanded='false' style={{width:'100%',padding:'12px 14px',border:0,borderRadius:11,background:'#fff8df',color:'#5b4618',fontWeight:900,fontSize:'1rem',cursor:'pointer'}}>{c.show}</button>:<>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'start'}}><div><b style={{display:'block',fontSize:'1.2rem',color:'#4d3b14'}}>{c.title}</b><p style={{margin:'5px 0 12px',color:'#596472'}}>{c.lead}</p></div><button type='button' onClick={()=>{videoRef.current?.pause();setOpen(false)}} aria-expanded='true' style={{border:'1px solid #d8d1bd',background:'#fff',borderRadius:10,padding:'7px 9px',cursor:'pointer'}}>{c.hide}</button></div>
      <label style={{display:'grid',gap:5,fontWeight:800,color:'#5d4a1e',maxWidth:340,marginBottom:12}}>{c.language}<select value={videoLanguage} onChange={e=>setVideoLanguage(e.target.value)} style={{padding:'10px 11px',border:'1px solid #d8d1bd',borderRadius:11,background:'#fff'}}>{languages.map(([code,flag,label])=><option value={code} key={code}>{flag} {label}</option>)}</select></label>
      <b style={{display:'block',marginBottom:6,color:'#5d4a1e'}}>{c.voice}</b><div role='group' aria-label={c.voice} style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}><button type='button' aria-pressed={presenter==='female'} onClick={()=>setPresenter('female')} style={buttonStyle(presenter==='female')}>👩 {c.female}</button><button type='button' aria-pressed={presenter==='male'} onClick={()=>setPresenter('male')} style={buttonStyle(presenter==='male')}>👨 {c.male}</button></div>
      <video ref={videoRef} data-explainer-video key={`${videoLanguage}-${presenter}`} controls playsInline autoPlay={open} preload='metadata' style={{display:'block',width:'100%',borderRadius:14,background:'#151515',aspectRatio:'16 / 9'}}><source src={selectedVideo.src} type='video/mp4'/><track src={selectedVideo.captions} kind='subtitles' srcLang={videoLanguage} label={languages.find(([code])=>code===videoLanguage)?.[2]||videoLanguage} default/>{c.loading}</video>
    </>}
  </section>)
}
