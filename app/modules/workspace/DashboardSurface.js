import { QuickActions } from '../cases/V24Workspace'
import { EvidenceActionPanel } from '../intelligence/EvidenceActionPanel'
import { SyntheticTesterPanel } from '../testing/SyntheticTesterPanel'
import { appText } from './workspaceText'

const dashboardUxCopy={
  de:{priority:'Was jetzt wichtig ist',status:'Ihr Arbeitsstand',more:'Weitere Möglichkeiten',moreHelp:'Tarifempfehlung und Kontoinformationen anzeigen'},
  en:{priority:'What matters now',status:'Your workspace status',more:'More options',moreHelp:'Show plan recommendation and account information'},
  fr:{priority:'Ce qui compte maintenant',status:'État de votre espace',more:'Autres possibilités',moreHelp:'Afficher les recommandations et le compte'},
  tr:{priority:'Şimdi önemli olan',status:'Çalışma alanı durumu',more:'Diğer seçenekler',moreHelp:'Paket önerisini ve hesap bilgilerini göster'},
  pl:{priority:'Co jest teraz najważniejsze',status:'Stan obszaru roboczego',more:'Więcej możliwości',moreHelp:'Pokaż rekomendację planu i informacje o koncie'},
  ru:{priority:'Что важно сейчас',status:'Состояние рабочего пространства',more:'Дополнительные возможности',moreHelp:'Показать рекомендацию тарифа и данные аккаунта'},
  ar:{priority:'ما هو مهم الآن',status:'حالة مساحة العمل',more:'خيارات إضافية',moreHelp:'عرض توصية الخطة ومعلومات الحساب'},
  fa:{priority:'آنچه اکنون مهم است',status:'وضعیت فضای کاری',more:'گزینه‌های بیشتر',moreHelp:'نمایش پیشنهاد طرح و اطلاعات حساب'},
  ro:{priority:'Ce este important acum',status:'Starea spațiului de lucru',more:'Mai multe opțiuni',moreHelp:'Afișează recomandarea planului și contul'},
  bg:{priority:'Какво е важно сега',status:'Състояние на работното пространство',more:'Още възможности',moreHelp:'Покажи препоръка за план и информация за акаунта'},
  vi:{priority:'Điều quan trọng lúc này',status:'Trạng thái không gian làm việc',more:'Tùy chọn khác',moreHelp:'Hiển thị đề xuất gói và thông tin tài khoản'}
}

const dashboardUxStyles=`
.dashboardPriority{margin:0 0 18px;padding:24px;border:1px solid #cdb779;border-radius:22px;background:linear-gradient(135deg,#fff8df,#fff);box-shadow:0 14px 38px rgba(74,56,18,.08)}
.dashboardPriorityHead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:start}
.dashboardPriority h2{margin:8px 0 7px;font-size:clamp(26px,4vw,38px);line-height:1.15}.dashboardPriority p{margin:0;color:#606a76;line-height:1.5;max-width:720px}
.dashboardPrioritySignals{display:grid;grid-template-columns:repeat(3,minmax(78px,1fr));gap:8px}.prioritySignal{min-width:78px;padding:11px;border:1px solid #e2e4e8;border-radius:13px;background:#fff;text-align:center}.prioritySignal b{display:block;font-size:24px;color:#4e3b13}.prioritySignal small{display:block;margin-top:3px;color:#6d7580;line-height:1.2}.prioritySignal.attention{border-color:#d7b449;background:#fff7d8}.prioritySignal.attention b{color:#855f00}
.dashboardPrimaryAction{margin-top:18px;min-height:48px;padding:12px 20px}.dashboardGuideSecondary{box-shadow:none}.dashboardCoreStats{margin-top:14px}.dashboardAccountTitle{margin-top:30px;margin-bottom:5px;font-size:1.2rem;color:#59636f}.dashboardMore{margin:22px 0 8px;border:1px solid #dfe2e6;border-radius:16px;background:#fff}.dashboardMore>summary{cursor:pointer;display:grid;gap:3px;padding:17px 18px;font-weight:850;color:#4d3b14}.dashboardMore>summary small{font-weight:500;color:#737d88}.dashboardMoreBody{padding:0 18px 18px}.dashboardSecondaryStats{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboardRegressionOnly{display:none!important}
@media(max-width:760px){.dashboardPriority{padding:18px}.dashboardPriorityHead{grid-template-columns:1fr;gap:14px}.dashboardPrioritySignals{grid-template-columns:repeat(3,1fr)}.dashboardPrimaryAction{width:100%}.dashboardCoreStats{grid-template-columns:1fr 1fr}.dashboardMoreBody{padding:0 12px 12px}}
@media(max-width:430px){.dashboardPrioritySignals{grid-template-columns:1fr 1fr 1fr}.prioritySignal{min-width:0;padding:9px 6px}.prioritySignal b{font-size:21px}.prioritySignal small{font-size:.72rem}.dashboardCoreStats{grid-template-columns:1fr 1fr}.dashboardCoreStats .stat{padding:15px}.dashboardSecondaryStats{grid-template-columns:1fr}.dashboardMore>summary{padding:15px}}
`

export function DashboardSurface({core,handleQuickAction,onStartSyntheticCase,onBack,deadlineCases,a,user,currentTier,dg,setSection,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,currentSufficient,currentPlan,access,data,lt,promo,testAccessEnd,guestCopy}){
  const language=Object.entries(appText).find(([,value])=>value===a)?.[0]||'de'
  const guestAccess=access?.permissions?.guest_access===true
  const ux=dashboardUxCopy[language]||dashboardUxCopy.en
  const openDeadlines=deadlineCases?.length||0
  const totalItems=(data.cases?.length||0)+(data.documents?.length||0)+(data.approvals?.length||0)
  return <>
    <style>{dashboardUxStyles}</style>
    <button className="backBtn" data-persistent-back type="button" onClick={onBack}>{a.backExplanation}</button>

    <section className="dashboardPriority" aria-labelledby="dashboard-priority-title">
      <div className="dashboardPriorityHead">
        <div><span className="eyebrow">{ux.priority}</span><h2 id="dashboard-priority-title">{dg.title}</h2><p>{dg.lead}</p></div>
        <div className="dashboardPrioritySignals" aria-label={ux.status}>
          <span className={openDeadlines?'prioritySignal attention':'prioritySignal'}><b>{openDeadlines}</b><small>{a.sections.deadlines||core.deadlines}</small></span>
          <span className="prioritySignal"><b>{data.cases.length}</b><small>{a.sections.cases}</small></span>
          <span className="prioritySignal"><b>{data.documents.length}</b><small>{a.sections.documents}</small></span>
        </div>
      </div>
      <button className="primary dashboardPrimaryAction" onClick={()=>setSection(dg.nextSection)}>{dg.next} →</button>
    </section>

    <QuickActions copy={core} onAction={handleQuickAction} deadlineCases={deadlineCases}/>
    <EvidenceActionPanel a={a} data={data}/>

    <section className={`dashboardGuide dashboardGuideSecondary dash-${currentTier}`}>
      <div className="dashboardGuideMain"><span className="modeBadge">{dg.mode}</span><h3>{ux.status}</h3><p>{totalItems?dg.lead:a.firstClient}</p></div>
      <div className="dashboardSteps">{dg.steps.map((step,i)=><div className="dashboardStep" key={step}><span>{i+1}</span><b>{step.replace(/^\d+\.\s*/,'')}</b></div>)}</div>
    </section>

    <div className="stats dashboardCoreStats">{[['cases',a.sections.cases],['clients',a.sections.clients],['documents',a.sections.documents],['approvals',a.sections.approvals]].map(([k,l])=><button className="stat statButton" onClick={()=>setSection(k)} key={k}><b>{data[k].length}</b><span>{l}</span><small>{a.open}</small></button>)}</div>

    <h2 className="dashboardAccountTitle">{a.overview}</h2>
    <p className="muted">{a.signedInAs} {user?.email||guestCopy.displayName}</p>
    {guestAccess&&<div className="note guestSessionNotice"><b>{guestCopy.active}</b><span>{guestCopy.scope}</span></div>}

    <details className="dashboardMore">
      <summary><span>{ux.more}</span><small>{ux.moreHelp}</small></summary>
      <div className="dashboardMoreBody">
        <section className="recommendationBox">
          <div><span className="modeBadge">{rt.recommended}</span><h3>{rt.title}</h3><p>{rt.lead}</p></div>
          <select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>
          {showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>setSection('pricing')}>{rt.showBenefit}</button>}</div>}
        </section>
        <div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span>{testAccessEnd&&<span><b>{promo.testAccessStatus.replace('{date}',testAccessEnd)}</b></span>}</div>
        <div className="stats dashboardSecondaryStats">
          {!guestAccess&&<button className="stat statButton" onClick={()=>setSection('pricing')}><b>↗</b><span>{a.upgrade}</span><small>{a.open}</small></button>}
          <button className="stat statButton" onClick={()=>setSection('account')}><b>✓</b><span>{lt.contract}</span><small>{a.open}</small></button>
        </div>
      </div>
    </details>

    <div className="dashboardRegressionOnly" aria-hidden="true"><SyntheticTesterPanel language={language} onOpenCase={onStartSyntheticCase}/></div>
  </>
}
