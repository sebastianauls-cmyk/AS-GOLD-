'use client'

import { useEffect } from 'react'

function clickTextButton(pattern){
  const buttons=[...document.querySelectorAll('button')]
  const target=buttons.find(button=>pattern.test((button.textContent||'').trim()))
  if(target){target.click();return true}
  return false
}

function ensureGerman(){
  const triggers=[...document.querySelectorAll('button[aria-haspopup="listbox"]')]
  const languageTrigger=triggers.find(button=>/Sprache|Language|Dil|Język|Язык|اللغة|زبان|Limb|Език/i.test(button.getAttribute('aria-label')||button.textContent||''))
  if(!languageTrigger)return false
  if(!languageTrigger.getAttribute('aria-expanded')?.includes('true'))languageTrigger.click()
  setTimeout(()=>{
    const german=[...document.querySelectorAll('[role="option"],button')].find(button=>/Deutsch/.test(button.getAttribute('aria-label')||button.textContent||''))
    german?.click()
  },80)
  return true
}

export function V43VisibilityFix(){
  useEffect(()=>{
    if(location.pathname!=='/')return
    let bar=document.getElementById('asgold-v43-visible-controls')
    if(!bar){
      bar=document.createElement('div')
      bar.id='asgold-v43-visible-controls'
      bar.setAttribute('data-v43-visible-controls','true')
      bar.innerHTML='<button type="button" data-v43-back>← Zurück</button><button type="button" data-v43-german>🇩🇪 Deutsch</button><button type="button" data-v43-video>▶ Erklärvideo</button>'
      document.body.appendChild(bar)
    }
    const style=document.createElement('style')
    style.id='asgold-v43-visible-controls-style'
    style.textContent=`#asgold-v43-visible-controls{position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px;border:1px solid #c9ad66;border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 8px 30px rgba(20,24,30,.18)}#asgold-v43-visible-controls button{min-height:46px;padding:9px 13px;border-radius:10px;border:1px solid #c9ad66;background:#fff;color:#2f291b;font-weight:900;font-size:.95rem}#asgold-v43-visible-controls [data-v43-video]{background:#2f291b;color:#fff}@media(min-width:900px){#asgold-v43-visible-controls{left:auto;right:18px;bottom:18px;width:auto}}`
    document.head.appendChild(style)
    const back=bar.querySelector('[data-v43-back]')
    const german=bar.querySelector('[data-v43-german]')
    const video=bar.querySelector('[data-v43-video]')
    back.onclick=()=>{if(history.length>1)history.back();else location.href='/'}
    german.onclick=()=>{if(!ensureGerman())location.href='/?lang=de'}
    video.onclick=()=>{
      const opened=clickTextButton(/AS Gold in 90 Sekunden|Watch AS Gold|Erklärvideo|Explainer video|Vidéo explicative|Tanıtım videosu|Film objaśniający|Объясняющее видео|فيديو توضيحي|ویدیوی توضیحی|Videoclip explicativ|Обяснително видео/i)
      if(!opened){
        const fallback=document.querySelector('#asgold-explainer-video-slot button')
        fallback?.click()
      }
      setTimeout(()=>document.querySelector('#asgold-explainer-video-slot,video')?.scrollIntoView({behavior:'smooth',block:'center'}),120)
    }
    return()=>{bar.remove();style.remove()}
  },[])
  return null
}
