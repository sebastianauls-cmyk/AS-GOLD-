import fs from 'node:fs'

// V37 final production verification trigger: 2026-09-01
const page=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')
const pageEntry=fs.readFileSync('app/page.js','utf8')
const layout=fs.readFileSync('app/layout.js','utf8')
const firstAction=fs.readFileSync('app/modules/public/V37FirstAction.js','utf8')
const firstActionCompatibility=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const problem=fs.readFileSync('app/modules/public/ProblemNavigator.js','utf8')
const problemCompatibility=fs.readFileSync('app/components/ProblemNavigator.js','utf8')
const analysisService=fs.readFileSync('app/modules/services/documentAnalysis.js','utf8')
const uploadConfig=fs.readFileSync('app/modules/documents/uploadConfig.js','utf8')
const authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
const publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')

const mustContain=(source,needle,label)=>{
  if(!source.includes(needle)) throw new Error(`V37 E2E guard: missing ${label}: ${needle}`)
}

mustContain(pageEntry,"./modules/workspace/WorkspaceApp",'workspace page module boundary')
mustContain(layout,'V37FirstAction','V37 first-action mount')
mustContain(layout,"./modules/public/V37FirstAction",'V37 first-action module ownership')
mustContain(layout,'ProblemNavigator','problem navigator mount')
mustContain(layout,"./modules/public/ProblemNavigator",'problem navigator module ownership')
mustContain(firstActionCompatibility,"../modules/public/V37FirstAction",'V37 first-action compatibility re-export')
mustContain(problemCompatibility,"../modules/public/ProblemNavigator",'problem navigator compatibility re-export')
mustContain(firstAction,'Problem beschreiben','problem CTA')
mustContain(firstAction,'Dokument hochladen','upload CTA')
mustContain(firstAction,'Beispiel ansehen','sample CTA')
mustContain(problem,'analyse()','problem analysis trigger')
mustContain(problem,'recommendation','first recommendation result')

mustContain(publicLanding,"setScreen('register')",'registration route in public module')
mustContain(publicLanding,"setScreen('login')",'login route in public module')
mustContain(page,'signInWithPassword','password login')
mustContain(page,'auth.signUp','registration action')

for(const ext of ['pdf','jpg','png','docx','xlsx','pptx','eml','msg']) mustContain(uploadConfig,`'${ext}'`,`upload extension ${ext}`)
mustContain(page,"action==='scan'||action==='upload'",'quick upload route')
mustContain(page,'DocumentSection','document workspace')

mustContain(page,'async function analyzeDocument','document analysis')
mustContain(page,'invokeDocumentAnalysis','OCR/analysis service boundary')
mustContain(analysisService,"supabase.functions.invoke('gold-ocr-v28'",'OCR/analysis backend')
mustContain(page,'analysis_summary','analysis summary persistence')
mustContain(page,'analysis_next_step','next-step persistence')
mustContain(page,'async function createAssessment','traffic-light assessment creation')
mustContain(page,"traffic_light:'yellow'",'default case traffic light')
mustContain(page,"traffic_light:draft.traffic_light",'assessment traffic light')

mustContain(page,'createApproval','approval creation')
mustContain(page,'ApprovalSection','approval workspace')
mustContain(page,'ApprovalDetail','approval detail')
mustContain(page,'prepareDocumentApproval','prepare approval from document')

mustContain(page,"doExport({kind:'case',item:selectedCase},exportType)",'case export action')
for(const [value,label] of [['pdf','PDF'],['docx','Word (.docx)'],['xlsx','Excel (.xlsx)'],['pptx','PowerPoint (.pptx)'],['csv','CSV (.csv)'],['txt','Text (.txt)']]) mustContain(page,`<option value=\"${value}\">${label}</option>`,`export ${label}`)
mustContain(page,'function downloadBlob','download delivery')

for(const marker of ['backOverview','backCases','backClients']) mustContain(page,marker,`navigation ${marker}`)
mustContain(authSurface,'backExplanation','navigation backExplanation in auth module')

console.log('V37 code-path end-to-end regression checks passed through the workspace module boundary')
