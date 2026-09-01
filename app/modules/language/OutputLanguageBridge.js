'use client'

import { useEffect } from 'react'
import { readOutputLanguage, withOutputLanguage } from './outputLanguage'

export function OutputLanguageBridge(){
  useEffect(()=>{
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
    return()=>{window.fetch=originalFetch}
  },[])
  return null
}

export const V45OutputLanguageBridge=OutputLanguageBridge
