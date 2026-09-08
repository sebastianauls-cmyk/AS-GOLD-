import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const route=fs.readFileSync('app/testen/page.js','utf8')
const gate=fs.readFileSync('app/modules/tester/PromoTesterGate.js','utf8')
const page=route+'\n'+gate
if(!route.includes("../modules/tester/PromoTesterGate")) throw new Error('Tester route must explicitly use the personal promo request gate')
if(route.includes('TesterPaused')||route.includes('TesterGuide')) throw new Error('Tester route must not expose paused or live tester content directly')
for(const text of ['robots:{index:false,follow:false}','Testerzugang mit Promo-Code','Promo-Code persönlich anfordern','persönlich per WhatsApp oder E-Mail','Name und die spätere Login-E-Mail','ausdrücklich zustimmt','an die angegebene Login-E-Mail gebunden','Bezahlfunktion bleibt deaktiviert']){if(!page.includes(text)) throw new Error('Personal tester request flow missing: '+text)}
if(!/^V\d+$/.test(APP_VERSION)) throw new Error('Invalid central app version: '+APP_VERSION)
if(page.includes('/api/tester/promo')||page.includes('sessionStorage')||page.includes('GuestTestStartButton')||page.includes('TesterShareButton')) throw new Error('Personal request surface must not auto-validate or expose tester controls')
console.log(`${APP_VERSION} personal tester-request guard passed: promo access requires explicit provider approval and a personally assigned login email.`)
