'use client'

import { useEffect } from 'react'

const supported=new Set(['de','en','fr','tr','pl','ru','ar','fa','ro','bg'])
const names={de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български'}

export function V45OutputLanguageBridge(){
  useEffect(()=>{
    let last=''
    const sync=()=>{
      const value=localStorage.getItem('asgold-output-language')||'de'
      const lang=supported.has(value)?value:'de'
      if(lang===last)return
      last=lang
      document.documentElement.dataset.outputLanguage=lang
      document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:lang}}))
      let badge=document.querySelector('[data-v45-output-language]')
      const host=document.querySelector('.legalMarketBar .wrap')||document.querySelector('.appHeaderTools')
      if(host){
        if(!badge){badge=document.createElement('span');badge.dataset.v45OutputLanguage='true';badge.className='legalChip';host.appendChild(badge)}
        badge.textContent=`Ausgabe: ${names[lang]||lang}`
      }
    }
    sync()
    const timer=setInterval(sync,300)
    return()=>{clearInterval(timer);document.querySelector('[data-v45-output-language]')?.remove();delete document.documentElement.dataset.outputLanguage}
  },[])
  return null
}
