import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const ensureDir=path=>fs.mkdirSync(path,{recursive:true})

function findStructuredConst(source,name){
  const marker=`const ${name} =`
  const start=source.indexOf(marker)
  if(start<0) return null
  let pos=start+marker.length
  while(/\s/.test(source[pos]||'')) pos++
  const opener=source[pos]
  if(opener!=='{'&&opener!=='[') throw new Error(`V46 domain catalogs: ${name} is not a structured const`)
  const closer=opener==='{'?'}':']'
  let depth=0
  let quote=null
  let escaped=false
  for(let i=pos;i<source.length;i++){
    const ch=source[i]
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote){quote=null}
      continue
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch===opener) depth++
    if(ch===closer){
      depth--
      if(depth===0){
        let end=i+1
        if(source[end]===';') end++
        while(source[end]===' '||source[end]==='\t') end++
        if(source[end]==='\r') end++
        if(source[end]==='\n') end++
        return {start,end,declaration:`export const ${name} = ${source.slice(pos,i+1)}\n`}
      }
    }
  }
  throw new Error(`V46 domain catalogs: closing delimiter missing for ${name}`)
}

function extractGroup(workspace,names,targetPath,importPath){
  const declarations=[]
  const found=[]
  for(const name of names){
    const match=findStructuredConst(workspace,name)
    if(match){
      declarations.push(match.declaration)
      workspace=workspace.slice(0,match.start)+workspace.slice(match.end)
      found.push(name)
    }
  }
  ensureDir(targetPath.split('/').slice(0,-1).join('/'))
  if(declarations.length){
    write(targetPath,declarations.join('\n'))
  }else if(!fs.existsSync(targetPath)){
    throw new Error(`V46 domain catalogs: no declarations found and ${targetPath} does not exist`)
  }
  const importNames=names.join(', ')
  const importLine=`import { ${importNames} } from '${importPath}'`
  if(!workspace.includes(importLine)){
    const anchor="import { passwordUi } from '../auth/passwordUi'"
    if(!workspace.includes(anchor)) throw new Error(`V46 domain catalogs: import anchor missing for ${targetPath}`)
    workspace=workspace.replace(anchor,`${anchor}\n${importLine}`)
  }
  return {workspace,found}
}

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)
const groups=[
  {
    names:['terms','plans','planJourney','planText','journeyLabels','recommendationText','periodText','goalTier','tierRank'],
    targetPath:'app/modules/pricing/catalog.js',
    importPath:'../pricing/catalog'
  },
  {
    names:['notices','dashboardGuide','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText'],
    targetPath:'app/modules/public/catalog.js',
    importPath:'../public/catalog'
  },
  {
    names:['launchTrustText','serverControlText','accessPendingMessages'],
    targetPath:'app/modules/compliance/workspaceControlText.js',
    importPath:'../compliance/workspaceControlText'
  },
  {
    names:['emptyData','emptyCase','sectionNames'],
    targetPath:'app/modules/workspace/stateConfig.js',
    importPath:'./stateConfig'
  }
]

for(const group of groups){
  const result=extractGroup(workspace,group.names,group.targetPath,group.importPath)
  workspace=result.workspace
}
write(workspacePath,workspace)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=read(guardPath)
const inventory=[
  "  'app/modules/pricing/catalog.js',",
  "  'app/modules/public/catalog.js',",
  "  'app/modules/compliance/workspaceControlText.js',",
  "  'app/modules/workspace/stateConfig.js',"
]
for(const entry of inventory){
  if(!guard.includes(entry)){
    const anchor="  'app/modules/workspace/workspaceText.js',"
    if(!guard.includes(anchor)) throw new Error('V46 domain catalogs: guard inventory anchor missing')
    guard=guard.replace(anchor,`${anchor}\n${entry}`)
  }
}
const guardAnchor="assert.doesNotMatch(workspace,/const appText =/)"
if(!guard.includes("assert.match(workspace,/\\.\\.\\/pricing\\/catalog/)")){
  if(!guard.includes(guardAnchor)) throw new Error('V46 domain catalogs: guard assertion anchor missing')
  guard=guard.replace(guardAnchor,`${guardAnchor}\nassert.match(workspace,/\\.\\.\\/pricing\\/catalog/)\nassert.match(workspace,/\\.\\.\\/public\\/catalog/)\nassert.match(workspace,/\\.\\.\\/compliance\\/workspaceControlText/)\nassert.match(workspace,/\\.\\/stateConfig/)\nfor (const name of ['terms','plans','planJourney','planText','journeyLabels','recommendationText','periodText','goalTier','tierRank','notices','dashboardGuide','transparencyText','caseDiscoveryText','publicAudienceText','testerLinkText','launchTrustText','serverControlText','accessPendingMessages','emptyData','emptyCase','sectionNames']) assert.doesNotMatch(workspace,new RegExp('const '+name+'\\\\s*='))`)
}
write(guardPath,guard)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('V46 Fachkataloge aus WorkspaceApp')){
  docs += '\n\n### V46 Fachkataloge aus WorkspaceApp\n\n- Preis- und Tarifdefinitionen liegen unter `app/modules/pricing/catalog.js`.\n- Öffentliche Discovery-/Transparenz-/Testertexte liegen unter `app/modules/public/catalog.js`.\n- Compliance- und Audit-/Löschtexte liegen unter `app/modules/compliance/workspaceControlText.js`.\n- Initiale Workspace-Zustände liegen unter `app/modules/workspace/stateConfig.js`.\n- `WorkspaceApp.js` importiert diese Kataloge nur noch und besitzt keine parallelen Inline-Kopien mehr.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('pricing/catalog.js')){
  readme += '\n### Extracted domain catalogs\n\n- `pricing/catalog.js`: plans, terms, plan journey and recommendation mappings.\n- `public/catalog.js`: public discovery, transparency and tester-link copy.\n- `compliance/workspaceControlText.js`: account-control, audit and deletion copy.\n- `workspace/stateConfig.js`: initial workspace data/case/section state.\n\nThese declarations no longer live in `WorkspaceApp.js`; the composition layer consumes them through explicit domain imports.\n'
}
write(readmePath,readme)

console.log('V46 domain catalogs extracted from WorkspaceApp behind pricing/public/compliance/workspace boundaries.')
