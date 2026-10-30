import assert from 'node:assert/strict'
import fs from 'node:fs'
import {plans} from '../app/modules/pricing/catalog.js'

assert.deepEqual(plans.map(p=>p.key),['free','start','professional','business'])

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'))
for(const script of ['test:pricing-tiers','test:tier-acceptance','test:product-deliverables','test:v114-readiness']){
  assert.ok(pkg.scripts[script],`missing ${script}`)
}
for(const token of ['test:pricing-tiers','test:tier-acceptance']) assert.match(pkg.scripts.prebuild,new RegExp(token.replace(':','\\:')))

const smoke=fs.readFileSync(new URL('../.github/workflows/production-guest-smoke.yml',import.meta.url),'utf8')
assert.match(smoke,/app-gold-workspace\.vercel\.app/)
assert.match(smoke,/production-guest-smoke\.spec\.js/)
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
