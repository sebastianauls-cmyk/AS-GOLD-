import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})
const ensureFile=(path,content)=>{ensureDir(path.split('/').slice(0,-1).join('/'));write(path,content)}

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)

ensureFile('app/modules/workspace/AppLogo.js',`export function AppLogo(){ return <div className="logo">AS</div> }\n`)
ensureFile('app/modules/auth/PasswordField.js',`export function PasswordField({id,label,value,onChange,visible,onToggle,labels,autoComplete,describedBy}){\n  const actionLabel = visible ? labels.hide : labels.show\n  return <div className="authField"><label htmlFor={id}>{label}</label><div className="passwordControl"><input id={id} type={visible?'text':'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-describedby={describedBy} required/><button type="button" className="passwordToggle" onClick={onToggle} aria-label={\`${'${actionLabel}'}: ${'${label}'}\`} aria-pressed={visible}>{actionLabel}</button></div></div>\n}\n`)
ensureFile('app/modules/workspace/ProtectedWorkspaceShell.js',`import { LanguageSwitcher } from '../language/LanguageSwitcher'\nimport { LegalFooter } from '../compliance/LegalFooter'\nimport { AppLogo } from './AppLogo'\n\nexport function ProtectedWorkspaceShell({language,outputLanguage,onLanguageChange,onOutputLanguageChange,legalLabel,languageLabel,outputLanguageLabel,logoutLabel,onLogout,message,children}){\n  return <>\n    <header className="appTop"><div className="brand"><AppLogo/><b>AS Workspace Gold</b></div><div className="appHeaderTools"><span className="legalChip">{legalLabel}</span><LanguageSwitcher value={language} onChange={onLanguageChange} label={languageLabel} showLabel/><LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={outputLanguageLabel} showLabel/><button className="secondary" onClick={onLogout}>{logoutLabel}</button></div></header>\n    <main className="appMain">{message&&<div className="note">{message}</div>}{children}</main>\n    <LegalFooter language={language}/>\n  </>\n}\n`)

const logoFn=`function Logo(){ return <div className="logo">AS</div> }\n\n`
if(workspace.includes(logoFn)) workspace=workspace.replace(logoFn,'')
const passwordStart=workspace.indexOf('function PasswordField(')
if(passwordStart>=0){
  const passwordEnd=workspace.indexOf('\n}\n\nexport default function Home()',passwordStart)
  if(passwordEnd<0) throw new Error('V46 shell: PasswordField end anchor missing')
  workspace=workspace.slice(0,passwordStart)+workspace.slice(passwordEnd+3)
}
workspace=workspace.replaceAll('<Logo/>','<AppLogo/>')

const importAnchor="import { passwordUi } from '../auth/passwordUi'"
const imports=[
  "import { PasswordField } from '../auth/PasswordField'",
  "import { AppLogo } from './AppLogo'",
  "import { ProtectedWorkspaceShell } from './ProtectedWorkspaceShell'"
]
for(const line of imports){
  if(!workspace.includes(line)){
    if(!workspace.includes(importAnchor)) throw new Error('V46 shell: import anchor missing')
    workspace=workspace.replace(importAnchor,`${importAnchor}\n${line}`)
  }
}

const oldProtected=`  function protectedWorkspace(content){\n    return <><header className="appTop"><div className="brand"><AppLogo/><b>AS Workspace Gold</b></div><div className="appHeaderTools"><span className="legalChip">{t.legal}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language} showLabel/><LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage} showLabel/><button className="secondary" onClick={()=>supabase.auth.signOut()}>{a.logout}</button></div></header><main className="appMain">{message&&<div className="note">{message}</div>}{content}</main><LegalFooter language={language}/></>\n  }`
const newProtected=`  function protectedWorkspace(content){\n    return <ProtectedWorkspaceShell language={language} outputLanguage={outputLanguage} onLanguageChange={setLanguage} onOutputLanguageChange={setOutputLanguage} legalLabel={t.legal} languageLabel={t.language} outputLanguageLabel={t.outputLanguage} logoutLabel={a.logout} onLogout={()=>supabase.auth.signOut()} message={message}>{content}</ProtectedWorkspaceShell>\n  }`
if(workspace.includes(oldProtected)) workspace=workspace.replace(oldProtected,newProtected)
else if(!workspace.includes('<ProtectedWorkspaceShell language={language}')) throw new Error('V46 shell: protectedWorkspace markup anchor missing')

write(workspacePath,workspace)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=read(guardPath)
const inventory=[
  "  'app/modules/auth/PasswordField.js',",
  "  'app/modules/workspace/AppLogo.js',",
  "  'app/modules/workspace/ProtectedWorkspaceShell.js',"
]
for(const entry of inventory){
  if(!guard.includes(entry)){
    const anchor="  'app/modules/workspace/stateConfig.js',"
    if(!guard.includes(anchor)) throw new Error('V46 shell: guard inventory anchor missing')
    guard=guard.replace(anchor,`${anchor}\n${entry}`)
  }
}
const assertionAnchor="assert.match(workspace,/\\.\\/stateConfig/)"
if(!guard.includes("assert.match(workspace,/ProtectedWorkspaceShell/)")){
  if(!guard.includes(assertionAnchor)) throw new Error('V46 shell: guard assertion anchor missing')
  guard=guard.replace(assertionAnchor,`${assertionAnchor}\nassert.match(workspace,/ProtectedWorkspaceShell/)\nassert.match(workspace,/\\.\\.\\/auth\\/PasswordField/)\nassert.match(workspace,/\\.\\/AppLogo/)\nassert.doesNotMatch(workspace,/function PasswordField\\(/)\nassert.doesNotMatch(workspace,/function Logo\\(/)`)
}
write(guardPath,guard)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('V46 Workspace-Shell')){
  docs += '\n\n### V46 Workspace-Shell\n\n- `auth/PasswordField.js` besitzt das wiederverwendbare Passwortfeld.\n- `workspace/AppLogo.js` besitzt die gemeinsame AS-Gold-Logo-Komponente.\n- `workspace/ProtectedWorkspaceShell.js` besitzt Header, Sprach-/Ausgabesprachen-Steuerung, Logout-Rahmen, Nachrichtenfläche und Footer des geschützten Bereichs.\n- `WorkspaceApp.js` übergibt nur noch Zustand und Handler an die Shell statt deren Markup selbst zu duplizieren.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('ProtectedWorkspaceShell.js')){
  readme += '\n### Workspace composition components\n\n- `auth/PasswordField.js`: reusable authentication password control.\n- `workspace/AppLogo.js`: shared product mark.\n- `workspace/ProtectedWorkspaceShell.js`: protected header/language/logout/message/footer composition.\n\nThe workspace controller now delegates repeated shell markup to explicit components.\n'
}
write(readmePath,readme)

console.log('V46 workspace shell components extracted behind auth/workspace boundaries.')
