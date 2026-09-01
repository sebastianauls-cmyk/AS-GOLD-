import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const navigator=fs.readFileSync(new URL('../app/components/ProblemNavigator.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

assert.match(modules,/id="asgold-customer-module-slot"/)
assert.match(modules,/className="customerModuleSlot"/)
assert.doesNotMatch(modules,/outputCustomerButton/)
assert.doesNotMatch(modules,/querySelector\('textarea'\)\?\.focus/)
assert.match(navigator,/getElementById\('asgold-customer-module-slot'\)/)
assert.match(navigator,/Strefa klienta · Polski/)
assert.match(navigator,/data-customer-language=\{outputLanguage\}/)
assert.match(css,/\.customerModuleSlot\{/)

console.log('V57 customer-language jump checks passed')
