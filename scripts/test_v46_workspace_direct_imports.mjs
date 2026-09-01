import assert from 'node:assert/strict'
import fs from 'node:fs'

const workspace=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')

for(const expected of [
  "from '../cases/V24Workspace'",
  "from '../cases/V25ApprovalWorkflow'",
  "from '../documents/V26DocumentAnalysis'",
  "from '../compliance/PrivacyControls'",
  "from '../auth/PasswordPolicy'",
  "from '../language/v36Languages.mjs'",
  "from '../pricing/v31PromoTranslations.mjs'"
]) assert.match(workspace,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`workspace must import canonical domain path: ${expected}`)

assert.doesNotMatch(workspace,/from '\.\/components\//,'WorkspaceApp must not depend on workspace-local component compatibility adapters')
assert.doesNotMatch(workspace,/from '\.\/lib\//,'WorkspaceApp must not depend on workspace-local library compatibility adapters')

console.log('V46 workspace direct-import guard passed: controller consumes canonical case/document/compliance/auth/language/pricing module paths directly.')
