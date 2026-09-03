import assert from 'node:assert/strict'
import fs from 'node:fs'
import { recommendProblem } from '../app/modules/public/problemRecommendationV73.mjs'
import { getProblemLanguageProfile } from '../app/modules/public/problemNavigatorLanguagesV36.mjs'

const profile=getProblemLanguageProfile('de')
const cases=[
  {
    label:'Minimum',
    text:'Auf der Stromrechnung steht ein Zahlendreher. Gefordert werden 286,40 EUR. Rechnung und Foto des Zählerstands sind vorhanden. Bitte kurz prüfen und eine Antwort vorbereiten.',
    planKey:'start',caseKey:'contract'
  },
  {
    label:'Mittel',
    text:'Aus der Rechnung über 1.147,92 EUR wurden Mahnung und Inkasso. Es läuft eine Frist für meinen Widerspruch.',
    planKey:'klar',caseKey:'contract'
  },
  {
    label:'Groß',
    text:'Der Energieversorger hat eine Bonitätsmeldung veranlasst. Die Bank hat deshalb meine Kreditlinie gekürzt. Zusätzlich gibt es eine Sperrandrohung und widersprüchliche Unterlagen.',
    planKey:'analyse',caseKey:'contract'
  },
  {
    label:'Kritisch',
    text:'Der Strom ist seit 56 Stunden gesperrt. Kühlware ist verdorben und es gibt Betriebsausfall. Die Versicherung lehnt den Schaden ab; auch der Vermieter fordert Ersatz.',
    planKey:'komplett',caseKey:'insurance'
  },
  {
    label:'Maximum',
    text:'Der Gesamtkomplex beträgt 104.310,02 EUR und betrifft sieben Parteien. Ein Team braucht Rollen und Rechte, Admin-Zugang, Audit-Protokoll, mehrere Fälle und einen Gesamtexport.',
    planKey:'business',caseKey:'business'
  }
]

for(const expected of cases){
  const actual=recommendProblem(expected.text,profile)
  assert.equal(actual.planKey,expected.planKey,`${expected.label}: wrong plan`)
  assert.equal(actual.caseKey,expected.caseKey,`${expected.label}: wrong case type`)
}

const controller=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')
const landing=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')
const navigator=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8')
const tester=fs.readFileSync('app/modules/tester/TesterGuide.js','utf8')
assert.match(controller,/const publicLanguage=language/)
assert.doesNotMatch(controller,/const publicLanguage=outputLanguage/)
assert.match(landing,/heroTitleCopy\[language\]/)
assert.match(landing,/<ProblemNavigator outputLanguage=\{outputLanguage\} language=\{language\}/)
assert.match(navigator,/data-interface-language=\{interfaceLanguage\}/)
assert.match(navigator,/getProblemLanguageProfile\(customerLanguage\)/)
assert.match(tester,/Testerbetrieb V7[34]/)
assert.match(tester,/Feedback zu V7[34] senden/)

console.log('V73 recommendation/language guard passed: Min-to-Max is 5/5, case routing is corrected, and interface/output languages remain separate.')
