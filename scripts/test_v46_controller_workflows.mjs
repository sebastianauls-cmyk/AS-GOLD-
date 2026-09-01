import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const exists=path=>assert.ok(fs.existsSync(path),`missing workflow module: ${path}`)

const paths={
  controller:'app/modules/workspace/WorkspaceAppV2.js',
  cases:'app/modules/cases/caseWorkflow.js',
  approvals:'app/modules/cases/approvalWorkflow.js',
  documents:'app/modules/documents/documentWorkflow.js',
  exports:'app/modules/documents/exportWorkflow.js',
  auth:'app/modules/auth/workspaceAuthWorkflow.js',
  pricing:'app/modules/pricing/pricingWorkflow.js',
  account:'app/modules/compliance/accountWorkflow.js'
}

for(const path of Object.values(paths)) exists(path)

const page=read('app/page.js')
const controller=read(paths.controller)
const legacy=read('app/modules/workspace/WorkspaceApp.js')
const workflows=Object.fromEntries(Object.entries(paths).filter(([key])=>key!=='controller').map(([key,path])=>[key,read(path)]))

assert.match(page,/modules\/workspace\/WorkspaceAppV2/,'root page must use the reduced workspace controller')
for(const expected of [
  "from '../cases/caseWorkflow'",
  "from '../cases/approvalWorkflow'",
  "from '../documents/documentWorkflow'",
  "from '../documents/exportWorkflow'",
  "from '../auth/workspaceAuthWorkflow'",
  "from '../pricing/pricingWorkflow'",
  "from '../compliance/accountWorkflow'"
]) assert.match(controller,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`controller must import ${expected}`)

for(const forbidden of [
  'createClientRecord','createCaseRecord','updateCaseRecord','createAssessmentRecord',
  'createApprovalRecord','updateApprovalRecord','approveApprovalRecord','rejectApprovalRecord',
  'authorizeDocumentAnalysis','uploadWorkspaceDocument','updateDocumentRecord','createWorkspaceDocumentSignedUrl',
  'invokeDocumentAnalysis','createWorkspaceExportArtifact','createAccountDataArtifact','recordExportEntry',
  'getWorkspaceAccess','loadWorkspaceBundle','ensureRegistrationPrivacy','registerTestAccount','sendPasswordReset','signInSession',
  'getUpgradeQuotes','requestUpgradeRecord','acknowledgeLegalSettings','requestDeletionRecord','cancelDeletionRecord','listDeletionRequests'
]) assert.doesNotMatch(controller,new RegExp(`\\b${forbidden}\\b`),`controller must not own ${forbidden}`)

for(const token of ['createClientRecord','createCaseRecord','updateCaseRecord','createAssessmentRecord']) assert.match(workflows.cases,new RegExp(token))
for(const token of ['createApprovalRecord','approveApprovalRecord']) assert.match(workflows.approvals,new RegExp(token))
for(const token of ['authorizeDocumentAnalysis','invokeDocumentAnalysis','uploadWorkspaceDocument']) assert.match(workflows.documents,new RegExp(token))
for(const token of ['createWorkspaceExportArtifact','createAccountDataArtifact','recordExportEntry']) assert.match(workflows.exports,new RegExp(token))
for(const token of ['getWorkspaceAccess','loadWorkspaceBundle','ensureRegistrationPrivacy','registerTestAccount','sendPasswordReset','signInSession']) assert.match(workflows.auth,new RegExp(token))
for(const token of ['getUpgradeQuotes','requestUpgradeRecord']) assert.match(workflows.pricing,new RegExp(token))
for(const token of ['acknowledgeLegalSettings','requestDeletionRecord','cancelDeletionRecord','listDeletionRequests']) assert.match(workflows.account,new RegExp(token))

for(const source of [controller,...Object.values(workflows)]){
  assert.doesNotMatch(source,/MutationObserver|setInterval\(|history\.(back|pushState|replaceState)|window\.fetch\s*=/,'workflow/controller must not reintroduce post-render or global interception hacks')
}

assert.ok(controller.length<legacy.length,'active controller must remain smaller than the legacy controller during migration')

const tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')
assert.match(tester,/TesterPaused/)
assert.match(tester,/Testerzugang vorübergehend geschlossen/)

console.log('V46 controller workflow guard passed: case, approval, document, export, auth, pricing and account sequencing are delegated to domain-owned workflow modules; tester access remains staged.')
