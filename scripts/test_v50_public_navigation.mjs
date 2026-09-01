import assert from 'node:assert/strict'
import fs from 'node:fs'

const page=fs.readFileSync('app/page.js','utf8')
const switcher=fs.readFileSync('app/components/LanguageSwitcher.js','utf8')
const microphone=fs.readFileSync('app/components/ProblemNavigator.js','utf8')
const css=fs.readFileSync('app/globals.css','utf8')

assert.match(page,/publicBackBtn/)
assert.match(page,/returnToPublicTop/)
assert.match(page,/data-output-language-status/)
assert.match(page,/publicNav\.output/)
assert.match(switcher,/publicPicker=false/)
assert.match(switcher,/active\.label/)
assert.match(switcher,/flagLanguageMenuBack/)
assert.match(css,/\.publicLanguageStack/)
assert.match(css,/\.flagLanguageMenu \.flagLanguageMenuBack/)
assert.match(microphone,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/)
assert.match(microphone,/navigator\.permissions/)
assert.doesNotMatch(microphone,/getUserMedia/)
assert.match(microphone,/rec\.onaudiostart/)
assert.match(microphone,/aria-live="polite"/)

console.log('V50 navigation guard passed: public Back button, explicit active language, output-language menu Back button and microphone activation feedback are present.')
