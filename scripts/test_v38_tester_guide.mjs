import fs from 'node:fs'

const route=fs.readFileSync('app/testen/page.js','utf8')
const module=fs.readFileSync('app/modules/tester/TesterPaused.js','utf8')
const page=`${route}\n${module}`
const paused=page.includes('Testerzugang vorübergehend geschlossen')

if(paused){
  const required=[
    'Aktuell keine Testerfreigabe.',
    'Bitte noch keinen Test starten und keine Testdaten hochladen.',
    'Navigation vollständig geprüft und abgenommen',
    'Die interne Entwicklung läuft weiter.',
    'Testerzugang gezielt wieder freigegeben'
  ]
  for(const text of required){
    if(!page.includes(text)) throw new Error(`Paused tester guide missing: ${text}`)
  }
  for(const forbidden of ['?start=register','Kostenlos testen','Muster-PDF herunterladen']){
    if(page.includes(forbidden)) throw new Error(`Paused tester guide must not expose active test action: ${forbidden}`)
  }
  console.log('V45 tester-guide guard passed: modular public tester access is intentionally paused with no active registration, upload or sample-download CTA.')
}else{
  const required=[
    'Testerbetrieb V45','AS Gold V45 sicher ausprobieren','vollständigen V45-Ablauf prüfen',
    'Oberflächensprache zuerst und getrennte Ausgabesprache danach',
    'Erklärvideo und klare Zurück-Navigation ohne Sackgasse',
    'Fristenwarnung, begründete Ampel, Fall-Timeline und genau ein priorisierter nächster Schritt',
    'Nachweislücken, dokumentübergreifende Abweichungen und daraus abgeleitete konkrete Aufgaben',
    'Professionelle Übergabeakte für Anwalt, Versicherung oder Berater','allen 10 App-Sprachen',
    'AS%20Gold%20V45%20Testfeedback','V45 ist ein kontrollierter Produkttest',
    '/testdaten/AS_Gold_Synthetischer_Testfall_V29.pdf','Die Bezahlfunktion bleibt deaktiviert.'
  ]
  for(const text of required){if(!page.includes(text)) throw new Error(`V45 tester guide missing: ${text}`)}
}

for(const stale of ['Testerbetrieb V33','Testerbetrieb V38','AS Gold V33 sicher','AS Gold V38 sicher ausprobieren','AS%20Gold%20V33%20Testfeedback','AS%20Gold%20V38%20Testfeedback','V33 ist ein kontrollierter Produkttest','V38 ist ein kontrollierter Produkttest']){
  if(page.includes(stale)) throw new Error(`Stale tester-guide version found: ${stale}`)
}
