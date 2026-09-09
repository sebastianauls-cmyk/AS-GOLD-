import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const page=fs.readFileSync('app/testen/page.js','utf8')
const redeem=fs.readFileSync('app/tester-freischalten/page.js','utf8')
const manage=fs.readFileSync('app/tester-verwaltung/page.js','utf8')
const invite=fs.readFileSync('app/einladungen/page.js','utf8')
const auth=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
const dashboard=fs.readFileSync('app/modules/workspace/DashboardSurface.js','utf8')
const contact=fs.readFileSync('app/kontakt/page.js','utf8')
const pricing=fs.readFileSync('app/modules/pricing/UpgradePanel.js','utf8')
const release=fs.readFileSync('app/modules/release/appRelease.mjs','utf8')
for(const legacy of [page,redeem,manage,invite]){
  assert.match(legacy,/redirect\('\/'\)/,'retired tester routes must redirect to the app')
  assert.doesNotMatch(legacy,/PromoTesterGate|PersonalTesterRedeem|TesterAdminPanel|PersonalInvitationStudio|InvitationWorkflowPanel/)
}
for(const visible of [auth,dashboard,contact]) assert.doesNotMatch(visible,/Testerzugang|Tester-Code|Tester verwalten|Tester freischalten|Testeinladung|tester access/i,'visible product flow must not expose tester features')
assert.doesNotMatch(pricing,/tester-freischalten/,'pricing must not route to retired tester redemption')
assert.match(pricing,/PromoCodeControl/,'pricing must retain the promo-code control')
assert.match(APP_VERSION,/^V\d+$/,'central app release must expose a valid version')
assert.match(release,/export const APP_VERSION=APP_RELEASE\.version/,'promo-only flow must keep the central release source')
console.log(`${APP_VERSION} promo-only sharing guard passed: tester routes are retired and visible access is handled only through the regular promo-code flow.`)
