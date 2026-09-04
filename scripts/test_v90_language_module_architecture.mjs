import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import { LANGUAGE_MODULES, createLanguageModuleContext, languageModuleRegistryContract } from '../app/modules/language/languageModuleRegistry.mjs'

assert.equal(LANGUAGE_MODULES.length,LANGUAGE_CATALOG.length)
assert.deepEqual(LANGUAGE_MODULES.map(item=>item.key),LANGUAGE_CATALOG.map(item=>item.key))
for(const module of LANGUAGE_MODULES){
  assert.equal(module.independent_from_country,true)
  assert.equal(module.may_change_home_country,false)
  assert.equal(module.may_change_target_country,false)
}
const context=createLanguageModuleContext({language:'pl',homeCountry:'PL',targetCountry:'TR'})
assert.equal(context.language,'pl')
assert.equal(context.home_country,'PL')
assert.equal(context.target_country,'TR')
assert.match(context.rule,/never change home country or target country/i)
const contract=languageModuleRegistryContract()
assert.equal(contract.version,'v90')
assert.equal(contract.oneModulePerLanguage,true)
assert.equal(contract.independentFromCountry,true)
console.log('V90 language module architecture guard passed.')
