import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const migration=read('supabase/migrations/20260907000038_v124_stripe_test_checkout.sql')
const advisorMigration=read('supabase/migrations/20260907002400_v124_stripe_webhook_fk_index.sql')

assert.match(migration,/gold_stripe_webhook_events/)
assert.match(migration,/Checkout amount mismatch/)
assert.match(migration,/grant execute on function public\.gold_fulfill_checkout_service[\s\S]*to service_role/)
assert.match(migration,/make_interval\(days=>coalesce\(v_request\.term_months,1\)\*30\)/)
assert.match(migration,/'auto_renew',false/)
assert.match(migration,/'checkout_total',v_checkout_total/)
assert.match(advisorMigration,/gold_stripe_webhook_events\(upgrade_request_id\)/)

console.log('V124 historical Stripe migration guard passed. The active payment integration is covered by the V125 SumUp guard.')
