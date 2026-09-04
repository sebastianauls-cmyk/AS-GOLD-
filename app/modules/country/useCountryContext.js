'use client'

import { useEffect, useState } from 'react'
import { readCountryContext, writeCountryContext } from './countryRegistry.mjs'

export function useCountryContext(){
  const [countryContext,setCountryContextState]=useState('DE')
  useEffect(()=>{setCountryContextState(readCountryContext())},[])
  const setCountryContext=value=>setCountryContextState(writeCountryContext(value))
  return {countryContext,setCountryContext}
}
