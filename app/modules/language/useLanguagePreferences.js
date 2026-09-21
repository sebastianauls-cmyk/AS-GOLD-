'use client'

import { useEffect, useState } from 'react'
import { rtlLanguages, supportedLanguages } from './v36Languages.mjs'

const interfaceLanguageKey='asgold-language'
const outputLanguageKey='asgold-output-language'

function isSupportedLanguage(value){
  return supportedLanguages.some(item=>item.key===value)
}

function readPreference(key){
  try{return localStorage.getItem(key)}catch{return null}
}

function savePreference(key,value){
  try{localStorage.setItem(key,value)}catch{}
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
    const savedLanguage=readPreference(interfaceLanguageKey)
    const savedOutputLanguage=readPreference(outputLanguageKey)
    const restored=resolveStoredPreferences({queryLanguage,savedLanguage,savedOutputLanguage})
    setLanguage(restored.language)
    setOutputLanguage(restored.outputLanguage)
    setPreferencesLoaded(true)
  },[])

  useEffect(()=>{
    if(!preferencesLoaded) return
    document.documentElement.lang=language
    document.documentElement.dir=rtlLanguages.has(language)?'rtl':'ltr'
    savePreference(interfaceLanguageKey,language)
    // A language-specific entry link must not undo a later explicit selection.
    const url=new URL(window.location.href)
    if(url.searchParams.has('lang')&&url.searchParams.get('lang')!==language){
      url.searchParams.set('lang',language)
      window.history.replaceState(window.history.state,'',`${url.pathname}${url.search}${url.hash}`)
    }
    return ()=>{ document.documentElement.dir='ltr' }
  },[language,preferencesLoaded])

  useEffect(()=>{
    if(!preferencesLoaded) return
    savePreference(outputLanguageKey,outputLanguage)
    document.documentElement.dataset.outputLanguage=outputLanguage
    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))
  },[outputLanguage,preferencesLoaded])

  return {language,setLanguage,outputLanguage,setOutputLanguage}
}
