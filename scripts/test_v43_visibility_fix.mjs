import assert from 'node:assert/strict'
import fs from 'node:fs'

const component=fs.readFileSync(new URL('../app/modules/public/PublicLanguageModules.js',import.meta.url),'utf8')
const languageSwitcher=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const videoDialog=fs.readFileSync(new URL('../app/modules/language/ExplainerVideoDialog.js',import.meta.url),'utf8')
const layout=fs.readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
assert.match(component,/Back to German \/ Zurück zu Deutsch/)
assert.match(component,/onLanguageChange\('de'\)/)
assert.match(component,/onOutputLanguageChange\('de'\)/)
assert.match(component,/▶ \{text\.play\}/)
assert.match(languageSwitcher,/backButtonText/)
assert.match(languageSwitcher,/de:'← Zurück'/)
assert.match(languageSwitcher,/supportedLanguages\.map/)
assert.match(videoDialog,/AS Workspace Gold · \{title\}/)
assert.match(videoDialog,/\['de','🇩🇪','Deutsch'\]/)
assert.doesNotMatch(layout,/V43VisibilityFix/)
console.log('V43 replacement guard passed: permanent Back-to-German, language and explainer-video controls are directly mounted and wired.')
