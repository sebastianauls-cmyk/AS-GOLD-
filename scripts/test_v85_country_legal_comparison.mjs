import assert from 'node:assert/strict'
import { compareCountryLegalModules, countryLegalComparisonContract } from '../app/modules/country/countryLegalComparison.mjs'

const reference={country_code:'DE',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['contracts','deadlines'],affected_workflows:['document_analysis','deadline_intelligence'],source_reviewed_at:'2026-09-01T00:00:00Z',baseline_checked_at:'2026-09-01T00:00:00Z',delta_checked_at:'2026-09-04T00:00:00Z'}
const target={country_code:'PL',status:'setup_required',official_sources:[],court_sources:[],authority_sources:[],covered_topics:[],affected_workflows:[],source_reviewed_at:null,baseline_checked_at:null,delta_checked_at:null}
const result=compareCountryLegalModules(reference,target)
assert.equal(result.reference_country.code,'DE')
assert.equal(result.target_country.code,'PL')
assert.equal(result.overall.key,'red')
assert.ok(result.rows.some(row=>row.dimension==='Einsatzbereitschaft'&&row.symbol==='🟡'))
assert.ok(result.rows.some(row=>row.dimension==='official_sources'&&row.symbol==='🔴'))
assert.ok(result.rows.some(row=>row.dimension==='Aktualität der Rechtsprüfung'&&row.symbol==='🔴'))
assert.match(result.rule,/ersetzt keine inhaltliche Rechtsvergleichung/i)
const contract=countryLegalComparisonContract()
assert.equal(contract.version,'v86')
assert.deepEqual(contract.lights.map(item=>item.symbol),['🟢','🟡','🔴'])
assert.equal(contract.autoIncludesNewLegalModules,true)
console.log('V85/V86 country legal comparison guard passed.')
