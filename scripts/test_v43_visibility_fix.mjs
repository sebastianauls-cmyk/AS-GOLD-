import assert from 'node:assert/strict'
import fs from 'node:fs'

const language=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const video=fs.readFileSync(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.doesNotMatch(layout,/V43VisibilityFix/,'legacy global V43 overlay must not be mounted')
assert.match(language,/backButtonText=\{de:'← Zurück'/,'localized Back labels must be owned by the language module')
assert.match(language,/className="flagLanguageMenuBack"/,'language menus must expose one local Back control')
assert.match(language,/aria-label=\{backLabel\.replace/,'Back control must expose a localized accessible label')
assert.equal((language.match(/className="flagLanguageMenuBack"/g)||[]).length,2,'the mutually exclusive public and standard switcher branches must each define one Back control')
assert.match(language,/explainerVideoTrigger/)
assert.match(language,/explainerButtonText/)
assert.match(video,/Erklärvideo/)
assert.match(video,/as-gold-v35-de\.mp4/)
assert.doesNotMatch(language,/history\.back/,'language menu must close via local React state, not browser history')
assert.doesNotMatch(language,/data-v43-visible-controls/,'legacy V43 duplicate-control marker must be absent')
console.log('V43 replacement guard passed: legacy overlay removed; modular localized Back, language and explainer controls are preserved without browser-history hacks.')
