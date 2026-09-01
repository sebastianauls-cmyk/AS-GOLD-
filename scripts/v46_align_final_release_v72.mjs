import fs from 'node:fs'

const path='scripts/v46_finalize_release_candidate.mjs'
let source=fs.readFileSync(path,'utf8')

function replaceAllRequired(label,from,to){
  if(!source.includes(from)) throw new Error(`V72 finalizer alignment: missing ${label}`)
  source=source.split(from).join(to)
}

replaceAllRequired('V70 version references','V70','V72')
replaceAllRequired('ten-language German copy','allen 10 App-Sprachen','allen 11 App-Sprachen einschließlich Vietnamesisch')
replaceAllRequired('ten-language English copy','ten languages','eleven languages including Vietnamese')
replaceAllRequired('tester translation count',".length,10)",".length,11)")

replaceAllRequired(
  'workspace required-module entry',
  "  'app/modules/workspace/WorkspaceApp.js','app/modules/workspace/DashboardSurface.js'",
  "  'app/modules/workspace/WorkspaceAppV2.js','app/modules/workspace/useWorkspaceAudit.js','app/modules/workspace/useWorkspaceSession.js','app/modules/workspace/DashboardSurface.js'"
)
replaceAllRequired(
  'active workspace release read',
  "const workspace=read('app/modules/workspace/WorkspaceApp.js')",
  "const workspace=read('app/modules/workspace/WorkspaceAppV2.js')"
)

const workspaceBoundaryAnchor="assert.match(workspace,/AccountSurface/)"
if(!source.includes(workspaceBoundaryAnchor)) throw new Error('V72 finalizer alignment: workspace boundary assertion anchor missing')
source=source.replace(
  workspaceBoundaryAnchor,
  `${workspaceBoundaryAnchor}\\nassert.doesNotMatch(workspace,/recordAuditEvent|\\bgetAuthSession\\b|\\bwatchAuthState\\b/,'active workspace controller must delegate audit and auth session lifecycle')\\nconst workspaceAudit=read('app/modules/workspace/useWorkspaceAudit.js')\\nassert.match(workspaceAudit,/recordAuditEvent/)\\nassert.match(workspaceAudit,/localStorage\\.getItem/)\\nconst workspaceSession=read('app/modules/workspace/useWorkspaceSession.js')\\nassert.match(workspaceSession,/getAuthSession/)\\nassert.match(workspaceSession,/watchAuthState/)`
)

if(!source.includes("test:v72-vietnamese")){
  const prebuildAnchor="if(!pkg.scripts.prebuild.includes('test:v46-release')) pkg.scripts.prebuild+=' && npm run test:v46-release'"
  if(!source.includes(prebuildAnchor)) throw new Error('V72 finalizer alignment: package prebuild anchor missing')
  source=source.replace(prebuildAnchor,`${prebuildAnchor}\\nif(!pkg.scripts.prebuild.includes('test:v72-vietnamese')) pkg.scripts.prebuild+=' && npm run test:v72-vietnamese'`)
}

const docsAnchor="- Der Tester-Share-Flow V72 ist im Tester-Modul vollständig vorbereitet"
if(!source.includes(docsAnchor)) throw new Error('V72 finalizer alignment: release documentation did not advance to V72')

fs.writeFileSync(path,source)

const guard=`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\nconst finalizer=fs.readFileSync('scripts/v46_finalize_release_candidate.mjs','utf8')\nassert.doesNotMatch(finalizer,/V70|allen 10 App-Sprachen|ten languages/)\nassert.match(finalizer,/V72/)\nassert.match(finalizer,/allen 11 App-Sprachen einschließlich Vietnamesisch/)\nassert.match(finalizer,/eleven languages including Vietnamese/)\nassert.ok(finalizer.includes('.length,11)'),'tester translation count must be eleven')\nassert.match(finalizer,/WorkspaceAppV2\\.js/)\nassert.match(finalizer,/useWorkspaceAudit\\.js/)\nassert.match(finalizer,/useWorkspaceSession\\.js/)\nassert.match(finalizer,/active workspace controller must delegate audit and auth session lifecycle/)\nassert.match(finalizer,/test:v72-vietnamese/)\nconsole.log('V46 V72 finalizer parity guard passed')\n`
fs.writeFileSync('scripts/test_v46_finalizer_v72_parity.mjs',guard)

for(const target of ['app/modules/README.md','docs/APP_GOLD_MODULARISIERUNG_V46.md']){
  if(!fs.existsSync(target)) continue
  let text=fs.readFileSync(target,'utf8')
  const note=`\n### Final-release alignment — V72 / eleven languages\n\nThe release-candidate preparation now matches the active V72 product: eleven application languages including Vietnamese, the active \`WorkspaceAppV2.js\` controller, and the extracted workspace session/audit hooks. The final release gate explicitly prevents regression back to V70/ten-language assumptions and verifies that the active controller delegates audit persistence and auth-session lifecycle. Tester access remains staged/closed until the complete synchronized final release candidate passes.\n`
  if(!text.includes('Final-release alignment — V72 / eleven languages')) text=text.trimEnd()+`\n${note}\n`
  fs.writeFileSync(target,text)
}

console.log('Aligned final release candidate preparation to V72 / eleven-language modular state')
