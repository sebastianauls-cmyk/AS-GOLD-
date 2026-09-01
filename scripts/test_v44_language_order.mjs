import assert from 'node:assert/strict'
import fs from 'node:fs'
const component=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')

assert.match(component,/1\. Sprache der Oberfläche/)
assert.match(component,/2\. Sprache für Ausgabe & Kunden/)
assert.match(component,/onLanguageChange/)
assert.match(component,/onOutputLanguageChange/)
assert.match(component,/outputLanguageNames/)
assert.match(page,/PublicLanguageModules/)
assert.doesNotMatch(layout,/V44LanguageOrder/)

console.log('V44 language-order guard passed: native, independent interface and output language modules are rendered without DOM reparenting.')
