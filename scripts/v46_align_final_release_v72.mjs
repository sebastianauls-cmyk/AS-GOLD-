import fs from 'node:fs'

const canonicalPath='scripts/v46_finalize_release_candidate_v72.mjs'
const entryPath='scripts/v46_finalize_release_candidate.mjs'
let source=fs.readFileSync(canonicalPath,'utf8')

function replaceOnce(label,from,to){
  if(!source.includes(from)) throw new Error(`V72 finalizer alignment: missing ${label}`)
  source=source.replace(from,to)
}

if(!source.includes("'app/modules/workspace/useWorkspaceAudit.js'")){
  replaceOnce(
    'workspace required-module entry',
    "'app/modules/workspace/WorkspaceAppV2.js','app/modules/workspace/DashboardSurface.js'",
    "'app/modules/workspace/WorkspaceAppV2.js','app/modules/workspace/useWorkspaceAudit.js','app/modules/workspace/useWorkspaceSession.js','app/modules/workspace/DashboardSurface.js'"
  )
}

if(!source.includes('active workspace controller must delegate audit and auth session lifecycle')){
  replaceOnce(
    'workspace release boundary anchor',
    "\\nconst legal=read('app/modules/compliance/LegalDocument.js');",
    "\\nassert.doesNotMatch(controller,/recordAuditEvent|\\\\bgetAuthSession\\\\b|\\\\bwatchAuthState\\\\b/,'active workspace controller must delegate audit and auth session lifecycle')\\nconst workspaceAudit=read('app/modules/workspace/useWorkspaceAudit.js');assert.match(workspaceAudit,/recordAuditEvent/);assert.match(workspaceAudit,/localStorage\\\\.getItem/)\\nconst workspaceSession=read('app/modules/workspace/useWorkspaceSession.js');assert.match(workspaceSession,/getAuthSession/);assert.match(workspaceSession,/watchAuthState/);assert.match(workspaceSession,/subscription\\\\.unsubscribe/)\\nconst legal=read('app/modules/compliance/LegalDocument.js');"
  )
}

if(!source.includes("pkg.scripts['test:v46-session-audit']")){
  replaceOnce(
    'release package scripts anchor',
    "pkg.scripts['test:v46-release']='node scripts/test_v46_release_gate.mjs'",
    "pkg.scripts['test:v46-release']='node scripts/test_v46_release_gate.mjs'\npkg.scripts['test:v46-session-audit']='node scripts/test_v46_workspace_session_audit.mjs'"
  )
  replaceOnce(
    'release prebuild append anchor',
    "if(!pkg.scripts.prebuild.includes('test:v46-release'))pkg.scripts.prebuild+=' && npm run test:v46-release'",
    "if(!pkg.scripts.prebuild.includes('test:v46-session-audit'))pkg.scripts.prebuild+=' && npm run test:v46-session-audit'\nif(!pkg.scripts.prebuild.includes('test:v46-release'))pkg.scripts.prebuild+=' && npm run test:v46-release'"
  )
}

if(!source.includes('V72')||!source.includes('allen 11 App-Sprachen einschließlich Vietnamesisch')||!source.includes(".length,11")){
  throw new Error('V72 finalizer alignment: canonical finalizer does not preserve V72 / eleven-language tester parity')
}
if(!source.includes("test:v72_vietnamese")&&!source.includes('test_v72_vietnamese_modular_coverage.mjs')){
  throw new Error('V72 finalizer alignment: Vietnamese release coverage is missing')
}

fs.writeFileSync(canonicalPath,source)
fs.writeFileSync(entryPath,"import './v46_finalize_release_candidate_v72.mjs'\n")

const guard=`import assert from 'node:assert/strict'\nimport fs from 'node:fs'\nconst entry=fs.readFileSync('scripts/v46_finalize_release_candidate.mjs','utf8')\nconst finalizer=fs.readFileSync('scripts/v46_finalize_release_candidate_v72.mjs','utf8')\nassert.match(entry,/v46_finalize_release_candidate_v72\\.mjs/)\nassert.match(finalizer,/V72/)\nassert.match(finalizer,/allen 11 App-Sprachen einschließlich Vietnamesisch/)\nassert.ok(finalizer.includes('.length,11'),'tester translation count must be eleven')\nassert.match(finalizer,/WorkspaceAppV2\\.js/)\nassert.match(finalizer,/useWorkspaceAudit\\.js/)\nassert.match(finalizer,/useWorkspaceSession\\.js/)\nassert.match(finalizer,/active workspace controller must delegate audit and auth session lifecycle/)\nassert.match(finalizer,/test:v46-session-audit/)\nassert.match(finalizer,/test_v72_vietnamese_modular_coverage\\.mjs/)\nconsole.log('V46 V72 canonical finalizer parity guard passed')\n`
fs.writeFileSync('scripts/test_v46_finalizer_v72_parity.mjs',guard)

for(const target of ['app/modules/README.md','docs/APP_GOLD_MODULARISIERUNG_V46.md']){
  if(!fs.existsSync(target)) continue
  let text=fs.readFileSync(target,'utf8')
  const note=`\n### Final-release alignment — V72 / eleven languages\n\nThe final release entry now delegates to the canonical V72 release-candidate preparation. It preserves eleven application languages including Vietnamese, validates the active \`WorkspaceAppV2.js\` controller, and carries the extracted workspace session/audit hooks into the final release gate. The final prebuild also runs the dedicated workspace session/audit boundary guard. Tester access remains staged/closed until the synchronized release candidate completes every regression and production-build gate.\n`
  if(!text.includes('Final-release alignment — V72 / eleven languages')) text=text.trimEnd()+`\n${note}\n`
  fs.writeFileSync(target,text)
}

console.log('Aligned canonical V72 final release candidate with workspace session/audit boundaries')
