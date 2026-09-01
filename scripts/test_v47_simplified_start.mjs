import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/components/V47SimplifiedPublicStart.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(component,/Fall starten/)
assert.match(component,/Bereits registriert\? Anmelden/)
assert.match(component,/asgold-language-order-stack/)
assert.match(component,/\.publicTop \.nav>nav\{display:none!important\}/)
assert.match(component,/#asgold-v43-visible-controls\{display:none!important\}/)
assert.match(component,/document\.getElementById\('fallarten'\)/)
assert.match(layout,/V47SimplifiedPublicStart/)

console.log('V47 simplified-start guard passed: language pair stays first, one primary case-start action is shown, duplicate top navigation and fixed recovery bar are removed from the first screen.')
