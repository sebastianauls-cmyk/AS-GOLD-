import assert from 'node:assert/strict'
import fs from 'node:fs'
import {plans,goalTier,tierRank} from '../app/modules/pricing/catalog.js'

const keys=plans.map(plan=>plan.key)
assert.deepEqual(keys,['free','start','klar','analyse','komplett','business','enterprise'])

const byKey=Object.fromEntries(plans.map(plan=>[plan.key,plan]))
assert.equal(byKey.start.price,19.90)
assert.equal(byKey.klar.price,39.90)
assert.equal(byKey.analyse.price,89.90)
assert.equal(byKey.komplett.price,249.90)
assert.equal(byKey.business.price,499.90)
assert.equal(byKey.enterprise.price,null)
assert.equal(byKey.enterprise.contactOnly,true)

assert.match(byKey.klar.checks,/Widersprüche/)
assert.match(byKey.klar.checks,/Beleglücken/)
assert.match(byKey.analyse.checks,/Chronologie/)
assert.match(byKey.analyse.checks,/Beweislücken/)
assert.match(byKey.analyse.checks,/Quellenstatus/)
assert.match(byKey.komplett.checks,/vorbereitete Schreiben/)
assert.match(byKey.business.checks,/Freigaben/)
assert.match(byKey.business.checks,/Audit/)
assert.match(byKey.enterprise.excluded,/kein Online-Checkout/)

assert.equal(goalTier.gaps,'klar')
assert.equal(goalTier.risks,'analyse')
assert.equal(goalTier.full,'komplett')
assert.equal(goalTier.business,'business')
assert.equal(goalTier.enterprise,'enterprise')
assert.deepEqual(
  ['free','start','klar','analyse','komplett','business','enterprise'].map(key=>tierRank[key]),
  [1,2,3,4,5,6,7]
)

console.log('five-tier pricing and Enterprise contact contract verified')

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8')
const migration=read('supabase/migrations/20261101100000_restore_five_paid_tiers.sql')
assert.match(migration,/security invoker/i)
assert.match(migration,/set search_path\s*=\s*''/i)
assert.match(migration,/from public\.pricing_plans/i)
assert.doesNotMatch(migration,/from private\.gold_plans/i)
assert.match(migration,/gold_klar/)
assert.match(migration,/gold_analyse/)
assert.match(migration,/gold_komplett/)
assert.match(migration,/active=false[\s\S]*gold_professional'/i)

const billablePlans=plans.filter(plan=>plan.key!=='free'&&!plan.contactOnly)
const upgradeOptions=from=>billablePlans
  .filter(plan=>tierRank[plan.key]>tierRank[from])
  .map(plan=>`${plan.key}:${(plan.price-byKey[from].price).toFixed(2)}`)
assert.deepEqual(upgradeOptions('free'),['start:19.90','klar:39.90','analyse:89.90','komplett:249.90','business:499.90'])
assert.deepEqual(upgradeOptions('start'),['klar:20.00','analyse:70.00','komplett:230.00','business:480.00'])
assert.deepEqual(upgradeOptions('klar'),['analyse:50.00','komplett:210.00','business:460.00'])
assert.deepEqual(upgradeOptions('analyse'),['komplett:160.00','business:410.00'])
assert.deepEqual(upgradeOptions('komplett'),['business:250.00'])
assert.deepEqual(upgradeOptions('business'),[])

const checkout=read('app/api/payments/checkout/route.js')
for(const key of ['start','klar','analyse','komplett','business'])assert.match(checkout,new RegExp(`'${key}'`))
assert.doesNotMatch(checkout,/PLAN_KEYS[^\n]*enterprise/)
console.log('five-tier upgrade prices and Enterprise checkout boundary verified')
