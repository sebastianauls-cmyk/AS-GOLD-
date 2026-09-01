import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')

assert.match(modules,/function returnToGerman\(\)/)
assert.match(modules,/onLanguageChange\('de'\)/)
assert.match(modules,/onClick=\{returnToGerman\}/)
assert.match(modules,/🇩🇪 Deutsch/)
assert.match(modules,/aria-label="Oberfläche auf Deutsch zurückstellen"/)
assert.doesNotMatch(modules,/onOutputLanguageChange\('de'\)/)

console.log('V62 German-return guard passed: interface returns to German without changing the customer language.')
