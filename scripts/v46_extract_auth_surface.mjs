import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)
const startMarker="  if(screen==='login'||screen==='register') return "
const endMarker="\n\n  if(screen==='app'&&!privacyCurrent)"
const start=workspace.indexOf(startMarker)
if(start<0 && !workspace.includes('<AuthSurface ')) throw new Error('V46 auth surface: auth start marker missing')
if(start>=0){
  const end=workspace.indexOf(endMarker,start)
  if(end<0) throw new Error('V46 auth surface: auth end marker missing')
  const expression=workspace.slice(start+startMarker.length,end).trim()
  const props=[
    'screen','t','a','language','setLanguage','tt','displayName','setDisplayName','email','setEmail','password','setPassword','password2','setPassword2','showPassword','setShowPassword','showPassword2','setShowPassword2','pui','v28','acceptedLegal','setAcceptedLegal','confirmedTestData','setConfirmedTestData','registerReady','register','signIn','resetPassword','message','setScreen'
  ]
  ensureDir('app/modules/auth')
  write('app/modules/auth/AuthSurface.js',`import { AppLogo } from '../workspace/AppLogo'\nimport { LanguageSwitcher } from '../language/LanguageSwitcher'\nimport { LegalFooter } from '../compliance/LegalFooter'\nimport { RegistrationLegalFields } from '../compliance/PrivacyControls'\nimport { PasswordPolicyChecklist } from './PasswordPolicy'\nimport { PasswordField } from './PasswordField'\n\nexport function AuthSurface({${props.join(',')}}){\n  return ${expression}\n}\n`)
  const invocation=`  if(screen==='login'||screen==='register') return <AuthSurface screen={screen} t={t} a={a} language={language} setLanguage={setLanguage} tt={tt} displayName={displayName} setDisplayName={setDisplayName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} password2={password2} setPassword2={setPassword2} showPassword={showPassword} setShowPassword={setShowPassword} showPassword2={showPassword2} setShowPassword2={setShowPassword2} pui={pui} v28={v28} acceptedLegal={acceptedLegal} setAcceptedLegal={setAcceptedLegal} confirmedTestData={confirmedTestData} setConfirmedTestData={setConfirmedTestData} registerReady={registerReady} register={register} signIn={signIn} resetPassword={resetPassword} message={message} setScreen={setScreen}/>`
  workspace=workspace.slice(0,start)+invocation+workspace.slice(end)
}
const importAnchor="import { PasswordField } from '../auth/PasswordField'"
if(!workspace.includes("import { AuthSurface } from '../auth/AuthSurface'")){
  if(!workspace.includes(importAnchor)) throw new Error('V46 auth surface: import anchor missing')
  workspace=workspace.replace(importAnchor,`${importAnchor}\nimport { AuthSurface } from '../auth/AuthSurface'`)
}
write(workspacePath,workspace)

for(const test of [
  {path:'scripts/test_v37_end_to_end.mjs',label:'V37 E2E'},
  {path:'scripts/test_v37_product_reife.mjs',label:'V37 readiness'}
]){
  let source=read(test.path)
  if(!source.includes("const authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')")){
    const candidates=[
      "const uploadConfig=fs.readFileSync('app/modules/documents/uploadConfig.js','utf8')",
      "const videoCompatibility=fs.readFileSync('app/components/ExplainerVideo.js','utf8')"
    ]
    const anchor=candidates.find(candidate=>source.includes(candidate))
    if(!anchor) throw new Error(`V46 auth surface: ${test.label} source anchor missing`)
    source=source.replace(anchor,`${anchor}\nconst authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')`)
  }
  const e2eNavigation="for(const marker of ['backOverview','backCases','backClients','backExplanation']) mustContain(page,marker,`navigation ${marker}`)"
  if(source.includes(e2eNavigation)) source=source.replace(e2eNavigation,"for(const marker of ['backOverview','backCases','backClients']) mustContain(page,marker,`navigation ${marker}`)\nmustContain(authSurface,'backExplanation','navigation backExplanation in auth module')")
  const readinessNavigation="for(const key of ['backOverview','backCases','backClients','backExplanation']) need(page,key,`back navigation ${key}`)"
  if(source.includes(readinessNavigation)) source=source.replace(readinessNavigation,"for(const key of ['backOverview','backCases','backClients']) need(page,key,`back navigation ${key}`)\nneed(authSurface,'backExplanation','back navigation backExplanation in auth module')")
  write(test.path,source)
}

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=read(guardPath)
const inventory="  'app/modules/auth/AuthSurface.js',"
if(!guard.includes(inventory)){
  const anchor="  'app/modules/auth/PasswordField.js',"
  if(!guard.includes(anchor)) throw new Error('V46 auth surface: guard inventory anchor missing')
  guard=guard.replace(anchor,`${anchor}\n${inventory}`)
}
const assertionAnchor="assert.match(workspace,/ProtectedWorkspaceShell/)"
if(!guard.includes("assert.match(workspace,/AuthSurface/)")){
  if(!guard.includes(assertionAnchor)) throw new Error('V46 auth surface: guard assertion anchor missing')
  guard=guard.replace(assertionAnchor,`${assertionAnchor}\nassert.match(workspace,/AuthSurface/)\nassert.doesNotMatch(workspace,/className=\\\"card authCard\\\"/)`)
}
write(guardPath,guard)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('V46 Auth-Oberfläche')) docs += '\n\n### V46 Auth-Oberfläche\n\n- `auth/AuthSurface.js` besitzt jetzt die vollständige Login-/Registrierungsoberfläche.\n- `WorkspaceApp.js` hält weiterhin den Auth-Zustand und die Auth-Handler, rendert die Formulare aber nicht mehr selbst.\n- Passwortfeld, Passwortregeln, Sprachwahl, Rechtseinwilligung und Footer werden innerhalb der Auth-Modulgrenze komponiert.\n- V37-End-to-End- und Readiness-Guards verfolgen den Auth-spezifischen Zurück-Pfad jetzt bis in das Auth-Modul statt ihn fälschlich im Workspace-Controller zu verlangen.\n'
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('auth/AuthSurface.js')) readme += '\n- `auth/AuthSurface.js`: login and registration composition; the workspace controller supplies state and handlers only.\n'
write(readmePath,readme)

console.log('V46 authentication surface extracted from WorkspaceApp and V37 guards aligned to module ownership.')
