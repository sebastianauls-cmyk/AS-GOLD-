import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import {
  LANGUAGE_MODULES,
  LANGUAGE_ENRICHMENT_TOPICS,
  createLanguageModuleContext,
  languageCountryEnrichmentPlan,
  enrichLanguageModuleFromCountryRecords,
  languageModuleRegistryContract,
  languageCountrySubmodule
} from '../app/modules/language/languageModuleRegistry.mjs'

assert.equal(LANGUAGE_MODULES.length,LANGUAGE_CATALOG.length)
assert.deepEqual(LANGUAGE_MODULES.map(item=>item.key),LANGUAGE_CATALOG.map(item=>item.key))
for(const module of LANGUAGE_MODULES){
  assert.equal(module.independent_from_country,true)
  assert.equal(module.may_change_home_country,false)
  assert.equal(module.may_change_target_country,false)
  assert.equal(module.inherits_verified_country_sources,true)
  assert.equal(module.country_submodules.length,COUNTRY_CATALOG.length)
}
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('laws'))
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('entry_requirements'))
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('residence_immigration'))

const context=createLanguageModuleContext({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.equal(context.language,'pl')
assert.equal(context.home_country,'PL')
assert.equal(context.target_country,'TR')
assert.equal(context.country_submodules.length,COUNTRY_CATALOG.length)
assert.match(context.rule,/never change home country or target country/i)

const plan=languageCountryEnrichmentPlan({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.ok(plan.countries.includes('PL'))
assert.ok(plan.countries.includes('TR'))
assert.equal(plan.country_submodules.length,COUNTRY_CATALOG.length)
assert.equal(plan.automatic,true)

const turkiyeInsidePolish=languageCountrySubmodule('pl','TR')
assert.equal(turkiyeInsidePolish.key,'TR')
assert.equal(turkiyeInsidePolish.module_type,'country_submodule')

const result=enrichLanguageModuleFromCountryRecords({
  language:'pl',
  homeCountry:'PL',
  targetCountry:'TR',
  countryRecords:[
    {country_code:'PL',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['consumer'],entry_requirements_verified:true,entry_sources:['entry'],residence_requirements_verified:true,residence_sources:['residence']},
    {country_code:'TR',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['consumer'],entry_requirements_verified:false,entry_sources:[],residence_requirements_verified:false,residence_sources:[]}
  ]
})
assert.equal(result.status,'needs_enrichment')
assert.ok(result.missing.some(item=>item.country_code==='TR'))
assert.equal(result.country_submodules.length,COUNTRY_CATALOG.length)

const contract=languageModuleRegistryContract()
assert.equal(contract.version,'v92')
assert.equal(contract.oneModulePerLanguage,true)
assert.equal(contract.countrySubmodulesPerLanguage,true)
assert.equal(contract.independentFromCountry,true)
assert.equal(contract.automaticCountryEnrichment,true)
console.log('V92 nested language/country module guard passed.')
