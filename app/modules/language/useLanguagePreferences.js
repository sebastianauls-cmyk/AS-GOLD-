'use client'

import { useEffect, useState } from 'react'
import { rtlLanguages, supportedLanguages } from './v36Languages.mjs'

const interfaceLanguageKey='asgold-language'
const outputLanguageKey='asgold-output-language'

function isSupportedLanguage(value){
  return supportedLanguages.some(item=>item.key===value)
}

export function resolveStoredPreferences({queryLanguage,savedLanguage,savedOutputLanguage}={}){
  return {
    language:queryLanguage&&isSupportedLanguage(queryLanguage)?queryLanguage:savedLanguage&&isSupportedLanguage(savedLanguage)?savedLanguage:'de',
    outputLanguage:savedOutputLanguage&&isSupportedLanguage(savedOutputLanguage)?savedOutputLanguage:'de'
  }
}

export function useLanguagePreferences(){
  const [language,setLanguage]=useState('de')
  const [outputLanguage,setOutputLanguage]=useState('de')
  const [preferencesLoaded,setPreferencesLoaded]=useState(false)

  useEffect(()=>{
    const queryLanguage=new URLSearchParams(window.location.search).get('lang')
    const savedLanguage=localStorage.getItem(interfaceLanguageKey)
    const savedOutputLanguage=localStorage.getItem(outputLanguageKey)
    const restored=resolveStoredPreferences({queryLanguage,savedLanguage,savedOutputLanguage})
    setLanguage(restored.language)
    setOutputLanguage(restored.outputLanguage)
    setPreferencesLoaded(true)
  },[])

  useEffect(()=>{
    if(!preferencesLoaded) return
    document.documentElement.lang=language
    document.documentElement.dir=rtlLanguages.has(language)?'rtl':'ltr'
    localStorage.setItem(interfaceLanguageKey,language)
    return ()=>{ document.documentElement.dir='ltr' }
  },[language,preferencesLoaded])

  useEffect(()=>{
    if(!preferencesLoaded) return
    localStorage.setItem(outputLanguageKey,outputLanguage)
    document.documentElement.dataset.outputLanguage=outputLanguage
    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))
  },[outputLanguage,preferencesLoaded])

  return {language,setLanguage,outputLanguage,setOutputLanguage}
}
