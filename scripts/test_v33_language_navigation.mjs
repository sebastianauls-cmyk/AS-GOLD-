import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { supportedLanguages } from '../app/lib/v30Languages.mjs'

const switcherSource=await readFile(new URL('../app/components/LanguageSwitcher.js',import.meta.url),'utf8')
const legalDocumentSource=await readFile(new URL('../app/components/LegalDocument.js',import.meta.url),'utf8')
const pageSource=await readFile(new URL('../app/page.js',import.meta.url),'utf8')
const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8')
const v33Styles=css.slice(css.indexOf('/* V33:'))

assert.equal(supportedLanguages.length,8,'V33 must keep all eight active languages')
assert.match(switcherSource,/aria-controls=\{open\?menuId:undefined\}/)
assert.match(switcherSource,/flagLanguageOptionMain/)
assert.match(switcherSource,/flagLanguageName/)
assert.match(v33Styles,/\.flagLanguageMenu\{[^}]*grid-template-columns:1fr/)
assert.match(v33Styles,/max-height:calc\(100dvh - 24px\)/)
assert.match(v33Styles,/\.appHeaderTools \.flagLanguageLabeled\{[^}]*grid-column:1\/-1/)
assert.match(v33Styles,/\.legalHeaderActions \.btn\{display:inline-flex\}/)
assert.match(pageSource,/className="backBtn full authBackBtn"/)
assert.match(legalDocumentSource,/className="secondary btn legalBackBtn"/)
assert.match(legalDocumentSource,/rtlLanguages\.has\(language\)\?'→':'←'/)

console.log('V33 Oberfläche: Sprachwahl vertikal sichtbar und Zurück-Navigation eindeutig geprüft.')
