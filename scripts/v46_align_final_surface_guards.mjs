import fs from 'node:fs'

const path='scripts/test_v46_modular_boundaries.mjs'
let source=fs.readFileSync(path,'utf8')
source=source.replace(
  "assert.match(workspace,/DocumentSection/)",
  "assert.match(read('app/modules/documents/DocumentsSurface.js'),/DocumentSection/)\nassert.match(workspace,/DocumentsSurface/)"
)

const marker="console.log('V46 modular-boundary guard passed: thin root entry, extracted public/auth/workspace surfaces, domain-owned catalogs and services, direct output-language flow, single language-menu back control, tester lock and thin compatibility adapters verified.')"
if(source.includes(marker)&&!source.includes('V46 final protected surface boundaries')){
  const finalAssertions=`\nfor(const path of [\n  'app/modules/workspace/DashboardSurface.js',\n  'app/modules/cases/WorkspaceCaseSurfaces.js',\n  'app/modules/cases/ApprovalsSurface.js',\n  'app/modules/documents/DocumentsSurface.js',\n  'app/modules/pricing/UpgradePanel.js',\n  'app/modules/compliance/AccountControlPanel.js'\n]) exists(path)\nassert.match(workspace,/DashboardSurface/)\nassert.match(workspace,/CasesSurface/)\nassert.match(workspace,/ClientsSurface/)\nassert.match(workspace,/DocumentsSurface/)\nassert.match(workspace,/ApprovalsSurface/)\nassert.doesNotMatch(workspace,/className=\\"accountControl\\"/,'account-control presentation belongs to compliance module')\nassert.doesNotMatch(workspace,/className=\\"detailCard upgradeBox\\"/,'upgrade presentation belongs to pricing module')\nassert.match(read('app/modules/compliance/AccountControlPanel.js'),/accountControl/)\nassert.match(read('app/modules/pricing/UpgradePanel.js'),/PromoCodeControl/)\nassert.match(read('app/modules/workspace/DashboardSurface.js'),/AccountControlPanel/)\nassert.match(read('app/modules/workspace/DashboardSurface.js'),/UpgradePanel/)\nconsole.log('V46 final protected surface boundaries verified: dashboard, cases, clients, documents, approvals, pricing and compliance presentation are explicitly owned.')\n`
  source=source.replace(marker,finalAssertions+'\n'+marker)
}
fs.writeFileSync(path,source)
console.log('V46 final surface guard alignment applied.')
