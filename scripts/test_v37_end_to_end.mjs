import fs from 'node:fs'

const page=fs.readFileSync('app/page.js','utf8')
const layout=fs.readFileSync('app/layout.js','utf8')
const firstAction=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const problem=fs.readFileSync('app/components/ProblemNavigator.js','utf8')

const mustContain=(source,needle,label)=>{
  if(!source.includes(needle)) throw new Error(`V37 E2E guard: missing ${label}: ${needle}`)
}

// 1. Public entry -> guided problem input / upload / sample.
mustContain(layout,'V37FirstAction','V37 first-action mount')
mustContain(layout,'ProblemNavigator','problem navigator mount')
mustContain(firstAction,'Problem beschreiben','problem CTA')
mustContain(firstAction,'Dokument hochladen','upload CTA')
mustContain(firstAction,'Beispiel ansehen','sample CTA')
mustContain(problem,'analyse()','problem analysis trigger')
mustContain(problem,'recommendation','first recommendation result')

// 2. Registration / login path remains reachable.
mustContain(page,"setScreen('register')",'registration route')
mustContain(page,"setScreen('login')",'login route')
mustContain(page,'signInWithPassword','password login')
mustContain(page,'auth.signUp','registration action')

// 3. Document intake supports the common office/photo/email formats.
for(const ext of ['pdf','jpg','png','docx','xlsx','pptx','eml','msg']) mustContain(page,`'${ext}'`,`upload extension ${ext}`)
mustContain(page,"action==='scan'||action==='upload'",'quick upload route')
mustContain(page,'DocumentSection','document workspace')

// 4. Analysis -> case assignment -> traffic light -> next step.
mustContain(page,'async function analyzeDocument','document analysis')
mustContain(page,"supabase.functions.invoke('gold-ocr-v28'",'OCR/analysis backend')
mustContain(page,'analysis_summary','analysis summary persistence')
mustContain(page,'analysis_next_step','next-step persistence')
mustContain(page,'async function createAssessment','traffic-light assessment creation')
mustContain(page,"traffic_light:'yellow'",'default case traffic light')
mustContain(page,"traffic_light:draft.traffic_light",'assessment traffic light')

// 5. Prepared response / approval flow.
mustContain(page,'createApproval','approval creation')
mustContain(page,'ApprovalSection','approval workspace')
mustContain(page,'ApprovalDetail','approval detail')
mustContain(page,'prepareDocumentApproval','prepare approval from document')

// 6. Export path offers all promised customer formats.
mustContain(page,"doExport({kind:'case',item:selectedCase},exportType)",'case export action')
for(const [value,label] of [['pdf','PDF'],['docx','Word (.docx)'],['xlsx','Excel (.xlsx)'],['pptx','PowerPoint (.pptx)'],['csv','CSV (.csv)'],['txt','Text (.txt)']]){
  mustContain(page,`<option value=\"${value}\">${label}</option>`,`export ${label}`)
}
mustContain(page,'function downloadBlob','download delivery')

// 7. Back-navigation exists from the major protected sections.
for(const marker of ['backOverview','backCases','backClients','backExplanation']) mustContain(page,marker,`navigation ${marker}`)

console.log('V37 code-path end-to-end regression checks passed')
