export const documentIntakeLanguages=Object.freeze([
  {key:'de',label:'Deutsch',locale:'de-DE'},
  {key:'en',label:'English',locale:'en-US'},
  {key:'pl',label:'Polski',locale:'pl-PL'},
  {key:'tr',label:'Türkçe',locale:'tr-TR'},
  {key:'ru',label:'Русский',locale:'ru-RU'},
  {key:'ar',label:'العربية',locale:'ar-SA'},
  {key:'fr',label:'Français',locale:'fr-FR'},
  {key:'fa',label:'فارسی',locale:'fa-IR'},
  {key:'ro',label:'Română',locale:'ro-RO'},
  {key:'bg',label:'Български',locale:'bg-BG'},
  {key:'vi',label:'Tiếng Việt',locale:'vi-VN'}
])

export function localeForIntakeLanguage(language){
  return documentIntakeLanguages.find(item=>item.key===language)?.locale||'de-DE'
}
