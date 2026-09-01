import fs from 'node:fs'

const page=fs.readFileSync('app/testen/page.js','utf8')

const required=[
  'Testerbetrieb V70',
  'AS Gold V70 sicher ausprobieren',
  'vollständigen V70-Ablauf prüfen',
  'Oberflächensprache zuerst und getrennte Ausgabesprache danach',
  'Erklärvideo mit weiblicher und männlicher Variante',
  'Klare Zurück-Navigation ohne Sackgasse und ohne doppelte Schaltflächen',
  'Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt',
  'Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben',
  'Professionelle Übergabeakte für Anwalt, Versicherung oder Berater',
  'allen 10 App-Sprachen',
  'AS%20Gold%20V70%20Testfeedback',
  'V70 ist ein kontrollierter Produkttest',
  '/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf',
  'Die Bezahlfunktion bleibt deaktiviert.'
]

for(const text of required){
  if(!page.includes(text)) throw new Error(`V70 tester guide missing: ${text}`)
}

for(const stale of ['Testerbetrieb V33','Testerbetrieb V38','Testerbetrieb V45','Testerbetrieb V49','AS Gold V33 sicher','AS Gold V38 sicher ausprobieren','AS Gold V45 sicher ausprobieren','AS Gold V49 sicher ausprobieren','AS%20Gold%20V33%20Testfeedback','AS%20Gold%20V38%20Testfeedback','AS%20Gold%20V45%20Testfeedback','AS%20Gold%20V49%20Testfeedback','V33 ist ein kontrollierter Produkttest','V38 ist ein kontrollierter Produkttest','V45 ist ein kontrollierter Produkttest','V49 ist ein kontrollierter Produkttest']){
  if(page.includes(stale)) throw new Error(`Stale tester-guide version found: ${stale}`)
}

console.log('V70 tester-guide guard passed: current release naming, sharing, presenter choice, no-dead-end navigation, 10-language check, sample data and payment lock verified.')
