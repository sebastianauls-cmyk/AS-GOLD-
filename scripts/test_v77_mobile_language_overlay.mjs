import assert from 'node:assert/strict'
import fs from 'node:fs'

const switcher=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

assert.match(switcher,/className="flagLanguageBackdrop"/,'an open mobile language menu needs a backdrop')
assert.match(switcher,/flagLanguageOpen/,'the open control must sit above neighboring language controls')
assert.match(switcher,/document\.body\.style\.overflow='hidden'/,'the page behind the mobile menu must not keep scrolling')
assert.match(switcher,/onPointerDown=\{\(\)=>setOpen\(false\)\}/,'tapping the backdrop must close the language menu')
assert.match(css,/\.flagLanguageBackdrop\{display:block;position:fixed;z-index:190;inset:0/,'the mobile backdrop must cover the viewport')
assert.match(css,/\.flagLanguage\.flagLanguageOpen\{z-index:300\}/,'the open control must create the top stacking layer')
assert.match(css,/\.flagLanguageMenu,\.publicLanguageModule \.flagLanguageMenu\{z-index:200/,'the language choices must remain above the backdrop')

console.log('V77 mobile language overlay passed: isolated menu and locked background.')
