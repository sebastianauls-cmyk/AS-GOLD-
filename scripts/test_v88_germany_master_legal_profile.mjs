import assert from 'node:assert/strict'
import { germanyMasterLegalProfile, GERMANY_CORE_STATUTES } from '../app/modules/country/germanyMasterLegalProfile.mjs'
import { LEGALLY_RELEVANT_PRODUCT_MODULES } from '../app/modules/workspace/productModuleRegistry.mjs'

const profile=germanyMasterLegalProfile()
assert.equal(profile.country_code,'DE')
assert.ok(profile.official_sources.length>=5)
assert.ok(profile.court_sources.length>=6)
assert.ok(profile.authority_sources.length>=3)
assert.ok(GERMANY_CORE_STATUTES.some(item=>item.key==='BGB'))
assert.ok(GERMANY_CORE_STATUTES.some(item=>item.key==='ZPO'))
assert.ok(GERMANY_CORE_STATUTES.some(item=>item.key==='RDG'))
assert.ok(GERMANY_CORE_STATUTES.some(item=>item.key==='BDSG'))
assert.ok(GERMANY_CORE_STATUTES.some(item=>item.key==='PAngV'))
assert.deepEqual([...profile.affected_workflows].sort(),LEGALLY_RELEVANT_PRODUCT_MODULES.map(item=>item.key).sort())
assert.equal(profile.owner_first,true)
assert.match(profile.legal_assertion_rule,/amtliche|gerichtliche/i)
console.log(`V88 Germany master legal profile guard passed with ${profile.official_sources.length} official source groups, ${profile.court_sources.length} court sources and ${profile.affected_workflows.length} legally relevant product modules.`)
