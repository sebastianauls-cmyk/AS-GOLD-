import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)

ensureDir('app/modules/workspace')
const loadingPath='app/modules/workspace/LoadingSurface.js'
if(!fs.existsSync(loadingPath)){
  write(loadingPath,`import { LegalFooter } from '../compliance/LegalFooter'\nimport { AppLogo } from './AppLogo'\n\nexport function LoadingSurface({language,checking}){\n  return <><main className="center"><section className="card"><AppLogo/><h1>AS Gold</h1><p>{checking}</p></section></main><LegalFooter language={language}/></>\n}\n`)
}

const loadingInline=`  if(screen==='loading') return <><main className="center"><section className="card"><AppLogo/><h1>AS Gold</h1><p>{a.checking}</p></section></main><LegalFooter language={language}/></>`
if(workspace.includes(loadingInline)) workspace=workspace.replace(loadingInline,`  if(screen==='loading') return <LoadingSurface language={language} checking={a.checking}/>`)
if(!workspace.includes("import { LoadingSurface } from './LoadingSurface'")){
  const anchor="import { ProtectedWorkspaceShell } from './ProtectedWorkspaceShell'"
  if(!workspace.includes(anchor)) throw new Error('V46 single shell: ProtectedWorkspaceShell import anchor missing')
  workspace=workspace.replace(anchor,`${anchor}\nimport { LoadingSurface } from './LoadingSurface'`)
}

const alreadyConsolidated=workspace.includes("return <PublicLanding")&&!workspace.includes('<header className="appTop">')
if(!alreadyConsolidated){
  const appBlockMarker="  if(screen==='app'){"
  const publicMarker='\n\n  return <>\n    <header className="publicTop">'
  const appStart=workspace.indexOf(appBlockMarker)
  const publicStart=workspace.indexOf(publicMarker,appStart)
  if(appStart<0||publicStart<0) throw new Error('V46 single shell: app/public block markers missing')
  let appBlock=workspace.slice(appStart,publicStart)

  if(appBlock.includes('<header className="appTop">')){
    const returnStart=appBlock.indexOf('    return <><header className="appTop">')
    const mainMarker='<main className="appMain">{message&&<div className="note">{message}</div>}'
    const mainStart=appBlock.indexOf(mainMarker,returnStart)
    const closeMarker='</main><LegalFooter language={language}/></>'
    const closeStart=appBlock.lastIndexOf(closeMarker)
    if(returnStart<0||mainStart<0||closeStart<mainStart) throw new Error('V46 single shell: legacy shell boundaries missing')
    const innerStart=mainStart+mainMarker.length
    const inner=appBlock.slice(innerStart,closeStart)
    const replacement=`    return protectedWorkspace(<>${inner}</>)`
    appBlock=appBlock.slice(0,returnStart)+replacement+appBlock.slice(closeStart+closeMarker.length)
    workspace=workspace.slice(0,appStart)+appBlock+workspace.slice(publicStart)
  }
}

if(workspace.includes('<header className="appTop">')) throw new Error('V46 single shell: duplicate protected app header remains in WorkspaceApp')
write(workspacePath,workspace)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=read(guardPath)
const loadingInventory="  'app/modules/workspace/LoadingSurface.js',"
if(!guard.includes(loadingInventory)){
  const anchor="  'app/modules/workspace/ProtectedWorkspaceShell.js',"
  if(!guard.includes(anchor)) throw new Error('V46 single shell: guard inventory anchor missing')
  guard=guard.replace(anchor,`${anchor}\n${loadingInventory}`)
}
if(!guard.includes("assert.doesNotMatch(workspace,/<header className=\\\"appTop\\\">/)")){
  const anchor="assert.match(workspace,/ProtectedWorkspaceShell/)"
  if(!guard.includes(anchor)) throw new Error('V46 single shell: guard assertion anchor missing')
  guard=guard.replace(anchor,`${anchor}\nassert.match(workspace,/LoadingSurface/)\nassert.doesNotMatch(workspace,/<header className=\\\"appTop\\\">/)\nassert.match(read('app/modules/workspace/ProtectedWorkspaceShell.js'),/<header className=\\\"appTop\\\">/)`)
}
write(guardPath,guard)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('V46 Einheitliche Workspace-Shell')){
  docs += '\n\n### V46 Einheitliche Workspace-Shell\n\n- `workspace/ProtectedWorkspaceShell.js` ist die einzige Quelle für den geschützten App-Header, Oberflächen-/Ausgabesprache, Logout, globale Nachricht und Footer.\n- Der bisherige zweite Header/Footer-Pfad im allgemeinen App-Rendering wurde entfernt; alle geschützten Ansichten laufen durch dieselbe Shell.\n- `workspace/LoadingSurface.js` besitzt den Ladebildschirm separat.\n- Damit können Navigations- und Sprachänderungen nicht mehr versehentlich nur einen von zwei parallelen App-Rahmen verändern.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('workspace/LoadingSurface.js')){
  readme += '\n- `workspace/LoadingSurface.js`: isolated loading state. The protected application has a single shell owner in `ProtectedWorkspaceShell.js`.\n'
}
write(readmePath,readme)

console.log(alreadyConsolidated?'V46 protected workspace shell already consolidated; idempotent guard confirmed.':'V46 protected workspace shell consolidated and loading surface extracted.')
