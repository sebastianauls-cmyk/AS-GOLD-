import fs from 'node:fs'

const page=fs.readFileSync('app/testen/page.js','utf8')

const required=[
  'Testerbetrieb V38',
  'AS Gold V38 sicher ausprobieren',
  'vollständigen V38-Ablauf prüfen',
  'V38-Fristenwarnung, begründete Ampel und genau ein priorisierter nächster Schritt',
  'allen 10 App-Sprachen',
  'AS%20Gold%20V38%20Testfeedback',
  'V38 ist ein kontrollierter Produkttest',
  '/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf',
  'Die Bezahlfunktion bleibt deaktiviert.'
]

for(const text of required){
  if(!page.includes(text)) throw new Error(`V38 tester guide missing: ${text}`)
}

for(const stale of ['Testerbetrieb V33','AS Gold V33 sicher','AS%20Gold%20V33%20Testfeedback','V33 ist ein kontrollierter Produkttest']){
  if(page.includes(stale)) throw new Error(`Stale tester-guide version found: ${stale}`)
}

console.log('V38 tester-guide guard passed: current release naming, test path, 10-language check, V38 core flow, sample data and payment lock verified.')
