import fs from 'node:fs'
import assert from 'node:assert/strict'

const module=fs.readFileSync('app/modules/language/outputLanguage.js','utf8')
const registry=fs.readFileSync('app/modules/language/languageRegistry.mjs','utf8')
const facade=fs.readFileSync('app/modules/language/v36Languages.mjs','utf8')
const service=fs.readFileSync('app/modules/services/documentAnalysis.js','utf8')
const workspace=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const fn=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const workflow=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8')
const workflowModule=fs.readFileSync('app/modules/language/documentLanguageWorkflow.mjs','utf8')
const layout=fs.readFileSync('app/layout.js','utf8')

const languages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']
assert.match(module,/OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'/)
assert.match(module,/normalizeOutputLanguage/)
for(const language of languages){
  assert.match(module,new RegExp(`['\"]${language}['\"]`),`output language registry missing ${language}`)
  assert.match(fn,new RegExp(`['\"]${language}['\"]`),`analysis backend missing ${language}`)
}
assert.match(service,/gold-document-analysis/)
assert.match(service,/output_language:outputLanguage/)
assert.match(workspace,/createDocumentWorkflowActions/)
assert.match(workspace,/outputLanguage/)
assert.match(workspace,/languageRegistry\.mjs/)
assert.match(registry,/LANGUAGE_CATALOG/)
assert.match(facade,/languageRegistry\.mjs/)
assert.doesNotMatch(facade,/LANGUAGE_CATALOG\s*=|pageTranslations\s*=/)
assert.doesNotMatch(layout,/OutputLanguageBridge/)
for(const field of ['extracted_text','document_translation','summary','next_step','response_letter_de','customer_copy']){
  assert.match(fn,new RegExp(field),`backend workflow field missing: ${field}`)
  assert.match(workflowModule,new RegExp(field),`central workflow module field missing: ${field}`)
}
assert.match(fn,/vollständige, gut lesbare Übersetzung/)
assert.match(fn,/verständliche Erklärung/)
assert.match(fn,/versandfertiges Antwortschreiben auf DEUTSCH/)
assert.match(fn,/Übersetzung genau dieses deutschen Antwortschreibens/)
assert.match(workflow,/documentLanguageWorkflow\.mjs/)
assert.match(workflow,/mapDocumentLanguageWorkflowResult/)
assert.match(fn,/output_language:requestedOutputLanguage/)
assert.doesNotMatch(fn,/gold-ocr-v28/)
console.log('Multilingual document workflow guard passed for all supported languages via the central workflow module.')
