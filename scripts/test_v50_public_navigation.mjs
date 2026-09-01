import assert from 'node:assert/strict'
import fs from 'node:fs'

const page=fs.readFileSync('app/page.js','utf8')
const switcher=fs.readFileSync('app/components/LanguageSwitcher.js','utf8')
const modules=fs.readFileSync('app/components/PublicLanguageModules.js','utf8')
const microphone=fs.readFileSync('app/components/ProblemNavigator.js','utf8')
const css=fs.readFileSync('app/globals.css','utf8')

assert.match(page,/PublicLanguageModules/)
assert.equal((modules.match(/<LanguageSwitcher/g)||[]).length,2)
assert.equal((modules.match(/className="publicBackButton"/g)||[]).length,1)
assert.match(modules,/data-output-language-status/)
assert.match(modules,/female:'Frau erklärt'/)
assert.match(modules,/male:'Mann erklärt'/)
assert.match(switcher,/publicPicker=false/)
assert.match(switcher,/active\.label/)
assert.match(switcher,/flagLanguageMenuBack/)
assert.match(css,/\.publicLanguageModules/)
assert.match(css,/\.flagLanguageMenu \.flagLanguageMenuBack/)
assert.match(microphone,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/)
assert.match(microphone,/navigator\.permissions/)
assert.doesNotMatch(microphone,/getUserMedia/)
assert.match(microphone,/rec\.onaudiostart/)
assert.match(microphone,/aria-live="polite"/)

console.log('V50 navigation guard passed: two public language modules, permanent Back button, presenter choices and microphone activation feedback are present.')
