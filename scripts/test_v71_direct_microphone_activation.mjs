import assert from 'node:assert/strict'
import fs from 'node:fs'

const landing=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')
const action=fs.readFileSync('app/modules/public/V37FirstAction.js','utf8')
const problem=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8')

assert.match(action,/onClick=\{speakProblem\}/,'voice CTA must call its callback directly from the user click')
assert.match(action,/const speakProblem=\(\)=>onSpeakProblem\?\.\(\)/,'first-action voice callback must stay synchronous')
assert.match(landing,/const problemNavigatorRef=useRef\(null\)/,'public landing must hold an explicit problem navigator ref')
assert.match(landing,/onSpeakProblem=\{\(\)=>problemNavigatorRef\.current\?\.speak\(\)\}/,'first-action voice click must synchronously call the navigator speak handle')
assert.match(landing,/onFocusProblem=\{\(\)=>problemNavigatorRef\.current\?\.focus\(\)\}/,'first-action text click must synchronously call the navigator focus handle')
assert.match(landing,/<ProblemNavigator ref=\{problemNavigatorRef\}/,'problem navigator must receive the explicit React ref')
assert.doesNotMatch(landing,/setProblemVoiceSignal|setProblemFocusSignal/,'public first-action flow must not depend on delayed state signals')
assert.match(problem,/forwardRef/,'problem navigator must expose an explicit React imperative handle')
assert.match(problem,/useImperativeHandle/,'problem navigator must expose speak/focus without DOM lookup')
assert.match(problem,/speak\(\)\{[\s\S]*?voice\(\)/,'imperative speak handle must call voice directly')
assert.doesNotMatch(landing,/querySelector|getElementById\('asgold-problem-navigator-react'\)/,'public composition must not restore DOM-based microphone routing')
assert.doesNotMatch(action,/querySelector|getElementById|CustomEvent\('asgold:open-problem'/,'first-action module must not restore legacy DOM/event routing')

console.log('V71 direct microphone activation guard passed: the first-action microphone reaches speech recognition synchronously through a React ref, without delayed state or DOM lookup.')
