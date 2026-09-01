import fs from 'node:fs'

const page=fs.readFileSync('app/modules/workspace/WorkspaceApp.js','utf8')
const pageEntry=fs.readFileSync('app/page.js','utf8')
const css=fs.readFileSync('app/globals.css','utf8')
const firstAction=fs.readFileSync('app/modules/public/V37FirstAction.js','utf8')
const video=fs.readFileSync('app/modules/public/ExplainerVideo.js','utf8')
const firstActionCompatibility=fs.readFileSync('app/components/V37FirstAction.js','utf8')
const videoCompatibility=fs.readFileSync('app/components/ExplainerVideo.js','utf8')
const authSurface=fs.readFileSync('app/modules/auth/AuthSurface.js','utf8')
const publicLanding=fs.readFileSync('app/modules/public/PublicLanding.js','utf8')

const need=(source,needle,label)=>{if(!source.includes(needle)) throw new Error(`V37 readiness: missing ${label}`)}

need(pageEntry,"./modules/workspace/WorkspaceApp",'workspace page module boundary')
need(css,'@media(max-width:850px)','tablet breakpoint')
need(css,'@media(max-width:560px)','phone breakpoint')
need(css,'.exportBar select,.exportBar button{width:100%}','mobile export controls')
need(css,'.documentRow{grid-template-columns:1fr}','mobile document layout')
need(css,'.dashboardSteps{grid-template-columns:1fr}','mobile dashboard steps')

for(const text of ['Problem beschreiben','Dokument hochladen','Beispiel ansehen']) need(firstAction,text,`entry action ${text}`)
need(firstAction,'input[type="file"]','upload target')
need(firstAction,'asgold-problem-navigator-react','problem target')
need(firstActionCompatibility,'../modules/public/V37FirstAction','first-action compatibility adapter')
need(videoCompatibility,'../modules/public/ExplainerVideo','explainer compatibility adapter')

need(publicLanding,"setScreen('register')",'registration path in public module')
need(publicLanding,"setScreen('login')",'login path in public module')
for(const key of ['backOverview','backCases','backClients']) need(page,key,`back navigation ${key}`)
need(authSurface,'backExplanation','back navigation backExplanation in auth module')
need(page,'functionErrorMessage','analysis error normalization')
need(page,'configuration_required','analysis configuration error')
need(page,'emptyState','empty-state presentation')
need(page,'uploading={uploading}','upload busy state')
need(page,'required','required-field handling')
need(page,'createAssessment','traffic-light assessment')
need(page,'prepareDocumentApproval','prepare approval')
need(page,'ApprovalDetail','approval detail')
for(const value of ['pdf','docx','xlsx','pptx']) need(page,`<option value="${value}">`,`export ${value}`)
need(page,"doExport({kind:'case',item:selectedCase},exportType)",'case export action')

need(video,"[open,setOpen]=useState(false)",'video collapsed default')
need(video,"role='group' aria-label={c.voice}",'presenter accessibility group')
need(video,"aria-pressed={presenter==='female'}",'female pressed state')
need(video,"aria-pressed={presenter==='male'}",'male pressed state')

console.log('V37 product-readiness guard passed through the workspace module boundary.')
