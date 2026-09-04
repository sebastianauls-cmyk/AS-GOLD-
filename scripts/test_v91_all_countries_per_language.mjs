import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import { LANGUAGE_MODULES, ALL_COUNTRY_CODES, createLanguageModuleContext, languageCountryEnrichmentPlan, languageModuleRegistryContract } from '../app/modules/language/languageModuleRegistry.mjs'

const expectedCountries=COUNTRY_CATALOG.map(country=>country.key)
assert.deepEqual(ALL_COUNTRY_CODES,expectedCountries)
assert.equal(LANGUAGE_MODULES.length,LANGUAGE_CATALOG.length)
for(const module of LANGUAGE_MODULES){
  assert.deepEqual(module.available_country_codes,expectedCountries)
  assert.equal(module.inherits_all_configured_countries,true)
  assert.equal(module.may_change_home_country,false)
  assert.equal(module.may_change_target_country,false)
}
const pl=createLanguageModuleContext({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.deepEqual(pl.available_country_codes,expectedCountries)
assert.equal(pl.home_country,'PL')
assert.equal(pl.target_country,'TR')
const arPlan=languageCountryEnrichmentPlan({language:'ar',homeCountry:'SA',targetCountry:'DE'})
assert.deepEqual(arPlan.countries,expectedCountries)
assert.equal(arPlan.active_home_country,'SA')
assert.equal(arPlan.active_target_country,'DE')
const contract=languageModuleRegistryContract()
assert.equal(contract.version,'v91')
assert.equal(contract.allCountriesPerLanguage,true)
assert.deepEqual(contract.countries,expectedCountries)
console.log('V91 all countries per language guard passed.')
