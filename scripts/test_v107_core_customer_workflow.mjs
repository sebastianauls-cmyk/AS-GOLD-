import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { createAssessmentRecord } from '../app/modules/services/workspaceRepository.js'

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const documents=read('app/modules/documents/DocumentsSurface.js')
const documentWorkflow=read('app/modules/documents/documentWorkflow.js')
const documentRepository=read('app/modules/services/documentRepository.js')
const exportWorkflow=read('app/modules/documents/exportWorkflow.js')
const caseWorkflow=read('app/modules/cases/caseWorkflow.js')
const customerSurface=read('app/modules/cases/WorkspaceCaseSurfaces.js')
const dashboard=read('app/modules/workspace/DashboardSurface.js')
const controller=read('app/modules/workspace/WorkspaceController.js')
const countryHook=read('app/modules/country/useCountryContext.js')
const migration=read('supabase/migrations/20260905125528_v107_atomic_assessment_and_case_status.sql')
const passwordPage=read('app/passwort-aendern/page.js')

assert.ok(Number(APP_VERSION.slice(1))>=107)

assert.match(documents,/name="data_classification"/)
assert.match(documents,/value="synthetic"/)
assert.match(documents,/value="anonymized"/)
assert.match(documents,/name="test_data_confirmed"/)
assert.doesNotMatch(documents,/name="data_classification" value="personal"/)
assert.match(documentWorkflow,/\['synthetic','anonymized'\]\.includes\(dataClassification\)/)
assert.match(documentWorkflow,/recordServerAudit\('document_uploaded',\{classification:dataClassification\}/)
assert.match(documentWorkflow,/recordServerAudit\('document_analysis_generated',\{status:'provisional'\}/)
assert.match(documentRepository,/data_classification:draft\.data_classification/)
assert.match(documentRepository,/ai_processing_allowed:false/)

assert.match(exportWorkflow,/recordServerAudit\('export_created',\{format:type\.toUpperCase\(\)\}/)
assert.match(exportWorkflow,/recordServerAudit\('account_data_export',\{format:'JSON'\}/)

assert.match(migration,/create or replace function public\.create_gold_assessment/)
assert.match(migration,/security invoker/)
assert.match(migration,/set traffic_light = p_traffic_light/)
assert.doesNotMatch(caseWorkflow,/const ranking=/)

let captured=null
const expected={assessment:{id:'assessment-1',traffic_light:'green'},case:{id:'case-1',traffic_light:'green'}}
const fakeSupabase={rpc:async(name,args)=>{captured={name,args};return {data:expected,error:null}}}
const result=await createAssessmentRecord(fakeSupabase,{caseId:'case-1',draft:{title:'Aktueller Stand',traffic_light:'green',reasoning:'Geprüft',next_step:'Abschließen'}})
assert.equal(captured.name,'create_gold_assessment')
assert.deepEqual(captured.args,{p_case_id:'case-1',p_title:'Aktueller Stand',p_traffic_light:'green',p_reasoning:'Geprüft',p_next_step:'Abschließen'})
assert.deepEqual(result,{assessment:expected.assessment,updatedCase:expected.case,error:null})

assert.match(caseWorkflow,/updateClientRecord/)
assert.match(caseWorkflow,/recordLocalAction\('client_updated'\)/)
assert.match(customerSurface,/onSave\(selectedClient\.id,draft\)/)
assert.match(customerSurface,/a\.relatedDocs/)
assert.match(customerSurface,/onOpenCase/)
assert.match(customerSurface,/onOpenDocument/)
assert.match(migration,/clients_audit_update_v107/)

assert.match(dashboard,/onOpenCase=\{onStartSyntheticCase\}/)
assert.match(controller,/function startSyntheticCase\(tester\)/)
assert.match(controller,/broadcastCountryContext\(tester\.target_country/)
assert.match(countryHook,/COUNTRY_CONTEXT_EVENT/)
assert.match(passwordPage,/APP_VERSION/)
assert.doesNotMatch(passwordPage,/release=V106/)

console.log('V107 core workflow regression passed: safe upload, reachable analysis, atomic current assessment, editable customer file, valid audit payloads and functional synthetic-case start.')
