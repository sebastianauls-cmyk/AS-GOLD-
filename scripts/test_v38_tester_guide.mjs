import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'

const testerRoute=fs.readFileSync('app/testen/page.js','utf8')
const redeemRoute=fs.readFileSync('app/tester-freischalten/page.js','utf8')
const manageRoute=fs.readFileSync('app/tester-verwaltung/page.js','utf8')
const invitationRoute=fs.readFileSync('app/einladungen/page.js','utf8')
const auth=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
const promo=fs.readFileSync('app/modules/pricing/promoTranslations.mjs','utf8')
const combined=[testerRoute,redeemRoute,manageRoute,invitationRoute].join('\n')

for(const route of [testerRoute,redeemRoute,manageRoute,invitationRoute]){
  if(!route.includes("redirect('/')")) throw new Error('Legacy tester route must redirect to the app')
}
if(!auth.includes("['🎟️','Promo-Code / promo code']")) throw new Error('Auth surface must advertise promo codes, not tester access')
if(auth.includes('Persönlichen Testzugang')||auth.includes('Tester-Code einlösen')) throw new Error('Auth surface must not expose tester actions')
if(!promo.includes("title:'Promo-Code'")) throw new Error('Promo-code translations must remain active')
if(promo.includes('Tester-Vollzugang')||promo.includes('tester access')) throw new Error('Promo translations must not present tester access')
if(!/^V\d+$/.test(APP_VERSION)) throw new Error('Invalid central app version: '+APP_VERSION)
if(combined.includes('PromoTesterGate')||combined.includes('PersonalTesterRedeem')||combined.includes('TesterAdminPanel')||combined.includes('PersonalInvitationStudio')) throw new Error('Legacy tester routes must not mount tester modules')
console.log(`${APP_VERSION} promo-only guard passed: tester routes are retired and promo-code access remains available.`)
