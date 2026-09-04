import assert from 'node:assert/strict'
import fs from 'node:fs'
import { compareHomeCountryToTarget, homeCountryComparisonContract } from '../app/modules/country/homeCountryComparison.mjs'

const homeRecord={country_code:'DE',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['contracts','deadlines'],affected_workflows:['document_analysis','deadline_intelligence','country_legal_comparison'],source_reviewed_at:'2026-09-01T00:00:00Z',baseline_checked_at:'2026-09-01T00:00:00Z',delta_checked_at:'2026-09-04T00:00:00Z'}
const targetRecord={country_code:'FR',status:'setup_required',official_sources:[],court_sources:[],authority_sources:[],covered_topics:[],affected_workflows:[],source_reviewed_at:null,baseline_checked_at:null,delta_checked_at:null}
const result=compareHomeCountryToTarget({homeCountry:'DE',targetCountry:'FR',homeRecord,targetRecord,topic:'contracts'})
assert.equal(result.version,'v87')
assert.equal(result.home_country.code,'DE')
assert.equal(result.target_country.code,'FR')
assert.ok(Array.isArray(result.same)&&Array.isArray(result.different)&&Array.isArray(result.unknown))
assert.equal(result.overall.symbol,'🔴')
assert.match(result.rule,/nur als verifiziert/i)
const sameCountry=compareHomeCountryToTarget({homeCountry:'DE',targetCountry:'DE',homeRecord,targetRecord:homeRecord})
assert.equal(sameCountry.overall.symbol,'🟢')
const contract=homeCountryComparisonContract()
assert.deepEqual(contract.output,['same','different','unknown','traffic-light'])
assert.equal(contract.ownerFirst,true)
const packageJson=fs.readFileSync('package.json','utf8')
assert.match(packageJson,/test:v87-home-country-comparison/)
console.log('V87 home-country versus target-country comparison guard passed.')
