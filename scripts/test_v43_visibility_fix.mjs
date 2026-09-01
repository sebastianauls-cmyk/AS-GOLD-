import assert from 'node:assert/strict'
import fs from 'node:fs'

const language=fs.readFileSync(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const publicModules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.doesNotMatch(layout,/V43VisibilityFix/)
assert.match(language,/backButtonText/)
assert.match(language,/flagLanguageMenuBack/)
assert.match(language,/asgold:open-explainer/)
assert.equal((publicModules.match(/className="publicBackButton"/g)||[]).length,1)
assert.match(publicModules,/back:'Zurück'/)
assert.match(publicModules,/asgold:open-explainer/)
assert.doesNotMatch(language,/role="dialog"/)
console.log('V43 recovery guard passed: legacy floating controls are removed and each language menu has a Back action without duplicating the explainer source.')
