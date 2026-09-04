import assert from 'node:assert/strict'
import fs from 'node:fs'
import { LANGUAGE_CATALOG } from '../app/modules/language/languageRegistry.mjs'
import {
  DOCUMENT_LANGUAGE_WORKFLOW_STEPS,
  DOCUMENT_LANGUAGE_WORKFLOW_FIELDS,
  DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES,
  documentLanguageWorkflowContract
} from '../app/modules/language/documentLanguageWorkflow.mjs'

const edge=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const workflow=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8')
const contract=documentLanguageWorkflowContract()
const catalogKeys=LANGUAGE_CATALOG.map(language=>language.key)

assert.deepEqual(DOCUMENT_LANGUAGE_WORKFLOW_LANGUAGES.map(language=>language.key),catalogKeys,'Every catalog language must inherit the document workflow')
assert.deepEqual(contract.languages,catalogKeys)
assert.deepEqual(DOCUMENT_LANGUAGE_WORKFLOW_STEPS,['original','translation','explanation','next_step','response_letter_de','customer_copy'])
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.original,'extracted_text')
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.translation,'document_translation')
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.explanation,'summary')
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.next_step,'next_step')
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.response_letter_de,'response_letter_de')
assert.equal(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS.customer_copy,'customer_copy')

for(const key of catalogKeys){
  assert.match(edge,new RegExp(`['\"]${key}['\"]`),`Edge analysis must support language ${key}`)
}
for(const field of Object.values(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS)){
  assert.match(edge,new RegExp(`\\b${field}\\b`),`Edge analysis must emit ${field}`)
}
assert.match(workflow,/documentLanguageWorkflow\.mjs/)
assert.match(workflow,/mapDocumentLanguageWorkflowResult/)
assert.doesNotMatch(workflow,/function bilingualAnalysisSummary/)
assert.match(edge,/VERSANDFERTIGER|versandfertiges Antwortschreiben/i)
assert.match(edge,/Kundensprache\/Ausgabesprache/)

console.log(`V81 document language workflow guard passed for ${catalogKeys.length} languages and ${Object.keys(DOCUMENT_LANGUAGE_WORKFLOW_FIELDS).length} workflow outputs.`)
