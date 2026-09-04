// Central country / jurisdiction context registry for AS Workspace Gold.
// Country context is deliberately independent from interface/output language.
// Add a new country here once; consuming workflows inherit it automatically.
export const COUNTRY_CONTEXT_STORAGE_KEY='asgold-country-context'

export const COUNTRY_CATALOG=Object.freeze([
  {key:'DE',label:'Deutschland',flag:'🇩🇪',jurisdictionLabel:'Deutschland / deutsches Recht',defaultLocale:'de-DE'},
  {key:'PL',label:'Polska',flag:'🇵🇱',jurisdictionLabel:'Polen / polnischer Rechtsraum',defaultLocale:'pl-PL'},
  {key:'FR',label:'France',flag:'🇫🇷',jurisdictionLabel:'Frankreich / französischer Rechtsraum',defaultLocale:'fr-FR'},
  {key:'TR',label:'Türkiye',flag:'🇹🇷',jurisdictionLabel:'Türkei / türkischer Rechtsraum',defaultLocale:'tr-TR'},
  {key:'GB',label:'United Kingdom',flag:'🇬🇧',jurisdictionLabel:'Vereinigtes Königreich',defaultLocale:'en-GB'},
  {key:'US',label:'United States',flag:'🇺🇸',jurisdictionLabel:'USA',defaultLocale:'en-US'},
  {key:'RU',label:'Россия',flag:'🇷🇺',jurisdictionLabel:'Russland / russischer Rechtsraum',defaultLocale:'ru-RU'},
  {key:'RO',label:'România',flag:'🇷🇴',jurisdictionLabel:'Rumänien / rumänischer Rechtsraum',defaultLocale:'ro-RO'},
  {key:'BG',label:'България',flag:'🇧🇬',jurisdictionLabel:'Bulgarien / bulgarischer Rechtsraum',defaultLocale:'bg-BG'},
  {key:'VN',label:'Việt Nam',flag:'🇻🇳',jurisdictionLabel:'Vietnam / vietnamesischer Rechtsraum',defaultLocale:'vi-VN'},
  {key:'SA',label:'السعودية',flag:'🇸🇦',jurisdictionLabel:'Saudi-Arabien',defaultLocale:'ar-SA'},
  {key:'AE',label:'الإمارات',flag:'🇦🇪',jurisdictionLabel:'Vereinigte Arabische Emirate',defaultLocale:'ar-AE'},
  {key:'IR',label:'ایران',flag:'🇮🇷',jurisdictionLabel:'Iran',defaultLocale:'fa-IR'},
  {key:'AF',label:'افغانستان',flag:'🇦🇫',jurisdictionLabel:'Afghanistan',defaultLocale:'fa-AF'}
])

const supported=new Set(COUNTRY_CATALOG.map(country=>country.key))

export function normalizeCountryContext(value){
  const key=String(value||'DE').toUpperCase()
  return supported.has(key)?key:'DE'
}

export function countryByKey(key){
  const normalized=normalizeCountryContext(key)
  return COUNTRY_CATALOG.find(country=>country.key===normalized)||COUNTRY_CATALOG[0]
}

export function readCountryContext(storage=globalThis?.localStorage){
  try{return normalizeCountryContext(storage?.getItem(COUNTRY_CONTEXT_STORAGE_KEY)||'DE')}catch{return 'DE'}
}

export function writeCountryContext(country,storage=globalThis?.localStorage){
  const normalized=normalizeCountryContext(country)
  try{storage?.setItem(COUNTRY_CONTEXT_STORAGE_KEY,normalized)}catch{}
  return normalized
}

export function countryContextContract(){
  return {defaultCountry:'DE',countries:COUNTRY_CATALOG.map(({key,label,jurisdictionLabel})=>({key,label,jurisdictionLabel}))}
}
