import assert from 'node:assert/strict'
import fs from 'node:fs'

const switcher=fs.readFileSync(new URL('../app/modules/language/LanguageSwitcher.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

assert.match(switcher,/className="flagLanguageBackdrop"/,'an open mobile language menu needs a backdrop')
assert.match(switcher,/flagLanguageOpen/,'the open control must sit above neighboring language controls')
assert.match(switcher,/document\.body\.style\.overflow='hidden'/,'the page behind the mobile menu must not keep scrolling')
assert.match(switcher,/onPointerDown=\{\(\)=>setOpen\(false\)\}/,'tapping the backdrop must close the language menu')
assert.match(switcher,/menuRef\.current\.scrollTop=0/,'every opened language menu must start with the first option')
assert.match(css,/\.flagLanguageBackdrop\{display:block;position:fixed;z-index:190;inset:0/,'the mobile backdrop must cover the viewport')
assert.match(css,/\.flagLanguage\.flagLanguageOpen\{z-index:300\}/,'the open control must create the top stacking layer')
assert.match(css,/\.flagLanguageMenu,\.publicLanguageModule \.flagLanguageMenu\{z-index:200/,'the language choices must remain above the backdrop')
assert.match(css,/top:max\(8px,env\(safe-area-inset-top\)\)/,'the menu must begin at the visible top edge on mobile')
assert.match(css,/overflow-y:scroll/,'the complete language list must scroll vertically')
assert.match(css,/touch-action:pan-y/,'the language list must accept downward touch gestures')

console.log('V77 mobile language overlay passed: isolated, top-aligned and vertically touch-scrollable menu.')
