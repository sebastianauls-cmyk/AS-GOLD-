import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const repository=read('app/modules/services/authRepository.js')
const workflow=read('app/modules/auth/workspaceAuthWorkflow.js')
const session=read('app/modules/workspace/useWorkspaceSession.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const tester=read('app/modules/tester/TesterGuide.js')
const guestButton=read('app/modules/tester/GuestTestStartButton.js')
const migration=read('supabase/migrations/20260905233240_v112_passwordless_synthetic_test.sql')
const anonymousFunction=repository.match(/export function startAnonymousTestSession[\s\S]*?\n}\n/)?.[0]||''

assert.ok(APP_RELEASE.number>=112,'passwordless synthetic testing requires release V112 or newer')
assert.match(repository,/auth\.signInAnonymously\(/)
assert.ok(anonymousFunction)
assert.doesNotMatch(anonymousFunction,/password/i)
assert.match(workflow,/async function startGuestTest\(\)/)
assert.match(session,/start==='guest-test'/)
assert.match(controller,/screen==='guest-test'/)
assert.match(tester,/GuestTestStartButton/)
assert.match(guestButton,/acceptedLegal&&confirmedTestData/)
assert.match(guestButton,/start:'guest-test'/)
assert.match(migration,/new\.is_anonymous/)
assert.doesNotMatch(migration,/raw_user_meta_data\s*->>\s*'synthetic_guest'/)
assert.match(migration,/interval '2 hours'/)
assert.match(migration,/'document_limit',2/)
assert.match(migration,/'full_analysis',true/)
assert.match(migration,/'export_pdf',true/)
assert.match(migration,/count\(\*\)<=20/)
assert.match(migration,/private\.gold_access_active\(\)/)
assert.match(migration,/permissions->>'access_source' is distinct from 'anonymous_test'/)
assert.match(migration,/auth\.jwt\(\)->>'is_anonymous'/)

console.log(`${APP_VERSION} passwordless synthetic test guard passed: no password or email, explicit legal/test-data confirmation, two-hour expiry, two-document cap and owner-scoped authenticated access.`)
