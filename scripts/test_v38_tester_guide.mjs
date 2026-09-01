import fs from 'node:fs'

const route=fs.readFileSync('app/testen/page.js','utf8')
const paused=fs.readFileSync('app/modules/tester/TesterPaused.js','utf8')
if(!route.includes("../modules/tester/TesterPaused")) throw new Error('Tester route must explicitly import TesterPaused until final release')
if(route.includes('TesterGuide')||route.includes('TesterShareButton')) throw new Error('Tester route must not expose the active guide/share flow before final release')
for(const text of ['Testerzugang vorübergehend geschlossen','Aktuell keine Testerfreigabe.','Bitte noch keinen Test starten und keine Testdaten hochladen.','Navigation vollständig geprüft und abgenommen','Testerzugang gezielt wieder freigegeben']){if(!paused.includes(text)) throw new Error('Paused tester guide missing: '+text)}
for(const forbidden of ['?start=register','Kostenlos testen','Musterdatei herunterladen']){if(paused.includes(forbidden)) throw new Error('Paused tester guide must not expose active action: '+forbidden)}
console.log('V46 tester-lock guard passed: route is explicitly paused and exposes no active tester/share CTA before final release.')
