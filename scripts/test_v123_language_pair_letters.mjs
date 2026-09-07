import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import {
  bilingualLetterStatus,
  composeBilingualLetter,
  isCompleteBilingualLetterBody
} from '../app/modules/language/bilingualLetter.mjs'
import { mapDocumentLanguageWorkflowResult } from '../app/modules/language/documentLanguageWorkflow.mjs'

const frenchArabic={
  reference_copy:'Madame, Monsieur,\n\nNous répondons à votre courrier.',
  reference_copy_language:'fr',
  customer_copy:'السيدة المحترمة، السيد المحترم،\n\nنرد على رسالتكم.',
  customer_copy_language:'ar'
}

const pairedBody=composeBilingualLetter(frenchArabic,{referenceLanguage:'fr',customerLanguage:'ar'})
assert.match(pairedBody,/REFERENZFASSUNG \/ REFERENCE VERSION – Français/)
assert.match(pairedBody,/KUNDENFASSUNG \/ CUSTOMER VERSION – العربية/)
assert.match(pairedBody,/Nous répondons/)
assert.match(pairedBody,/نرد على رسالتكم/)
assert.equal(isCompleteBilingualLetterBody(pairedBody,{referenceLanguage:'fr',customerLanguage:'ar'}),true)

const pairedStatus=bilingualLetterStatus(frenchArabic,{referenceLanguage:'fr',customerLanguage:'ar'})
assert.equal(pairedStatus.complete,true)
assert.equal(pairedStatus.sameLanguage,false)
assert.equal(pairedStatus.matchesRequestedLanguages,true)
assert.equal(bilingualLetterStatus(frenchArabic,{referenceLanguage:'en',customerLanguage:'ar'}).matchesRequestedLanguages,false)
assert.equal(bilingualLetterStatus(frenchArabic,{referenceLanguage:'fr',customerLanguage:'pl'}).matchesRequestedLanguages,false)

const englishOnly={reference_copy:'Dear Sir or Madam,',reference_copy_language:'en',customer_copy_language:'en'}
const singleBody=composeBilingualLetter(englishOnly,{referenceLanguage:'en',customerLanguage:'en'})
assert.match(singleBody,/REFERENCE VERSION – English/)
assert.doesNotMatch(singleBody,/CUSTOMER VERSION/)
assert.equal(bilingualLetterStatus(englishOnly).complete,true)
assert.equal(bilingualLetterStatus(englishOnly).sameLanguage,true)
assert.equal(isCompleteBilingualLetterBody(singleBody,{referenceLanguage:'en',customerLanguage:'en'}),true)

const mapped=mapDocumentLanguageWorkflowResult({
  reference_language:'fr',
  reference_copy:'Réponse en français',
  customer_copy:'الترجمة العربية'
},{title:'Courrier.pdf'},'ar','fr')
assert.equal(mapped.fields.reference_copy_language,'fr')
assert.equal(mapped.fields.reference_copy,'Réponse en français')
assert.equal(mapped.fields.response_letter_de,'')
assert.equal(mapped.fields.customer_copy_language,'ar')

const edge=fs.readFileSync('supabase/functions/gold-document-analysis/index.ts','utf8')
const workspace=fs.readFileSync('app/modules/cases/CaseWorkspace.js','utf8')
const approval=fs.readFileSync('app/modules/cases/approvalWorkflow.js','utf8')
const repository=fs.readFileSync('app/modules/services/documentRepository.js','utf8')
const migration=fs.readFileSync('supabase/migrations/20260906230000_v123_reference_customer_language_pair.sql','utf8')

assert.match(edge,/reference_language/)
assert.match(edge,/reference_copy/)
assert.doesNotMatch(edge,/response_letter_de:\{type/)
assert.match(workspace,/reference_copy_language/)
assert.match(workspace,/customer_copy_language/)
assert.match(workspace,/letterUi\.sameLanguage/)
assert.match(approval,/matchesRequestedLanguages/)
assert.match(repository,/reference_copy:referenceCopy/)
assert.match(migration,/documents_reference_copy_language_v123_check/)
assert.match(migration,/response_letter_de/)
assert.ok(Number(APP_VERSION.slice(1))>=123)

console.log('V123 language-pair letters passed: any reference/customer language pair is supported and identical languages produce one version.')
