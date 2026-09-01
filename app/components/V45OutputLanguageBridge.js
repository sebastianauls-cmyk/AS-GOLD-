'use client'

import { useEffect } from 'react'

const supported=new Set(['de','en','fr','tr','pl','ru','ar','fa','ro','bg'])
const names={de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български'}

export function V45OutputLanguageBridge(){
  useEffect(()=>{
    let last=''
    const originalFetch=window.fetch.bind(window)
    window.fetch=async(input,init={})=>{
      try{
        const url=typeof input==='string'?input:input?.url||''
        if(url.includes('/functions/v1/gold-ocr-v28')&&init?.body){
          const parsed=typeof init.body==='string'?JSON.parse(init.body):null
          if(parsed&&typeof parsed==='object'){
            const value=localStorage.getItem('asgold-output-language')||'de'
            parsed.output_language=supported.has(value)?value:'de'
            init={...init,body:JSON.stringify(parsed)}
          }
        }
      }catch{}
      return originalFetch(input,init)
    }
    const sync=()=>{
      const value=localStorage.getItem('asgold-output-language')||'de'
      const lang=supported.has(value)?value:'de'
      if(lang===last)return
      last=lang
      document.documentElement.dataset.outputLanguage=lang
      document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:lang}}))
      const reactStatus=document.querySelector('[data-output-language-status]')
      let badge=document.querySelector('[data-v45-output-language]')
      const host=document.querySelector('.legalMarketBar .wrap')||document.querySelector('.appHeaderTools')
      if(reactStatus){
        badge?.remove()
      }else if(host){
        if(!badge){badge=document.createElement('span');badge.dataset.v45OutputLanguage='true';badge.className='legalChip';host.appendChild(badge)}
        badge.textContent=`Ausgabe: ${names[lang]||lang}`
      }
    }
    sync()
    const timer=setInterval(sync,300)
    return()=>{clearInterval(timer);window.fetch=originalFetch;document.querySelector('[data-v45-output-language]')?.remove();delete document.documentElement.dataset.outputLanguage}
  },[])
  return null
}
