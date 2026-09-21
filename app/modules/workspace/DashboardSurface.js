import { SyntheticTesterPanel } from '../testing/SyntheticTesterPanel'
import { appText } from './workspaceText'
import { workspaceOverview } from './workspaceOverview.mjs'
import { workspaceOverviewCopy } from './workspaceOverviewCopy.mjs'
import { SimpleCaseStart } from '../cases/SimpleCaseStart'
import { simpleCaseCopy } from '../cases/lib/simpleCaseCopy.mjs'

const insiderEntryCopy={
  de:{label:'PASSWORT 1 · VOLLZUGRIFF AUF ALLES',title:'Gemeinsamer Team-Arbeitsbereich',lead:'Auf das gesamte ASH Workspace zugreifen und jede Änderung vorbereiten. Passwort 2 gibt die neue Live-Version frei.',action:'Änderungszentrale öffnen',landing:'Interne Startfläche'},
  en:{label:'PASSWORD 1 · FULL ACCESS TO EVERYTHING',title:'Shared team workspace',lead:'Access all of ASH Workspace and prepare any change. Password 2 releases the new live version.',action:'Open change control',landing:'Internal start page'},
  fr:{label:'ACCÈS INTERNE',title:'Espace de travail partagé',lead:'Ouvrir le compte d’équipe, vérifier la vue utilisateur ou copier le lien d’installation.',action:'Ouvrir l’accès équipe'},
  tr:{label:'İÇ ERİŞİM',title:'Ortak ekip çalışma alanı',lead:'Ekip hesabını açın, kullanıcı görünümünü kontrol edin veya yükleme bağlantısını kopyalayın.',action:'Ekip erişimini aç'},
  pl:{label:'DOSTĘP WEWNĘTRZNY',title:'Wspólny obszar zespołu',lead:'Otwórz konto zespołu, sprawdź widok użytkownika lub skopiuj link instalacyjny.',action:'Otwórz dostęp zespołu'},
  ru:{label:'ВНУТРЕННИЙ ДОСТУП',title:'Общее рабочее пространство команды',lead:'Откройте общий аккаунт, проверьте вид пользователя или скопируйте ссылку установки.',action:'Открыть доступ команды'},
  ar:{label:'وصول داخلي',title:'مساحة عمل الفريق المشتركة',lead:'افتح حساب الفريق أو راجع واجهة المستخدم أو انسخ رابط التثبيت.',action:'فتح دخول الفريق'},
  fa:{label:'دسترسی داخلی',title:'فضای کاری مشترک تیم',lead:'حساب تیم را باز کنید، نمای کاربر را بررسی کنید یا پیوند نصب را کپی کنید.',action:'باز کردن دسترسی تیم'},
  ro:{label:'ACCES INTERN',title:'Spațiu comun al echipei',lead:'Deschideți contul echipei, verificați vizualizarea utilizatorului sau copiați linkul de instalare.',action:'Deschide accesul echipei'},
  bg:{label:'ВЪТРЕШЕН ДОСТЪП',title:'Общо екипно пространство',lead:'Отворете екипния акаунт, проверете потребителския изглед или копирайте връзката за инсталация.',action:'Отвори екипния достъп'},
  vi:{label:'TRUY CẬP NỘI BỘ',title:'Không gian làm việc chung của nhóm',lead:'Mở tài khoản nhóm, kiểm tra giao diện người dùng hoặc sao chép liên kết cài đặt.',action:'Mở quyền truy cập nhóm'}
}


export function DashboardSurface({caseStart,core,handleQuickAction,onOpenDocument,onOpenApproval,onStartSyntheticCase,onBack,a,user,currentTier,setSection,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,currentSufficient,currentPlan,access,data,lt,promo,testAccessEnd,guestCopy}){
  const language=Object.entries(appText).find(([,value])=>value===a)?.[0]||'de'
  const ux=workspaceOverviewCopy(language)
  const simple=simpleCaseCopy(language)
  const overview=workspaceOverview(data)
  const {next}=overview
  const linkedCase=['read','review'].includes(next.kind)?data.cases?.find(item=>item.id===next.item?.case_id):null
  const insiderText=insiderEntryCopy[language]||insiderEntryCopy.en
  const hasInsiderAccess=access?.app_role==='owner'||access?.permissions?.shared_team_access===true
  const guestAccess=access?.permissions?.guest_access===true
  const openDocument=item=>item&&onOpenDocument?onOpenDocument(item):setSection('documents')
  const openApproval=item=>item&&onOpenApproval?onOpenApproval(item):setSection('approvals')
  function openNext(){
    if(next.kind==='read'||next.kind==='review')return linkedCase?handleQuickAction('open-case',linkedCase):openDocument(next.item)
    if(next.kind==='approval')return openApproval(next.item)
    if(next.kind==='deadline')return handleQuickAction('deadlines')
    if(next.kind==='case')return handleQuickAction('open-case',next.item)
    return handleQuickAction('case')
  }
  const nextButton=linkedCase&&(next.kind==='read'||next.kind==='review')?simple.continue:next.kind==='read'||next.kind==='review'?ux.openDocument:next.kind==='approval'?ux.openApproval:next.kind==='deadline'?ux.openDeadlines:next.kind==='case'?ux.openCase:ux.create
  const cards=[
    {key:'cases',label:a.sections.cases,count:overview.cases.length,action:()=>setSection('cases')},
    {key:'documents',label:ux.documents,count:overview.reviewDocuments.length,action:()=>openDocument(overview.reviewDocuments[0])},
    {key:'approvals',label:ux.approvals,count:overview.pendingApprovals.length,action:()=>openApproval(overview.pendingApprovals[0])},
    {key:'deadlines',label:ux.deadlines,count:overview.deadlines.dated.length,detail:`${overview.deadlines.unresolved.length} ${ux.unresolved}`,action:()=>handleQuickAction('deadlines')}
  ]
  return <div className="workspaceOverview" dir={language==='ar'||language==='fa'?'rtl':'ltr'}>
    <button className="backBtn" data-persistent-back type="button" onClick={onBack}>{a.backExplanation}</button>
    <h1 className={caseStart?'simpleCasePageTitle':undefined}>{ux.title}</h1>
    {caseStart&&<SimpleCaseStart {...caseStart} language={language} copy={core}/>}
    {(!caseStart||next.kind!=='create')&&<section className="workspaceNext" aria-labelledby="workspace-next-title">
      <span className="eyebrow">{ux.next}</span>
      <h2 id="workspace-next-title">{linkedCase&&(next.kind==='read'||next.kind==='review')?simple.continue:ux[next.kind]}</h2>
      <p className="workspaceNextSubject">{linkedCase?.title||next.item?.title||next.item?.subject||ux.empty}</p>
      <button className="primary" type="button" onClick={openNext}>{nextButton} <span aria-hidden="true">→</span></button>
    </section>}
    {overview.recentCases.length>0&&<section className="workspaceRecent" aria-labelledby="workspace-recent-title">
      <div className="workspaceRecentHead"><h2 id="workspace-recent-title">{ux.recent}</h2><button type="button" className="linkBtn" onClick={()=>setSection('cases')}>{ux.allCases}</button></div>
      {overview.recentCases.map(item=><button type="button" className="workspaceRecentCase" key={item.id} onClick={()=>handleQuickAction('open-case',item)}><span>{item.title}</span><span aria-hidden="true">→</span></button>)}
    </section>}
    <details className="workspaceMore">
      <summary>{ux.more}</summary>
      <div className="workspaceMoreContent">
        <nav className="workspaceOverviewGrid" aria-label={ux.title}>
          {cards.map(card=><button type="button" className="workspaceOverviewCard" key={card.key} onClick={card.action}>
            <span className="workspaceCardCount">{card.count}</span><span className="workspaceCardLabel">{card.label}</span>{card.detail&&<small>{card.detail}</small>}<span className="workspaceCardArrow" aria-hidden="true">→</span>
          </button>)}
        </nav>
        <button className="secondary" type="button" onClick={()=>handleQuickAction('upload')}>＋ {ux.upload}</button>
        <div className="workspaceSecondaryLinks">{['clients','documents','approvals','account'].map(key=><button type="button" className="secondary" key={key} onClick={()=>setSection(key)}>{a.sections[key]||lt.contract}</button>)}</div>
        <p className="muted">{a.signedInAs} {user?.email||guestCopy.displayName}</p>
        {guestAccess&&<p className="guestSessionNotice"><b>{guestCopy.active}</b><span>{guestCopy.scope}</span></p>}
        {hasInsiderAccess&&<section className="dashboardInsiderEntry" aria-label={insiderText.title}>
          <h3>{insiderText.title}</h3>
          <div className="workspaceSecondaryLinks"><button type="button" className="secondary" onClick={()=>setSection('change-control')}>{insiderText.action}</button><a className="linkBtn" href="/insider">{insiderText.landing||insiderText.action}</a></div>
        </section>}
        <section className="recommendationBox">
          <div><h3>{rt.title}</h3><p>{rt.lead}</p></div>
          <select className="goalSelect" value={selectedGoal} onChange={event=>{setSelectedGoal(event.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
          {showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>setSection('pricing')}>{rt.showBenefit}</button>}</div>}
        </section>
        <div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span>{testAccessEnd&&<span><b>{promo.testAccessStatus.replace('{date}',testAccessEnd)}</b></span>}</div>
        {!guestAccess&&<button className="secondary" type="button" onClick={()=>setSection('pricing')}>{a.upgrade}</button>}
      </div>
    </details>
    <div hidden><SyntheticTesterPanel language={language} onOpenCase={onStartSyntheticCase}/></div>
  </div>
}
