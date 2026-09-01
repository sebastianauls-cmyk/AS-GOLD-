import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const styles=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

assert.equal((modules.match(/welcome:'/g)||[]).length,10)
assert.match(modules,/Willkommen bei AS Gold – schön, dass Sie da sind\./)
assert.ok(modules.indexOf('className="publicWelcome"')<modules.indexOf('className="publicLanguageModule interfaceModule"'))
assert.match(modules,/🇩🇪 Alles auf Deutsch/)
assert.match(modules,/onLanguageChange\('de'\)/)
assert.match(modules,/onOutputLanguageChange\('de'\)/)
assert.match(styles,/\.publicWelcome\{grid-column:1\/-1;/)

console.log('V64 welcome/reset guard passed: greeting comes first and the German reset is unambiguous.')
