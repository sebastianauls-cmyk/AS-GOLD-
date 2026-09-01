import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')

assert.match(modules,/function returnToGerman\(\)/)
assert.match(modules,/onLanguageChange\('de'\)/)
assert.match(modules,/onOutputLanguageChange\('de'\)/)
assert.match(modules,/onClick=\{returnToGerman\}/)
assert.match(modules,/🇩🇪 Back to German \/ Zurück zu Deutsch/)
assert.match(modules,/aria-label="Back to German – Oberfläche und Kundensprache auf Deutsch zurückstellen"/)

console.log('V63 German-reset guard passed: interface and customer output return to German together.')
