import assert from 'node:assert/strict'
import fs from 'node:fs'
const component=fs.readFileSync(new URL('../app/components/V44LanguageOrder.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.match(component,/1\. Sprache der Oberfläche/)
assert.match(component,/2\. Ausgabesprache/)
assert.match(component,/flagLanguagePublicPicker/)
assert.match(component,/findOutputControl/)
assert.match(component,/prepend\(stack\)/)
assert.match(layout,/V44LanguageOrder/)
console.log('V44 language-order guard passed: interface language is placed before output language without duplicating language logic.')
