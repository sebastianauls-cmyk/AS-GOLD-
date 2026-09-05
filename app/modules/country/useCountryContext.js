'use client'

import { useEffect, useState } from 'react'
import { COUNTRY_CONTEXT_EVENT, broadcastCountryContext, readCountryContext } from './countryRegistry.mjs'

export function useCountryContext(){
  const [countryContext,setCountryContextState]=useState('DE')
  useEffect(()=>{
    const sync=event=>setCountryContextState(event?.detail||readCountryContext())
    sync()
    window.addEventListener(COUNTRY_CONTEXT_EVENT,sync)
    return()=>window.removeEventListener(COUNTRY_CONTEXT_EVENT,sync)
  },[])
  const setCountryContext=value=>setCountryContextState(broadcastCountryContext(value))
  return {countryContext,setCountryContext}
}
