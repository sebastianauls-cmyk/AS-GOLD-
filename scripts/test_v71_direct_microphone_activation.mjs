import assert from 'node:assert/strict'
import fs from 'node:fs'

const landing=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')
const problem=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8')

assert.match(problem,/data-problem-voice onClick=\{voice\}/,'the only voice CTA must call speech directly from the user click')
assert.doesNotMatch(landing,/V37FirstAction|problemNavigatorRef|setProblemVoiceSignal|setProblemFocusSignal/,'public landing must not restore a duplicate routed entry card')
assert.match(problem,/forwardRef/,'problem navigator must expose an explicit React imperative handle')
assert.match(problem,/useImperativeHandle/,'problem navigator must expose speak/focus without DOM lookup')
assert.match(problem,/speak\(\)\{[\s\S]*?voice\(\)/,'imperative speak handle must call voice directly')
assert.doesNotMatch(landing,/querySelector|getElementById\('asgold-problem-navigator-react'\)/,'public composition must not restore DOM-based microphone routing')

console.log('V71 direct microphone activation guard passed: the single problem-card microphone reaches speech recognition directly, without duplicate routing or DOM lookup.')
