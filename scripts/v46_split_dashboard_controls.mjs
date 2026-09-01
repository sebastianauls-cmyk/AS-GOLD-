import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
const dashboardPath='app/modules/workspace/DashboardSurface.js'
const pricingSurfacePath='app/modules/pricing/PricingSurface.js'
const accountSurfacePath='app/modules/compliance/AccountSurface.js'
const guardPath='scripts/test_v46_modular_boundaries.mjs'
const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'

let workspace=fs.readFileSync(workspacePath,'utf8')

function addImport(line,anchor){
  if(workspace.includes(line)) return
  if(!workspace.includes(anchor)) throw new Error(`V46 dashboard split: import anchor missing: ${anchor}`)
  workspace=workspace.replace(anchor,`${anchor}\n${line}`)
}

addImport("import { PricingSurface } from '../pricing/PricingSurface'","import { DashboardSurface } from './DashboardSurface'")
addImport("import { AccountSurface } from '../compliance/AccountSurface'","import { PricingSurface } from '../pricing/PricingSurface'")

const dashboardCall=/      :section==='dashboard'\?<DashboardSurface[^\n]+\/>/
if(!dashboardCall.test(workspace)) throw new Error('V46 dashboard split: dashboard render call missing')
workspace=workspace.replace(dashboardCall,"      :section==='dashboard'?<DashboardSurface core={core} handleQuickAction={handleQuickAction} deadlineCases={deadlineCases} a={a} user={user} currentTier={currentTier} dg={dg} setSection={setSection} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} currentSufficient={currentSufficient} currentPlan={currentPlan} access={access} data={data} lt={lt}/>")

const sectionAnchor="  if(screen==='app') {"
if(!workspace.includes("section==='pricing'")){
  if(!workspace.includes(sectionAnchor)) throw new Error('V46 dashboard split: protected section anchor missing')
  const pricingBranch=`  if(screen==='app'&&!selectedClient&&section==='pricing') return protectedWorkspace(<PricingSurface a={a} promo={promo} upgrades={upgrades} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade} onBack={()=>setSection('dashboard')}/>)\n  if(screen==='app'&&!selectedClient&&section==='account') return protectedWorkspace(<AccountSurface a={a} currentPlan={currentPlan} currentTier={currentTier} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion} onBack={()=>setSection('dashboard')}/>)\n\n`
  workspace=workspace.replace(sectionAnchor,pricingBranch+sectionAnchor)
}

fs.writeFileSync(pricingSurfacePath,`import { UpgradePanel } from './UpgradePanel'\n\nexport function PricingSurface({a,onBack,...upgradeProps}){\n  return <>\n    <div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.upgrade}</h2></div>\n    <UpgradePanel a={a} {...upgradeProps}/>\n  </>\n}\n`)

fs.writeFileSync(accountSurfacePath,`import { AccountControlPanel } from './AccountControlPanel'\n\nexport function AccountSurface({a,onBack,...accountProps}){\n  return <>\n    <div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button></div>\n    <AccountControlPanel {...accountProps}/>\n  </>\n}\n`)

fs.writeFileSync(dashboardPath,`import { QuickActions } from '../cases/V24Workspace'\n\nexport function DashboardSurface({core,handleQuickAction,deadlineCases,a,user,currentTier,dg,setSection,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,currentSufficient,currentPlan,access,data,lt}){\n  return <>\n    <QuickActions copy={core} onAction={handleQuickAction} deadlineCases={deadlineCases}/>\n    <h2>{a.overview}</h2>\n    <p className="muted">{a.signedInAs} {user?.email}</p>\n    <section className={\`dashboardGuide dash-\${currentTier}\`}>\n      <div className="dashboardGuideMain"><span className="modeBadge">{dg.mode}</span><h3>{dg.title}</h3><p>{dg.lead}</p><button className="primary nextAction" onClick={()=>setSection(dg.nextSection)}>{dg.next} →</button></div>\n      <div className="dashboardSteps">{dg.steps.map((step,i)=><div className="dashboardStep" key={step}><span>{i+1}</span><b>{step.replace(/^\\d+\\.\\s*/,'')}</b></div>)}</div>\n    </section>\n    <section className="recommendationBox">\n      <div><span className="modeBadge">{rt.recommended}</span><h3>{rt.title}</h3><p>{rt.lead}</p></div>\n      <select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>\n      {showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>setSection('pricing')}>{rt.showBenefit}</button>}</div>}\n    </section>\n    <div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span></div>\n    <div className="stats">{[['cases',a.sections.cases],['clients',a.sections.clients],['documents',a.sections.documents],['approvals',a.sections.approvals]].map(([k,l])=><button className="stat statButton" onClick={()=>setSection(k)} key={k}><b>{data[k].length}</b><span>{l}</span><small>{a.open}</small></button>)}</div>\n    <div className="stats">\n      <button className="stat statButton" onClick={()=>setSection('pricing')}><b>↗</b><span>{a.upgrade}</span><small>{a.open}</small></button>\n      <button className="stat statButton" onClick={()=>setSection('account')}><b>✓</b><span>{lt.contract}</span><small>{a.open}</small></button>\n    </div>\n  </>\n}\n`)

fs.writeFileSync(workspacePath,workspace)

let guard=fs.readFileSync(guardPath,'utf8')
for(const path of [pricingSurfacePath,accountSurfacePath,dashboardPath]){
  if(!guard.includes(`  '${path}',`)){
    const anchor="  'app/modules/workspace/WorkspaceApp.js',"
    if(!guard.includes(anchor)) throw new Error('V46 dashboard split: guard file-list anchor missing')
    guard=guard.replace(anchor,`${anchor}\n  '${path}',`)
  }
}
const assertions=`\nconst dashboardSurface=read('app/modules/workspace/DashboardSurface.js')\nassert.doesNotMatch(dashboardSurface,/AccountControlPanel|UpgradePanel/,'dashboard must not own account or pricing controls')\nassert.match(dashboardSurface,/setSection\\('pricing'\\)/)\nassert.match(dashboardSurface,/setSection\\('account'\\)/)\nassert.match(workspace,/PricingSurface/)\nassert.match(workspace,/AccountSurface/)\nassert.match(workspace,/section==='pricing'/)\nassert.match(workspace,/section==='account'/)\n`
if(!guard.includes("dashboard must not own account or pricing controls")) guard += assertions
fs.writeFileSync(guardPath,guard)

let docs=fs.readFileSync(docsPath,'utf8')
const note=`\n\n### V46 Dashboard, Tarif und Kontosteuerung getrennt\n\n- Das Dashboard rendert nur noch Übersicht, Schnellaktionen, Empfehlung und Bereichsnavigation.\n- Tarif-/Upgrade-Funktionen besitzen mit \`pricing/PricingSurface.js\` eine eigene geschützte Oberfläche.\n- Konto-, Audit-, Datenexport- und Löschsteuerung besitzen mit \`compliance/AccountSurface.js\` eine eigene geschützte Oberfläche.\n- \`WorkspaceApp.js\` routet die beiden Bereiche explizit über \`section='pricing'\` und \`section='account'\`; das Dashboard importiert deren Fachkomponenten nicht mehr.\n- Dadurch können Tarif- und Compliance-Änderungen unabhängig vom Dashboard umgesetzt werden.\n`
if(!docs.includes('### V46 Dashboard, Tarif und Kontosteuerung getrennt')) docs += note
fs.writeFileSync(docsPath,docs)

console.log('V46 dashboard split complete: dashboard, pricing and account-control are independent protected surfaces.')
