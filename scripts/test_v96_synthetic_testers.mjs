import assert from 'node:assert/strict'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import { SYNTHETIC_TESTERS, SYNTHETIC_TESTER_CONTRACT, validateSyntheticTesterCoverage } from '../app/modules/testing/syntheticTesterRegistry.mjs'

const result=validateSyntheticTesterCoverage()
assert.equal(SYNTHETIC_TESTER_CONTRACT.version,'v96')
assert.equal(SYNTHETIC_TESTER_CONTRACT.synthetic_only,true)
assert.equal(SYNTHETIC_TESTER_CONTRACT.real_personal_data,false)
assert.equal(SYNTHETIC_TESTERS.length,12)
assert.equal(result.ok,true,`Synthetic tester coverage errors: ${result.errors.join(', ')}`)
assert.equal(result.languages_covered.length,LANGUAGE_CATALOG.length)

const languageKeys=new Set(LANGUAGE_CATALOG.map(x=>x.key))
const countryKeys=new Set(COUNTRY_CATALOG.map(x=>x.key))
for(const tester of SYNTHETIC_TESTERS){
  assert(languageKeys.has(tester.language),tester.id)
  assert(countryKeys.has(tester.home_country),tester.id)
  assert(countryKeys.has(tester.target_country),tester.id)
  assert(['low','medium','high','very_high'].includes(tester.complexity),tester.id)
  assert(['🟢','🟡','🔴','⚪'].includes(tester.expected_ampel),tester.id)
  assert(tester.documents.length>0,tester.id)
  assert(tester.expected_actions.length>0,tester.id)
}

const plTr=SYNTHETIC_TESTERS.find(t=>t.id==='ST12')
assert.equal(plTr.language,'pl')
assert.equal(plTr.home_country,'PL')
assert.equal(plTr.target_country,'TR')
assert.equal(plTr.expected_ampel,'⚪')

console.log(`V96 synthetic tester guard passed: ${SYNTHETIC_TESTERS.length} testers, ${LANGUAGE_CATALOG.length} languages, ${COUNTRY_CATALOG.length} configured countries.`)
