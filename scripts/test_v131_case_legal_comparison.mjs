import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { COUNTRY_CATALOG } from '../app/modules/country/countryRegistry.mjs'
import {
  CASE_LEGAL_COMPARISON_TOPICS,
  caseLegalComparisonContract,
  normalizeCaseLegalComparisonRecord,
  safeLegalSourceUrl
} from '../app/modules/country/caseLegalComparison.mjs'
import { legalComparisonTopicLabels, legalComparisonUi } from '../app/modules/country/legalComparisonCopy.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

assert.equal(APP_RELEASE.number,131)
assert.equal(APP_VERSION,'V131')
assert.equal(CASE_LEGAL_COMPARISON_TOPICS.length,10)

const contract=caseLegalComparisonContract()
assert.equal(contract.version,'v131')
for(const rule of [
  'official_sources_only',
  'visible_clickable_sources',
  'home_country_is_not_automatically_applicable_law',
  'target_country_is_not_automatically_applicable_law',
  'unsupported_claims_become_unknown',
  'professional_review_required',
  'output_language_independent'
]) assert.equal(contract.rules[rule],true,`${rule} must remain enforced`)

assert.equal(safeLegalSourceUrl('javascript:alert(1)'),null)
assert.equal(safeLegalSourceUrl('http://example.gov/rule'),null)
assert.equal(safeLegalSourceUrl('https://person:secret@example.gov/rule'),null)
assert.equal(safeLegalSourceUrl('https://example.gov/rule'),'https://example.gov/rule')

const normalized=normalizeCaseLegalComparisonRecord({
  overall_light:'green',
  sources:[
    {title:'Official rule',url:'https://example.gov/rule',publisher:'Authority'},
    {title:'Unsafe',url:'javascript:alert(1)'}
  ],
  result:{
    applicable_law:{status:'known',explanation:'Claim',missing_factors:['Place'],source_urls:['https://example.gov/rule']},
    rows:[{
      issue:'Customer issue',difference_status:'same',confidence:'high',practical_meaning:'Meaning',
      home:{explanation:'Home rule',source_urls:['https://example.gov/rule']},
      target:{explanation:'Unsupported target rule',source_urls:['https://not-listed.gov/rule']}
    }],
    professional_review_required:false
  }
})
assert.equal(normalized.sources.length,1,'unsafe source URLs must be removed')
assert.equal(normalized.applicable_law.status,'likely','missing applicability facts must prevent a definitive status')
assert.equal(normalized.rows[0].difference_status,'unclear','a comparison without sources for both sides must remain unclear')
assert.equal(normalized.rows[0].confidence,'low')
assert.equal(normalized.light.key,'white','a comparison with no fully supported row must remain white')
assert.equal(normalized.professional_review_required,true,'the review requirement cannot be disabled by stored output')

const languages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
for(const language of languages){
  const ui=legalComparisonUi(language)
  for(const field of ['title','intro','baseline','legend','greenLabel','yellowLabel','redLabel','whiteLabel','topic','question','classification','consent','applicableLaw','comparisonPoints','sources','reviewRequired']) assert.ok(ui[field],`${language}.${field} must be visible`)
  const labels=legalComparisonTopicLabels(language)
  for(const topic of CASE_LEGAL_COMPARISON_TOPICS) assert.ok(labels[topic],`${language}.${topic} must have a label`)
}

const component=read('app/modules/country/LegalComparisonPanel.js')
const service=read('app/modules/services/legalComparison.js')
const caseWorkspace=read('app/modules/cases/CaseWorkspace.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const edge=read('supabase/functions/gold-legal-comparison/index.ts')
const migration=read('supabase/migrations/20260908130238_v131_case_legal_comparisons.sql')
const css=read('app/globals.css')

assert.match(caseWorkspace,/<LegalComparisonPanel/)
assert.match(controller,/outputLanguage=\{outputLanguage\}[\s\S]*onPrivacyUpdate=\{setPrivacySettings\}/)
assert.match(component,/applicableLawCard/)
assert.match(component,/legalComparisonLegend/)
assert.match(component,/target="_blank" rel="noreferrer"/,'official citations must be clickable')
assert.match(component,/dataClassification:classification/)
assert.match(service,/\.eq\('home_country',homeCountry\)/)
assert.match(service,/\.eq\('target_country',targetCountry\)/)
assert.match(service,/privacy_notice_version/)

assert.match(edge,/type:'web_search',filters:\{allowed_domains:allowedDomains\}/)
assert.match(edge,/include:\['web_search_call\.action\.sources'\]/)
assert.match(edge,/professional_review_required:true/)
assert.match(edge,/home country and target country alone never establish applicable law/i)
assert.match(edge,/unsupported[\s\S]*official primary source/i)
assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/)
assert.match(edge,/client\.from\('cases'\)[\s\S]*\.eq\('owner_id',user\.id\)/)
assert.match(edge,/client\.from\('documents'\)[\s\S]*\.in\('data_classification',\['synthetic','anonymized'\]\)/)
for(const country of COUNTRY_CATALOG) assert.match(edge,new RegExp(`\\b${country.key}:\\{`),`${country.key} must have an official-source profile`)
for(const topic of CASE_LEGAL_COMPARISON_TOPICS) assert.match(edge,new RegExp(`\\b${topic}:`),`${topic} must be supported server-side`)

assert.match(migration,/alter table public\.legal_comparisons enable row level security/)
assert.match(migration,/revoke all on public\.legal_comparisons from anon, authenticated/)
assert.match(migration,/grant select on public\.legal_comparisons to authenticated/)
assert.doesNotMatch(migration,/grant\s+(?:insert|update|delete)[^;]*authenticated/i,'clients must not forge legal research provenance')
assert.match(migration,/status in \('research_draft','professionally_reviewed','superseded'\)/)
assert.match(css,/@media\(max-width:760px\)[^\n]*legalComparisonLegend/,'the comparison must collapse to one column on mobile')

console.log('V131 legal-comparison guard passed: case-specific, source-bound, multilingual, immutable and review-required comparison flow is wired end to end.')
