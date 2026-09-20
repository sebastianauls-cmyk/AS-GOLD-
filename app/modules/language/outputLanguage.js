import {LANGUAGE_CATALOG} from './languageRegistry.mjs'
export const OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'
export const OUTPUT_LANGUAGES=LANGUAGE_CATALOG.map(language=>language.key)
const supported=new Set(OUTPUT_LANGUAGES)

export const outputLanguageLabels=Object.fromEntries(LANGUAGE_CATALOG.map(({key,label})=>[key,label]))

export function normalizeOutputLanguage(value){return supported.has(value)?value:'de'}

export function readOutputLanguage(storage=globalThis?.localStorage){
  try{return normalizeOutputLanguage(storage?.getItem(OUTPUT_LANGUAGE_STORAGE_KEY)||'de')}catch{return 'de'}
}

export function writeOutputLanguage(language,storage=globalThis?.localStorage){
  const normalized=normalizeOutputLanguage(language)
  try{storage?.setItem(OUTPUT_LANGUAGE_STORAGE_KEY,normalized)}catch{}
  return normalized
}

export function withOutputLanguage(payload,language){
  return {...payload,output_language:normalizeOutputLanguage(language)}
}
