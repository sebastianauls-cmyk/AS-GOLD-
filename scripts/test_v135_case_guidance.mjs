import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import nextConfig from '../next.config.mjs'
import { prioritizeNextStep } from '../app/modules/cases/lib/nextStepEngine.mjs'
import { assessmentEvidence, caseEvidenceStatus, caseGuidance, currentAssessments } from '../app/modules/cases/lib/caseEvidence.mjs'
import { caseGuidanceCopies } from '../app/modules/cases/lib/caseGuidanceCopy.mjs'
import { buildWorkspaceExportRows } from '../app/modules/services/exportService.js'
import { assessmentEvidenceText } from '../app/modules/cases/lib/assessmentEvidenceText.mjs'
import { openPrivateDocument } from '../app/modules/documents/openPrivateDocument.mjs'
import { mapDocumentLanguageWorkflowResult } from '../app/modules/language/documentLanguageWorkflow.mjs'
import { analyzeCaseDeadlines } from '../app/modules/cases/lib/caseDeadlineEvidence.mjs'

const mappedDate=(result,document={})=>mapDocumentLanguageWorkflowResult(result,document).fields.document_date
assert.equal(mappedDate({document_date:'30.08.2026'}),'2026-08-30','localized AI dates must reach the date input')
assert.equal(mappedDate({document_date:'2026-08-30'}),'2026-08-30')
assert.equal(mappedDate({document_date:null,extracted_text:'Schaden am 15.08.2026. Dokumentdatum: 30.08.2026 Antwortfrist: 15.09.2026'}),'2026-08-30','recover the explicitly labelled date observed in the live PDF test')
assert.equal(mappedDate({extracted_text:'Document date: 2026-08-30. Deadline: 2026-09-15'}),'2026-08-30')
assert.equal(mappedDate({extracted_text:'Dokumentdatum\n\n30.08.2026\nAntwortfrist\n15.09.2026'}),'2026-08-30','labelled PDF table cells may be separated by line breaks')
assert.equal(mappedDate({extracted_text:'Antwortfrist: 15.09.2026; Schaden vom 15.08.2026'}),'','never substitute a deadline or event date')
assert.equal(mappedDate({document_date:'08/09/2026'}),'','ambiguous slash dates need review')
assert.equal(mappedDate({document_date:'2026-02-30'}),'','reject impossible calendar dates')
assert.equal(mappedDate({document_date:'29.02.2024'}),'2024-02-29')
assert.equal(mappedDate({extracted_text:'Dokumentdatum: 30.08.2026 Dokumentdatum: 31.08.2026'}),'','conflicting document dates need review')
assert.equal(mappedDate({extracted_text:'Dokumentdatum: 30.08.2026'},{document_date:'2026-08-29'}),'2026-08-29','keep an existing date when AI has no usable date')
console.log('V135 live-test regression: localized and labelled document dates survive mapping; ambiguous, conflicting and impossible dates stay open.')

const item={id:'case-1'}
const document={id:'doc-1',case_id:item.id,owner_id:'owner-1',title:'Musterbrief',updated_at:'2026-09-18T10:00:00Z',extracted_text:'Bitte reichen Sie die Unterlagen ein.'}
const assessment={id:'a1',case_id:item.id,owner_id:'owner-1',source_document_id:document.id,source_document_updated_at:document.updated_at,source_locator:'Seite 1, Absatz 1',source_excerpt:'reichen Sie die Unterlagen ein.',source_reviewed_at:'2026-09-18T10:01:00Z',traffic_light:'green'}
const deadlineDocument={...document,extracted_text:'Bitte bestätigen Sie den Eingang bis spätestens 15.09.2026.'}
const clock=new Date('2026-09-18T12:00:00Z')
const detectedDeadline=analyzeCaseDeadlines(item,[deadlineDocument],clock)
assert.equal(detectedDeadline.status,'overdue','the case must retain the warning detected in its document')
assert.equal(detectedDeadline.primary.date,'2026-09-15')
assert.equal(caseGuidance({item,documents:[deadlineDocument],deadlineStatus:detectedDeadline.status,deadlineDocument:detectedDeadline.document}).target,'document','the urgent action opens the original evidence')
assert.equal(analyzeCaseDeadlines({...item,deadline_at:'2026-09-30'},[deadlineDocument],clock).primary.date,'2026-09-15','an earlier document deadline outranks the stored later deadline')
assert.equal(analyzeCaseDeadlines(item,[{...deadlineDocument,case_id:'another-case'}],clock).status,'uncertain')
assert.equal(analyzeCaseDeadlines({...item,owner_id:'owner-1'},[{...deadlineDocument,owner_id:'owner-2'}],clock).status,'uncertain')
assert.equal(analyzeCaseDeadlines(item,[{...document,extracted_text:'Bericht vom 15.09.2026',analysis_summary:'Zahlbar bis 15.09.2026'}],clock).status,'uncertain','AI summary alone is not an original deadline source')
assert.equal(analyzeCaseDeadlines(item,[{...document,extracted_text:'Einreichen bis'},{...document,id:'doc-2',extracted_text:'15.09.2026'}],clock).status,'uncertain','keep separate document contexts separate')
assert.equal(analyzeCaseDeadlines(item,[{...document,extracted_text:'Besprechung am 15.09.2026'}],clock).status,'uncertain')
assert.equal(caseGuidance({item}).target,'upload')
assert.equal(caseGuidance({item,deadlineStatus:'immediate'}).kind,'deadline','urgent deadlines outrank missing files')
assert.equal(assessmentEvidence(assessment,[document]).status,'reviewed')
assert.equal(assessmentEvidence({...assessment,source_reviewed_at:null},[document]).status,'pending','AI output alone cannot be verified')
assert.equal(assessmentEvidence({...assessment,source_excerpt:'invented'},[document]).status,'pending')
assert.equal(assessmentEvidence(assessment,[{...document,case_id:'other'}]).status,'missing')
assert.equal(assessmentEvidence(assessment,[{...document,owner_id:'other'}]).status,'missing')
assert.equal(assessmentEvidence(assessment,[{...document,updated_at:'2026-09-19T10:00:00Z'}]).status,'stale')
assert.equal(caseEvidenceStatus(item,[document],[assessment]).complete,true)
const newDocument={...document,id:'doc-2'}
assert.equal(caseGuidance({item,documents:[document,newDocument],assessments:[assessment]}).kind,'newDocument')
assert.equal(caseEvidenceStatus(item,[document,newDocument],[assessment]).complete,false,'a new document reopens source review')
const replacement={...assessment,id:'a2',supersedes_assessment_id:'a1',traffic_light:'yellow',next_step:'Unterlagen prüfen'}
assert.deepEqual(currentAssessments([replacement,assessment]).map(entry=>entry.id),['a2'])
assert.equal(caseGuidance({item,documents:[document],assessments:[replacement,assessment]}).action,'Unterlagen prüfen')
for(const [language,copy] of Object.entries(caseGuidanceCopies))for(const [key,value] of Object.entries(copy))assert.ok(value,`${language}.${key}`)
assert.equal(Object.keys(caseGuidanceCopies).length,11)

const order=[]
const tab={closed:false,opener:{},location:{replace:url=>order.push(['navigate',url])},close:()=>order.push(['close'])}
const opened=await openPrivateDocument({browser:{open:()=>{order.push(['open']);return tab}},getSignedUrl:async()=>{order.push(['sign']);return {data:{signedUrl:'https://example.test/private-file'}}}})
assert.equal(opened.opened,true)
assert.deepEqual(order.map(entry=>entry[0]),['open','sign','navigate'],'the tab must be created before awaiting the signed URL')
assert.equal(tab.opener,null)
const blocked=await openPrivateDocument({browser:{open:()=>null},getSignedUrl:async()=>({data:{signedUrl:'https://example.test/private-file'}})})
assert.deepEqual(blocked,{opened:false,url:'https://example.test/private-file'})
await assert.rejects(openPrivateDocument({browser:{open:()=>tab},getSignedUrl:async()=>({error:new Error('unavailable')})}),/unavailable/)
assert.deepEqual(order.at(-1),['close'])
console.log('V135: actionable case guidance, source isolation, changed/new documents, assessment history, 11 languages and mobile file opening passed.')

// Execute the customer workflow with a successful repository response. This
// catches the formerly missing setSelectedClient closure binding at runtime.
const workflowSource=(await readFile(new URL('../app/modules/cases/caseWorkflow.js',import.meta.url),'utf8')).replace(/^import .*$/gm,'').replace(/^export \{.*$/gm,'').replace('export function createCaseWorkflowActions','function createCaseWorkflowActions')
const updatedClient={id:'client-1',name:'Korrigierter Mustername'}
const createActions=new Function('updateClientRecord',workflowSource+';return createCaseWorkflowActions')(async()=>({data:updatedClient,error:null}))
let selectedClient=null
let workspace={clients:[{id:'client-1',name:'Alter Mustername'}]}
const actions=createActions({supabase:{},ownerId:'owner-1',setMessage:()=>{},recordLocalAction:()=>{},setData:update=>{workspace=update(workspace)},setSelectedClient:client=>{selectedClient=client}})
assert.equal(await actions.updateClient('client-1',{name:updatedClient.name}),true)
assert.deepEqual(selectedClient,updatedClient)
assert.deepEqual(workspace.clients,[updatedClient])
console.log('V135: successful customer save updates both the list and the open detail view.')

const exported=assessmentEvidenceText(assessment,[document],'de',[replacement,assessment])
assert.match(exported,/Frühere Bewertung/)
assert.match(exported,/Seite 1, Absatz 1/)
assert.match(exported,/reichen Sie die Unterlagen ein/)
const labels=new Proxy({},{get:(_,key)=>key})
const rows=buildWorkspaceExportRows({ref:{kind:'case',item},data:{documents:[document],assessments:[replacement,assessment],sourceStatus:[],approvals:[]},copy:{ex:labels,core:labels,approvalUi:labels}})
const assessmentRow=rows.find(([label])=>label==='currentAssessments')[1]
assert.match(assessmentRow,/Seite 1, Absatz 1/)
assert.match(assessmentRow,/Belegstelle geprüft/)
assert.match(assessmentRow,/Frühere Bewertung/)
console.log('V135: case exports preserve exact evidence, review state and superseded history.')

const deploymentEnvironment=process.env.VERCEL_ENV
try{
  process.env.VERCEL_ENV='production'
  const liveRules=await nextConfig.headers()
  assert.equal(liveRules.length,1)
  assert.ok(liveRules[0].headers.some(header=>header.key==='X-Frame-Options'&&header.value==='DENY'))
  process.env.VERCEL_ENV='preview'
  const previewRules=await nextConfig.headers()
  assert.equal(previewRules[1].source,'/vorschau/v135')
  assert.ok(previewRules[1].headers.some(header=>header.key==='X-Frame-Options'&&header.value==='SAMEORIGIN'))
}finally{if(deploymentEnvironment===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=deploymentEnvironment}
console.log('V135: same-origin framing is limited to the synthetic preview; production keeps its frame protection.')

assert.equal(prioritizeNextStep({language:'vi',deadlineStatus:'immediate'}).when,'Ngay bây giờ / hôm nay')
