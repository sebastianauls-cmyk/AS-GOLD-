import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const exists=path=>assert.ok(fs.existsSync(path),`missing workflow module: ${path}`)

const paths={
  controller:'app/modules/workspace/WorkspaceAppV2.js',
  cases:'app/modules/cases/caseWorkflow.js',
  approvals:'app/modules/cases/approvalWorkflow.js',
  documents:'app/modules/documents/documentWorkflow.js',
  exports:'app/modules/documents/exportWorkflow.js'
}

for(const path of Object.values(paths)) exists(path)

const page=read('app/page.js')
const controller=read(paths.controller)
const legacy=read('app/modules/workspace/WorkspaceApp.js')
const caseWorkflow=read(paths.cases)
const approvalWorkflow=read(paths.approvals)
const documentWorkflow=read(paths.documents)
const exportWorkflow=read(paths.exports)

assert.match(page,/modules\/workspace\/WorkspaceAppV2/,'root page must use the reduced workspace controller')
for(const expected of [
  "from '../cases/caseWorkflow'",
  "from '../cases/approvalWorkflow'",
  "from '../documents/documentWorkflow'",
  "from '../documents/exportWorkflow'"
]) assert.match(controller,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`controller must import ${expected}`)

for(const forbidden of [
  'createClientRecord','createCaseRecord','updateCaseRecord','createAssessmentRecord',
  'createApprovalRecord','updateApprovalRecord','approveApprovalRecord','rejectApprovalRecord',
  'authorizeDocumentAnalysis','uploadWorkspaceDocument','updateDocumentRecord','createWorkspaceDocumentSignedUrl',
  'invokeDocumentAnalysis','createWorkspaceExportArtifact','createAccountDataArtifact','recordExportEntry'
]) assert.doesNotMatch(controller,new RegExp(`\\b${forbidden}\\b`),`controller must not own ${forbidden}`)

assert.match(caseWorkflow,/createClientRecord/)
assert.match(caseWorkflow,/createCaseRecord/)
assert.match(caseWorkflow,/updateCaseRecord/)
assert.match(caseWorkflow,/createAssessmentRecord/)
assert.match(approvalWorkflow,/createApprovalRecord/)
assert.match(approvalWorkflow,/approveApprovalRecord/)
assert.match(documentWorkflow,/authorizeDocumentAnalysis/)
assert.match(documentWorkflow,/invokeDocumentAnalysis/)
assert.match(documentWorkflow,/uploadWorkspaceDocument/)
assert.match(exportWorkflow,/createWorkspaceExportArtifact/)
assert.match(exportWorkflow,/createAccountDataArtifact/)
assert.match(exportWorkflow,/recordExportEntry/)

for(const source of [controller,caseWorkflow,approvalWorkflow,documentWorkflow,exportWorkflow]){
  assert.doesNotMatch(source,/MutationObserver|setInterval\(|history\.(back|pushState|replaceState)|window\.fetch\s*=/,'workflow/controller must not reintroduce post-render or global interception hacks')
}

assert.ok(controller.length<legacy.length,'active controller must remain smaller than the legacy controller during migration')

const tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')
assert.match(tester,/TesterPaused/)
assert.match(tester,/Testerzugang vorübergehend geschlossen/)

console.log('V46 controller workflow guard passed: active controller delegates case, approval, document and export sequencing to domain-owned workflow modules; tester access remains staged.')
