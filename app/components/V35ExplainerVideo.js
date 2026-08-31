'use client'

import { useEffect, useRef, useState } from 'react'

const videoByLanguage = {
  de: 'https://resource2.heygen.ai/video_translate/6b18109b292448afb9fedf930f8ccdbb-de/original.mp4',
  en: 'https://resource2.heygen.ai/video_translate/3ccf94ed801641f585cd0620cc97de38-en/original.mp4',
  fr: 'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-fr/original.mp4',
  tr: 'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-tr/original.mp4',
  pl: 'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-pl/original.mp4',
  ru: 'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ru/original.mp4',
  ar: 'https://resource2.heygen.ai/video_translate/612b49a63cc9445b91024a45151c6446-ar/original.mp4',
  fa: 'https://resource2.heygen.ai/video_translate/4378b94dc0e84ad598a3742c105bbda7-fa_fa-IR/original.mp4',
  ro: 'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-ro/original.mp4',
  bg: 'https://resource2.heygen.ai/video_translate/57f2030d6e6c433997d8627f4c3f5902-bg/original.mp4'
}

const copy = {
  de:{button:'Erklärvideo',title:'AS Gold kurz erklärt',close:'Schließen'},
  en:{button:'Explainer video',title:'AS Gold explained briefly',close:'Close'},
  fr:{button:'Vidéo explicative',title:'AS Gold expliqué brièvement',close:'Fermer'},
  tr:{button:'Tanıtım videosu',title:'AS Gold kısaca anlatılıyor',close:'Kapat'},
  pl:{button:'Film objaśniający',title:'AS Gold w skrócie',close:'Zamknij'},
  ru:{button:'Объясняющее видео',title:'AS Gold — краткое объяснение',close:'Закрыть'},
  ar:{button:'فيديو توضيحي',title:'شرح مختصر لـ AS Gold',close:'إغلاق'},
  fa:{button:'ویدیوی توضیحی',title:'معرفی کوتاه AS Gold',close:'بستن'},
  ro:{button:'Videoclip explicativ',title:'AS Gold explicat pe scurt',close:'Închide'},
  bg:{button:'Обяснително видео',title:'AS Gold накратко',close:'Затвори'}
}

export function V35ExplainerVideo({language='de'}){
  const [open,setOpen]=useState(false)
  const dialogRef=useRef(null)
  const languageKey=videoByLanguage[language]?language:'de'
  const text=copy[languageKey]||copy.de
  const videoUrl=videoByLanguage[languageKey]

  useEffect(()=>{
    if(!open) return
    const previous=document.activeElement
    const onKeyDown=event=>{if(event.key==='Escape') setOpen(false)}
    document.addEventListener('keydown',onKeyDown)
    dialogRef.current?.focus()
    return ()=>{
      document.removeEventListener('keydown',onKeyDown)
      previous?.focus?.()
    }
  },[open])

  return <>
    <button
      type="button"
      onClick={()=>setOpen(true)}
      aria-haspopup="dialog"
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'7px',minHeight:'46px',padding:'8px 12px',border:'1px solid #c9ad66',borderRadius:'12px',background:'#2f291b',color:'#fff',fontWeight:850,boxShadow:'0 4px 14px rgba(27,31,37,.10)',whiteSpace:'nowrap'}}
    >
      <span aria-hidden="true">▶</span><span>{text.button}</span>
    </button>
    {open&&<div
      role="presentation"
      onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}
      style={{position:'fixed',inset:0,zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'18px',background:'rgba(15,18,22,.72)'}}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
        tabIndex={-1}
        style={{width:'min(920px,100%)',maxHeight:'calc(100dvh - 36px)',overflow:'auto',background:'#fff',borderRadius:'18px',boxShadow:'0 22px 70px rgba(0,0,0,.34)',padding:'14px',outline:'none'}}
      >
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'2px 2px 12px'}}>
          <strong style={{fontSize:'1.05rem'}}>{text.title}</strong>
          <button type="button" onClick={()=>setOpen(false)} aria-label={text.close} style={{border:'1px solid #d8dbe0',borderRadius:'10px',background:'#fff',padding:'8px 11px',fontWeight:800}}>✕ {text.close}</button>
        </div>
        <video key={videoUrl} src={videoUrl} controls autoPlay playsInline preload="metadata" style={{display:'block',width:'100%',height:'auto',borderRadius:'12px',background:'#000'}}/>
      </section>
    </div>}
  </>
}

export { videoByLanguage as v35ExplainerVideos }
