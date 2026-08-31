import {supportedLanguages,rtlLanguages,localeForLanguage,outputLanguageNames,pageTranslations as v35PageTranslations} from './v35Languages.mjs'
import {extraPageTranslations} from './v35RoBgExtras.mjs'

export {supportedLanguages,rtlLanguages,localeForLanguage,outputLanguageNames}
export const pageTranslations={}
for(const key of new Set([...Object.keys(v35PageTranslations),...Object.keys(extraPageTranslations)])) pageTranslations[key]={...(v35PageTranslations[key]||{}),...(extraPageTranslations[key]||{})}
