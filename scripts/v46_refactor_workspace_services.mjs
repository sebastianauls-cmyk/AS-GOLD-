import fs from 'node:fs'

const read=path=>fs.readFileSync(path,'utf8')
const write=(path,content)=>fs.writeFileSync(path,content)
const replaceRequired=(source,from,to,label)=>{
  if(source.includes(to)) return source
  if(!source.includes(from)) throw new Error(`V46 refactor pattern missing: ${label}`)
  return source.replace(from,to)
}

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let workspace=read(workspacePath)
workspace=replaceRequired(
  workspace,
  "import { createClient } from '@supabase/supabase-js'",
  "import { supabase } from '../services/supabaseClient'\nimport { invokeDocumentAnalysis } from '../services/documentAnalysis'",
  'workspace Supabase import'
)
if(workspace.includes('const supabase = createClient(')){
  const before=workspace
  workspace=workspace.replace(/\nconst supabase = createClient\([\s\S]*?\n\)\n\nconst emptyData/, '\nconst emptyData')
  if(workspace===before) throw new Error('V46 refactor could not remove inline Supabase client')
}
workspace=replaceRequired(
  workspace,
  "const {data:result,error}=await supabase.functions.invoke('gold-ocr-v28',{body:{file_path:document.file_path,document_id:document.id,acknowledged:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION}})",
  "const {data:result,error}=await invokeDocumentAnalysis({supabase,documentId:document.id,filePath:document.file_path,outputLanguage,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})",
  'explicit document-analysis invocation'
)
write(workspacePath,workspace)

const layoutPath='app/layout.js'
let layout=read(layoutPath)
layout=layout.replace("import { OutputLanguageBridge } from './modules/language/OutputLanguageBridge'\n",'')
layout=layout.replace('<OutputLanguageBridge/>','')
write(layoutPath,layout)

write(
  'app/modules/language/OutputLanguageBridge.js',
  "'use client'\n\n// Compatibility shell only. Output language now flows explicitly into the document-analysis service.\nexport function OutputLanguageBridge(){ return null }\nexport const V45OutputLanguageBridge=OutputLanguageBridge\n"
)

const e2ePath='scripts/test_v37_end_to_end.mjs'
let e2e=read(e2ePath)
e2e=replaceRequired(
  e2e,
  "const problemCompatibility=fs.readFileSync('app/components/ProblemNavigator.js','utf8')\n",
  "const problemCompatibility=fs.readFileSync('app/components/ProblemNavigator.js','utf8')\nconst analysisService=fs.readFileSync('app/modules/services/documentAnalysis.js','utf8')\n",
  'V37 analysis service source'
)
e2e=replaceRequired(
  e2e,
  "mustContain(page,\"supabase.functions.invoke('gold-ocr-v28'\",'OCR/analysis backend')",
  "mustContain(page,'invokeDocumentAnalysis','OCR/analysis service boundary')\nmustContain(analysisService,\"supabase.functions.invoke('gold-ocr-v28'\",'OCR/analysis backend')",
  'V37 OCR service guard'
)
write(e2ePath,e2e)

write('scripts/test_v45_output_language.mjs',[
  "import fs from 'node:fs'",
  "import assert from 'node:assert/strict'",
  '',
  "const compatibility=fs.readFileSync('app/components/V45OutputLanguageBridge.js','utf8')",
  "const bridge=fs.readFileSync('app/modules/language/OutputLanguageBridge.js','utf8')",
  "const module=fs.readFileSync('app/modules/language/outputLanguage.js','utf8')",
  "const service=fs.readFileSync('app/modules/services/documentAnalysis.js','utf8')",
  "const workspace=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')",
  "const fn=fs.readFileSync('supabase/functions/gold-ocr-v28/index.ts','utf8')",
  "const layout=fs.readFileSync('app/layout.js','utf8')",
  '',
  "assert.match(module,/OUTPUT_LANGUAGE_STORAGE_KEY='asgold-output-language'/)",
  'assert.match(module,/normalizeOutputLanguage/)',
  'assert.match(service,/gold-ocr-v28/)',
  'assert.match(service,/output_language:outputLanguage/)',
  'assert.match(workspace,/invokeDocumentAnalysis/)',
  'assert.match(workspace,/outputLanguage/)',
  'assert.match(compatibility,/modules\\/language\\/OutputLanguageBridge/)',
  'assert.doesNotMatch(bridge,/window\\.fetch|gold-ocr-v28/)',
  'assert.doesNotMatch(layout,/OutputLanguageBridge/)',
  'assert.match(fn,/OUTPUT_LANGUAGES/)',
  'assert.match(fn,/summary und next_step vollständig auf/)',
  'assert.match(fn,/output_language:requestedOutputLanguage/)',
  "console.log('V45 output-language guard passed: output language now reaches OCR through an explicit document-analysis service with no global fetch interception.')",
  ''
].join('\n'))

const v46Path='scripts/test_v46_modular_boundaries.mjs'
let v46=read(v46Path)
v46=replaceRequired(
  v46,
  "  'app/modules/services/supabaseClient.js',",
  "  'app/modules/services/supabaseClient.js',\n  'app/modules/services/documentAnalysis.js',",
  'V46 service inventory'
)
v46=replaceRequired(
  v46,
  "assert.match(workspace,/doExport/)\n",
  "assert.match(workspace,/doExport/)\nassert.match(workspace,/\\.\\.\\/services\\/supabaseClient/)\nassert.match(workspace,/\\.\\.\\/services\\/documentAnalysis/)\nassert.doesNotMatch(workspace,/createClient\\(/)\nassert.match(workspace,/invokeDocumentAnalysis/)\n",
  'V46 workspace service assertions'
)
v46=replaceRequired(
  v46,
  "assert.match(layout,/modules\\/language\\/OutputLanguageBridge/)\n",
  "assert.doesNotMatch(layout,/OutputLanguageBridge/)\n",
  'V46 layout bridge assertion'
)
v46=replaceRequired(
  v46,
  "const switcher=read('app/modules/language/LanguageSwitcher.js')\n",
  "const outputBridge=read('app/modules/language/OutputLanguageBridge.js')\nconst analysisService=read('app/modules/services/documentAnalysis.js')\nassert.doesNotMatch(outputBridge,/window\\.fetch|gold-ocr-v28/)\nassert.match(analysisService,/output_language:outputLanguage/)\n\nconst switcher=read('app/modules/language/LanguageSwitcher.js')\n",
  'V46 explicit output-language assertions'
)
write(v46Path,v46)

const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'
let docs=read(docsPath)
docs=docs.replace(
  '- Noch offen: die verbleibende globale `window.fetch`-Interception und das DOM-Polling vollständig durch expliziten Datenfluss zu Analyse-/Exportservices ersetzen.',
  '- Die globale window.fetch-Interception ist entfernt. Die Ausgabesprache wird jetzt explizit aus WorkspaceApp an app/modules/services/documentAnalysis.js und von dort als output_language an gold-ocr-v28 übergeben. Der alte Bridge-Pfad bleibt nur als wirkungslose Kompatibilitätshülle bestehen.'
)
const nextBlock=[
  '## Verbleibende Kernarbeiten vor Freigabe',
  '',
  '1. Den geschützten Workspace weiter in Dashboard, Cases, Clients, Documents, Approvals, Pricing und AccountControl aufteilen.',
  '2. Verbliebene Public-/Case-Enhancer, die gerendertes DOM dekorieren, durch direkte Komponentenstruktur ersetzen.',
  '3. Weitere Supabase-, Daten- und Exportzugriffe aus WorkspaceApp hinter Fachservices verschieben; der gemeinsame Supabase-Client und die Dokumentanalyse sind bereits ausgelagert.',
  '4. Den öffentlichen, Auth- und geschützten Workspace als getrennte Kompositionsflächen aus WorkspaceApp herauslösen.',
  '5. Abschließenden vollständigen Build-, Mobil-, Accessibility-, Navigations- und Funktions-Smoketest durchführen.',
  '',
  '## Freigaberegel'
].join('\n')
docs=docs.replace(/## Noch offene Kernarbeiten vor Freigabe[\s\S]*?## Freigaberegel/,nextBlock)
write(docsPath,docs)

const moduleReadmePath='app/modules/README.md'
let moduleReadme=read(moduleReadmePath)
moduleReadme=moduleReadme.replace(
  '- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. OutputLanguageBridge no longer performs DOM polling; only its temporary fetch interception remains.',
  '- `language/`: owns LanguageSwitcher, ExplainerVideoDialog, LegalLanguageContext, output-language helpers, the complete language catalog chain and component translation catalogs. V43/V44 DOM correction layers are removed. Output-language transport no longer relies on DOM polling or global fetch interception.'
)
moduleReadme=moduleReadme.replace(
  '- `services/`: owns Office export implementation and now a shared Supabase client used by the compliance privacy dashboard. The old `app/lib/officeExports.js` path is only an adapter. Workspace data access and OCR orchestration still need extraction.',
  '- `services/`: owns Office export implementation, the shared Supabase client and explicit document-analysis invocation. Workspace and compliance surfaces share the same Supabase client, and OCR receives the selected output language through the service boundary. Remaining CRUD/export orchestration still needs extraction.'
)
const blockers=[
  '## Remaining release blockers',
  '',
  '- Replace remaining public/case DOM enhancers with direct React component composition where they still mutate rendered markup.',
  '- Decompose WorkspaceApp.js into public, auth, dashboard/cases, documents, pricing and account/compliance composition surfaces.',
  '- Move the remaining WorkspaceApp CRUD, upload and export orchestration behind service/domain boundaries.',
  '- Run the final full preview build plus mobile/navigation regression and functional smoke checks before touching main or reopening tester access.',
  '',
  'Current gate:'
].join('\n')
moduleReadme=moduleReadme.replace(/## Remaining release blockers[\s\S]*?Current gate:/,blockers)
write(moduleReadmePath,moduleReadme)

console.log('V46 workspace service refactor prepared successfully.')
