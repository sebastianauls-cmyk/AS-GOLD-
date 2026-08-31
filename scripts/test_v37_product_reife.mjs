import fs from 'node:fs'

const page=fs.readFileSync('app/page.js','utf8')
const css=fs.readFileSync('app/globals.css','utf8')
const firstAction=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const video=fs.readFileSync('app/components/ExplainerVideo.js','utf8')

const need=(source,needle,label)=>{if(!source.includes(needle)) throw new Error(`V37 readiness: missing ${label}`)}

// Responsive layout must explicitly support tablet and phone widths.
need(css,'@media(max-width:850px)','tablet breakpoint')
need(css,'@media(max-width:560px)','phone breakpoint')
need(css,'.exportBar select,.exportBar button{width:100%}','mobile export controls')
need(css,'.documentRow{grid-template-columns:1fr}','mobile document layout')
need(css,'.dashboardSteps{grid-template-columns:1fr}','mobile dashboard steps')

// The three primary entry actions stay reachable.
for(const text of ['Problem beschreiben','Dokument hochladen','Beispiel ansehen']) need(firstAction,text,`entry action ${text}`)
need(firstAction,'input[type="file"]','upload target')
need(firstAction,'asgold-problem-navigator-react','problem target')

// Auth and back-navigation must remain present.
need(page,"setScreen('register')",'registration path')
need(page,"setScreen('login')",'login path')
for(const key of ['backOverview','backCases','backClients','backExplanation']) need(page,key,`back navigation ${key}`)

// Error/empty-state handling stays visible in the customer path.
need(page,'functionErrorMessage','analysis error normalization')
need(page,'configuration_required','analysis configuration error')
need(page,'emptyState','empty-state presentation')
need(page,'uploading={uploading}','upload busy state')
need(page,'required','required-field handling')

// Practical result path: assessment, approval and promised exports.
need(page,'createAssessment','traffic-light assessment')
need(page,'prepareDocumentApproval','prepare approval')
need(page,'ApprovalDetail','approval detail')
for(const value of ['pdf','docx','xlsx','pptx']) need(page,`<option value="${value}">`,`export ${value}`)
need(page,"doExport({kind:'case',item:selectedCase},exportType)",'case export action')

// Video remains optional, keyboard-accessible and presenter-aware.
need(video,"[open,setOpen]=useState(false)",'video collapsed default')
need(video,"role='group' aria-label={c.voice}",'presenter accessibility group')
need(video,"aria-pressed={presenter==='female'}",'female pressed state')
need(video,"aria-pressed={presenter==='male'}",'male pressed state')

console.log('V37 product-readiness guard passed: responsive layout, navigation, error handling, approvals and exports protected.')
