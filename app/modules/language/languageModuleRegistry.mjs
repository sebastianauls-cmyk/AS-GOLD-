import { LANGUAGE_CATALOG, isSupportedLanguage } from './languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'

export const LANGUAGE_MODULE_REGISTRY_VERSION='v91'

export const LANGUAGE_MODULE_CAPABILITIES=Object.freeze([
  'interface_texts',
  'document_translation',
  'document_explanation',
  'next_step_explanation',
  'customer_copy',
  'cross_country_explanation',
  'legal_text_explanation',
  'entry_requirement_explanation',
  'authority_and_court_explanation'
])

export const LANGUAGE_ENRICHMENT_TOPICS=Object.freeze([
  'laws',
  'entry_requirements',
  'residence_immigration',
  'courts_authorities',
  'deadlines_procedures',
  'consumer_law',
  'employment_law',
  'insurance_law',
  'social_administration',
  'privacy_compliance'
])

export const ALL_COUNTRY_CODES=Object.freeze(COUNTRY_CATALOG.map(country=>country.key))

export const LANGUAGE_MODULES=Object.freeze(
  LANGUAGE_CATALOG.map(language=>Object.freeze({
    key:language.key,
    label:language.label,
    locale:language.locale,
    rtl:language.rtl,
    direction:language.rtl?'rtl':'ltr',
    associated_country_codes:[...(language.countryCodes||[])],
    available_country_codes:[...ALL_COUNTRY_CODES],
    capabilities:[...LANGUAGE_MODULE_CAPABILITIES],
    enrichment_topics:[...LANGUAGE_ENRICHMENT_TOPICS],
    independent_from_country:true,
    may_change_home_country:false,
    may_change_target_country:false,
    inherits_verified_country_sources:true,
    inherits_all_configured_countries:true
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
    associated_country_codes:[...module.associated_country_codes],
    available_country_codes:[...module.available_country_codes],
    home_country:homeCountry,
    target_country:targetCountry,
    enrichment_topics:[...module.enrichment_topics],
    rule:'Changing the language module changes only language/output behaviour. Every language module can use every configured country. It must never change home country or target country.'
  }
}

export function languageCountryEnrichmentPlan({language='de',homeCountry=null,targetCountry=null}={}){
  const module=languageModuleByKey(language)
  return {
    version:LANGUAGE_MODULE_REGISTRY_VERSION,
    language:module.key,
    countries:[...module.available_country_codes],
    active_home_country:homeCountry,
    active_target_country:targetCountry,
    topics:[...LANGUAGE_ENRICHMENT_TOPICS],
    source_policy:'Use verified country legal modules and official entry/immigration authority sources. Never infer legal or entry rules from language alone.',
    automatic:true
  }
}

export function enrichLanguageModuleFromCountryRecords({language='de',homeCountry=null,targetCountry=null,countryRecords=[]}={}){
  const plan=languageCountryEnrichmentPlan({language,homeCountry,targetCountry})
  const records=Array.isArray(countryRecords)?countryRecords:[]
  const byCode=new Map(records.map(record=>[String(record.country_code||'').toUpperCase(),record]))
  const countries=plan.countries.map(code=>{
    const record=byCode.get(String(code).toUpperCase())||null
    const ready=record?.status==='ready'
    return {
      country_code:code,
      ready,
      status:record?.status||'missing',
      official_sources:ready&&Array.isArray(record.official_sources)?record.official_sources:[],
      court_sources:ready&&Array.isArray(record.court_sources)?record.court_sources:[],
      authority_sources:ready&&Array.isArray(record.authority_sources)?record.authority_sources:[],
      covered_topics:ready&&Array.isArray(record.covered_topics)?record.covered_topics:[],
      entry_requirements_verified:!!record?.entry_requirements_verified,
      entry_sources:Array.isArray(record?.entry_sources)?record.entry_sources:[],
      residence_requirements_verified:!!record?.residence_requirements_verified,
      residence_sources:Array.isArray(record?.residence_sources)?record.residence_sources:[]
    }
  })
  const missing=countries.filter(country=>!country.ready||!country.entry_requirements_verified||!country.residence_requirements_verified)
  return {
    version:LANGUAGE_MODULE_REGISTRY_VERSION,
    language:plan.language,
    topics:plan.topics,
    countries,
    active_home_country:plan.active_home_country,
    active_target_country:plan.active_target_country,
    status:missing.length===0?'ready':'needs_enrichment',
    missing:missing.map(country=>({country_code:country.country_code,status:country.status,entry_requirements_verified:country.entry_requirements_verified,residence_requirements_verified:country.residence_requirements_verified})),
    rule:'Every language module contains every configured country. It may explain only verified country content; missing legal, entry or residence data must remain visibly unverified until official sources are added.'
  }
}

export function languageModuleRegistryContract(){
  return {
    version:LANGUAGE_MODULE_REGISTRY_VERSION,
    modules:LANGUAGE_MODULES.map(({key,label,locale,rtl,direction,associated_country_codes,available_country_codes})=>({key,label,locale,rtl,direction,associated_country_codes,available_country_codes})),
    oneModulePerLanguage:true,
    allCountriesPerLanguage:true,
    independentFromCountry:true,
    automaticCountryEnrichment:true,
    capabilities:[...LANGUAGE_MODULE_CAPABILITIES],
    enrichmentTopics:[...LANGUAGE_ENRICHMENT_TOPICS],
    countries:[...ALL_COUNTRY_CODES]
  }
}
