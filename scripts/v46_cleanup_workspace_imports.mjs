import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=fs.readFileSync(workspacePath,'utf8')

const replacements=new Map([
  ["from './components/V24Workspace'","from '../cases/V24Workspace'"],
  ["from './components/V25ApprovalWorkflow'","from '../cases/V25ApprovalWorkflow'"],
  ["from './components/V26DocumentAnalysis'","from '../documents/V26DocumentAnalysis'"],
  ["from './components/V28PrivacyControls'","from '../compliance/PrivacyControls'"],
  ["from './components/V29PasswordPolicy'","from '../auth/PasswordPolicy'"],
  ["from './lib/v30Languages.mjs'","from '../language/v36Languages.mjs'"],
  ["from './lib/v31PromoTranslations.mjs'","from '../pricing/v31PromoTranslations.mjs'"]
])

for(const [legacy,canonical] of replacements){
  if(!workspace.includes(legacy)&&!workspace.includes(canonical)) throw new Error(`Expected workspace import not found: ${legacy}`)
  workspace=workspace.replaceAll(legacy,canonical)
}
fs.writeFileSync(workspacePath,workspace)

const packagePath='package.json'
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'))
pkg.scripts ||= {}
pkg.scripts['test:v46-direct-imports']='node scripts/test_v46_workspace_direct_imports.mjs'
if(!pkg.scripts.prebuild.includes('test:v46-direct-imports')) pkg.scripts.prebuild += ' && npm run test:v46-direct-imports'
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n')

console.log('V46 workspace compatibility imports replaced with canonical domain imports and direct-import guard wired into prebuild.')
