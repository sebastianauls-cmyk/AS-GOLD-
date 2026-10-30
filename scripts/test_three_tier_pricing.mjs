import assert from 'node:assert/strict'
import {plans,goalTier,tierRank} from '../app/modules/pricing/catalog.js'

const keys=plans.map(plan=>plan.key)
assert.deepEqual(keys,['free','start','professional','business'])

const byKey=Object.fromEntries(plans.map(plan=>[plan.key,plan]))
assert.equal(byKey.start.price,19.90)
assert.equal(byKey.professional.price,89.90)
assert.equal(byKey.business.price,499.90)

assert.match(byKey.professional.checks,/Chronologie/)
assert.match(byKey.professional.checks,/Widersprüche/)
assert.match(byKey.professional.checks,/Beweislücken/)
assert.match(byKey.professional.checks,/Fristen/)
assert.match(byKey.professional.checks,/Quellenstatus/)
assert.match(byKey.business.checks,/Freigaben/)
assert.match(byKey.business.checks,/Audit/)
assert.match(byKey.business.checks,/Integrationen/)

assert.equal(goalTier.gaps,'professional')
assert.equal(goalTier.risks,'professional')
assert.equal(goalTier.full,'professional')
assert.equal(goalTier.business,'business')
assert.ok(tierRank.business>tierRank.professional)

console.log('three-tier pricing contract verified')
