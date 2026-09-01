'use client'

import { useEffect } from 'react'

const backPattern=/^(?:←\s*)?(Zurück|Back|Retour|Geri|Wstecz|Назад|رجوع|بازگشت|Înapoi)$/i
const germanPattern=/Deutsch/i
const videoPattern=/AS Gold in 90 Sekunden|Watch AS Gold|Erklärvideo|Explainer video|Vidéo explicative|Tanıtım videosu|Film objaśniający|Объясняющее видео|فيديو توضيحي|ویدیوی توضیحی|Videoclip explicativ|Обяснително видео/i

function textOf(element){return (element?.getAttribute?.('aria-label')||element?.textContent||'').trim()}
function outsideFallback(selector){return [...document.querySelectorAll(selector)].filter(el=>!el.closest('#asgold-v43-visible-controls'))}
function findControl(pattern){return outsideFallback('button,a').find(el=>pattern.test(textOf(el)))}

function goBack(){
  if(history.length>1)history.back()
  else location.href='/'
}

function enhanceNativeBack(){
  const nativeBack=findControl(backPattern)
  if(!nativeBack||nativeBack.dataset.asgoldBackEnhanced==='true')return !!nativeBack
  nativeBack.dataset.asgoldBackEnhanced='true'
  nativeBack.addEventListener('click',event=>{
    event.preventDefault()
    event.stopPropagation()
    goBack()
  },true)
  return true
}

function ensureGerman(){
  const nativeGerman=findControl(germanPattern)
  if(nativeGerman){nativeGerman.click();return true}
  const triggers=[...document.querySelectorAll('button[aria-haspopup="listbox"]')]
  const languageTrigger=triggers.find(button=>/Sprache|Language|Dil|Język|Язык|اللغة|زبان|Limb|Език/i.test(textOf(button)))
  if(!languageTrigger)return false
  if(languageTrigger.getAttribute('aria-expanded')!=='true')languageTrigger.click()
  setTimeout(()=>findControl(germanPattern)?.click(),80)
  return true
}

function openVideo(){
  const nativeVideo=findControl(videoPattern)
  if(nativeVideo){nativeVideo.click();return true}
  const fallback=document.querySelector('#asgold-explainer-video-slot button')
  fallback?.click()
  setTimeout(()=>document.querySelector('#asgold-explainer-video-slot,video')?.scrollIntoView({behavior:'smooth',block:'center'}),120)
  return !!fallback
}

function fallbackButton(type,label){
  const button=document.createElement('button')
  button.type='button'
  button.dataset[`v46${type}`]='true'
  button.textContent=label
  return button
}

function reconcile(){
  if(location.pathname!=='/')return
  const hasBack=enhanceNativeBack()
  const hasGerman=!!findControl(germanPattern)
  const hasVideo=!!findControl(videoPattern)

  let bar=document.getElementById('asgold-v43-visible-controls')
  if(!bar){
    bar=document.createElement('div')
    bar.id='asgold-v43-visible-controls'
    bar.setAttribute('data-v43-visible-controls','true')
    bar.setAttribute('data-v46-fallback-controls','true')
    document.body.appendChild(bar)
  }
  bar.replaceChildren()

  if(!hasBack){
    const back=fallbackButton('Back','← Zurück')
    back.onclick=goBack
    bar.appendChild(back)
  }
  if(!hasGerman){
    const german=fallbackButton('German','🇩🇪 Deutsch')
    german.onclick=()=>{if(!ensureGerman())location.href='/?lang=de'}
    bar.appendChild(german)
  }
  if(!hasVideo){
    const video=fallbackButton('Video','▶ Erklärvideo')
    video.onclick=openVideo
    bar.appendChild(video)
  }
  bar.hidden=bar.childElementCount===0
}

export function V43VisibilityFix(){
  useEffect(()=>{
    if(location.pathname!=='/')return
    let timer
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(reconcile,40)}
    reconcile()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-expanded','aria-label']})

    let style=document.getElementById('asgold-v43-visible-controls-style')
    if(!style){
      style=document.createElement('style')
      style.id='asgold-v43-visible-controls-style'
      style.textContent=`#asgold-v43-visible-controls[hidden]{display:none!important}#asgold-v43-visible-controls{position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px;border:1px solid #c9ad66;border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 8px 30px rgba(20,24,30,.18)}#asgold-v43-visible-controls button{min-height:46px;padding:9px 13px;border-radius:10px;border:1px solid #c9ad66;background:#fff;color:#2f291b;font-weight:900;font-size:.95rem}#asgold-v43-visible-controls [data-v46-video]{background:#2f291b;color:#fff}@media(min-width:900px){#asgold-v43-visible-controls{left:auto;right:18px;bottom:18px;width:auto}}`
      document.head.appendChild(style)
    }

    return()=>{
      clearTimeout(timer)
      observer.disconnect()
      document.getElementById('asgold-v43-visible-controls')?.remove()
    }
  },[])
  return null
}
