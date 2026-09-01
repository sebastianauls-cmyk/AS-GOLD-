import assert from 'node:assert/strict'
import fs from 'node:fs'

const mobile=fs.readFileSync(new URL('../app/components/V38MobileResilience.js',import.meta.url),'utf8')
const language=fs.readFileSync(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const publicModules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(mobile,/@media\(max-width:560px\)/)
assert.match(mobile,/overflow-wrap:anywhere/)
assert.match(mobile,/max-width:100%/)
assert.match(mobile,/v38DeadlineWarningCard/)
assert.match(mobile,/v38PrimaryNextStep/)
assert.match(mobile,/v38AssessmentWhy/)
assert.match(mobile,/flagLanguagePublicPicker/)
assert.match(language,/backButtonText/)
assert.match(language,/flagLanguageMenuBack/)
assert.match(language,/maxHeight:'calc\(100dvh - 150px\)'/)
assert.match(language,/overflowY:'auto'/)
assert.match(css,/@media\(max-width:760px\)/)
assert.match(publicModules,/back:'Zurück'/)
assert.equal((publicModules.match(/className="publicBackButton"/g)||[]).length,1)
assert.match(css,/max-height:calc\(100dvh - 16px\)/)
assert.match(css,/\.flagLanguageMenu\{[^}]*overflow-y:auto/)
assert.match(layout,/V38MobileResilience/)

console.log('V38 mobile resilience guard passed: 560px layout, long-text wrapping, V38 cards, scrollable language menu and permanent German Back button verified.')
