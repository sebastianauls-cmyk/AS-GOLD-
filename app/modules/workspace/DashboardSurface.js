import { QuickActions } from '../cases/V24Workspace'
import { EvidenceActionPanel } from '../intelligence/EvidenceActionPanel'
import { SyntheticTesterPanel } from '../testing/SyntheticTesterPanel'
import { appText } from './workspaceText'

export function DashboardSurface({core,handleQuickAction,deadlineCases,a,user,currentTier,dg,setSection,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,currentSufficient,currentPlan,access,data,lt,promo,testAccessEnd}){
  const language=Object.entries(appText).find(([,value])=>value===a)?.[0]||'de'
  return <>
    <QuickActions copy={core} onAction={handleQuickAction} deadlineCases={deadlineCases}/>
    <h2>{a.overview}</h2>
    <p className="muted">{a.signedInAs} {user?.email}</p>
    <SyntheticTesterPanel language={language}/>
    <EvidenceActionPanel a={a} data={data}/>
    <section className={`dashboardGuide dash-${currentTier}`}>
      <div className="dashboardGuideMain"><span className="modeBadge">{dg.mode}</span><h3>{dg.title}</h3><p>{dg.lead}</p><button className="primary nextAction" onClick={()=>setSection(dg.nextSection)}>{dg.next} →</button></div>
      <div className="dashboardSteps">{dg.steps.map((step,i)=><div className="dashboardStep" key={step}><span>{i+1}</span><b>{step.replace(/^\d+\.\s*/,'')}</b></div>)}</div>
    </section>
    <section className="recommendationBox">
      <div><span className="modeBadge">{rt.recommended}</span><h3>{rt.title}</h3><p>{rt.lead}</p></div>
      <select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>
      {showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>setSection('pricing')}>{rt.showBenefit}</button>}</div>}
    </section>
    <div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span>{testAccessEnd&&<span><b>{promo.testAccessStatus.replace('{date}',testAccessEnd)}</b></span>}</div>
    <div className="stats">{[['cases',a.sections.cases],['clients',a.sections.clients],['documents',a.sections.documents],['approvals',a.sections.approvals]].map(([k,l])=><button className="stat statButton" onClick={()=>setSection(k)} key={k}><b>{data[k].length}</b><span>{l}</span><small>{a.open}</small></button>)}</div>
    <div className="stats">
      <button className="stat statButton" onClick={()=>setSection('pricing')}><b>↗</b><span>{a.upgrade}</span><small>{a.open}</small></button>
      <button className="stat statButton" onClick={()=>setSection('account')}><b>✓</b><span>{lt.contract}</span><small>{a.open}</small></button>
    </div>
  </>
}
