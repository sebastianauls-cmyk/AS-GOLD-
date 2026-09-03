import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const current=fs.readFileSync('app/modules/workspace/WorkspaceAppCurrent.js','utf8')
const legacyController=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')

for(const expected of ["from '../cases/V24Workspace'","from '../cases/V25ApprovalWorkflow'","from '../documents/V26DocumentAnalysis'","from '../compliance/PrivacyControls'","from '../auth/PasswordPolicy'","from '../language/v36Languages.mjs'","from '../pricing/v31PromoTranslations.mjs'","from '../documents/documentWorkflow'","from '../documents/exportWorkflow'","from '../cases/caseWorkflow'","from '../cases/approvalWorkflow'"]) assert.match(workspace,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`controller import path missing: ${expected}`)

assert.match(current,/WorkspaceController/)
assert.match(legacyController,/WorkspaceController/)
assert.equal(fs.existsSync('app/modules/workspace/WorkspaceApp.js'),false,'obsolete WorkspaceApp.js facade must stay removed')
assert.doesNotMatch(workspace,/from '\.\/components\//,'active controller must not depend on workspace-local component compatibility adapters')
assert.doesNotMatch(workspace,/from '\.\/lib\//,'active controller must not depend on workspace-local library compatibility adapters')

const facades=[
  ['app/modules/cases/V24Workspace.js','CaseWorkspace'],
  ['app/modules/cases/V25ApprovalWorkflow.js','ApprovalWorkflowUi'],
  ['app/modules/documents/V26DocumentAnalysis.js','DocumentAnalysis'],
  ['app/modules/pricing/v31PromoTranslations.mjs','promoTranslations'],
  ['app/modules/language/v36Languages.mjs','languageRegistry']
]
for(const [path,target] of facades){const source=fs.readFileSync(path,'utf8');assert.match(source,new RegExp(target),`${path} must remain compatibility-only`)}
console.log('V80 workspace direct-import guard passed: WorkspaceController is active and remaining versioned import paths are compatibility-only facades into canonical V80 modules.')
