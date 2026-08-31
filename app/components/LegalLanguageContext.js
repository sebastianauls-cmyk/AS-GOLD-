'use client'

import { createContext, useContext } from 'react'

export const LegalLanguageContext=createContext('de')
export function useLegalLanguage(){ return useContext(LegalLanguageContext) }
