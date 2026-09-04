import assert from 'node:assert/strict'
import fs from 'node:fs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import {
  COUNTRY_LEGAL_MODULES,
  COUNTRY_LEGAL_STATUSES,
  COUNTRY_LEGAL_CHECK_TYPES,
  createCountryLegalModuleDraft,
  validateCountryLegalModule,
  countryLegalCheckPlan,
  countryLegalModuleContract
} from '../app/modules/country/countryLegalModuleRegistry.mjs'

const migration=fs.readFileSync('supabase/migrations/20260904034500_v84_country_legal_modules.sql','utf8')
const countryKeys=COUNTRY_CATALOG.map(country=>country.key)

assert.deepEqual(COUNTRY_LEGAL_MODULES.map(module=>module.country_code),countryKeys)
assert.deepEqual(COUNTRY_LEGAL_STATUSES,['setup_required','source_review','baseline_review','ready','suspended'])
assert.deepEqual(COUNTRY_LEGAL_CHECK_TYPES,['baseline','delta'])
assert.equal(countryLegalModuleContract().ownerFirst,true)
assert.equal(countryLegalModuleContract().countries.length,countryKeys.length)

for(const key of countryKeys){
  const draft=createCountryLegalModuleDraft(key)
  assert.equal(draft.country_code,key)
  assert.equal(countryLegalCheckPlan(draft).action,'baseline')
  assert.match(migration,new RegExp(`\\('${key}'`),`migration missing country ${key}`)
}

assert.throws(()=>validateCountryLegalModule({country_code:'PL',status:'ready',official_sources:[],court_sources:[],authority_sources:[],source_reviewed_at:null,baseline_checked_at:null}),/verified official_sources/)

const ready={...createCountryLegalModuleDraft('PL'),status:'ready',official_sources:['official'],court_sources:['court'],authority_sources:['authority'],source_reviewed_at:new Date().toISOString(),baseline_checked_at:new Date().toISOString(),delta_checked_at:new Date().toISOString(),next_delta_due_at:new Date(Date.now()+86400000).toISOString()}
assert.equal(validateCountryLegalModule(ready),true)
assert.equal(countryLegalCheckPlan(ready).action,'none')
assert.match(migration,/enable row level security/i)
assert.match(migration,/private\.gold_is_owner/)
assert.match(migration,/owner_notified_at/)
assert.match(migration,/owner_acknowledged_at/)

console.log(`V84 country legal module guard passed for ${countryKeys.length} country modules.`)
