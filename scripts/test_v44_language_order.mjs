import assert from 'node:assert/strict'
import fs from 'node:fs'
const page=fs.readFileSync(new URL('../app/page.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.match(page,/1\. Sprache der Oberfläche/)
assert.match(page,/2\. Ausgabesprache/)
assert.match(page,/className="publicLanguageStack"/)
assert.match(page,/publicPicker/)
assert.match(page,/value=\{outputLanguage\} onChange=\{setOutputLanguage\}/)
assert.doesNotMatch(layout,/V44LanguageOrder/)
console.log('Language-order guard passed: interface and output language are rendered directly, visibly and without DOM relocation.')
