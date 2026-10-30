import assert from 'node:assert/strict'
import fs from 'node:fs'
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


// gold_available_upgrades ACL regression: its invoker must only read the public
// pricing catalog. Reading private.gold_plans produces 403 for authenticated users.
const upgradeMigration=fs.readFileSync(new URL('../supabase/migrations/20261030204500_fix_gold_available_upgrades_acl.sql',import.meta.url),'utf8')
assert.match(upgradeMigration,/create or replace function public\.gold_available_upgrades\(\)/i)
assert.match(upgradeMigration,/from public\.pricing_plans/i)
assert.doesNotMatch(upgradeMigration,/from private\.gold_plans/i)
assert.match(upgradeMigration,/set search_path to ''/i)
assert.match(upgradeMigration,/auth\.uid\(\) is not null/i)
assert.doesNotMatch(upgradeMigration,/^\s*security definer\b/im)
const upgradeOptions=from=>plans.filter(plan=>tierRank[plan.key]>tierRank[from]).map(plan=>`${plan.key}:${(plan.price-byKey[from].price).toFixed(2)}`)
assert.deepEqual(upgradeOptions('free'),['start:19.90','professional:89.90','business:499.90'])
assert.deepEqual(upgradeOptions('start'),['professional:70.00','business:480.00'])
assert.deepEqual(upgradeOptions('professional'),['business:410.00'])
assert.deepEqual(upgradeOptions('business'),[])
console.log('gold_available_upgrades invoker ACL and three-tier upgrade price regression passed')
