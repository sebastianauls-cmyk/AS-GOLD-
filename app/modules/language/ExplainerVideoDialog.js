'use client'

import { getExplainerVideo } from '../public/explainerVideoCatalogV133.mjs'

const videoLanguages=[
  ['de','🇩🇪','Deutsch'],['en','🇬🇧','English'],['fr','🇫🇷','Français'],['tr','🇹🇷','Türkçe'],['pl','🇵🇱','Polski'],
  ['ru','🇷🇺','Русский'],['ar','🇸🇦','العربية'],['fa','🇮🇷','فارسی'],['ro','🇷🇴','Română'],['bg','🇧🇬','Български'],['vi','🇻🇳','Tiếng Việt']
]

export const videoButtonText={de:'Erklärvideo',en:'Explainer video',fr:'Vidéo explicative',tr:'Tanıtım videosu',pl:'Film objaśniający',ru:'Объясняющее видео',ar:'فيديو توضيحي',fa:'ویدیوی توضیحی',ro:'Videoclip explicativ',bg:'Обяснително видео',vi:'Video giải thích'}
const videoCloseText={de:'Schließen',en:'Close',fr:'Fermer',tr:'Kapat',pl:'Zamknij',ru:'Закрыть',ar:'إغلاق',fa:'بستن',ro:'Închide',bg:'Затвори',vi:'Đóng'}

export function ExplainerVideoDialog({language='de',videoLanguage,setVideoLanguage,presenter='female',onClose}){
  const title=videoButtonText[language]||videoButtonText.de
  const closeLabel=videoCloseText[language]||videoCloseText.de
  const selectedVideo=getExplainerVideo(videoLanguage,presenter)
  return <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} style={{position:'fixed',inset:0,zIndex:500,background:'rgba(20,24,30,.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
    <div onClick={event=>event.stopPropagation()} style={{width:'min(960px,100%)',maxHeight:'92dvh',overflow:'auto',background:'#fff',borderRadius:18,padding:14,boxShadow:'0 24px 70px rgba(0,0,0,.34)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:10}}><strong style={{fontSize:'1.05rem'}}>ASH Workspace Gold · {title}</strong><button type="button" onClick={onClose} aria-label={closeLabel} style={{border:0,background:'#eef0f2',borderRadius:999,width:36,height:36,fontSize:'1.25rem'}}>×</button></div>
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:10}}>{videoLanguages.map(([key,flag,label])=><button key={key} type="button" onClick={()=>setVideoLanguage(key)} title={label} aria-pressed={videoLanguage===key} style={{border:videoLanguage===key?'2px solid #9b792b':'1px solid #d8dbe0',background:videoLanguage===key?'#fff8e8':'#fff',borderRadius:10,padding:'7px 9px',fontWeight:800,whiteSpace:'nowrap'}}>{flag} {label}</button>)}</div>
      <video key={`${videoLanguage}-${presenter}`} controls playsInline preload="metadata" style={{display:'block',width:'100%',maxHeight:'68dvh',background:'#000',borderRadius:12}}><source src={selectedVideo.src} type="video/mp4"/><track src={selectedVideo.captions} kind="subtitles" srcLang={videoLanguage} label={videoLanguages.find(([key])=>key===videoLanguage)?.[2]||videoLanguage} default/></video>
    </div>
  </div>
}

export const explainerVideos=Object.freeze(Object.fromEntries(videoLanguages.map(([key])=>[key,getExplainerVideo(key,'female').src])))
