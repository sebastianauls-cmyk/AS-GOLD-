'use client'

import { useEffect } from 'react'

const outputLabels=['Ausgabesprache','Output language','Langue de sortie','Çıktı dili','Język wyniku','Язык результата','لغة الإخراج','زبان خروجی','Limba rezultatului','Език на резултата']

function isOutputLabel(label){
  const text=(label.textContent||'').trim()
  return outputLabels.some(name=>text.startsWith(name))
}

export function V46MobileLanguageAcceptance(){
  useEffect(()=>{
    if(location.pathname!=='/') return

    const fix=()=>{
      const interfaceRoot=document.querySelector('.flagLanguagePublicPicker')
      const outputControl=[...document.querySelectorAll('label')].find(label=>isOutputLabel(label)&&label.querySelector('button[aria-haspopup="listbox"],.flagLanguage'))
      if(!interfaceRoot||!outputControl)return

      const publicTop=interfaceRoot.closest('.publicTop')||document.querySelector('.publicTop')
      if(!publicTop)return

      let stack=document.getElementById('asgold-language-order-stack')
      if(!stack){
        stack=document.createElement('section')
        stack.id='asgold-language-order-stack'
        stack.dataset.v44LanguageOrder='true'
        stack.style.cssText='display:grid;gap:10px;width:100%;max-width:560px;margin:0 0 14px;padding:12px;border:1px solid #d9c792;border-radius:14px;background:#fffdf7;order:-50;'
        publicTop.prepend(stack)
      }

      const interfaceControl=interfaceRoot.closest('.languageSwitch')||interfaceRoot
      let first=stack.querySelector('[data-v44-interface]')
      if(!first){first=document.createElement('div');first.dataset.v44Interface='true';stack.appendChild(first)}
      if(!first.querySelector('[data-v44-title]')){
        const title=document.createElement('strong');title.dataset.v44Title='true';title.textContent='1. Sprache';title.style.cssText='display:block;margin:0 0 6px;color:#443817;font-size:.95rem';first.prepend(title)
      }
      if(interfaceControl.parentElement!==first)first.appendChild(interfaceControl)

      let second=stack.querySelector('[data-v44-output]')
      if(!second){second=document.createElement('div');second.dataset.v44Output='true';stack.appendChild(second)}
      if(!second.querySelector('[data-v44-title]')){
        const title=document.createElement('strong');title.dataset.v44Title='true';title.textContent='2. Ausgabesprache';title.style.cssText='display:block;margin:0 0 6px;color:#443817;font-size:.95rem';second.prepend(title)
      }
      if(outputControl.parentElement!==second)second.appendChild(outputControl)

      const fixed=document.getElementById('asgold-v43-visible-controls')
      const anyOpen=[...document.querySelectorAll('button[aria-haspopup="listbox"]')].some(button=>button.getAttribute('aria-expanded')==='true')
      if(fixed)fixed.style.display=anyOpen?'none':'flex'
    }

    fix()
    const observer=new MutationObserver(fix)
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded']})
    const timer=setInterval(fix,500)
    return()=>{observer.disconnect();clearInterval(timer)}
  },[])
  return null
}
