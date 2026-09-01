import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const navigator=fs.readFileSync(new URL('../app/components/ProblemNavigator.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
const flow=fs.readFileSync(new URL('../app/components/HomepageFlowAnchors.js',import.meta.url),'utf8')

assert.doesNotMatch(modules,/id="asgold-customer-module-slot"/)
assert.doesNotMatch(modules,/outputCustomerButton/)
assert.doesNotMatch(modules,/querySelector\('textarea'\)\?\.focus/)
assert.match(navigator,/getElementById\('asgold-customer-module-slot'\)/)
assert.match(flow,/asgold-problem-slot/)
assert.match(navigator,/Strefa klienta · Polski/)
assert.match(navigator,/data-customer-language=\{outputLanguage\}/)
assert.match(css,/\.homepageFlow\{/)

console.log('V57 customer-language jump checks passed')
