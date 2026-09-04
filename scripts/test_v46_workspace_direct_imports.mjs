import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceController.js','utf8')
const current=fs.readFileSync('app/modules/workspace/WorkspaceAppCurrent.js','utf8')
const legacyController=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')

for(const expected of ["from '../cases/CaseWorkspace'","from '../cases/ApprovalWorkflowUi'","from '../documents/DocumentAnalysis'","from '../compliance/PrivacyControls'","from '../auth/PasswordPolicy'","from '../language/languageRegistry.mjs'","from '../pricing/promoTranslations.mjs'","from '../public/casePriority.mjs'","from '../documents/documentWorkflow'","from '../documents/exportWorkflow'","from '../cases/caseWorkflow'","from '../cases/approvalWorkflow'"]) assert.match(workspace,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`controller import path missing: ${expected}`)

assert.match(current,/WorkspaceController/)
assert.match(legacyController,/WorkspaceController/)
assert.equal(fs.existsSync('app/modules/workspace/WorkspaceApp.js'),false,'obsolete WorkspaceApp.js facade must stay removed')
assert.doesNotMatch(workspace,/from '\.\/components\//,'active controller must not depend on workspace-local component compatibility adapters')
assert.doesNotMatch(workspace,/from '\.\/lib\//,'active controller must not depend on workspace-local library compatibility adapters')
for(const path of ['app/modules/cases/V24Workspace.js','app/modules/cases/V25ApprovalWorkflow.js','app/modules/documents/V26DocumentAnalysis.js','app/modules/pricing/v31PromoTranslations.mjs','app/modules/language/v36Languages.mjs','app/modules/public/casePriorityV56.mjs']) assert.equal(fs.existsSync(path),false,`${path} must stay removed after V80 consolidation`)
console.log('V80 workspace direct-import guard passed: WorkspaceController imports canonical domain modules directly and obsolete versioned facades are removed.')
