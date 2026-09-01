'use client'

import { useEffect } from 'react'
import { outputLanguageLabels, readOutputLanguage, withOutputLanguage } from './outputLanguage'

export function OutputLanguageBridge(){
  useEffect(()=>{
    let last=''
    const originalFetch=window.fetch.bind(window)
    window.fetch=async(input,init={})=>{
      try{
        const url=typeof input==='string'?input:input?.url||''
        if(url.includes('/functions/v1/gold-ocr-v28')&&init?.body){
          const parsed=typeof init.body==='string'?JSON.parse(init.body):null
          if(parsed&&typeof parsed==='object') init={...init,body:JSON.stringify(withOutputLanguage(parsed,readOutputLanguage()))}
        }
      }catch{}
      return originalFetch(input,init)
    }
    const sync=()=>{
      const lang=readOutputLanguage()
      if(lang===last)return
      last=lang
      document.documentElement.dataset.outputLanguage=lang
      document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:lang}}))
      let badge=document.querySelector('[data-v45-output-language]')
      const host=document.querySelector('.legalMarketBar .wrap')||document.querySelector('.appHeaderTools')
      if(host){
        if(!badge){badge=document.createElement('span');badge.dataset.v45OutputLanguage='true';badge.className='legalChip';host.appendChild(badge)}
        badge.textContent=`Ausgabe: ${outputLanguageLabels[lang]||lang}`
      }
    }
    sync()
    const timer=setInterval(sync,300)
    return()=>{clearInterval(timer);window.fetch=originalFetch;document.querySelector('[data-v45-output-language]')?.remove();delete document.documentElement.dataset.outputLanguage}
  },[])
  return null
}

export const V45OutputLanguageBridge=OutputLanguageBridge
