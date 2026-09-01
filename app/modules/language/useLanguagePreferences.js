'use client'

import { useEffect, useState } from 'react'
import { rtlLanguages, supportedLanguages } from './v36Languages.mjs'

const interfaceLanguageKey='asgold-language'
const outputLanguageKey='asgold-output-language'

function isSupportedLanguage(value){
  return supportedLanguages.some(item=>item.key===value)
}

export function useLanguagePreferences(){
  const [language,setLanguage]=useState('de')
  const [outputLanguage,setOutputLanguage]=useState('de')

  useEffect(()=>{
    const queryLanguage=new URLSearchParams(window.location.search).get('lang')
    const savedLanguage=localStorage.getItem(interfaceLanguageKey)
    const savedOutputLanguage=localStorage.getItem(outputLanguageKey)
    if(queryLanguage&&isSupportedLanguage(queryLanguage)) setLanguage(queryLanguage)
    else if(savedLanguage&&isSupportedLanguage(savedLanguage)) setLanguage(savedLanguage)
    if(savedOutputLanguage&&isSupportedLanguage(savedOutputLanguage)) setOutputLanguage(savedOutputLanguage)
  },[])

  useEffect(()=>{
    document.documentElement.lang=language
    document.documentElement.dir=rtlLanguages.has(language)?'rtl':'ltr'
    localStorage.setItem(interfaceLanguageKey,language)
    return ()=>{ document.documentElement.dir='ltr' }
  },[language])

  useEffect(()=>{
    localStorage.setItem(outputLanguageKey,outputLanguage)
    document.documentElement.dataset.outputLanguage=outputLanguage
    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))
  },[outputLanguage])

  return {language,setLanguage,outputLanguage,setOutputLanguage}
}
