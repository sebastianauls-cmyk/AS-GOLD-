import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const styles=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

const resetIndex=modules.indexOf('className="publicBackButton"')
const interfaceIndex=modules.indexOf('className="publicLanguageModule interfaceModule"')
assert.ok(resetIndex>0&&resetIndex<interfaceIndex,'German return must be independent and before both language modules')
assert.match(modules,/dir="ltr" onClick=\{returnToGerman\}/)
assert.match(modules,/Back to German \/ Zurück zu Deutsch/)
assert.match(modules,/onLanguageChange\('de'\)/)
assert.match(modules,/onOutputLanguageChange\('de'\)/)
assert.match(styles,/\.publicBackButton\{grid-column:1\/-1;justify-self:end;/)
assert.match(styles,/@media\(max-width:760px\)[\s\S]*\.publicBackButton\{width:100%;max-width:none;justify-self:stretch\}/)

console.log('V68 return-language guard passed: a bilingual German reset stands independently outside both language modules.')
