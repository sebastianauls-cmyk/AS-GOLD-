import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const route=fs.readFileSync('app/testen/page.js','utf8')
const paused=fs.readFileSync('app/modules/tester/TesterPaused.js','utf8')
const page=route+'\n'+paused
if(!route.includes("../modules/tester/TesterPaused")) throw new Error('Tester route must explicitly import the paused tester surface during synthetic-only completion')
if(route.includes('TesterGuide')) throw new Error('Tester route must not expose the live TesterGuide while external testing is paused')
for(const text of ['robots:{index:false,follow:false}','Testerzugang pausiert','synthetischen Testfällen','keine externe Testerfreigabe','Bezahlfunktion bleibt deaktiviert','Navigation, Sprachumschaltung, Dokumentanalyse','PDF-, Word-, Excel- und PowerPoint-Exporte']){if(!page.includes(text)) throw new Error('Paused tester surface missing: '+text)}
if(!/^V\d+$/.test(APP_VERSION)) throw new Error('Invalid central app version: '+APP_VERSION)
if(page.includes('<TesterShareButton/>')||page.includes('GuestTestStartButton')) throw new Error('Paused tester surface must not expose sharing or guest-start controls')
console.log(`${APP_VERSION} paused tester-guide guard passed: external testing remains disabled during synthetic-only completion.`)
