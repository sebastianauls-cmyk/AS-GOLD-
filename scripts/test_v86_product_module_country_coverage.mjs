import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PRODUCT_MODULES, LEGALLY_RELEVANT_PRODUCT_MODULES, missingCountryModuleCoverage } from '../app/modules/workspace/productModuleRegistry.mjs'
import { countryLegalComparisonContract } from '../app/modules/country/countryLegalComparison.mjs'

assert.ok(PRODUCT_MODULES.length>0)
assert.ok(LEGALLY_RELEVANT_PRODUCT_MODULES.length>0)
assert.equal(countryLegalComparisonContract().autoIncludesNewLegalModules,true)
assert.ok(countryLegalComparisonContract().dimensions.includes('Neue / rechtlich relevante Produktmodule'))

const complete={affected_workflows:LEGALLY_RELEVANT_PRODUCT_MODULES.map(module=>module.key)}
assert.deepEqual(missingCountryModuleCoverage(complete),[])

const incomplete={affected_workflows:[]}
assert.equal(missingCountryModuleCoverage(incomplete).length,LEGALLY_RELEVANT_PRODUCT_MODULES.length)

const comparison=fs.readFileSync('app/modules/country/countryLegalComparison.mjs','utf8')
assert.match(comparison,/LEGALLY_RELEVANT_PRODUCT_MODULES/)
assert.match(comparison,/missingCountryModuleCoverage/)
assert.match(comparison,/Neue \/ rechtlich relevante Produktmodule/)

console.log(`V86 product-module country coverage guard passed for ${PRODUCT_MODULES.length} modules, including ${LEGALLY_RELEVANT_PRODUCT_MODULES.length} legally relevant modules.`)
