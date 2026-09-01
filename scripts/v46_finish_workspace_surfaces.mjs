import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let source=fs.readFileSync(workspacePath,'utf8')

const ensureDir=path=>fs.mkdirSync(path,{recursive:true})
ensureDir('app/modules/cases')
ensureDir('app/modules/documents')
ensureDir('app/modules/pricing')
ensureDir('app/modules/compliance')
ensureDir('app/modules/workspace')

function addImport(line,anchor){
  if(source.includes(line)) return
  if(!source.includes(anchor)) throw new Error(`V46 surface refactor: import anchor missing: ${anchor}`)
  source=source.replace(anchor,`${anchor}\n${line}`)
}

addImport("import { CasesSurface, ClientDetailSurface, ClientsSurface } from '../cases/WorkspaceCaseSurfaces'","import { PublicLanding } from '../public/PublicLanding'")
addImport("import { DocumentsSurface } from '../documents/DocumentsSurface'","import { CasesSurface, ClientDetailSurface, ClientsSurface } from '../cases/WorkspaceCaseSurfaces'")
addImport("import { ApprovalsSurface } from '../cases/ApprovalsSurface'","import { DocumentsSurface } from '../documents/DocumentsSurface'")
addImport("import { DashboardSurface } from './DashboardSurface'","import { ApprovalsSurface } from '../cases/ApprovalsSurface'")

source=source.replace(
  "import { CaseDetail, CaseSection, DocumentDetail, DocumentSection, QuickActions, getV24Copy } from './components/V24Workspace'",
  "import { CaseDetail, DocumentDetail, getV24Copy } from './components/V24Workspace'"
)
source=source.replace(
  "import { ApprovalDetail, ApprovalSection, getV25ApprovalCopy } from './components/V25ApprovalWorkflow'",
  "import { ApprovalDetail, getV25ApprovalCopy } from './components/V25ApprovalWorkflow'"
)
source=source.replace("import { PromoCodeControl } from './components/PromoCodeControl'\n",'')

const lines=source.split('\n')
const dashboardIndex=lines.findIndex(line=>line.includes(":section==='dashboard'?<>"))
if(dashboardIndex<0 && !source.includes('<DashboardSurface')) throw new Error('V46 surface refactor: dashboard branch not found')

if(dashboardIndex>=0){
  const line=lines[dashboardIndex]
  const prefix="      :section==='dashboard'?<>"
  if(!line.startsWith(prefix)||!line.endsWith('</>')) throw new Error('V46 surface refactor: unexpected dashboard branch format')
  let body=line.slice(prefix.length,-3)

  const accountStart=body.indexOf('<section className="accountControl">')
  const accountEndMarker='</section><div className="stats">'
  const accountEndAt=body.indexOf(accountEndMarker,accountStart)
  if(accountStart<0||accountEndAt<0) throw new Error('V46 surface refactor: account-control block not found')
  const accountBlock=body.slice(accountStart,accountEndAt+'</section>'.length)

  const upgradeStart=body.indexOf('{upgrades.length>0&&<div className="detailCard upgradeBox">')
  if(upgradeStart<0) throw new Error('V46 surface refactor: upgrade block not found')
  const upgradeBlock=body.slice(upgradeStart)

  const accountProps='currentPlan={currentPlan} currentTier={currentTier} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion}'
  const upgradeProps='upgrades={upgrades} a={a} promo={promo} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade}'

  fs.writeFileSync('app/modules/compliance/AccountControlPanel.js',`export function AccountControlPanel({currentPlan,currentTier,lt,exportMyData,activityLog,localeForLanguage,language,sct,serverAudit,deletionRequests,deletionBusy,cancelAccountDeletion,requestAccountDeletion}){\n  return ${accountBlock}\n}\n`)
  fs.writeFileSync('app/modules/pricing/UpgradePanel.js',`import { PromoCodeControl } from './PromoCodeControl'\n\nexport function UpgradePanel({upgrades,a,promo,promoCode,setPromoCode,appliedPromoCode,applyPromo,clearPromo,quoteLoading,quotes,promoAnyValid,promoAllInvalid,promoSomeInvalid,eur,terms,termMonths,setTermMonths,monthsLabel,period,requestUpgrade}){\n  return <>${upgradeBlock}</>\n}\n`)

  body=body.replace(accountBlock,`<AccountControlPanel ${accountProps}/>`)
  body=body.slice(0,body.indexOf(upgradeBlock))+`<UpgradePanel ${upgradeProps}/>`

  fs.writeFileSync('app/modules/workspace/DashboardSurface.js',`import { QuickActions } from '../cases/V24Workspace'\nimport { AccountControlPanel } from '../compliance/AccountControlPanel'\nimport { UpgradePanel } from '../pricing/UpgradePanel'\n\nexport function DashboardSurface({core,handleQuickAction,deadlineCases,a,user,currentTier,dg,setSection,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,currentSufficient,recommendedTier,currentPlan,access,lt,exportMyData,activityLog,localeForLanguage,language,sct,serverAudit,deletionRequests,deletionBusy,cancelAccountDeletion,requestAccountDeletion,data,upgrades,promo,promoCode,setPromoCode,appliedPromoCode,applyPromo,clearPromo,quoteLoading,quotes,promoAnyValid,promoAllInvalid,promoSomeInvalid,eur,terms,termMonths,setTermMonths,monthsLabel,period,requestUpgrade}){\n  return <>${body}</>\n}\n`)

  lines[dashboardIndex]="      :section==='dashboard'?<DashboardSurface core={core} handleQuickAction={handleQuickAction} deadlineCases={deadlineCases} a={a} user={user} currentTier={currentTier} dg={dg} setSection={setSection} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} currentSufficient={currentSufficient} recommendedTier={recommendedTier} currentPlan={currentPlan} access={access} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion} data={data} upgrades={upgrades} promo={promo} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade}/>"
}

fs.writeFileSync('app/modules/cases/WorkspaceCaseSurfaces.js',`import { CaseSection } from './V24Workspace'\n\nexport function CasesSurface({a,core,clients,cases,newCase,setNewCase,showCaseForm,setShowCaseForm,createCase,setSelectedCase,onBack}){\n  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.cases}</h2></div><CaseSection copy={core} clients={clients} cases={cases} newCase={newCase} setNewCase={setNewCase} showForm={showCaseForm} setShowForm={setShowCaseForm} onSubmit={createCase} onSelect={setSelectedCase}/></>\n}\n\nexport function ClientDetailSurface({a,selectedClient,onBack}){\n  return <><button className="backBtn" onClick={onBack}>{a.backClients}</button><h2>{selectedClient.name}</h2><div className="detailCard"><p><b>E-Mail:</b> {selectedClient.email||'—'}</p><p><b>{a.phone}:</b> {selectedClient.phone||'—'}</p><p><b>{a.note}:</b> {selectedClient.notes||'—'}</p></div></>\n}\n\nexport function ClientsSurface({a,showClientForm,setShowClientForm,createClient,newClient,setNewClient,clients,setSelectedClient,onBack}){\n  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.clients}</h2></div><button className="primary actionBtn" onClick={()=>setShowClientForm(v=>!v)}>{showClientForm?a.cancel:a.addClient}</button>{showClientForm&&<form className="actionCard" onSubmit={createClient}><label>{a.name}<input value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} required/></label><label>{a.email}<input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/></label><label>{a.phone}<input value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})}/></label><label>{a.note}<textarea value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})}/></label><button className="primary full">{a.saveClient}</button></form>}{clients.length?<div className="itemList">{clients.map((item,i)=><button className="itemRow buttonRow" onClick={()=>setSelectedClient(item)} key={item.id||i}><div><b>{item.name}</b>{item.email&&<p>{item.email}</p>}</div><span className="chev">›</span></button>)}</div>:<div className="emptyState"><b>{a.noneYet.replace('{section}',a.sections.clients.toLowerCase())}</b><p>{a.firstClient}</p></div>}</>\n}\n`)

fs.writeFileSync('app/modules/documents/DocumentsSurface.js',`import { DocumentSection } from '../cases/V24Workspace'\n\nexport function DocumentsSurface({a,access,documents,core,v28,cases,documentMode,setDocumentMode,uploadCaseId,uploadDocument,uploading,allowedUploadAccept,setSelectedDocument,onBack}){\n  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.documents}</h2></div>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<DocumentSection copy={core} privacy={v28} cases={cases} documents={documents} mode={documentMode} setMode={setDocumentMode} defaultCaseId={uploadCaseId} onSubmit={uploadDocument} uploading={uploading} accept={allowedUploadAccept} onSelect={setSelectedDocument}/></>\n}\n`)

fs.writeFileSync('app/modules/cases/ApprovalsSurface.js',`import { ApprovalSection } from './V25ApprovalWorkflow'\n\nexport function ApprovalsSurface({a,approvalUi,cases,documents,approvals,approvalDefaults,createApproval,setSelectedApproval,onBack}){\n  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{approvalUi.title}</h2></div><ApprovalSection copy={approvalUi} cases={cases} documents={documents} approvals={approvals} defaults={approvalDefaults} onCreate={createApproval} onSelect={setSelectedApproval}/></>\n}\n`)

let next=lines.join('\n')
const replaceLine=(needle,replacement)=>{
  const current=next.split('\n')
  const index=current.findIndex(line=>line.includes(needle))
  if(index<0){ if(!next.includes(replacement.split(' ')[0])) throw new Error(`V46 surface refactor: line not found: ${needle}`); return }
  current[index]=replacement
  next=current.join('\n')
}

replaceLine("if(screen==='app'&&!selectedClient&&section==='cases')","  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<CasesSurface a={a} core={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showCaseForm={showCaseForm} setShowCaseForm={setShowCaseForm} createCase={createCase} setSelectedCase={setSelectedCase} onBack={()=>setSection('dashboard')}/>)")
replaceLine("if(screen==='app'&&!selectedClient&&section==='documents')","  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<DocumentsSurface a={a} access={access} documents={data.documents} core={core} v28={v28} cases={data.cases} documentMode={documentMode} setDocumentMode={setDocumentMode} uploadCaseId={uploadCaseId} uploadDocument={uploadDocument} uploading={uploading} allowedUploadAccept={allowedUploadAccept} setSelectedDocument={setSelectedDocument} onBack={()=>setSection('dashboard')}/>)")
replaceLine("if(screen==='app'&&!selectedClient&&section==='approvals')","  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<ApprovalsSurface a={a} approvalUi={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} approvalDefaults={approvalDefaults} createApproval={createApproval} setSelectedApproval={setSelectedApproval} onBack={()=>{setApprovalDefaults({caseId:'',documentId:''});setSection('dashboard')}}/>)")
replaceLine(":selectedClient?","      :selectedClient?<ClientDetailSurface a={a} selectedClient={selectedClient} onBack={()=>setSelectedClient(null)}/>" )
replaceLine(":<><div className=\"sectionHead\"><button className=\"backBtn\" onClick={()=>setSection('dashboard')}","      :<ClientsSurface a={a} showClientForm={showClientForm} setShowClientForm={setShowClientForm} createClient={createClient} newClient={newClient} setNewClient={setNewClient} clients={data.clients} setSelectedClient={setSelectedClient} onBack={()=>setSection('dashboard')}/>" )

fs.writeFileSync(workspacePath,next)
console.log('V46 final workspace surfaces extracted: dashboard, account controls, pricing upgrades, cases, clients, documents and approvals now have explicit module owners.')
