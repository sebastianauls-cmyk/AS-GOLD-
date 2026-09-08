import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const route=fs.readFileSync('app/testen/page.js','utf8')
const gate=fs.readFileSync('app/modules/tester/PromoTesterGate.js','utf8')
const guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
const promoApi=fs.readFileSync('app/api/tester/promo/route.js','utf8')
const page=route+'\n'+gate+'\n'+guide+'\n'+promoApi
if(!route.includes("../modules/tester/PromoTesterGate")) throw new Error('Tester route must explicitly use the promo-only gate')
if(route.includes('TesterPaused')) throw new Error('Tester route must no longer use the fully paused tester surface')
for(const text of ['robots:{index:false,follow:false}','Testerzugang mit Promo-Code','/api/tester/promo','sessionStorage','2*60*60*1000','timingSafeEqual','createHash','Bezahlfunktion bleibt deaktiviert','TesterGuide']){if(!page.includes(text)) throw new Error('Promo-only tester gate missing: '+text)}
if(!/^V\d+$/.test(APP_VERSION)) throw new Error('Invalid central app version: '+APP_VERSION)
if(route.includes('GuestTestStartButton')||route.includes('TesterShareButton')) throw new Error('Tester route must not expose guest/share controls before promo verification')
if(promoApi.includes('aspromo2026')) throw new Error('Promo code must not be stored as clear text in the server route')
console.log(`${APP_VERSION} promo-only tester guard passed: tester content requires server-side promo verification before the guide is rendered.`)
