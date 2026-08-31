'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const labels={
  de:'3 Dokumente kostenlos kennenlernen',
  en:'Try 3 documents for free',
  fr:'Découvrir gratuitement avec 3 documents',
  tr:'3 belgeyi ücretsiz deneyin',
  pl:'Wypróbuj 3 dokumenty bezpłatnie',
  ru:'Попробовать 3 документа бесплатно',
  ar:'جرّب 3 مستندات مجانًا',
  fa:'۳ سند را رایگان امتحان کنید'
}

export function FreeEntryAfterRecommendation(){
  const [host,setHost]=useState(null)
  const [language,setLanguage]=useState('de')

  useEffect(()=>{
    const resolve=()=>{
      if(location.pathname!=='/'){setHost(null);return}
      setLanguage((document.documentElement.lang||'de').split('-')[0])
      const nav=document.getElementById('asgold-problem-navigator-react')
      const recommendation=nav?.querySelector('article')
      setHost(recommendation||null)
    }
    resolve()
    const observer=new MutationObserver(resolve)
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['lang']})
    return ()=>observer.disconnect()
  },[])

  if(!host)return null
  const text=labels[language]||labels.en

  function startFree(){
    const existing=document.querySelector('.hero .actions .secondary.btn')||document.querySelector('.actions .secondary.btn')
    if(existing){existing.click();return}
    window.scrollTo({top:0,behavior:'smooth'})
  }

  return createPortal(
    <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #eadfbe'}}>
      <button type="button" onClick={startFree} style={{width:'100%',padding:'12px 14px',border:0,borderRadius:11,background:'#8f6e25',color:'#fff',fontWeight:900,fontSize:'1rem',cursor:'pointer'}}>
        ✓ {text}
      </button>
    </div>,
    host
  )
}
