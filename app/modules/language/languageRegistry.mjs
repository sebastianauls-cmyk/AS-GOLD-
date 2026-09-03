import {
  pageTranslations as legacyPageTranslations,
  outputLanguageNames as legacyOutputLanguageNames
} from './basePageTranslations.mjs'
import { extraPageTranslations } from './roBgPageTranslations.mjs'
import { vietnamesePageTranslations } from './vietnamesePageTranslations.mjs'

// Single public language registry for the active application.
// Adding a language should be isolated here plus its translation pack; business logic must stay untouched.
export const LANGUAGE_CATALOG = Object.freeze([
  { key:'de', label:'Deutsch', short:'DE', flags:'🇩🇪', countryCodes:['DE'], locale:'de-DE', rtl:false },
  { key:'en', label:'English', short:'EN', flags:'🇬🇧 🇺🇸', countryCodes:['GB','US'], locale:'en-GB', rtl:false },
  { key:'fr', label:'Français', short:'FR', flags:'🇫🇷', countryCodes:['FR'], locale:'fr-FR', rtl:false },
  { key:'tr', label:'Türkçe', short:'TR', flags:'🇹🇷', countryCodes:['TR'], locale:'tr-TR', rtl:false },
  { key:'pl', label:'Polski', short:'PL', flags:'🇵🇱', countryCodes:['PL'], locale:'pl-PL', rtl:false },
  { key:'ru', label:'Русский', short:'RU', flags:'🇷🇺', countryCodes:['RU'], locale:'ru-RU', rtl:false },
  { key:'ar', label:'العربية', short:'AR', flags:'🇸🇦 🇦🇪', countryCodes:['SA','AE'], locale:'ar', rtl:true },
  { key:'fa', label:'فارسی', short:'FA', flags:'🇮🇷 🇦🇫', countryCodes:['IR','AF'], locale:'fa-IR', rtl:true },
  { key:'ro', label:'Română', short:'RO', flags:'🇷🇴', countryCodes:['RO'], locale:'ro-RO', rtl:false },
  { key:'bg', label:'Български', short:'BG', flags:'🇧🇬', countryCodes:['BG'], locale:'bg-BG', rtl:false },
  { key:'vi', label:'Tiếng Việt', short:'VI', flags:'🇻🇳', countryCodes:['VN'], locale:'vi-VN', rtl:false }
])

export const supportedLanguages = LANGUAGE_CATALOG.map(({locale,rtl,...language})=>language)
export const rtlLanguages = new Set(LANGUAGE_CATALOG.filter(language=>language.rtl).map(language=>language.key))
export const localeForLanguage = Object.fromEntries(LANGUAGE_CATALOG.map(language=>[language.key,language.locale]))
export const outputLanguageNames = legacyOutputLanguageNames

export const pageTranslations={}
for(const key of new Set([
  ...Object.keys(legacyPageTranslations),
  ...Object.keys(extraPageTranslations),
  ...Object.keys(vietnamesePageTranslations)
])){
  pageTranslations[key]={
    ...(legacyPageTranslations[key]||{}),
    ...(extraPageTranslations[key]||{}),
    ...(vietnamesePageTranslations[key]===undefined?{}:{vi:vietnamesePageTranslations[key]})
  }
}

export function languageByKey(key){
  return LANGUAGE_CATALOG.find(language=>language.key===key)||LANGUAGE_CATALOG[0]
}

export function isSupportedLanguage(key){
  return LANGUAGE_CATALOG.some(language=>language.key===key)
}
