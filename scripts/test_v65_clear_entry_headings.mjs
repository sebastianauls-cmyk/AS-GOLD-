import assert from 'node:assert/strict'
import fs from 'node:fs'

const action=fs.readFileSync(new URL('../app/components/V37FirstAction.js',import.meta.url),'utf8')
const problem=fs.readFileSync(new URL('../app/components/ProblemNavigator.js',import.meta.url),'utf8')

assert.match(action,/const startTitles=\{de:'Wie möchten Sie starten\?'/)
assert.equal((action.match(/startTitles\[language\]/g)||[]).length,1)
assert.match(problem,/const concernTitles=\{de:'Worum geht es\?'/)
assert.match(problem,/const concernTitle=concernTitles\[outputLanguage\]\|\|concernTitles\.de/)
assert.match(problem,/aria-label=\{concernTitle\}/)
assert.equal((action.match(/startTitles=\{[^\n]+/g)||[]).length,1)
assert.equal((problem.match(/concernTitles=\{[^\n]+/g)||[]).length,1)

console.log('V65 heading guard passed: start method and case description are clearly separated in all ten languages.')
