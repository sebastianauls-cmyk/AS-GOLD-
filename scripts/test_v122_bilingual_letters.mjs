import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { approvalDefaultsForDocument } from '../app/modules/cases/approvalDefaults.mjs'
import {
  bilingualLetterStatus,
  composeBilingualLetter,
  isCompleteBilingualLetterBody
} from '../app/modules/language/bilingualLetter.mjs'
import { mapDocumentLanguageWorkflowResult } from '../app/modules/language/documentLanguageWorkflow.mjs'

const document={
  id:'doc-1',
  case_id:'case-1',
  title:'Eingangsschreiben',
  response_recipient:'Behörde',
  response_subject:'Antwort zum Vorgang',
  response_letter_de:'Sehr geehrte Damen und Herren,\n\nwir antworten auf Ihr Schreiben.',
  customer_copy:'Szanowni Państwo,\n\nodpowiadamy na Państwa pismo.',
  customer_copy_language:'pl'
}

const body=composeBilingualLetter(document,'pl')
assert.match(body,/VERSANDFASSUNG – DEUTSCH/)
assert.match(body,/Sehr geehrte Damen und Herren/)
assert.match(body,/KUNDENFASSUNG \/ ÜBERSETZUNG – Polski/)
assert.match(body,/Szanowni Państwo/)
assert.equal(isCompleteBilingualLetterBody(body,'pl'),true)
assert.equal(isCompleteBilingualLetterBody(document.response_letter_de,'pl'),false)
assert.deepEqual(bilingualLetterStatus(document,'pl'),{
  complete:true,
  language:'pl',
  matchesRequestedLanguage:true,
  german:document.response_letter_de,
  customer:document.customer_copy
})
assert.equal(bilingualLetterStatus(document,'tr').matchesRequestedLanguage,false)

assert.deepEqual(approvalDefaultsForDocument(document,'pl'),{
  caseId:'case-1',
  documentId:'doc-1',
  recipient:'Behörde',
  subject:'Antwort zum Vorgang',
  body
})

const mapped=mapDocumentLanguageWorkflowResult({
  response_letter_de:'Deutsch',
  customer_copy:'Polski'
},{title:'Eingang.pdf'},'pl')
assert.equal(mapped.fields.customer_copy_language,'pl')

const approvalWorkflow=fs.readFileSync('app/modules/cases/approvalWorkflow.js','utf8')
const approvalUi=fs.readFileSync('app/modules/cases/ApprovalWorkflowUi.js','utf8')
const workspace=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const exportService=fs.readFileSync('app/modules/services/exportService.js','utf8')
const repository=fs.readFileSync('app/modules/services/documentRepository.js','utf8')
const migration=fs.readFileSync('supabase/migrations/20260906223000_v122_bilingual_letter_output.sql','utf8')
const backfill=fs.readFileSync('supabase/migrations/20260906223100_v122_bilingual_letter_language_backfill.sql','utf8')

assert.match(approvalWorkflow,/bilingualLetterStatus/)
assert.match(approvalWorkflow,/isCompleteBilingualLetterBody/)
assert.match(approvalUi,/selectDocument/)
assert.match(approvalUi,/bilingualHint/)
assert.match(workspace,/outputLanguage=\{outputLanguage\}/)
assert.match(exportService,/composeBilingualLetter/)
assert.match(repository,/customer_copy_language/)
assert.match(migration,/documents_customer_copy_language_v122_check/)
assert.match(backfill,/customer_copy_language = case/)
assert.equal(APP_VERSION,'V122')

console.log('V122 bilingual letters passed: German sending version and customer-language copy stay paired in document review, approval preview and export.')
