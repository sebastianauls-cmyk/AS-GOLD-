import assert from 'node:assert/strict'
import { buildCrossCountryExplanation, crossCountryExplanationContract } from '../app/modules/country/crossCountryExplanation.mjs'

const homeRecord={country_code:'PL',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['contracts'],affected_workflows:['cases','documents','deadlines','assessments','approvals','exports','country_context','country_legal','country_comparison','home_country_comparison','cross_country_explanation','legal_monitor','pricing','privacy_compliance'],source_reviewed_at:'2026-09-04T00:00:00Z',baseline_checked_at:'2026-09-04T00:00:00Z',delta_checked_at:'2026-09-04T00:00:00Z'}
const targetRecord={country_code:'TR',status:'ready',official_sources:['law'],court_sources:['court'],authority_sources:['authority'],covered_topics:['contracts'],affected_workflows:['cases','documents','deadlines','assessments','approvals','exports','country_context','country_legal','country_comparison','home_country_comparison','cross_country_explanation','legal_monitor','pricing','privacy_compliance'],source_reviewed_at:'2026-09-04T00:00:00Z',baseline_checked_at:'2026-09-04T00:00:00Z',delta_checked_at:'2026-09-04T00:00:00Z'}

const result=buildCrossCountryExplanation({homeCountry:'PL',targetCountry:'TR',outputLanguage:'pl',homeRecord,targetRecord,topic:'Vertrag'})
assert.equal(result.version,'v89')
assert.equal(result.home_country.code,'PL')
assert.equal(result.target_country.code,'TR')
assert.equal(result.output_language.key,'pl')
assert.match(result.rule,/unabhängige Parameter/i)
assert.match(result.rule,/Sprachwechsel darf weder Heimatland noch Zielland verändern/i)
const contract=crossCountryExplanationContract()
assert.deepEqual(contract.independentParameters,['homeCountry','targetCountry','outputLanguage'])
assert.deepEqual(contract.example,{homeCountry:'PL',targetCountry:'TR',outputLanguage:'pl'})
console.log('V89 cross-country explanation guard passed.')
