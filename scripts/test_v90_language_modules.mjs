import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import {
  LANGUAGE_MODULES,
  LANGUAGE_ENRICHMENT_TOPICS,
  createLanguageModuleContext,
  languageCountryEnrichmentPlan,
  enrichLanguageModuleFromCountryRecords,
  languageModuleRegistryContract
} from '../app/modules/language/languageModuleRegistry.mjs'

assert.equal(LANGUAGE_MODULES.length,LANGUAGE_CATALOG.length)
assert.deepEqual(LANGUAGE_MODULES.map(module=>module.key),LANGUAGE_CATALOG.map(language=>language.key))
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('laws'))
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('entry_requirements'))
assert.ok(LANGUAGE_ENRICHMENT_TOPICS.includes('residence_immigration'))

const context=createLanguageModuleContext({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.equal(context.language,'pl')
assert.equal(context.home_country,'PL')
assert.equal(context.target_country,'TR')

const plan=languageCountryEnrichmentPlan({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.ok(plan.countries.includes('PL'))
assert.ok(plan.countries.includes('TR'))
assert.equal(plan.automatic,true)

const english=languageCountryEnrichmentPlan({language:'en'})
assert.ok(english.countries.includes('GB'))
assert.ok(english.countries.includes('US'))

const result=enrichLanguageModuleFromCountryRecords({
  language:'pl',
  homeCountry:'PL',
  targetCountry:'TR',
  countryRecords:[
    {country_code:'PL',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['consumer'],entry_requirements_verified:true,entry_sources:['entry']},
    {country_code:'TR',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['consumer'],entry_requirements_verified:false,entry_sources:[]}
  ]
})
assert.equal(result.status,'needs_enrichment')
assert.ok(result.missing.some(item=>item.country_code==='TR'))

const contract=languageModuleRegistryContract()
assert.equal(contract.version,'v90')
assert.equal(contract.oneModulePerLanguage,true)
assert.equal(contract.automaticCountryEnrichment,true)
assert.equal(contract.independentFromCountry,true)
console.log('V90 language module enrichment guard passed.')
