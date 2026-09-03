import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
const route=fs.readFileSync('app/testen/page.js','utf8')
const guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
const page=route+'\n'+guide
if(!route.includes("../modules/tester/TesterGuide")) throw new Error('Final tester route must explicitly import the modular TesterGuide')
if(route.includes('TesterPaused')) throw new Error('Final tester route must not remain paused after the release gate')
for(const text of ['APP_VERSION','showRelease','localizable','Testerbetrieb','AS Gold sicher ausprobieren','Tester-Link weiterleiten','Genau ein Sprachmenü und genau ein Zurück-Element im geöffneten Sprachmenü','Zurück schließt das Sprachmenü zuverlässig, auch auf Mobilgeräten','Oberflächensprache zuerst und getrennte Ausgabesprache danach','Klare Navigation ohne offensichtliche Sackgassen','allen 11 App-Sprachen einschließlich Vietnamesisch','Musterdatei herunterladen','Die Bezahlfunktion bleibt deaktiviert.']){if(!page.includes(text)) throw new Error('Final tester guide missing: '+text)}
if(APP_VERSION!=='V78') throw new Error('Unexpected central app version: '+APP_VERSION)
if(!page.includes('<TesterShareButton/>')) throw new Error('Final tester guide must expose modular tester sharing')
console.log(`${APP_VERSION} final tester-guide guard passed: tester route uses the central release version.`)
