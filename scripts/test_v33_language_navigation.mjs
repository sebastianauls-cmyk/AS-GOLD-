import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { supportedLanguages } from '../app/lib/v30Languages.mjs'

const switcherSource=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const cssSource=await readFile(new URL('../app/globals.css',import.meta.url),'utf8')
const v33Css=cssSource.split('/* V33: sichtbare, senkrechte Sprachauswahl und eindeutige Zurück-Navigation. */')[1]||''

assert.equal(supportedLanguages.length,8,'All eight V32 languages must remain available')
assert.match(switcherSource,/flagLanguageCurrent/,'The selected language name must remain visible in the trigger')
assert.match(switcherSource,/flagLanguageOptionName/,'Every language option must show its full name')
assert.match(switcherSource,/flagLanguageBack/,'The language panel must contain a clear back button')
assert.match(switcherSource,/role="dialog"/,'The panel with its back action must expose dialog semantics')
assert.match(switcherSource,/role="listbox"/,'The language options must remain an accessible listbox')
for(const language of supportedLanguages){
  assert.match(switcherSource,new RegExp(`${language.key}:'[^']+'`),`${language.key}: localized back label missing`)
}

assert.match(v33Css,/\.flagLanguageOptions\{display:grid;grid-template-columns:1fr/,'Language buttons must run from top to bottom')
assert.match(v33Css,/\.flagLanguageTrigger>\.flagIconSet,\.flagLanguageTrigger>\.flagLanguageChevron\{flex:0 0 auto\}/,'Flag and chevron must not squeeze the visible language name')
assert.match(v33Css,/\.flagLanguageTrigger>\.flagLanguageCurrent\{[^}]*flex:1 1 auto/,'The selected language name must keep its natural visible width')
assert.match(v33Css,/\.flagLanguageMenu\{position:fixed;top:12px;right:12px;bottom:12px;left:12px/,'The complete mobile language panel must stay visible')
assert.match(v33Css,/\.appHeaderTools\{[^}]*grid-template-columns:1fr/,'Mobile app language controls must be vertically stacked')
assert.match(v33Css,/\.legalHeaderActions \.btn\{[^}]*display:inline-flex/,'The legal-page back button must stay visible on mobile')
assert.match(v33Css,/\.backBtn,\.authCard>button\.linkBtn:last-of-type/,'Existing app and login back actions must be visually prominent')

console.log('V33 language layout and back navigation: OK')
