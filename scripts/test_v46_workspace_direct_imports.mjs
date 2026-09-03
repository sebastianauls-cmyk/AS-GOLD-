import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')
const current=fs.readFileSync('app/modules/workspace/WorkspaceAppCurrent.js','utf8')

for(const expected of [
  "from '../cases/V24Workspace'",
  "from '../cases/V25ApprovalWorkflow'",
  "from '../documents/V26DocumentAnalysis'",
  "from '../compliance/PrivacyControls'",
  "from '../auth/PasswordPolicy'",
  "from '../language/v36Languages.mjs'",
  "from '../pricing/v31PromoTranslations.mjs'",
  "from '../documents/documentWorkflow'",
  "from '../documents/exportWorkflow'",
  "from '../cases/caseWorkflow'",
  "from '../cases/approvalWorkflow'"
]) assert.match(workspace,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`active workspace must import canonical domain path: ${expected}`)

assert.match(current,/WorkspaceAppV2/)
assert.equal(fs.existsSync('app/modules/workspace/WorkspaceApp.js'),false,'obsolete WorkspaceApp.js facade must stay removed')
assert.doesNotMatch(workspace,/from '\.\/components\//,'active workspace must not depend on workspace-local component compatibility adapters')
assert.doesNotMatch(workspace,/from '\.\/lib\//,'active workspace must not depend on workspace-local library compatibility adapters')
console.log('V80 workspace direct-import guard passed: the single current entry consumes one active controller and canonical domain modules; obsolete controller facade is removed.')