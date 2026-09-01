import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)

const importLine="import { allowedUploadAccept, allowedUploadExtensions, maxUploadBytes, uploadUi } from '../documents/uploadConfig'"
if(!workspace.includes(importLine)){
  const anchor="import { invokeDocumentAnalysis } from '../services/documentAnalysis'"
  if(!workspace.includes(anchor)) throw new Error('V46 upload refactor: service import anchor missing')
  workspace=workspace.replace(anchor,`${anchor}\n${importLine}`)
}

const startMarker='// Temporary V26 test ceiling.'
const endMarker='\n\nconst ui = {'
if(workspace.includes(startMarker)){
  const start=workspace.indexOf(startMarker)
  const end=workspace.indexOf(endMarker,start)
  if(end<0) throw new Error('V46 upload refactor: upload config block end missing')
  const block=workspace.slice(start,end)
  const moduleBody=block
    .replace('const maxUploadBytes =','export const maxUploadBytes =')
    .replace('const allowedUploadExtensions =','export const allowedUploadExtensions =')
    .replace('const allowedUploadAccept =','export const allowedUploadAccept =')
    .replace('const uploadUi =','export const uploadUi =')
  fs.mkdirSync('app/modules/documents',{recursive:true})
  write('app/modules/documents/uploadConfig.js',`${moduleBody}\n`)
  workspace=workspace.slice(0,start)+workspace.slice(end+2)
}else if(!fs.existsSync('app/modules/documents/uploadConfig.js')){
  throw new Error('V46 upload refactor: neither inline config nor module exists')
}
write(workspacePath,workspace)

const e2ePath='scripts/test_v37_end_to_end.mjs'
let e2e=read(e2ePath)
if(!e2e.includes("const uploadConfig=fs.readFileSync('app/modules/documents/uploadConfig.js','utf8')")){
  const anchor="const analysisService=fs.readFileSync('app/modules/services/documentAnalysis.js','utf8')"
  if(!e2e.includes(anchor)) throw new Error('V46 upload refactor: E2E analysis-service anchor missing')
  e2e=e2e.replace(anchor,`${anchor}\nconst uploadConfig=fs.readFileSync('app/modules/documents/uploadConfig.js','utf8')`)
}
e2e=e2e.replace("for(const ext of ['pdf','jpg','png','docx','xlsx','pptx','eml','msg']) mustContain(page,`'${ext}'`,`upload extension ${ext}`)","for(const ext of ['pdf','jpg','png','docx','xlsx','pptx','eml','msg']) mustContain(uploadConfig,`'${ext}'`,`upload extension ${ext}`)")
write(e2ePath,e2e)

const prelaunchPath='scripts/test_v38_prelaunch_guard.mjs'
let prelaunch=read(prelaunchPath)
if(!prelaunch.includes("const uploadConfig=read('app/modules/documents/uploadConfig.js')")){
  const anchor="const integrationTokens=read('app/modules/integrations/tokens.js')"
  if(!prelaunch.includes(anchor)) throw new Error('V46 upload refactor: prelaunch source anchor missing')
  prelaunch=prelaunch.replace(anchor,`${anchor}\nconst uploadConfig=read('app/modules/documents/uploadConfig.js')`)
}
prelaunch=prelaunch.replace('assert.match(page,/maxUploadBytes = 50 \\* 1024 \\* 1024/)','assert.match(uploadConfig,/maxUploadBytes = 50 \\* 1024 \\* 1024/)')
prelaunch=prelaunch.replace('assert.match(page,/allowedUploadExtensions/)','assert.match(uploadConfig,/allowedUploadExtensions/)')
prelaunch=prelaunch.replace('assert.match(page,/tooLarge/)','assert.match(uploadConfig,/tooLarge/)')
prelaunch=prelaunch.replace('assert.match(page,/unsupported/)','assert.match(uploadConfig,/unsupported/)')
write(prelaunchPath,prelaunch)

const v46Path='scripts/test_v46_modular_boundaries.mjs'
let v46=read(v46Path)
if(!v46.includes("  'app/modules/documents/uploadConfig.js',")){
  const anchor="  'app/modules/documents/V26DocumentAnalysis.js',"
  if(!v46.includes(anchor)) throw new Error('V46 upload refactor: document module inventory anchor missing')
  v46=v46.replace(anchor,`${anchor}\n  'app/modules/documents/uploadConfig.js',`)
}
if(!v46.includes("assert.match(workspace,/\\.\\.\\/documents\\/uploadConfig/)")){
  const anchor='assert.match(workspace,/invokeDocumentAnalysis/)'
  if(!v46.includes(anchor)) throw new Error('V46 upload refactor: Workspace assertion anchor missing')
  v46=v46.replace(anchor,`${anchor}\nassert.match(workspace,/\\.\\.\\/documents\\/uploadConfig/)\nassert.doesNotMatch(workspace,/const maxUploadBytes =/)`)
}
write(v46Path,v46)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
if(!docs.includes('Upload-Konfiguration wurde aus WorkspaceApp herausgelöst')){
  docs += '\n\n### V46 Dokumentmodul – Upload-Konfiguration\n\n- Die Upload-Konfiguration wurde aus WorkspaceApp herausgelöst und liegt führend unter app/modules/documents/uploadConfig.js.\n- Dateigrenze, unterstützte Dateiendungen, Accept-Liste und lokalisierte Upload-Hinweise besitzen damit eine eindeutige fachliche Zuständigkeit im Dokumentmodul.\n- WorkspaceApp konsumiert diese Werte nur noch über die Modulgrenze.\n- Die End-to-End-, Prelaunch- und V46-Modulguards wurden auf die neue Zuständigkeit umgestellt.\n'
}
write(docsPath,docs)

const readmePath='app/modules/README.md'
let readme=read(readmePath)
if(!readme.includes('uploadConfig.js')){
  readme += '\n- `documents/uploadConfig.js`: owns upload limits, accepted file extensions and localized upload validation copy; WorkspaceApp only consumes this domain configuration.\n'
}
write(readmePath,readme)

console.log('V46 document upload configuration extracted behind the documents module boundary.')
