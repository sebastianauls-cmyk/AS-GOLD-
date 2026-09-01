import assert from 'node:assert/strict'
import fs from 'node:fs'

const language=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const video=fs.readFileSync(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.doesNotMatch(layout,/V43VisibilityFix/,'legacy global V43 overlay must not be mounted')
assert.match(language,/aria-label="Zurück"/)
assert.equal((language.match(/aria-label="Zurück"/g)||[]).length,1,'exactly one language-menu back control expected')
assert.match(language,/explainerVideoTrigger/)
assert.match(language,/videoButtonText/)
assert.match(video,/Erklärvideo/)
assert.match(video,/as-gold-v35-de\.mp4/)
assert.doesNotMatch(language,/history\.back/,'language menu must close via local React state, not browser history')
assert.doesNotMatch(language,/data-v43-visible-controls/,'legacy V43 duplicate-control marker must be absent')
console.log('V43 replacement guard passed: legacy overlay removed; modular Back, language and explainer controls are preserved without browser-history hacks.')
