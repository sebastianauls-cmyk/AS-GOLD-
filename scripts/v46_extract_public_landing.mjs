import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)
const publicPath='app/modules/public/PublicLanding.js'
const marker='  return <>\n    <header className="publicTop">'
const alreadyExtracted=workspace.includes('return <PublicLanding ')

if(!alreadyExtracted){
  const start=workspace.lastIndexOf(marker)
  if(start<0) throw new Error('V46 public landing: final public return marker missing')
  const functionEnd=workspace.lastIndexOf('\n}')
  if(functionEnd<start) throw new Error('V46 public landing: Home function end missing')
  const expression=workspace.slice(start+'  return '.length,functionEnd).trim()
  if(!expression.includes('className="publicTop"')||!expression.includes('id="preise"')) throw new Error('V46 public landing: extracted expression incomplete')
  const props=[
    't','a','language','setLanguage','outputLanguage','setOutputLanguage','setScreen','cd','testerLinkText','pa','activePublicCase','setSelectedPublicCase','tt','jl','localizedPlans','rt','selectedGoal','setSelectedGoal','setShowRecommendation','showRecommendation','recommendedPlan','recommendedTier','eur','period','terms','monthsLabel'
  ]
  ensureDir('app/modules/public')
  write(publicPath,`import { LegalFooter } from '../compliance/LegalFooter'\nimport { LanguageSwitcher } from '../language/LanguageSwitcher'\nimport { AppLogo } from '../workspace/AppLogo'\n\nexport function PublicLanding({${props.join(',')}}){\n  return ${expression}\n}\n`)
  const invocation=`  return <PublicLanding t={t} a={a} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={cd} testerLinkText={testerLinkText} pa={pa} activePublicCase={activePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={tt} jl={jl} localizedPlans={localizedPlans} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} recommendedTier={recommendedTier} eur={eur} period={period} terms={terms} monthsLabel={monthsLabel}/>`
  workspace=workspace.slice(0,start)+invocation+workspace.slice(functionEnd)
}else if(!fs.existsSync(publicPath)){
  throw new Error('V46 public landing: PublicLanding module missing')
}

if(!workspace.includes("import { PublicLanding } from '../public/PublicLanding'")){
  const anchor="import { AuthSurface } from '../auth/AuthSurface'"
  if(!workspace.includes(anchor)) throw new Error('V46 public landing: import anchor missing')
  workspace=workspace.replace(anchor,`${anchor}\nimport { PublicLanding } from '../public/PublicLanding'`)
}

for(const line of [
  "import { AppLogo } from './AppLogo'\n",
  "import { PasswordField } from '../auth/PasswordField'\n",
  "import { LegalFooter } from './components/LegalFooter'\n",
  "import { LanguageSwitcher } from './components/LanguageSwitcher'\n"
]) workspace=workspace.replace(line,'')
workspace=workspace.replace("import { LegalAcceptance, PRIVACY_NOTICE_VERSION, RegistrationLegalFields, TERMS_VERSION, getV28PrivacyCopy } from './components/V28PrivacyControls'","import { LegalAcceptance, PRIVACY_NOTICE_VERSION, TERMS_VERSION, getV28PrivacyCopy } from './components/V28PrivacyControls'")
workspace=workspace.replace("import { PasswordPolicyChecklist, getV29PasswordCopy, validateV29Password } from './components/V29PasswordPolicy'","import { getV29PasswordCopy, validateV29Password } from './components/V29PasswordPolicy'")

if(workspace.includes('className="publicTop"')) throw new Error('V46 public landing: public page markup remains in WorkspaceApp')
write(workspacePath,workspace)

for(const test of [
  {path:'scripts/test_v37_end_to_end.mjs',label:'V37 E2E',mode:'mustContain'},
  {path:'scripts/test_v37_product_reife.mjs',label:'V37 readiness',mode:'need'}
]){
  let source=read(test.path)
  if(!source.includes("const publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')")){
    const anchor="const authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')"
    if(!source.includes(anchor)) throw new Error(`V46 public landing: ${test.label} source anchor missing`)
    source=source.replace(anchor,`${anchor}\nconst publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')`)
  }
  if(test.mode==='mustContain'){
    source=source.replace("mustContain(page,\"setScreen('register')\",'registration route')","mustContain(publicLanding,\"setScreen('register')\",'registration route in public module')")
    source=source.replace("mustContain(page,\"setScreen('login')\",'login route')","mustContain(publicLanding,\"setScreen('login')\",'login route in public module')")
  }else{
    source=source.replace("need(page,\"setScreen('register')\",'registration path')","need(publicLanding,\"setScreen('register')\",'registration path in public module')")
    source=source.replace("need(page,\"setScreen('login')\",'login path')","need(publicLanding,\"setScreen('login')\",'login path in public module')")
  }
  write(test.path,source)
}

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=read(guardPath)
const inventory="  'app/modules/public/PublicLanding.js',"
if(!guard.includes(inventory)){
  const anchor="  'app/modules/public/catalog.js',"
  if(!guard.includes(anchor)) throw new Error('V46 public landing: guard inventory anchor missing')
  guard=guard.replace(anchor,`${anchor}\n${inventory}`)
}
if(!guard.includes("assert.match(workspace,/PublicLanding/)")){
  const anchor="assert.match(workspace,/AuthSurface/)"
  if(!guard.includes(anchor)) throw new Error('V46 public landing: guard assertion anchor missing')
  guard=guard.replace(anchor,`${anchor}\nassert.match(workspace,/PublicLanding/)\nassert.doesNotMatch(workspace,/className=\\\"publicTop\\\"/)\nassert.match(read('app/modules/public/PublicLanding.js'),/className=\\\"publicTop\\\"/)\nassert.match(read('app/modules/public/PublicLanding.js'),/id=\\\"preise\\\"/)`)
}
write(guardPath,guard)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('V46 Öffentliche Oberfläche')){
  docs += '\n\n### V46 Öffentliche Oberfläche\n\n- `public/PublicLanding.js` besitzt jetzt die komplette öffentliche Start-, Fallarten-, Transparenz- und Preisoberfläche.\n- `WorkspaceApp.js` liefert nur noch Zustand, abgeleitete Daten und Aktionen an diese Oberfläche.\n- Sprache, Ausgabesprache und Footer werden in der öffentlichen Modulgrenze direkt aus den kanonischen Sprach-/Compliance-Modulen komponiert.\n- Öffentliche Markup-Änderungen können damit unabhängig von Authentifizierung und geschütztem Workspace erfolgen.\n- V37-End-to-End- und Readiness-Guards folgen Registrierungs-/Login-Routen jetzt bis in das Public-Modul.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('public/PublicLanding.js')) readme += '\n- `public/PublicLanding.js`: complete public landing, case-discovery, transparency and pricing composition.\n'
write(readmePath,readme)

console.log('V46 public landing extracted and route guards aligned to public module ownership.')
