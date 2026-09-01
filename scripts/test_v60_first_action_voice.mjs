import assert from 'node:assert/strict'
import fs from 'node:fs'

const firstAction=fs.readFileSync(new URL('../app/components/V37FirstAction.js',import.meta.url),'utf8')
const problemNavigator=fs.readFileSync(new URL('../app/components/ProblemNavigator.js',import.meta.url),'utf8')

for(const label of ['Problem einsprechen','Speak problem','Dicter le problème','Sorunu sesli anlat','Powiedz problem','Продиктовать проблему','قل المشكلة','بیان صوتی مشکل','Spuneți problema','Кажете проблема']){
  assert.ok(firstAction.includes(label),`missing localized microphone label: ${label}`)
}
assert.match(firstAction,/data-first-action-voice/)
assert.match(firstAction,/querySelector\('\[data-problem-voice\]'\)/)
assert.match(firstAction,/microphone\.click\(\)/)
assert.match(firstAction,/aria-controls='asgold-problem-navigator-react'/)
assert.match(problemNavigator,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/)
assert.match(problemNavigator,/rec\.lang=getSpeechLocale\(outputLanguage\)/)
assert.match(problemNavigator,/rec\.onresult=/)
assert.match(problemNavigator,/updateValue\(\[base,spoken\]/)

console.log('V60 first-action speech-recognition guard passed in all ten customer languages.')
