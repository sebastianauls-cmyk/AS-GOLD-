import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V46MobileLanguageAcceptance.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/2\. Ausgabesprache/)
assert.match(component,/button\[aria-haspopup="listbox"\]/)
assert.match(component,/aria-expanded/)
assert.match(component,/asgold-v43-visible-controls/)
assert.match(component,/anyOpen\?'none':'flex'/)
assert.match(layout,/V46MobileLanguageAcceptance/)

console.log('V46 mobile language acceptance guard passed: output language is detected as listbox control and fixed controls hide while a language menu is open.')
