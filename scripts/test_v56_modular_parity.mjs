import assert from 'node:assert/strict'
import fs from 'node:fs'
import { caseFrequencyWeight, caseOrder, orderCasesByResearch, researchedCaseVolumes } from '../app/modules/public/casePriorityV56.mjs'

assert.deepEqual(caseOrder,['work','contract','authority','property','insurance','business','dispute','private'])
assert.ok(researchedCaseVolumes.work>researchedCaseVolumes.insurance)
assert.ok(caseFrequencyWeight.work>caseFrequencyWeight.insurance)
assert.deepEqual(orderCasesByResearch(caseOrder.map(key=>({key})).reverse()).map(item=>item.key),caseOrder)

const navigator=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8')
const landing=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')
const languageModules=fs.readFileSync('app/modules/public/PublicLanguageModules.js','utf8')
const workspace=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')
const css=fs.readFileSync('app/globals.css','utf8')

assert.match(navigator,/count\*1000/)
assert.match(navigator,/data-customer-language=\{customerLanguage\}/)
assert.match(navigator,/getSpeechLocale\(customerLanguage\)/)
assert.match(navigator,/textRef\.current\?\.value\?\?value/)
assert.match(navigator,/onInput=\{event=>updateValue\(event\.currentTarget\.value\)\}/)
assert.match(navigator,/<form onSubmit=\{event=>\{event\.preventDefault\(\);analyse\(\)\}\}/)
assert.match(navigator,/textRef\.current\?\.blur\(\)/)
assert.match(navigator,/resultRef\.current\?\.scrollIntoView/)
assert.doesNotMatch(navigator,/MutationObserver|createPortal/)

assert.match(languageModules,/1\. Sprache der Oberfläche/)
assert.match(languageModules,/2\. Sprache für Ausgabe & Kunden/)
assert.match(languageModules,/id="asgold-customer-module-slot"/)
assert.match(languageModules,/className="customerModuleSlot"/)
assert.match(languageModules,/\{customerModule\}/)
assert.doesNotMatch(languageModules,/getElementById|querySelector|MutationObserver|createPortal/)
assert.match(landing,/PublicLanguageModules/)
assert.match(landing,/customerModule=\{customerModule\}/)
assert.match(landing,/ProblemNavigator outputLanguage=\{outputLanguage\}/)
assert.match(landing,/className="secondary heroVoiceShortcut"/)
assert.match(landing,/orderedPublicCases\.map/)

assert.match(workspace,/document\.documentElement\.dataset\.outputLanguage=outputLanguage/)
assert.match(workspace,/CustomEvent\('asgold:output-language'/)
assert.match(workspace,/getV24Copy\(outputLanguage\)/)
assert.match(workspace,/getV25ApprovalCopy\(outputLanguage\)/)
assert.match(workspace,/orderCasesByResearch\(cd\.cases\)/)
assert.match(workspace,/useState\('work'\)/)

assert.match(css,/\.publicTop\{position:relative;top:auto\}/)
assert.match(css,/\.outputModule p\{display:none\}/)
assert.match(css,/\.publicLanguageModules\{/)
assert.match(css,/\.customerModuleSlot\{/)
assert.match(css,/#asgold-problem-navigator-react\{scroll-margin-top:16px\}/)

console.log('V58 direct modular parity checks passed: interface language, customer/output language and customer navigator are directly owned by modular React components.')
