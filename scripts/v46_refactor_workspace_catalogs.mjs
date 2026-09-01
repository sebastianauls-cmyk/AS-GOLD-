import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})

function findConstObject(source,name){
  const marker=`const ${name} =`
  const start=source.indexOf(marker)
  if(start<0) return null
  const brace=source.indexOf('{',start+marker.length)
  if(brace<0) throw new Error(`V46 catalogs: opening object brace missing for ${name}`)
  let depth=0
  let quote=null
  let escaped=false
  for(let i=brace;i<source.length;i++){
    const ch=source[i]
    if(quote){
      if(escaped){ escaped=false; continue }
      if(ch==='\\'){ escaped=true; continue }
      if(ch===quote){ quote=null }
      continue
    }
    if(ch==='"'||ch==="'"||ch==='`'){ quote=ch; continue }
    if(ch==='{') depth++
    if(ch==='}'){
      depth--
      if(depth===0){
        let end=i+1
        if(source[end]===';') end++
        while(source[end]===' '||source[end]==='\t') end++
        if(source[end]==='\r') end++
        if(source[end]==='\n') end++
        return {start,end,expression:source.slice(source.indexOf('=',start)+1,i+1).trim()}
      }
    }
  }
  throw new Error(`V46 catalogs: closing object brace missing for ${name}`)
}

function extractCatalog({workspace,name,modulePath,importPath}){
  const existing=findConstObject(workspace,name)
  if(existing){
    ensureDir(modulePath.split('/').slice(0,-1).join('/'))
    write(modulePath,`export const ${name} = ${existing.expression}\n`)
    workspace=workspace.slice(0,existing.start)+workspace.slice(existing.end)
  }else if(!fs.existsSync(modulePath)){
    throw new Error(`V46 catalogs: neither inline ${name} nor ${modulePath} exists`)
  }
  const importLine=`import { ${name} } from '${importPath}'`
  if(!workspace.includes(importLine)){
    const anchor="import { allowedUploadAccept, allowedUploadExtensions, maxUploadBytes, uploadUi } from '../documents/uploadConfig'"
    if(!workspace.includes(anchor)) throw new Error(`V46 catalogs: import anchor missing for ${name}`)
    workspace=workspace.replace(anchor,`${anchor}\n${importLine}`)
  }
  return workspace
}

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)
workspace=extractCatalog({workspace,name:'passwordUi',modulePath:'app/modules/auth/passwordUi.js',importPath:'../auth/passwordUi'})
workspace=extractCatalog({workspace,name:'ui',modulePath:'app/modules/public/publicUi.js',importPath:'../public/publicUi'})
workspace=extractCatalog({workspace,name:'exportUi',modulePath:'app/modules/documents/exportUi.js',importPath:'../documents/exportUi'})
workspace=extractCatalog({workspace,name:'appText',modulePath:'app/modules/workspace/workspaceText.js',importPath:'./workspaceText'})
write(workspacePath,workspace)

const prelaunchPath='scripts/test_v38_prelaunch_guard.mjs'
let prelaunch=read(prelaunchPath)
if(!prelaunch.includes("const workspaceText=read('app/modules/workspace/workspaceText.js')")){
  const anchor="const uploadConfig=read('app/modules/documents/uploadConfig.js')"
  if(!prelaunch.includes(anchor)) throw new Error('V46 catalogs: prelaunch upload-config anchor missing')
  prelaunch=prelaunch.replace(anchor,`${anchor}\nconst workspaceText=read('app/modules/workspace/workspaceText.js')\nconst publicUi=read('app/modules/public/publicUi.js')\nconst workspaceCopy=page+'\\n'+workspaceText+'\\n'+publicUi`)
}
for(const needle of [
  'Bezahlfunktion ist vorübergehend deaktiviert',
  'keine Zahlung ausgelöst',
  'Keine automatische Verlängerung'
]){
  const old=`assert.match(page,/${needle}/)`
  const next=`assert.match(workspaceCopy,/${needle}/)`
  if(prelaunch.includes(old)) prelaunch=prelaunch.replace(old,next)
}
write(prelaunchPath,prelaunch)

const v46Path='scripts/test_v46_modular_boundaries.mjs'
let v46=read(v46Path)
const inventory=[
  "  'app/modules/auth/passwordUi.js',",
  "  'app/modules/public/publicUi.js',",
  "  'app/modules/documents/exportUi.js',",
  "  'app/modules/workspace/workspaceText.js',"
]
for(const entry of inventory){
  if(!v46.includes(entry)){
    const anchor="  'app/modules/documents/uploadConfig.js',"
    if(!v46.includes(anchor)) throw new Error('V46 catalogs: module inventory anchor missing')
    v46=v46.replace(anchor,`${anchor}\n${entry}`)
  }
}
const assertionAnchor="assert.doesNotMatch(workspace,/const maxUploadBytes =/)"
if(!v46.includes("assert.match(workspace,/\\.\\.\\/auth\\/passwordUi/)")){
  if(!v46.includes(assertionAnchor)) throw new Error('V46 catalogs: workspace assertion anchor missing')
  v46=v46.replace(assertionAnchor,`${assertionAnchor}\nassert.match(workspace,/\\.\\.\\/auth\\/passwordUi/)\nassert.match(workspace,/\\.\\.\\/public\\/publicUi/)\nassert.match(workspace,/\\.\\.\\/documents\\/exportUi/)\nassert.match(workspace,/\\.\\/workspaceText/)\nassert.doesNotMatch(workspace,/const passwordUi =/)\nassert.doesNotMatch(workspace,/const ui =/)\nassert.doesNotMatch(workspace,/const exportUi =/)\nassert.doesNotMatch(workspace,/const appText =/)`)
}
write(v46Path,v46)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('Statische Workspace-Kataloge')){
  docs += '\n\n### V46 Statische Workspace-Kataloge\n\n- Passwort-UI-Texte liegen unter app/modules/auth/passwordUi.js.\n- Öffentliche Oberflächentexte liegen unter app/modules/public/publicUi.js.\n- Exporttexte liegen unter app/modules/documents/exportUi.js.\n- Die umfangreichen geschützten Workspace-Texte liegen unter app/modules/workspace/workspaceText.js.\n- WorkspaceApp importiert die Kataloge nur noch über die jeweiligen Fachgrenzen und enthält keine führenden Kopien mehr.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('workspaceText.js')){
  readme += '\n### Workspace catalog boundaries\n\n- `auth/passwordUi.js`: password visibility copy.\n- `public/publicUi.js`: public landing and language-control copy.\n- `documents/exportUi.js`: export labels and status copy.\n- `workspace/workspaceText.js`: protected-workspace application copy.\n\nWorkspaceApp consumes these catalogs; it no longer owns their leading definitions.\n'
}
write(readmePath,readme)

console.log('V46 static UI and workspace catalogs extracted behind domain boundaries.')
