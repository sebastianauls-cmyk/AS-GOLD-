import assert from 'node:assert/strict'
import fs from 'node:fs'
import {plans} from '../app/modules/pricing/catalog.js'
import {APP_VERSION} from '../app/modules/release/appRelease.mjs'

assert.deepEqual(plans.map(p=>p.key),['free','start','professional','business'])
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8')
const contract=read('docs/FINAL_PRODUCT_CONTRACT.md')
const readme=read('README.md')
assert.match(readme,new RegExp('ASH Workspace Gold Workspace – '+APP_VERSION))
for(const fragment of ['Gold Start – 19,90 EUR','Gold Professional – 89,90 EUR','Gold Business – 499,90 EUR','Keine externe Kundenkommunikation ohne ausdrückliche Freigabe','Supabase Leaked-Password-Protection']) assert.ok(contract.includes(fragment),`product contract missing: ${fragment}`)

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'))
for(const script of ['test:pricing-tiers','test:tier-acceptance','test:product-deliverables','test:v114-readiness']){
  assert.ok(pkg.scripts[script],`missing ${script}`)
}
for(const token of ['test:pricing-tiers','test:tier-acceptance']) assert.match(pkg.scripts.prebuild,new RegExp(token.replace(':','\\:')))

const smoke=fs.readFileSync(new URL('../.github/workflows/production-guest-smoke.yml',import.meta.url),'utf8')
assert.match(smoke,/app-gold-workspace\.vercel\.app/)
assert.match(smoke,/production-guest-smoke\.spec\.js/)
assert.match(smoke,/--project=desktop-chromium/,'production smoke must consume only one anonymous live session per run')
assert.match(smoke,/cron: '23 1 \* \* \*'/,'production guest smoke must not exhaust rolling 20/24h cap')
assert.match(smoke,/ASH_PRODUCTION_GUEST_SMOKE: 'true'/)
assert.match(smoke,/--retries=0/)
assert.match(smoke,/--workers=1/)
const guestSpec=read('tests/browser/specs/production-guest-smoke.spec.js')
assert.match(guestSpec,/ASH_PRODUCTION_GUEST_SMOKE/,'all other browser pipelines must skip real production guest signups')
assert.match(smoke,/schedule:/)

const guest=fs.readFileSync(new URL('../app/modules/auth/workspaceAuthWorkflow.js',import.meta.url),'utf8')
assert.match(guest,/startAnonymousTestSession/)
assert.match(guest,/clearGuestTestRequest/)

const approvals=fs.readFileSync(new URL('../app/modules/cases/approvalWorkflow.js',import.meta.url),'utf8')
assert.match(approvals,/preview/i)
assert.match(approvals,/approve/i)

const integrations=fs.readFileSync(new URL('../app/modules/integrations/IntegrationHub.js',import.meta.url),'utf8')
assert.match(integrations,/google_not_configured/)
assert.match(integrations,/microsoft_not_configured/)
assert.match(integrations,/can_send/)
assert.match(integrations,/can_read/)

const checkout=fs.readFileSync(new URL('../app/api/payments/checkout/route.js',import.meta.url),'utf8')
for(const key of ['start','professional','business']) assert.match(checkout,new RegExp("'"+key+"'"))

console.log('FINAL RELEASE GATE PASS: pricing, tier acceptance, production guest smoke, auth, approvals, integrations and checkout contracts are present.')
