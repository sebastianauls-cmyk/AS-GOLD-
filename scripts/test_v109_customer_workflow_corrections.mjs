import assert from 'node:assert/strict'
import { resolveStoredPreferences } from '../app/modules/language/useLanguagePreferences.js'
import { normalizeCasePayload } from '../app/modules/cases/casePayload.mjs'
import { mapDocumentLanguageWorkflowResult } from '../app/modules/language/documentLanguageWorkflow.mjs'
import { approvalDefaultsForDocument } from '../app/modules/cases/approvalDefaults.mjs'
import { selectEvidenceContext } from '../app/modules/intelligence/evidenceContext.mjs'

assert.deepEqual(resolveStoredPreferences({savedLanguage:'tr',savedOutputLanguage:'pl'}),{language:'tr',outputLanguage:'pl'})
assert.deepEqual(resolveStoredPreferences({queryLanguage:'vi',savedLanguage:'tr',savedOutputLanguage:'ar'}),{language:'vi',outputLanguage:'ar'})

const normalized=normalizeCasePayload({title:' Test ',client_id:'',reference_no:' TEST-ST12 ',goal:' Ziel ',summary:' Sachstand ',deadline_at:'',next_action:' Prüfen ',home_country:'pl',target_country:'tr',test_case_id:'ST12',test_case_expected_ampel:'⚪',test_case_language:'pl'})
assert.equal(normalized.home_country,'PL')
assert.equal(normalized.target_country,'TR')
assert.equal(normalized.test_case_id,'ST12')

const generated=mapDocumentLanguageWorkflowResult({extracted_text:'اصل',document_translation:'Tłumaczenie',summary:'Erklärung',next_step:'Prüfen',response_letter_de:'Sehr geehrte Damen und Herren',customer_copy:'Szanowni Państwo',response_recipient:'Behörde',response_subject:'Antwort TEST-1',traffic_light:'red',assessment_reasoning:'Frist morgen',confidence:'hoch'},{title:'Eingang.pdf'},'pl')
assert.equal(generated.fields.analysis_traffic_light,'red')
assert.equal(generated.fields.response_recipient,'Behörde')
assert.equal(generated.fields.response_letter_de,'Sehr geehrte Damen und Herren')

const approvalDefaults=approvalDefaultsForDocument({id:'doc-1',case_id:'case-a',title:'Eingang',response_recipient:'Behörde',response_subject:'Antwort',response_letter_de:'Text',customer_copy:'Tekst',customer_copy_language:'pl'},'pl')
assert.equal(approvalDefaults.caseId,'case-a')
assert.equal(approvalDefaults.documentId,'doc-1')
assert.match(approvalDefaults.body,/VERSANDFASSUNG – DEUTSCH/)
assert.match(approvalDefaults.body,/KUNDENFASSUNG \/ ÜBERSETZUNG – Polski/)

const evidence=selectEvidenceContext({assessments:[{id:'a2',case_id:'case-b'}],sourceStatus:[{id:'s1',case_id:'case-a'},{id:'s2',case_id:'case-b'}]})
assert.equal(evidence.caseId,'case-b')
assert.deepEqual(evidence.sources.map(item=>item.id),['s2'])

console.log('V109 customer workflow corrections passed: preferences, per-case context, analysis handoff, approval prefill and evidence scoping are behaviorally verified.')
