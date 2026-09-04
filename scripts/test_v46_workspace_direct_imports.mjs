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
assert.equal(fs.existsSync('app/modules/documents/V26DocumentAnalysis.js'),false,'obsolete document V26 facade must stay removed')
assert.equal(fs.existsSync('app/modules/pricing/v31PromoTranslations.mjs'),false,'obsolete promo V31 facade must stay removed')
const caseBridge=fs.readFileSync('app/modules/cases/V24Workspace.js','utf8')
assert.match(caseBridge,/CaseWorkspace/);assert.doesNotMatch(caseBridge,/function CaseDetail|function CaseSection|const copy=/)
const approvalBridge=fs.readFileSync('app/modules/cases/V25ApprovalWorkflow.js','utf8')
assert.match(approvalBridge,/ApprovalWorkflowUi/);assert.doesNotMatch(approvalBridge,/function ApprovalDetail|function ApprovalSection|const copy=/)
const languageBridge=fs.readFileSync('app/modules/language/v36Languages.mjs','utf8')
assert.match(languageBridge,/languageRegistry\.mjs/,'temporary V36 language bridge must delegate to canonical registry')
assert.doesNotMatch(languageBridge,/LANGUAGE_CATALOG\s*=|pageTranslations\s*=/,'temporary V36 language bridge must not own language data')
const componentBridge=fs.readFileSync('app/modules/lib/v30ComponentTranslations.mjs','utf8')
assert.match(componentBridge,/componentTranslations\.mjs/,'temporary component translation bridge must delegate to canonical language catalog')
assert.doesNotMatch(componentBridge,/componentTranslations\s*=|workspaceCopy\s*=|approvalCopy\s*=/,'temporary component translation bridge must not own translation data')
const priorityBridge=fs.readFileSync('app/modules/public/casePriorityV56.mjs','utf8')
assert.match(priorityBridge,/casePriority\.mjs/,'temporary case-priority bridge must delegate to canonical V80 module')
assert.doesNotMatch(priorityBridge,/caseFrequencyWeight\s*=|caseOrder\s*=|researchedCaseVolumes\s*=/,'temporary case-priority bridge must not own logic')
for(const [path,target] of [['app/modules/lib/v38DeadlineIntelligence.mjs','deadlineIntelligence'],['app/modules/lib/v38NextStepEngine.mjs','nextStepEngine'],['app/modules/lib/v39CaseIntelligence.mjs','caseIntelligence'],['app/modules/lib/v40ProfessionalHandoff.mjs','professionalHandoff'],['app/modules/lib/v41CaseConsistency.mjs','caseConsistency']]){const source=fs.readFileSync(path,'utf8');assert.match(source,new RegExp(target),`${path} must delegate to canonical case lib`);assert.doesNotMatch(source,/function\s+\w+|const\s+\w+\s*=/,`${path} must not own logic`)}
console.log('V80 workspace direct-import guard passed: WorkspaceController imports canonical modules directly; remaining compatibility facades are logic-free V80 bridges.')
