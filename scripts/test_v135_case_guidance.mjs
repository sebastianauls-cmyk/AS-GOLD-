import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { assessmentEvidence, caseEvidenceStatus, caseGuidance, currentAssessments } from '../app/modules/cases/lib/caseEvidence.mjs'
import { caseGuidanceCopies } from '../app/modules/cases/lib/caseGuidanceCopy.mjs'
import { openPrivateDocument } from '../app/modules/documents/openPrivateDocument.mjs'

const item={id:'case-1'}
const document={id:'doc-1',case_id:item.id,owner_id:'owner-1',title:'Musterbrief',updated_at:'2026-09-18T10:00:00Z',extracted_text:'Bitte reichen Sie die Unterlagen ein.'}
const assessment={id:'a1',case_id:item.id,owner_id:'owner-1',source_document_id:document.id,source_document_updated_at:document.updated_at,source_locator:'Seite 1, Absatz 1',source_excerpt:'reichen Sie die Unterlagen ein.',source_reviewed_at:'2026-09-18T10:01:00Z',traffic_light:'green'}
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
