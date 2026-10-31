import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration=fs.readFileSync(new URL('../supabase/migrations/20261030201200_guest_quota_counts_only_granted_access.sql',import.meta.url),'utf8')

assert.match(migration,/from private\.user_access ua/)
assert.match(migration,/permissions->>'access_source'='anonymous_test'/)
assert.match(migration,/permissions->>'guest_access'/)
assert.match(migration,/'quota_exhausted',not v_guest_allowed/)
assert.match(migration,/status='approved'/)
assert.match(migration,/active is true/)
assert.match(migration,/count\(\*\)<20/)
assert.doesNotMatch(migration,/from auth\.users[\s\S]{0,200}count/i)

console.log('Guest quota regression passed: denied anonymous auth identities no longer extend the rolling demo cap.')
