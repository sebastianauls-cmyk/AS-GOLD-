import assert from 'node:assert/strict'
import fs from 'node:fs'

const mobile=fs.readFileSync(new URL('../app/modules/navigation/MobileResilience.js',import.meta.url),'utf8')
const compatibility=fs.readFileSync(new URL('../app/components/V38MobileResilience.js',import.meta.url),'utf8')
const language=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const styles=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')

assert.match(mobile,/@media\(max-width:560px\)/)
assert.match(mobile,/overflow-wrap:anywhere/)
assert.match(mobile,/max-width:100%/)
assert.match(mobile,/v38DeadlineWarningCard/)
assert.match(mobile,/v38PrimaryNextStep/)
assert.match(mobile,/v38AssessmentWhy/)
assert.match(mobile,/flagLanguagePublicPicker/)
assert.match(compatibility,/modules\/navigation\/MobileResilience/)
assert.match(language,/backButtonText=\{de:'← Zurück'/,'German localized back label must remain available')
assert.match(language,/className="flagLanguageMenuBack"/,'language menus must expose an explicit back control')
assert.match(language,/aria-label=\{backLabel\.replace/,'back control must expose a localized accessible label')
assert.equal((language.match(/className="flagLanguageMenuBack"/g)||[]).length,2,'public and standard switcher branches are mutually exclusive and must each contain one back control')
assert.match(styles,/\.flagLanguageMenu\{[^}]*max-height:calc\(100dvh - 92px\)[^}]*overflow-y:auto/s)
assert.match(styles,/@media\(max-width:700px\)\{\s*\.flagLanguageMenu\{[^}]*position:fixed[^}]*max-height:calc\(100dvh - 24px\)/s)
assert.match(layout,/modules\/navigation\/MobileResilience/)
assert.match(layout,/<MobileResilience\/>/)

console.log('V38 mobile resilience guard passed: responsive behavior is owned by the navigation module and each rendered language menu exposes one scrollable localized back control.')
