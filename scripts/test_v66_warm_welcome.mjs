import assert from 'node:assert/strict'
import fs from 'node:fs'

const modules=fs.readFileSync(new URL('../app/components/PublicLanguageModules.js',import.meta.url),'utf8')
const styles=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')

assert.match(modules,/const warmWelcome=\{/)
assert.match(modules,/Herzlich willkommen bei AS Gold – hier sind Sie richtig/)
assert.match(modules,/warmWelcome\[language\]\|\|warmWelcome\.de/)
assert.match(styles,/\.publicWelcome\{[^\n]*font-size:1\.08rem/)
assert.match(styles,/\.publicWelcome\{[^\n]*background:linear-gradient/)
assert.match(styles,/\.publicWelcome span\{font-size:1\.35rem/)

console.log('V66 welcome guard passed: the greeting is warmer, larger and clearly visible before language selection.')
