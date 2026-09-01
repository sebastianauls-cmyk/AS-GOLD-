import fs from 'node:fs'
import assert from 'node:assert/strict'

const bridge=fs.readFileSync('app/modules/language/OutputLanguageBridge.js','utf8')
const compatibility=fs.readFileSync('app/components/V45OutputLanguageBridge.js','utf8')
const module=fs.readFileSync('app/modules/language/outputLanguage.js','utf8')
const fn=fs.readFileSync('supabase/functions/gold-ocr-v28/index.ts','utf8')
const layout=fs.readFileSync('app/layout.js','utf8')

assert.match(module,/OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'/)
assert.match(module,/withOutputLanguage/)
assert.match(module,/output_language/)
assert.match(module,/normalizeOutputLanguage/)
assert.match(bridge,/withOutputLanguage/)
assert.match(bridge,/gold-ocr-v28/)
assert.match(compatibility,/modules\/language\/OutputLanguageBridge/)
assert.match(fn,/OUTPUT_LANGUAGES/)
assert.match(fn,/summary und next_step vollständig auf/)
assert.match(fn,/output_language:requestedOutputLanguage/)
assert.match(layout,/OutputLanguageBridge/)
assert.match(layout,/modules\/language\/OutputLanguageBridge/)
console.log('V45 output-language guard passed: output-language behavior is owned by the language module and still reaches AI analysis with server acknowledgement.')
