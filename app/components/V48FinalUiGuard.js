'use client'

import { useEffect } from 'react'

const backPattern=/^(?:←\s*)?(Zurück|Back|Retour|Geri|Wstecz|Назад|رجوع|بازگشت|Înapoi)$/i
const germanPattern=/^(?:🇩🇪\s*)?Deutsch$/i
const videoPattern=/AS Gold in 90 Sekunden|Watch AS Gold|Erklärvideo|Explainer video|Vidéo explicative|Tanıtım videosu|Film objaśniający|Объясняющее видео|فيديو توضيحي|ویدیوی توضیحی|Videoclip explicativ|Обяснително видео/i
const processingPattern=/männliche Fassung.*verarbeitet|male version.*processed|version masculine.*cours de traitement|erkek.*hazırlanıyor|męska wersja.*przetwarzana|мужская версия.*обрабатывается|النسخة الرجالية.*المعالجة|نسخه مردانه.*پردازش|versiunea masculină.*procesare|мъжката версия.*обработва/i

function label(el){return (el.getAttribute?.('aria-label')||el.textContent||'').trim()}
function candidates(pattern){return [...document.querySelectorAll('button,a')].filter(el=>pattern.test(label(el)))}

function keepSingle(pattern){
  const items=candidates(pattern).filter(el=>!el.hidden&&getComputedStyle(el).display!=='none')
  if(items.length<=1)return
  const preferred=items.find(el=>!el.closest('#asgold-v43-visible-controls'))||items[0]
  items.forEach(el=>{
    if(el===preferred)return
    el.dataset.v48DuplicateHidden='true'
    el.style.setProperty('display','none','important')
    el.setAttribute('aria-hidden','true')
    el.tabIndex=-1
  })
}

function removeStaleVideoProcessingNotice(){
  const root=document.getElementById('asgold-explainer-video-slot')
  if(!root)return
  root.querySelectorAll('p').forEach(p=>{
    if(processingPattern.test((p.textContent||'').trim())){
      p.dataset.v48StaleVideoNotice='true'
      p.hidden=true
    }
  })
}

function reconcile(){
  if(location.pathname!=='/')return
  keepSingle(backPattern)
  keepSingle(germanPattern)
  keepSingle(videoPattern)
  removeStaleVideoProcessingNotice()
}

export function V48FinalUiGuard(){
  useEffect(()=>{
    if(location.pathname!=='/')return
    let timer
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(reconcile,60)}
    reconcile()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-expanded','aria-label','hidden']})
    return()=>{clearTimeout(timer);observer.disconnect()}
  },[])
  return null
}
