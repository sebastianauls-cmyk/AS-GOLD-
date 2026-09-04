import assert from 'node:assert/strict'
import fs from 'node:fs'
import {COUNTRY_CATALOG,normalizeCountryContext,countryByKey} from '../app/modules/country/countryRegistry.mjs'

assert.ok(COUNTRY_CATALOG.length>=10)
assert.equal(normalizeCountryContext('pl'),'PL')
assert.equal(normalizeCountryContext('unknown'),'DE')
assert.equal(countryByKey('DE').key,'DE')

const service=fs.readFileSync(new URL('../app/modules/services/documentAnalysis.js',import.meta.url),'utf8')
const shell=fs.readFileSync(new URL('../app/modules/workspace/ProtectedWorkspaceShell.js',import.meta.url),'utf8')
const backend=fs.readFileSync(new URL('../supabase/functions/gold-document-analysis/index.ts',import.meta.url),'utf8')
const languageWorkflow=fs.readFileSync(new URL('../app/modules/language/documentLanguageWorkflow.mjs',import.meta.url),'utf8')

assert.match(service,/target_country:targetCountry/)
assert.match(service,/readCountryContext/)
assert.match(shell,/CountrySwitcher/)
assert.match(backend,/COUNTRY_CONTEXTS/)
assert.match(backend,/target_country/)
assert.match(backend,/Sprache und Land sind getrennte Parameter/)
assert.doesNotMatch(languageWorkflow,/COUNTRY_CATALOG|target_country/)
console.log('Country context module guard passed: country/jurisdiction stays independent from language workflow.')
