'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { signOutSession } from '../services/authRepository'
import { allowedUploadAccept, uploadUi } from '../documents/uploadConfig'
import { exportUi } from '../documents/exportUi'
import { appText } from './workspaceText'
import { broadcastCountryContext } from '../country/countryRegistry.mjs'
import { ui } from '../public/publicUi'
import { passwordRecoveryUi, passwordUi } from '../auth/passwordUi'
import { ProtectedWorkspaceShell } from './ProtectedWorkspaceShell'
import { LoadingSurface } from './LoadingSurface'
import { AuthSurface } from '../auth/AuthSurface'
import { PublicLanding } from '../public/PublicLanding'
import { CasesSurface, ClientDetailSurface, ClientsSurface } from '../cases/WorkspaceCaseSurfaces'
import { DocumentsSurface } from '../documents/DocumentsSurface'
import { ApprovalsSurface } from '../cases/ApprovalsSurface'
import { DashboardSurface } from './DashboardSurface'
import { PricingSurface } from '../pricing/PricingSurface'
import { AccountSurface } from '../compliance/AccountSurface'
import { emptyData, emptyCase } from './stateConfig'
import { launchTrustText, serverControlText, accessPendingMessages } from '../compliance/workspaceControlText'
import { notices, dashboardGuide, transparencyText, caseDiscoveryText, publicAudienceText, testerLinkText } from '../public/catalog'
import { terms, plans, planJourney, planText, journeyLabels, recommendationText, periodText, goalTier, tierRank } from '../pricing/catalog'
import { CaseDetail, DocumentDetail, getV24Copy } from '../cases/CaseWorkspace'
import { ApprovalDetail, getV25ApprovalCopy } from '../cases/ApprovalWorkflowUi'
import { getV26AnalysisCopy } from '../documents/DocumentAnalysis'
import { LegalAcceptance, PRIVACY_NOTICE_VERSION, TERMS_VERSION, getV28PrivacyCopy } from '../compliance/PrivacyControls'
import { getV29PasswordCopy, validateV29Password } from '../auth/PasswordPolicy'
import { localeForLanguage, pageTranslations } from '../language/languageRegistry.mjs'
import { promoTranslations } from '../pricing/promoTranslations.mjs'
import { orderCasesByResearch } from '../public/casePriority.mjs'
import { useLanguagePreferences } from '../language/useLanguagePreferences'
import { createCaseWorkflowActions } from '../cases/caseWorkflow'
import { createApprovalWorkflowActions } from '../cases/approvalWorkflow'
import { createDocumentWorkflowActions } from '../documents/documentWorkflow'
import { createExportWorkflowActions } from '../documents/exportWorkflow'
import { createWorkspaceAuthActions } from '../auth/workspaceAuthWorkflow'
import { createPricingWorkflowActions } from '../pricing/pricingWorkflow'
import { createAccountWorkflowActions } from '../compliance/accountWorkflow'
import { useWorkspaceAudit } from './useWorkspaceAudit'
import { useWorkspaceSession } from './useWorkspaceSession'
import { buildSyntheticCaseDraft } from '../testing/syntheticCaseDraft.mjs'

const guestTestCopy={
  de:{starting:'Sicherer Testarbeitsbereich wird geöffnet …',unavailable:'Der passwortlose Testzugang ist momentan nicht verfügbar. Bitte verwenden Sie die normale Anmeldung.',displayName:'Synthetischer Testzugang',active:'Passwortloser Testzugang aktiv',scope:'Nur synthetische oder wirksam anonymisierte Daten · höchstens 2 Dokumente · 2 Stunden'},
  en:{starting:'Opening the secure test workspace …',unavailable:'Passwordless testing is currently unavailable. Please use the regular sign-in.',displayName:'Synthetic test access',active:'Passwordless test access is active',scope:'Synthetic or effectively anonymised data only · up to 2 documents · 2 hours'},
  tr:{starting:'Güvenli test alanı açılıyor …',unavailable:'Parolasız test şu anda kullanılamıyor. Normal giriş yöntemini kullanın.',displayName:'Sentetik test erişimi',active:'Parolasız test erişimi etkin',scope:'Yalnızca sentetik veya etkili anonim veri · en fazla 2 belge · 2 saat'},
  pl:{starting:'Otwieranie bezpiecznego obszaru testowego …',unavailable:'Test bez hasła jest chwilowo niedostępny. Użyj zwykłego logowania.',displayName:'Syntetyczny dostęp testowy',active:'Dostęp testowy bez hasła jest aktywny',scope:'Tylko dane syntetyczne lub skutecznie anonimowe · maks. 2 dokumenty · 2 godziny'},
  ru:{starting:'Открывается безопасная тестовая область …',unavailable:'Тест без пароля сейчас недоступен. Используйте обычный вход.',displayName:'Синтетический тестовый доступ',active:'Доступ без пароля активен',scope:'Только синтетические или надёжно анонимизированные данные · до 2 документов · 2 часа'},
  ar:{starting:'جارٍ فتح مساحة الاختبار الآمنة …',unavailable:'الاختبار بلا كلمة مرور غير متاح حالياً. استخدم تسجيل الدخول العادي.',displayName:'وصول اختباري اصطناعي',active:'الوصول بلا كلمة مرور نشط',scope:'بيانات اصطناعية أو مجهولة بفعالية فقط · مستندان كحد أقصى · ساعتان'},
  fa:{starting:'فضای آزمایش امن در حال باز شدن است …',unavailable:'آزمایش بدون گذرواژه اکنون در دسترس نیست. از ورود عادی استفاده کنید.',displayName:'دسترسی آزمایشی ساختگی',active:'دسترسی بدون گذرواژه فعال است',scope:'فقط داده ساختگی یا واقعاً ناشناس · حداکثر ۲ سند · ۲ ساعت'},
  fr:{starting:'Ouverture de l’espace de test sécurisé …',unavailable:'Le test sans mot de passe est indisponible pour le moment. Utilisez la connexion normale.',displayName:'Accès de test synthétique',active:'Accès de test sans mot de passe actif',scope:'Données synthétiques ou effectivement anonymisées uniquement · 2 documents maximum · 2 heures'},
  ro:{starting:'Se deschide spațiul de test sigur …',unavailable:'Testul fără parolă nu este disponibil momentan. Folosiți autentificarea normală.',displayName:'Acces de test sintetic',active:'Accesul de test fără parolă este activ',scope:'Doar date sintetice sau anonimizate efectiv · maximum 2 documente · 2 ore'},
  bg:{starting:'Безопасното тестово пространство се отваря …',unavailable:'Тестът без парола временно не е достъпен. Използвайте обичайното влизане.',displayName:'Синтетичен тестов достъп',active:'Достъпът без парола е активен',scope:'Само синтетични или ефективно анонимизирани данни · до 2 документа · 2 часа'},
  vi:{starting:'Đang mở không gian thử nghiệm an toàn …',unavailable:'Thử nghiệm không mật khẩu hiện chưa khả dụng. Hãy dùng đăng nhập thông thường.',displayName:'Quyền truy cập thử nghiệm tổng hợp',active:'Quyền thử nghiệm không mật khẩu đang hoạt động',scope:'Chỉ dữ liệu tổng hợp hoặc ẩn danh hiệu quả · tối đa 2 tài liệu · 2 giờ'}
}

const eur=value=>`${Number(value||0).toFixed(2).replace('.',',')} €`

const pageCatalogs={
  passwordUi,uploadUi,ui,exportUi,appText,planJourney,planText,notices,
  journeyLabels,dashboardGuide,recommendationText,transparencyText,
  caseDiscoveryText,publicAudienceText,testerLinkText,periodText,
  launchTrustText,serverControlText
}

for(const [catalogName,translations] of Object.entries(pageTranslations)){
  Object.assign(pageCatalogs[catalogName],translations)
}

export default function WorkspaceController(){
  const [screen,setScreen]=useState('loading')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [password2,setPassword2]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [showPassword2,setShowPassword2]=useState(false)
  const [displayName,setDisplayName]=useState('')
  const [acceptedLegal,setAcceptedLegal]=useState(false)
  const [confirmedTestData,setConfirmedTestData]=useState(false)
  const [message,setMessage]=useState('')
  const [user,setUser]=useState(null)
  const [privacySettings,setPrivacySettings]=useState(null)
  const [privacyBusy,setPrivacyBusy]=useState(false)
  const [data,setData]=useState(emptyData)
  const [section,setSection]=useState('dashboard')
  const [selectedCase,setSelectedCase]=useState(null)
  const [selectedClient,setSelectedClient]=useState(null)
  const [selectedDocument,setSelectedDocument]=useState(null)
  const [selectedApproval,setSelectedApproval]=useState(null)
  const [approvalDefaults,setApprovalDefaults]=useState({caseId:'',documentId:'',recipient:'',subject:'',body:''})
  const [access,setAccess]=useState(null)
  const [upgrades,setUpgrades]=useState([])
  const [termMonths,setTermMonths]=useState(1)
  const [quotes,setQuotes]=useState({})
  const [quoteLoading,setQuoteLoading]=useState(false)
  const [promoCode,setPromoCode]=useState('')
  const [appliedPromoCode,setAppliedPromoCode]=useState('')
  const [promoRevision,setPromoRevision]=useState(0)
  const [newClient,setNewClient]=useState({name:'',email:'',phone:'',notes:''})
  const [showClientForm,setShowClientForm]=useState(false)
  const [newCase,setNewCase]=useState(emptyCase)
  const [showCaseForm,setShowCaseForm]=useState(false)
  const [documentMode,setDocumentMode]=useState('upload')
  const [uploadCaseId,setUploadCaseId]=useState('')
  const [uploading,setUploading]=useState(false)
  const [exportType,setExportType]=useState('pdf')
  const {language,setLanguage,outputLanguage,setOutputLanguage}=useLanguagePreferences()
  const [selectedGoal,setSelectedGoal]=useState('overview')
  const [showRecommendation,setShowRecommendation]=useState(false)
  const [selectedPublicCase,setSelectedPublicCase]=useState('work')
  const {activityLog,serverAudit,setServerAudit,recordLocalAction,recordServerAudit,resetAudit}=useWorkspaceAudit({supabase,userId:user?.id})
  const [deletionRequests,setDeletionRequests]=useState([])
  const [deletionBusy,setDeletionBusy]=useState(false)
  const guestStartAttempted=useRef(false)

  const t=ui[language]||ui.de
  const a=appText[language]||appText.de
  const n=notices[language]||notices.de
  const pui=passwordUi[language]||passwordUi.de
  const recoveryCopy=passwordRecoveryUi[language]||passwordRecoveryUi.de
  const guestCopy=guestTestCopy[language]||guestTestCopy.de
  const uui=uploadUi[language]||uploadUi.de
  const v28=getV28PrivacyCopy(language)
  const v29Password=getV29PasswordCopy(language)
  const passwordPolicy=validateV29Password(password,{email,displayName})
  const passwordMatches=password.length>0&&password===password2
  const registerReady=acceptedLegal&&confirmedTestData&&passwordPolicy.valid&&passwordMatches
  const recoveryReady=passwordPolicy.valid&&passwordMatches
  const localizedPlans=plans.map((plan,index)=>{
    const translated=(planText[language]||{})[plan.key]
    const journey=(planJourney[language]||planJourney.de)[plan.key]||{}
    const base=translated?{...plan,audience:translated[0],checks:translated[1],result:translated[2],excluded:translated[3]}:plan
    return {...base,...journey,level:index+1}
  })
  const period=periodText[language]||periodText.de
  const monthsLabel=value=>a.months.replace('{n}',value).replace('{plural}',value>1?(language==='de'?'e':language==='en'?'s':''):'')
  const currentTier=access?.permissions?.tier||'free'
  const currentPlan=useMemo(()=>plans.find(plan=>plan.key===currentTier)||plans[0],[currentTier])
  const dg=(dashboardGuide[language]||dashboardGuide.de)[currentTier]||dashboardGuide.de.free
  const rt=recommendationText[language]||recommendationText.de
  const tt=transparencyText[language]||transparencyText.de
  const lt=launchTrustText[language]||launchTrustText.de
  const sct=serverControlText[language]||serverControlText.de
  const promo=promoTranslations[language]||promoTranslations.de
  const core=getV24Copy(language)
  const approvalUi=getV25ApprovalCopy(language)
  const analysisUi=getV26AnalysisCopy(language)
  const privacyCurrent=privacySettings?.privacy_notice_version===PRIVACY_NOTICE_VERSION&&privacySettings?.terms_version===TERMS_VERSION&&!!privacySettings?.privacy_notice_acknowledged_at&&!!privacySettings?.terms_acknowledged_at
  const recommendedTier=goalTier[selectedGoal]||'free'
  const recommendedPlan=localizedPlans.find(plan=>plan.key===recommendedTier)||localizedPlans[0]
  const currentSufficient=(tierRank[currentTier]||1)>=(tierRank[recommendedTier]||1)
  const deadlineCases=useMemo(()=>data.cases.filter(item=>item.deadline_at).sort((left,right)=>new Date(left.deadline_at)-new Date(right.deadline_at)),[data.cases])
  const promoQuotes=Object.values(quotes).filter(Boolean)
  const promoAnyValid=!!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='valid')
  const promoAllInvalid=!!appliedPromoCode&&promoQuotes.length===upgrades.length&&promoQuotes.every(quote=>quote.promo_code_state==='invalid')
  const promoSomeInvalid=!!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='invalid')
  const activeCaseContext=useMemo(()=>{
    if(selectedCase) return selectedCase
    const linkedCaseId=selectedDocument?.case_id||selectedApproval?.case_id
    return linkedCaseId?data.cases.find(item=>item.id===linkedCaseId)||null:null
  },[selectedCase,selectedDocument,selectedApproval,data.cases])

  useEffect(()=>{
    if(screen==='app'&&activeCaseContext?.target_country) broadcastCountryContext(activeCaseContext.target_country)
  },[screen,activeCaseContext?.id,activeCaseContext?.target_country])

  // The public interface follows the interface language. Output language is
  // reserved for customer-facing results and generated documents.
  const publicLanguage=language
  const publicT=ui[publicLanguage]||ui.de
  const publicA=appText[publicLanguage]||appText.de
  const publicLocalizedPlans=plans.map((plan,index)=>{
    const translated=(planText[publicLanguage]||{})[plan.key]
    const journey=(planJourney[publicLanguage]||planJourney.de)[plan.key]||{}
    const base=translated?{...plan,audience:translated[0],checks:translated[1],result:translated[2],excluded:translated[3]}:plan
    return {...base,...journey,level:index+1}
  })
  const publicPeriod=periodText[publicLanguage]||periodText.de
  const publicJl=journeyLabels[publicLanguage]||journeyLabels.de
  const publicRt=recommendationText[publicLanguage]||recommendationText.de
  const publicTt=transparencyText[publicLanguage]||transparencyText.de
  const publicCd=caseDiscoveryText[publicLanguage]||caseDiscoveryText.de
  const publicOrderedPublicCases=orderCasesByResearch(publicCd.cases)
  const publicPa=publicAudienceText[publicLanguage]||publicAudienceText.de
  const publicActivePublicCase=publicOrderedPublicCases.find(item=>item.key===selectedPublicCase)||publicOrderedPublicCases[0]
  const publicRecommendedPlan=publicLocalizedPlans.find(plan=>plan.key===recommendedTier)||publicLocalizedPlans[0]
  const publicMonthsLabel=value=>publicA.months.replace('{n}',value).replace('{plural}',value>1?(publicLanguage==='de'?'e':publicLanguage==='en'?'s':''):'')
  const navigateToScreen=nextScreen=>{setMessage('');setScreen(nextScreen)}

  const {createClient,updateClient,createCase,updateCase,createAssessment}=createCaseWorkflowActions({
    supabase,ownerId:user?.id,data,newClient,newCase,setData,setMessage,setNewClient,setShowClientForm,setSection,setNewCase,setShowCaseForm,setSelectedCase,recordLocalAction,recordServerAudit
  })

  const {createApproval,updateApproval,approveApproval,rejectApproval,prepareDocumentApproval}=createApprovalWorkflowActions({
    supabase,ownerId:user?.id,data,approvalUi,setData,setMessage,setApprovalDefaults,setSelectedApproval,setSelectedDocument,setSelectedCase,setSection,recordLocalAction,recordServerAudit
  })

  const {analyzeDocument,updateDocument,uploadDocument,openDocument}=createDocumentWorkflowActions({
    supabase,ownerId:user?.id,data,access,privacyCurrent,outputLanguage,privacyCopy:v28,notices:n,uploadCopy:uui,analysisCopy:analysisUi,caseCopy:core,serverCopy:sct,setData,setMessage,setPrivacySettings,setUploading,setSection,setSelectedDocument,recordLocalAction,recordServerAudit
  })

  const {doExport,exportMyData}=createExportWorkflowActions({
    supabase,access,data,outputLanguage,appCopy:a,notices:n,serverCopy:sct,trustCopy:lt,user,currentTier,currentPlan,privacySettings,setMessage,recordLocalAction,recordServerAudit
  })

  const {acknowledgeCurrentLegal,requestAccountDeletion,cancelAccountDeletion}=createAccountWorkflowActions({
    supabase,ownerId:user?.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,deletionRequests,deletionBusy,privacyBusy,privacyCopy:v28,serverCopy:sct,setDeletionBusy,setPrivacyBusy,setDeletionRequests,setPrivacySettings,setMessage,recordServerAudit
  })

  const {loadApp,signIn,startGuestTest,resetPassword,completePasswordRecovery,register}=createWorkspaceAuthActions({
    supabase,language,pendingMessages:accessPendingMessages,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,legalCopy:v28,passwordCopy:v29Password,notices:n,trustCopy:lt,recoveryCopy,guestCopy,email,password,password2,displayName,acceptedLegal,confirmedTestData,validatePassword:validateV29Password,setPassword,setPassword2,setAcceptedLegal,setConfirmedTestData,setAccess,setUpgrades,setData,setServerAudit,setDeletionRequests,setPrivacySettings,setUser,setScreen,setMessage
  })

  useEffect(()=>{
    if(screen!=='guest-test'){guestStartAttempted.current=false;return}
    if(guestStartAttempted.current)return
    guestStartAttempted.current=true
    startGuestTest()
  },[screen])

  const {loadQuotes,applyPromo,clearPromo,requestUpgrade}=createPricingWorkflowActions({
    supabase,upgrades,termMonths,promoCode,appliedPromoCode,quotes,promoCopy:promo,notices:n,setQuotes,setPromoCode,setAppliedPromoCode,setPromoRevision,setQuoteLoading,setMessage,setAccess,setUpgrades,onTestAccessGranted:()=>setSection('dashboard'),formatAccessEnd:value=>new Intl.DateTimeFormat(localeForLanguage[language]||'de-DE',{dateStyle:'medium'}).format(new Date(value)),recordServerAudit
  })

  useWorkspaceSession({
    supabase,
    loadApp,
    setScreen,
    onPasswordRecovery:()=>{setMessage('');setScreen('recovery')},
    onSignedOut:()=>{
      setUser(null)
      setAccess(null)
      setPrivacySettings(null)
      setData(emptyData)
      setSelectedCase(null)
      setSelectedClient(null)
      setSelectedDocument(null)
      setSelectedApproval(null)
      setApprovalDefaults({caseId:'',documentId:'',recipient:'',subject:'',body:''})
      setDeletionRequests([])
      resetAudit()
      setSection('dashboard')
      setScreen('public')
    }
  })

  useEffect(()=>{
    if(screen!=='app'||!upgrades.length) return
    let cancelled=false
    loadQuotes({isCancelled:()=>cancelled})
    return ()=>{cancelled=true}
  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])

  function handleQuickAction(action,item=null){
    setSelectedClient(null)
    setSelectedDocument(null)
    setSelectedApproval(null)
    if(action==='open-case'&&item){setSelectedCase(item);return}
    setSelectedCase(null)
    if(action==='case'){setSection('cases');setShowCaseForm(true);return}
    if(action==='scan'||action==='upload'){setDocumentMode(action);setUploadCaseId('');setSection('documents');return}
    if(action==='clients'){setSection('clients');return}
    if(action==='deadlines'){setSection('cases');return}
    if(action==='approvals'){setApprovalDefaults({caseId:'',documentId:'',recipient:'',subject:'',body:''});setSection('approvals')}
  }

  function startSyntheticCase(tester){
    if(!tester) return
    setOutputLanguage(tester.language||outputLanguage)
    broadcastCountryContext(tester.target_country||'DE')
    setSelectedClient(null)
    setSelectedDocument(null)
    setSelectedApproval(null)
    setSelectedCase(null)
    setNewCase({...emptyCase,...buildSyntheticCaseDraft(tester)})
    setShowCaseForm(true)
    setSection('cases')
  }

  function protectedWorkspace(content){
    return <ProtectedWorkspaceShell language={language} outputLanguage={outputLanguage} onLanguageChange={setLanguage} onOutputLanguageChange={setOutputLanguage} legalLabel={t.legal} languageLabel={t.language} outputLanguageLabel={t.outputLanguage} logoutLabel={a.logout} onLogout={()=>signOutSession(supabase)} message={message}>{content}</ProtectedWorkspaceShell>
  }

  if(screen==='loading') return <LoadingSurface language={language} checking={a.checking}/>

  if(screen==='guest-test') return <LoadingSurface language={language} checking={guestCopy.starting}/>

  if(screen==='login'||screen==='register'||screen==='recovery'||screen==='request-reset') return <AuthSurface screen={screen} t={t} a={a} language={language} setLanguage={setLanguage} tt={tt} displayName={displayName} setDisplayName={setDisplayName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} password2={password2} setPassword2={setPassword2} showPassword={showPassword} setShowPassword={setShowPassword} showPassword2={showPassword2} setShowPassword2={setShowPassword2} pui={pui} recoveryCopy={recoveryCopy} v28={v28} acceptedLegal={acceptedLegal} setAcceptedLegal={setAcceptedLegal} confirmedTestData={confirmedTestData} setConfirmedTestData={setConfirmedTestData} registerReady={registerReady} recoveryReady={recoveryReady} register={register} signIn={signIn} resetPassword={resetPassword} completePasswordRecovery={completePasswordRecovery} message={message} lt={lt} setScreen={navigateToScreen}/>

  if(screen==='app'&&!privacyCurrent) return protectedWorkspace(<LegalAcceptance copy={v28} onAccept={acknowledgeCurrentLegal} busy={privacyBusy}/>)

  if(screen==='app'&&selectedApproval) return protectedWorkspace(<ApprovalDetail key={`${selectedApproval.id}-${selectedApproval.preview_revision}-${selectedApproval.status}`} copy={approvalUi} item={selectedApproval} cases={data.cases} documents={data.documents} onBack={()=>setSelectedApproval(null)} onSave={updateApproval} onApprove={approveApproval} onReject={rejectApproval}/>)

  if(screen==='app'&&selectedDocument) return protectedWorkspace(<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} privacy={v28} language={language} item={selectedDocument} cases={data.cases} onBack={()=>setSelectedDocument(null)} onSave={updateDocument} onAnalyze={analyzeDocument} onOpen={openDocument} onPrepareApproval={prepareDocumentApproval} approvalLabel={approvalUi.prepareFromDocument}/>)

  if(screen==='app'&&selectedCase){
    const caseDocs=data.documents.filter(document=>document.case_id===selectedCase.id)
    const caseAssessments=data.assessments.filter(assessment=>assessment.case_id===selectedCase.id)
    return protectedWorkspace(<><CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} language={language} item={selectedCase} clients={data.clients} documents={caseDocs} assessments={caseAssessments} onBack={()=>setSelectedCase(null)} onSave={updateCase} onAddAssessment={createAssessment} onAddDocument={caseId=>{setUploadCaseId(caseId);setDocumentMode('upload');setSelectedCase(null);setSection('documents')}} onOpenDocument={setSelectedDocument}/><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={event=>setExportType(event.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div></>)
  }

  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<CasesSurface a={a} core={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showCaseForm={showCaseForm} setShowCaseForm={setShowCaseForm} createCase={createCase} setSelectedCase={setSelectedCase} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<DocumentsSurface a={a} access={access} documents={data.documents} core={core} v28={v28} cases={data.cases} documentMode={documentMode} setDocumentMode={setDocumentMode} uploadCaseId={uploadCaseId} uploadDocument={uploadDocument} uploading={uploading} allowedUploadAccept={allowedUploadAccept} setSelectedDocument={setSelectedDocument} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<ApprovalsSurface a={a} approvalUi={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} approvalDefaults={approvalDefaults} createApproval={createApproval} setSelectedApproval={setSelectedApproval} onBack={()=>{setApprovalDefaults({caseId:'',documentId:'',recipient:'',subject:'',body:''});setSection('dashboard')}}/>)

  if(screen==='app'&&!selectedClient&&section==='pricing') return protectedWorkspace(<PricingSurface a={a} promo={promo} upgrades={upgrades} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='account') return protectedWorkspace(<AccountSurface a={a} currentPlan={currentPlan} currentTier={currentTier} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'){
    if(selectedClient){
      const clientCases=data.cases.filter(item=>item.client_id===selectedClient.id)
      const clientCaseIds=new Set(clientCases.map(item=>item.id))
      const clientDocuments=data.documents.filter(item=>clientCaseIds.has(item.case_id))
      return protectedWorkspace(<ClientDetailSurface a={a} core={core} selectedClient={selectedClient} cases={clientCases} documents={clientDocuments} onSave={updateClient} onOpenCase={item=>{setSelectedClient(null);setSelectedCase(item)}} onOpenDocument={item=>{setSelectedClient(null);setSelectedDocument(item)}} onBack={()=>setSelectedClient(null)}/>)
    }
    if(section==='dashboard') return protectedWorkspace(<DashboardSurface core={core} handleQuickAction={handleQuickAction} onStartSyntheticCase={startSyntheticCase} deadlineCases={deadlineCases} a={a} user={user} currentTier={currentTier} dg={dg} setSection={setSection} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} currentSufficient={currentSufficient} currentPlan={currentPlan} access={access} data={data} lt={lt} promo={promo} guestCopy={guestCopy} testAccessEnd={(access?.permissions?.promo_access_ends_at||access?.permissions?.guest_access_ends_at)?new Intl.DateTimeFormat(localeForLanguage[language]||'de-DE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(access.permissions.promo_access_ends_at||access.permissions.guest_access_ends_at)):null}/>)
    return protectedWorkspace(<ClientsSurface a={a} showClientForm={showClientForm} setShowClientForm={setShowClientForm} createClient={createClient} newClient={newClient} setNewClient={setNewClient} clients={data.clients} setSelectedClient={setSelectedClient} onBack={()=>setSection('dashboard')}/>)
  }

  return <PublicLanding t={publicT} a={publicA} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={navigateToScreen} cd={publicCd} testerLinkText={testerLinkText} pa={publicPa} activePublicCase={publicActivePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={publicTt} jl={publicJl} localizedPlans={publicLocalizedPlans} rt={publicRt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={publicRecommendedPlan} recommendedTier={recommendedTier} eur={eur} period={publicPeriod} terms={terms} monthsLabel={publicMonthsLabel}/>
}
