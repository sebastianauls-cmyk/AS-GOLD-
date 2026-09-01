'use client'

import { useEffect } from 'react'

const outputLabels=['Ausgabesprache','Output language','Langue de sortie','Çıktı dili','Język wyniku','Язык результата','لغة الإخراج','زبان خروجی','Limba rezultatului','Език на резултата']
const headings={
  de:['1. Sprache der Oberfläche','2. Ausgabesprache'],
  en:['1. Interface language','2. Output language'],fr:["1. Langue de l’interface","2. Langue de sortie"],
  tr:['1. Arayüz dili','2. Çıktı dili'],pl:['1. Język interfejsu','2. Język wyniku'],
  ru:['1. Язык интерфейса','2. Язык результата'],ar:['1. لغة الواجهة','2. لغة الإخراج'],
  fa:['1. زبان رابط','2. زبان خروجی'],ro:['1. Limba interfeței','2. Limba rezultatului'],
  bg:['1. Език на интерфейса','2. Език на резултата']
}

function lang(){const v=(document.documentElement.lang||'de').toLowerCase().slice(0,2);return headings[v]?v:'de'}
function findOutputControl(){
  return [...document.querySelectorAll('label')].find(label=>{
    const text=(label.textContent||'').trim()
    return outputLabels.some(name=>text.startsWith(name)) && label.querySelector('select')
  }) || null
}

export function V44LanguageOrder(){
  useEffect(()=>{
    function arrange(){
      if(location.pathname!=='/') return
      const interfaceRoot=document.querySelector('.flagLanguagePublicPicker')
      const outputControl=findOutputControl()
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
      const texts=headings[lang()]
      let first=stack.querySelector('[data-v44-interface]')
      if(!first){first=document.createElement('div');first.dataset.v44Interface='true';stack.appendChild(first)}
      let second=stack.querySelector('[data-v44-output]')
      if(!second){second=document.createElement('div');second.dataset.v44Output='true';stack.appendChild(second)}

      let firstTitle=first.querySelector('strong[data-v44-title]')
      if(!firstTitle){firstTitle=document.createElement('strong');firstTitle.dataset.v44Title='true';firstTitle.style.cssText='display:block;margin:0 0 6px;color:#443817;font-size:.95rem';first.prepend(firstTitle)}
      firstTitle.textContent=texts[0]
      if(interfaceControl.parentElement!==first) first.appendChild(interfaceControl)

      let secondTitle=second.querySelector('strong[data-v44-title]')
      if(!secondTitle){secondTitle=document.createElement('strong');secondTitle.dataset.v44Title='true';secondTitle.style.cssText='display:block;margin:0 0 6px;color:#443817;font-size:.95rem';second.prepend(secondTitle)}
      secondTitle.textContent=texts[1]
      if(outputControl.parentElement!==second) second.appendChild(outputControl)
    }
    arrange()
    const observer=new MutationObserver(arrange)
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']})
    const timer=setInterval(arrange,900)
    return()=>{observer.disconnect();clearInterval(timer)}
  },[])
  return null
}
