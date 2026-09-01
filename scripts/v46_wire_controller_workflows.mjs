import fs from 'node:fs'

const controllerPath='app/modules/workspace/WorkspaceAppV2.js'
const controllerTestPath='scripts/test_v46_controller_workflows.mjs'
const docPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'

let source=fs.readFileSync(controllerPath,'utf8')

function replaceOnce(oldValue,newValue,label){
  if(source.includes(newValue)) return
  if(!source.includes(oldValue)) throw new Error(`V46 controller migration anchor missing: ${label}`)
  source=source.replace(oldValue,newValue)
}

replaceOnce(
  "import { cancelDeletionRecord, ensureRegistrationPrivacy, getWorkspaceAccess, listDeletionRequests, loadWorkspaceBundle, recordAuditEvent, requestDeletionRecord } from '../services/workspaceRepository'",
  "import { recordAuditEvent } from '../services/workspaceRepository'",
  'workspace repository import'
)
replaceOnce(
  "import { getUpgradeQuotes, requestUpgradeRecord } from '../services/pricingRepository'\nimport { acknowledgeLegalSettings } from '../services/complianceRepository'\nimport { getAuthSession, registerTestAccount, sendPasswordReset, signInSession, signOutSession, watchAuthState } from '../services/authRepository'",
  "import { getAuthSession, signOutSession, watchAuthState } from '../services/authRepository'",
  'pricing/compliance/auth repository imports'
)
replaceOnce(
  "import { createExportWorkflowActions } from '../documents/exportWorkflow'",
  "import { createExportWorkflowActions } from '../documents/exportWorkflow'\nimport { createWorkspaceAuthActions } from '../auth/workspaceAuthWorkflow'\nimport { createPricingWorkflowActions } from '../pricing/pricingWorkflow'\nimport { createAccountWorkflowActions } from '../compliance/accountWorkflow'",
  'workflow imports'
)

if(!source.includes("const {loadApp,signIn,resetPassword,register}=createWorkspaceAuthActions")){
  const start=source.indexOf('  async function requestAccountDeletion(){')
  const end=source.indexOf('  useEffect(()=>{',start)
  if(start<0||end<0) throw new Error('V46 controller migration account/auth block anchors missing')
  const delegated=`  const {acknowledgeCurrentLegal,requestAccountDeletion,cancelAccountDeletion}=createAccountWorkflowActions({\n    supabase,ownerId:user?.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,deletionRequests,deletionBusy,privacyBusy,privacyCopy:v28,serverCopy:sct,setDeletionBusy,setPrivacyBusy,setDeletionRequests,setPrivacySettings,setMessage,recordServerAudit\n  })\n\n  const {loadApp,signIn,resetPassword,register}=createWorkspaceAuthActions({\n    supabase,language,pendingMessages:accessPendingMessages,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,legalCopy:v28,passwordCopy:v29Password,notices:n,trustCopy:lt,email,password,password2,displayName,acceptedLegal,confirmedTestData,validatePassword:validateV29Password,setAcceptedLegal,setConfirmedTestData,setAccess,setUpgrades,setData,setServerAudit,setDeletionRequests,setPrivacySettings,setUser,setScreen,setMessage\n  })\n\n  const {loadQuotes,applyPromo,clearPromo,requestUpgrade}=createPricingWorkflowActions({\n    supabase,upgrades,termMonths,promoCode,appliedPromoCode,quotes,promoCopy:promo,notices:n,setQuotes,setPromoCode,setAppliedPromoCode,setPromoRevision,setQuoteLoading,setMessage,recordServerAudit\n  })\n\n`
  source=source.slice(0,start)+delegated+source.slice(end)
}

replaceOnce(
`  useEffect(()=>{\n    if(screen!=='app'||!upgrades.length) return\n    let cancelled=false\n    ;(async()=>{\n      setQuoteLoading(true)\n      const nextQuotes=await getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode:appliedPromoCode})\n      if(!cancelled){setQuotes(nextQuotes);setQuoteLoading(false)}\n    })()\n    return ()=>{cancelled=true}\n  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])`,
`  useEffect(()=>{\n    if(screen!=='app'||!upgrades.length) return\n    let cancelled=false\n    loadQuotes({isCancelled:()=>cancelled})\n    return ()=>{cancelled=true}\n  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])`,
  'pricing quote effect'
)

if(source.includes('  async function acknowledgeCurrentLegal(){')){
  const start=source.indexOf('  async function acknowledgeCurrentLegal(){')
  const end=source.indexOf('  function handleQuickAction(action,item=null){',start)
  if(end<0) throw new Error('V46 controller migration local action block end missing')
  source=source.slice(0,start)+source.slice(end)
}

for(const forbidden of [
  'getWorkspaceAccess(', 'loadWorkspaceBundle(', 'ensureRegistrationPrivacy(',
  'registerTestAccount(', 'sendPasswordReset(', 'signInSession(',
  'getUpgradeQuotes(', 'requestUpgradeRecord(', 'acknowledgeLegalSettings(',
  'requestDeletionRecord(', 'cancelDeletionRecord(', 'listDeletionRequests('
]){
  if(source.includes(forbidden)) throw new Error(`V46 controller still owns delegated operation: ${forbidden}`)
}
for(const required of [
  "from '../auth/workspaceAuthWorkflow'",
  "from '../pricing/pricingWorkflow'",
  "from '../compliance/accountWorkflow'",
  'createWorkspaceAuthActions({',
  'createPricingWorkflowActions({',
  'createAccountWorkflowActions({'
]){
  if(!source.includes(required)) throw new Error(`V46 controller delegation missing: ${required}`)
}

fs.writeFileSync(controllerPath,source)

const controllerTest=`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\n\nconst read=path=>fs.readFileSync(path,'utf8')\nconst exists=path=>assert.ok(fs.existsSync(path),\`missing workflow module: \${path}\`)\n\nconst paths={\n  controller:'app/modules/workspace/WorkspaceAppV2.js',\n  cases:'app/modules/cases/caseWorkflow.js',\n  approvals:'app/modules/cases/approvalWorkflow.js',\n  documents:'app/modules/documents/documentWorkflow.js',\n  exports:'app/modules/documents/exportWorkflow.js',\n  auth:'app/modules/auth/workspaceAuthWorkflow.js',\n  pricing:'app/modules/pricing/pricingWorkflow.js',\n  account:'app/modules/compliance/accountWorkflow.js'\n}\n\nfor(const path of Object.values(paths)) exists(path)\n\nconst page=read('app/page.js')\nconst controller=read(paths.controller)\nconst legacy=read('app/modules/workspace/WorkspaceApp.js')\nconst workflows=Object.fromEntries(Object.entries(paths).filter(([key])=>key!=='controller').map(([key,path])=>[key,read(path)]))\n\nassert.match(page,/modules\\/workspace\\/WorkspaceAppV2/,'root page must use the reduced workspace controller')\nfor(const expected of [\n  \"from '../cases/caseWorkflow'\",\n  \"from '../cases/approvalWorkflow'\",\n  \"from '../documents/documentWorkflow'\",\n  \"from '../documents/exportWorkflow'\",\n  \"from '../auth/workspaceAuthWorkflow'\",\n  \"from '../pricing/pricingWorkflow'\",\n  \"from '../compliance/accountWorkflow'\"\n]) assert.match(controller,new RegExp(expected.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')),\`controller must import \${expected}\`)\n\nfor(const forbidden of [\n  'createClientRecord','createCaseRecord','updateCaseRecord','createAssessmentRecord',\n  'createApprovalRecord','updateApprovalRecord','approveApprovalRecord','rejectApprovalRecord',\n  'authorizeDocumentAnalysis','uploadWorkspaceDocument','updateDocumentRecord','createWorkspaceDocumentSignedUrl',\n  'invokeDocumentAnalysis','createWorkspaceExportArtifact','createAccountDataArtifact','recordExportEntry',\n  'getWorkspaceAccess','loadWorkspaceBundle','ensureRegistrationPrivacy','registerTestAccount','sendPasswordReset','signInSession',\n  'getUpgradeQuotes','requestUpgradeRecord','acknowledgeLegalSettings','requestDeletionRecord','cancelDeletionRecord','listDeletionRequests'\n]) assert.doesNotMatch(controller,new RegExp(\`\\\\b\${forbidden}\\\\b\`),\`controller must not own \${forbidden}\`)\n\nfor(const token of ['createClientRecord','createCaseRecord','updateCaseRecord','createAssessmentRecord']) assert.match(workflows.cases,new RegExp(token))\nfor(const token of ['createApprovalRecord','approveApprovalRecord']) assert.match(workflows.approvals,new RegExp(token))\nfor(const token of ['authorizeDocumentAnalysis','invokeDocumentAnalysis','uploadWorkspaceDocument']) assert.match(workflows.documents,new RegExp(token))\nfor(const token of ['createWorkspaceExportArtifact','createAccountDataArtifact','recordExportEntry']) assert.match(workflows.exports,new RegExp(token))\nfor(const token of ['getWorkspaceAccess','loadWorkspaceBundle','ensureRegistrationPrivacy','registerTestAccount','sendPasswordReset','signInSession']) assert.match(workflows.auth,new RegExp(token))\nfor(const token of ['getUpgradeQuotes','requestUpgradeRecord']) assert.match(workflows.pricing,new RegExp(token))\nfor(const token of ['acknowledgeLegalSettings','requestDeletionRecord','cancelDeletionRecord','listDeletionRequests']) assert.match(workflows.account,new RegExp(token))\n\nfor(const source of [controller,...Object.values(workflows)]){\n  assert.doesNotMatch(source,/MutationObserver|setInterval\\(|history\\.(back|pushState|replaceState)|window\\.fetch\\s*=/,'workflow/controller must not reintroduce post-render or global interception hacks')\n}\n\nassert.ok(controller.length<legacy.length,'active controller must remain smaller than the legacy controller during migration')\n\nconst tester=read('app/testen/page.js')+read('app/modules/tester/TesterPaused.js')\nassert.match(tester,/TesterPaused/)\nassert.match(tester,/Testerzugang vorübergehend geschlossen/)\n\nconsole.log('V46 controller workflow guard passed: case, approval, document, export, auth, pricing and account sequencing are delegated to domain-owned workflow modules; tester access remains staged.')\n`
fs.writeFileSync(controllerTestPath,controllerTest)

let doc=fs.readFileSync(docPath,'utf8')
const marker='## Controller-Orchestrierung: Auth, Tarife und Konto delegiert'
if(!doc.includes(marker)){
  doc+='\n\n'+marker+'\n\nDer aktive Workspace-Controller delegiert nun zusätzlich Login/Registrierung/Workspace-Bootstrap an `auth/workspaceAuthWorkflow.js`, Angebots-/Promo-/Upgrade-Sequenzen an `pricing/pricingWorkflow.js` und Datenschutz-/Löschabläufe an `compliance/accountWorkflow.js`. Damit verbleiben in `WorkspaceAppV2.js` primär Screen-State, Auswahlzustände und die Komposition der Domain-Surfaces. Direkte Repository-Aufrufe für diese drei Abläufe wurden aus dem Controller entfernt. Der Testerzugang bleibt während der verbleibenden Release-Prüfungen geschlossen.\n'
  fs.writeFileSync(docPath,doc)
}

console.log('V46 wired auth, pricing and account workflows into the active workspace controller.')
