import assert from 'node:assert/strict'
import fs from 'node:fs'
import {analyzeCaseDeadlines,caseDeadlineEntries} from '../app/modules/cases/lib/caseDeadlineEvidence.mjs'
import {analyzeDeadlines,extractDeadlineDates} from '../app/modules/cases/lib/deadlineIntelligence.mjs'
import {autoDocumentAssessment} from '../app/modules/cases/lib/caseIntelligence.mjs'
import {documentLimitMessage} from '../app/modules/documents/documentLimit.mjs'
import {mapDocumentLanguageWorkflowResult,readableDocumentSummary} from '../app/modules/language/documentLanguageWorkflow.mjs'
import {roadmapSource,roadmapModelSource,roadmapFingerprint} from '../supabase/functions/_shared/customerRoadmap.mjs'
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/retest-september.json',import.meta.url)))
const {item,documents,assessments}=fixture,now=new Date('2026-09-20T12:00:00Z')
for(const text of [
  'Die Frist bis 24.09.2026 wurde auf den 02.10.2026 verlängert.',
  'Die Frist 24.09.2026 wird bis zum 02.10.2026 verlängert.',
  'Die Frist bis 24.09.2026 wird verlängert bis zum 02.10.2026.',
  'Die Frist wird vom 24.09.2026 auf den 02.10.2026 verschoben.'
]){
  const shifted=extractDeadlineDates(text)
  assert.deepEqual(shifted.map(entry=>[entry.date.toISOString().slice(0,10),entry.state]),[['2026-09-24','superseded'],['2026-10-02','active']])
  assert.equal(analyzeDeadlines({text,now}).primary.date,'2026-10-02')
  assert.equal(analyzeDeadlines({text,caseDeadline:'2026-09-24',now}).primary.date,'2026-09-24','an extracted extension never overrides a manually confirmed deadline')
}
for(const text of [
  'Falls die Frist bis 24.09.2026 auf den 02.10.2026 verlängert wird, melden wir uns.',
  'Die Frist bis 24.09.2026 wurde nicht auf den 02.10.2026 verlängert.',
  'Die Frist bis 24.09.2026 soll auf den 02.10.2026 verlängert werden.',
  'Wird die Frist bis 24.09.2026 auf den 02.10.2026 verlängert?',
  'Die Frist bis 24.09.2026 wird verlängert bis zum 02.10.2026?',
  'Die Frist bis 24.09.2026 soll ersetzt werden durch die Frist bis 02.10.2026.',
  'Die Frist bis 24.09.2026 wurde auf den 31.02.2026 verlängert.'
])assert.equal(analyzeDeadlines({text,now}).primary.date,'2026-09-24','a request, condition, denial, question or invalid date cannot silently retire the old deadline')
const shiftOriginal={...documents[0],id:'shift-original',extracted_text:'Rechnung SHIFT-100. Zahlung bis 24.09.2026.'}
const shiftReply={...documents[0],id:'shift-reply',extracted_text:'Rechnung SHIFT-100. Die Zahlungsfrist bis 24.09.2026 wurde auf den 02.10.2026 verlängert.'}
assert.equal(analyzeCaseDeadlines(item,[shiftOriginal,shiftReply],now).primary.date,'2026-10-02','explicit extensions reconcile across documents with matching references')
assert.equal(analyzeCaseDeadlines(item,[shiftOriginal,{...shiftReply,extracted_text:shiftReply.extracted_text.replace('SHIFT-100','OTHER-100')}],now).primary.date,'2026-09-24','another invoice never replaces this deadline')
assert.equal(analyzeCaseDeadlines(item,documents.slice(0,1),now).primary.date,'2026-09-24')
assert.equal(analyzeCaseDeadlines(item,documents,now).primary.date,'2026-10-02')
assert.equal(analyzeDeadlines({text:documents[1].extracted_text,now}).primary.date,'2026-10-02')
const entries=caseDeadlineEntries(item,documents)
assert.equal(entries.length,4,'invoice issue date must not be mistaken for its due date')
assert.match(entries.find(e=>e.kind==='invoice_due').context,/4\.800,00 EUR/,'amount punctuation must not crop the evidence')
assert.equal(entries.find(e=>e.kind==='invoice_due').state,'historical')
assert.equal(entries.filter(e=>e.state==='superseded').length,2)
assert.equal(item.deadline_at,null,'candidate handling never changes the stored case date')
assert.equal(analyzeCaseDeadlines({...item,deadline_at:'2026-09-23'},documents,now).primary.date,'2026-09-23')
const additional=text=>({...documents[0],id:'extra',extracted_text:text})
assert.equal(analyzeCaseDeadlines(item,[...documents,additional('Gericht: Stellungnahme bis 21.09.2026 einreichen.')],now).primary.date,'2026-09-21','an unrelated urgent deadline stays first')
assert.equal(analyzeCaseDeadlines(item,[...documents,{...additional('Gericht: Stellungnahme bis 20.09.2026 einreichen.'),owner_id:'other'}],now).primary.date,'2026-10-02')
assert.equal(analyzeCaseDeadlines(item,[...documents,additional('Bezug: Rechnung OTHER-200. Zahlung bis 24.09.2026.')],now).primary.date,'2026-09-24','same date on another invoice is not silently replaced')
assert.equal(analyzeDeadlines({text:'Falls die Frist bis 24.09.2026 ersetzt wird, erhalten Sie eine Nachricht.',now}).primary.date,'2026-09-24')
assert.equal(analyzeDeadlines({text:'Die Frist bis 24.09.2026 wird nicht ersetzt.',now}).primary.date,'2026-09-24')
assert.equal(analyzeDeadlines({text:'Zahlung bis 23.09.2026. Weitere Zahlung bis 02.10.2026.',now}).primary.date,'2026-09-23','a later date alone never cancels an earlier deadline')
assert.equal(extractDeadlineDates('Die Zahlungsfrist 02.10.2026 ersetzt die bisherige Frist 24.09.2026.').filter(e=>e.state==='superseded')[0].date.toISOString().slice(0,10),'2026-09-24')
assert.equal(autoDocumentAssessment(documents[0].extracted_text,analyzeDeadlines({text:documents[0].extracted_text,now})).trafficLight,'yellow')
assert.equal(autoDocumentAssessment('Mahnung: Zahlung bis 21.09.2026.',analyzeDeadlines({text:'Zahlung bis 21.09.2026.',now})).trafficLight,'red')
const mapped=mapDocumentLanguageWorkflowResult({source_language:'de',extracted_text:'ORIGINAL',document_translation:'ORIGINAL',summary:'Die kurze Erklärung.',reference_copy:'Sehr geehrte Damen und Herren',customer_copy:''},{},'de','de')
assert.equal(mapped.fields.analysis_summary,'Die kurze Erklärung.')
assert.equal(mapped.fields.extracted_text,'ORIGINAL');assert.equal(mapped.fields.reference_copy,'Sehr geehrte Damen und Herren')
const foreign=mapDocumentLanguageWorkflowResult({source_language:'en',extracted_text:'original',document_translation:'Übersetzung',summary:'Erklärung'},{},'de','en')
assert.ok(foreign.fields.analysis_summary.startsWith('Erklärung'));assert.match(foreign.fields.analysis_summary,/Übersetzung/)
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])assert.ok(documentLimitMessage({permissions:{guest_access_ends_at:'2026-09-21'}},language,2,'PAID {limit}').includes('2'))
assert.equal(documentLimitMessage({permissions:{}},'de',3,'PAID {limit}'),'PAID 3')
const source=roadmapSource(item,documents,assessments),model=roadmapModelSource(source)
assert.equal(model.documents.length,2);assert.equal(model.documents[0].extracted_text,source.documents[0].extracted_text)
assert.ok(model.documents.every(d=>!Object.hasOwn(d,'analysis_summary')))
const changed=structuredClone(source);changed.documents[0].analysis_summary='changed'
assert.notEqual(await roadmapFingerprint(source),await roadmapFingerprint(changed),'omitted AI prose still invalidates old snapshots')
console.log('Retest regression: replacement dates, independent urgency, ownership, full evidence, concise explanation, guest limits and original-only model context passed.')

const legacy='ÜBERSETZUNG DES ORIGINALDOKUMENTS (Deutsch)\nOriginal\n\n────────────────────────\n\nERKLÄRUNG FÜR DEN KUNDEN (Deutsch)\nKurze Erklärung\n\n────────────────────────\n\nREFERENZFASSUNG / REFERENCE VERSION (Deutsch)\nBrief'
assert.equal(readableDocumentSummary(legacy,'Original'),'Kurze Erklärung')
assert.match(readableDocumentSummary(legacy,'English original'),/Original/)
assert.equal(readableDocumentSummary('Freie Notiz'),'Freie Notiz')
