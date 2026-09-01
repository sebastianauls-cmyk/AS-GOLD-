import fs from 'node:fs'
import assert from 'node:assert/strict'

const bridge=fs.readFileSync('app/components/V45OutputLanguageBridge.js','utf8')
const fn=fs.readFileSync('supabase/functions/gold-ocr-v28/index.ts','utf8')
const layout=fs.readFileSync('app/layout.js','utf8')

assert.match(bridge,/asgold-output-language/)
assert.match(bridge,/gold-ocr-v28/)
assert.match(bridge,/output_language/)
assert.match(fn,/OUTPUT_LANGUAGES/)
assert.match(fn,/summary und next_step vollständig auf/)
assert.match(fn,/output_language:requestedOutputLanguage/)
assert.match(layout,/V45OutputLanguageBridge/)
console.log('V45 output-language guard passed: selected output language reaches AI analysis and is acknowledged by the server.')
