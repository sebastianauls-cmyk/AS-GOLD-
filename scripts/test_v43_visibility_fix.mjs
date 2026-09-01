import assert from 'node:assert/strict'
import fs from 'node:fs'

const language=fs.readFileSync(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.doesNotMatch(layout,/V43VisibilityFix/)
assert.equal((language.match(/aria-label="Zurück"/g)||[]).length,1)
assert.equal((language.match(/>← Zurück<\/button>/g)||[]).length,1)
assert.match(language,/asgold:open-explainer/)
assert.doesNotMatch(language,/role="dialog"/)
console.log('V43 recovery guard passed: legacy floating controls are removed and language navigation has one Back action and one explainer source.')
