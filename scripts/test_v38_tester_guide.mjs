import fs from 'node:fs'
const route=fs.readFileSync('app/testen/page.js','utf8')
const guide=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
const page=route+'\n'+guide
if(!route.includes("../modules/tester/TesterGuide")) throw new Error('Final tester route must explicitly import the modular TesterGuide')
if(route.includes('TesterPaused')) throw new Error('Final tester route must not remain paused after the release gate')
for(const text of ['Testerbetrieb V72','AS Gold V72 sicher ausprobieren','Tester-Link weiterleiten','Genau ein Sprachmenü und genau ein Zurück-Element im geöffneten Sprachmenü','Zurück schließt das Sprachmenü zuverlässig, auch auf Mobilgeräten','Oberflächensprache zuerst und getrennte Ausgabesprache danach','Klare Navigation ohne offensichtliche Sackgassen','allen 11 App-Sprachen einschließlich Vietnamesisch','Musterdatei herunterladen','Die Bezahlfunktion bleibt deaktiviert.','AS%20Gold%20V72%20Testfeedback']){if(!page.includes(text)) throw new Error('Final tester guide missing: '+text)}
if(!page.includes('<TesterShareButton/>')) throw new Error('Final tester guide must expose modular tester sharing')
console.log('V46/V72 final tester-guide guard passed: tester route is active only in the fully validated release candidate.')
