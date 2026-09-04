import { LANGUAGE_CATALOG, languageByKey, isSupportedLanguage } from './languageRegistry.mjs'

export const LANGUAGE_MODULE_REGISTRY_VERSION='v90'

export const LANGUAGE_MODULE_CAPABILITIES=Object.freeze([
  'interface_texts',
  'document_translation',
  'document_explanation',
  'next_step_explanation',
  'customer_copy',
  'cross_country_explanation'
])

export const LANGUAGE_MODULES=Object.freeze(
  LANGUAGE_CATALOG.map(language=>Object.freeze({
    key:language.key,
    label:language.label,
    locale:language.locale,
    rtl:language.rtl,
    direction:language.rtl?'rtl':'ltr',
    capabilities:[...LANGUAGE_MODULE_CAPABILITIES],
    independent_from_country:true,
    may_change_home_country:false,
    may_change_target_country:false
  }))
)

export function languageModuleByKey(key){
  if(!isSupportedLanguage(key)) return LANGUAGE_MODULES[0]
  return LANGUAGE_MODULES.find(module=>module.key===key)||LANGUAGE_MODULES[0]
}

export function createLanguageModuleContext({language='de',homeCountry=null,targetCountry=null}={}){
  const module=languageModuleByKey(language)
  return {
    version:LANGUAGE_MODULE_REGISTRY_VERSION,
    language:module.key,
    label:module.label,
    locale:module.locale,
    direction:module.direction,
    home_country:homeCountry,
    target_country:targetCountry,
    rule:'Changing the language module changes only language/output behaviour. It must never change home country or target country.'
  }
}

export function languageModuleRegistryContract(){
  return {
    version:LANGUAGE_MODULE_REGISTRY_VERSION,
    modules:LANGUAGE_MODULES.map(({key,label,locale,rtl,direction})=>({key,label,locale,rtl,direction})),
    oneModulePerLanguage:true,
    independentFromCountry:true,
    capabilities:[...LANGUAGE_MODULE_CAPABILITIES]
  }
}
