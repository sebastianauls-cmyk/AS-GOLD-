export const OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'
export const OUTPUT_LANGUAGES=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
const supported=new Set(OUTPUT_LANGUAGES)

export const outputLanguageLabels={de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български',vi:'Tiếng Việt'}

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
