'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { cancelDeletionRecord, ensureRegistrationPrivacy, getWorkspaceAccess, listDeletionRequests, loadWorkspaceBundle, recordAuditEvent, requestDeletionRecord } from '../services/workspaceRepository'
import { getUpgradeQuotes, requestUpgradeRecord } from '../services/pricingRepository'
import { acknowledgeLegalSettings } from '../services/complianceRepository'
import { getAuthSession, registerTestAccount, sendPasswordReset, signInSession, signOutSession, watchAuthState } from '../services/authRepository'
import { allowedUploadAccept, uploadUi } from '../documents/uploadConfig'
import { appText } from './workspaceText'
import { ui } from '../public/publicUi'
import { passwordUi } from '../auth/passwordUi'
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
import { CaseDetail, DocumentDetail, getV24Copy } from '../cases/V24Workspace'
import { ApprovalDetail, getV25ApprovalCopy } from '../cases/V25ApprovalWorkflow'
import { getV26AnalysisCopy } from '../documents/V26DocumentAnalysis'
import { LegalAcceptance, PRIVACY_NOTICE_VERSION, TERMS_VERSION, getV28PrivacyCopy } from '../compliance/PrivacyControls'
import { getV29PasswordCopy, validateV29Password } from '../auth/PasswordPolicy'
import { localeForLanguage, pageTranslations } from '../language/v36Languages.mjs'
import { promoTranslations } from '../pricing/v31PromoTranslations.mjs'
import { orderCasesByResearch } from '../public/casePriorityV56.mjs'
import { useLanguagePreferences } from '../language/useLanguagePreferences'
import { createCaseWorkflowActions } from '../cases/caseWorkflow'
import { createApprovalWorkflowActions } from '../cases/approvalWorkflow'
import { createDocumentWorkflowActions } from '../documents/documentWorkflow'
import { createExportWorkflowActions } from '../documents/exportWorkflow'

const eur=value=>`${Number(value||0).toFixed(2).replace('.',',')} €`

const pageCatalogs={
  passwordUi,uploadUi,ui,appText,planJourney,planText,notices,
  journeyLabels,dashboardGuide,recommendationText,transparencyText,
  caseDiscoveryText,publicAudienceText,testerLinkText,periodText,
  launchTrustText,serverControlText
}

for(const [catalogName,translations] of Object.entries(pageTranslations)){
  Object.assign(pageCatalogs[catalogName],translations)
}

export default function WorkspaceAppV2(){
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
  const [approvalDefaults,setApprovalDefaults]=useState({caseId:'',documentId:''})
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
  const [activityLog,setActivityLog]=useState([])
  const [serverAudit,setServerAudit]=useState([])
  const [deletionRequests,setDeletionRequests]=useState([])
  const [deletionBusy,setDeletionBusy]=useState(false)

  const t=ui[language]||ui.de
  const a=appText[language]||appText.de
  const n=notices[language]||notices.de
  const pui=passwordUi[language]||passwordUi.de
  const uui=uploadUi[language]||uploadUi.de
  const v28=getV28PrivacyCopy(language)
  const v29Password=getV29PasswordCopy(language)
  const passwordPolicy=validateV29Password(password,{email,displayName})
  const passwordMatches=password.length>0&&password===password2
  const registerReady=acceptedLegal&&confirmedTestData&&passwordPolicy.valid&&passwordMatches
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

  const publicLanguage=outputLanguage
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

  useEffect(()=>{
    if(!user?.id) return
    try{
      const storageKey=`asgold-activity-${user.id}`
      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]
      localStorage.setItem(storageKey,JSON.stringify(sanitized))
      setActivityLog(sanitized)
    }catch{
      setActivityLog([])
    }
  },[user?.id])

  function recordLocalAction(kind){
    if(!user?.id) return
    const entry={at:new Date().toISOString(),kind,detail:'✓'}
    setActivityLog(previous=>{
      const next=[entry,...previous].slice(0,50)
      localStorage.setItem(`asgold-activity-${user.id}`,JSON.stringify(next))
      return next
    })
  }

  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){
    if(!user?.id) return false
    const {rows,error}=await recordAuditEvent(supabase,{ownerId:user.id,eventType,metadata,entityType,entityId})
    if(error){console.error('record_gold_audit_event',error);return false}
    setServerAudit(rows||[])
    return true
  }

  const {createClient,createCase,updateCase,createAssessment}=createCaseWorkflowActions({
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

  async function requestAccountDeletion(){
    if(!user?.id||deletionBusy) return
    setDeletionBusy(true)
    setMessage('')
    const {error}=await requestDeletionRecord(supabase,user.id)
    if(error){setDeletionBusy(false);return setMessage(error.code==='23505'?sct.deletionPending:error.message)}
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[])
    setDeletionBusy(false)
    setMessage(sct.deletionRequested)
  }

  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(request=>request.scope==='account'&&request.status==='requested')
    if(!pending||deletionBusy) return
    setDeletionBusy(true)
    setMessage('')
    const {error}=await cancelDeletionRecord(supabase,{ownerId:user.id,requestId:pending.id})
    if(error){setDeletionBusy(false);return setMessage(error.message)}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[])
    setDeletionBusy(false)
    setMessage(sct.deletionCancelled)
  }

  async function loadApp(session){
    setMessage('')
    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){setMessage(accessSnapshot.error.message);setScreen('login');return}
    const row=accessSnapshot.access
    if(!row?.active||row?.status!=='approved'){
      setMessage(accessPendingMessages[language]||accessPendingMessages.de)
      setScreen('login')
      return
    }
    setAccess(row)
    setUpgrades(accessSnapshot.upgrades||[])
    const ownerId=session.user.id
    const bundle=await loadWorkspaceBundle(supabase,ownerId)
    if(bundle.error) setMessage(bundle.error.message)
    let nextPrivacy=bundle.privacy
    if(!nextPrivacy){
      const createdPrivacy=await ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta:session.user?.user_metadata||{},privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
      if(!createdPrivacy.error&&createdPrivacy.data) nextPrivacy=createdPrivacy.data
    }
    setData(bundle.data)
    setServerAudit(bundle.audit)
    setDeletionRequests(bundle.deletionRequests)
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
  }

  useEffect(()=>{
    let alive=true
    getAuthSession(supabase).then(({data:{session}})=>{
      if(alive) session?loadApp(session):setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public')
    })
    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='SIGNED_IN'&&session) loadApp(session)
      if(event==='SIGNED_OUT'){
        setUser(null)
        setAccess(null)
        setPrivacySettings(null)
        setData(emptyData)
        setSelectedCase(null)
        setSelectedClient(null)
        setSelectedDocument(null)
        setSelectedApproval(null)
        setApprovalDefaults({caseId:'',documentId:''})
        setServerAudit([])
        setDeletionRequests([])
        setActivityLog([])
        setSection('dashboard')
        setScreen('public')
      }
    })
    return ()=>{alive=false;subscription.unsubscribe()}
  },[])

  useEffect(()=>{
    if(screen!=='app'||!upgrades.length) return
    let cancelled=false
    ;(async()=>{
      setQuoteLoading(true)
      const nextQuotes=await getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode:appliedPromoCode})
      if(!cancelled){setQuotes(nextQuotes);setQuoteLoading(false)}
    })()
    return ()=>{cancelled=true}
  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])

  async function acknowledgeCurrentLegal(){
    if(!user?.id||privacyBusy) return false
    setPrivacyBusy(true)
    setMessage('')
    const {data:stored,error}=await acknowledgeLegalSettings(supabase,{ownerId:user.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(error){setPrivacyBusy(false);setMessage(error.message);return false}
    setPrivacySettings(stored)
    await recordServerAudit('legal_notices_acknowledged',{},'account',null)
    setPrivacyBusy(false)
    setMessage(v28.saved)
    return true
  }

  async function signIn(event){
    event.preventDefault()
    setMessage('')
    const {data:authData,error}=await signInSession(supabase,{email:email.trim(),password})
    if(error) return setMessage(error.message)
    await loadApp(authData.session)
  }

  async function resetPassword(){
    setMessage('')
    if(!email.trim()) return setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')
    const {error}=await sendPasswordReset(supabase,{email:email.trim(),redirectTo:window.location.origin})
    if(error) return setMessage(error.message)
    setMessage(lt.passwordSent)
  }

  async function register(event){
    event.preventDefault()
    setMessage('')
    if(!acceptedLegal||!confirmedTestData) return setMessage(v28.required)
    if(!validateV29Password(password,{email,displayName}).valid) return setMessage(v29Password.invalid)
    if(password!==password2) return setMessage(n.pwMismatch)
    const {data:authData,error}=await registerTestAccount(supabase,{email:email.trim(),password,displayName:displayName.trim(),privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,emailRedirectTo:'https://app-gold-workspace.vercel.app'})
    if(error) return setMessage(error.message)
    if(authData.session) await loadApp(authData.session)
    else{
      setAcceptedLegal(false)
      setConfirmedTestData(false)
      setMessage(n.registered)
      setScreen('login')
    }
  }

  function applyPromo(event){
    event.preventDefault()
    const next=promoCode.trim()
    if(!next) return clearPromo()
    setQuotes({})
    setAppliedPromoCode(next)
    setPromoRevision(value=>value+1)
  }

  function clearPromo(){
    setPromoCode('')
    setQuotes({})
    setAppliedPromoCode('')
    setPromoRevision(value=>value+1)
  }

  async function requestUpgrade(plan){
    setMessage('')
    const selectedQuote=quotes[plan.plan_key]
    if(appliedPromoCode&&selectedQuote?.promo_code_state!=='valid') return setMessage(promo.invalid)
    const {data:upgradeData,error}=await requestUpgradeRecord(supabase,{planKey:plan.plan_key,termMonths,promoCode:appliedPromoCode})
    if(error) return setMessage(appliedPromoCode?promo.invalid:error.message)
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:upgradeData?.promo_code_state==='valid'},'account',null)
    setMessage(`${n.upgradeReserved} ${n.selected}: ${upgradeData?.to_plan_name||plan.plan_name}, ${termMonths} ${termMonths===1?n.monthOne:n.monthMany}.`)
  }

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
    if(action==='approvals'){setApprovalDefaults({caseId:'',documentId:''});setSection('approvals')}
  }

  function protectedWorkspace(content){
    return <ProtectedWorkspaceShell language={language} outputLanguage={outputLanguage} onLanguageChange={setLanguage} onOutputLanguageChange={setOutputLanguage} legalLabel={t.legal} languageLabel={t.language} outputLanguageLabel={t.outputLanguage} logoutLabel={a.logout} onLogout={()=>signOutSession(supabase)} message={message}>{content}</ProtectedWorkspaceShell>
  }

  if(screen==='loading') return <LoadingSurface language={language} checking={a.checking}/>

  if(screen==='login'||screen==='register') return <AuthSurface screen={screen} t={t} a={a} language={language} setLanguage={setLanguage} tt={tt} displayName={displayName} setDisplayName={setDisplayName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} password2={password2} setPassword2={setPassword2} showPassword={showPassword} setShowPassword={setShowPassword} showPassword2={showPassword2} setShowPassword2={setShowPassword2} pui={pui} v28={v28} acceptedLegal={acceptedLegal} setAcceptedLegal={setAcceptedLegal} confirmedTestData={confirmedTestData} setConfirmedTestData={setConfirmedTestData} registerReady={registerReady} register={register} signIn={signIn} resetPassword={resetPassword} message={message} lt={lt} setScreen={setScreen}/>

  if(screen==='app'&&!privacyCurrent) return protectedWorkspace(<LegalAcceptance copy={v28} onAccept={acknowledgeCurrentLegal} busy={privacyBusy}/>)

  if(screen==='app'&&selectedApproval) return protectedWorkspace(<ApprovalDetail key={`${selectedApproval.id}-${selectedApproval.preview_revision}-${selectedApproval.status}`} copy={approvalUi} item={selectedApproval} cases={data.cases} documents={data.documents} onBack={()=>setSelectedApproval(null)} onSave={updateApproval} onApprove={approveApproval} onReject={rejectApproval}/>)

  if(screen==='app'&&selectedDocument) return protectedWorkspace(<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} language={language} item={selectedDocument} cases={data.cases} onBack={()=>setSelectedDocument(null)} onSave={updateDocument} onAnalyze={analyzeDocument} onOpen={openDocument} onPrepareApproval={prepareDocumentApproval} approvalLabel={approvalUi.prepareFromDocument}/>)

  if(screen==='app'&&selectedCase){
    const caseDocs=data.documents.filter(document=>document.case_id===selectedCase.id)
    const caseAssessments=data.assessments.filter(assessment=>assessment.case_id===selectedCase.id)
    return protectedWorkspace(<><CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} language={language} item={selectedCase} clients={data.clients} documents={caseDocs} assessments={caseAssessments} onBack={()=>setSelectedCase(null)} onSave={updateCase} onAddAssessment={createAssessment} onAddDocument={caseId=>{setUploadCaseId(caseId);setDocumentMode('upload');setSelectedCase(null);setSection('documents')}} onOpenDocument={setSelectedDocument}/><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={event=>setExportType(event.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div></>)
  }

  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<CasesSurface a={a} core={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showCaseForm={showCaseForm} setShowCaseForm={setShowCaseForm} createCase={createCase} setSelectedCase={setSelectedCase} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<DocumentsSurface a={a} access={access} documents={data.documents} core={core} v28={v28} cases={data.cases} documentMode={documentMode} setDocumentMode={setDocumentMode} uploadCaseId={uploadCaseId} uploadDocument={uploadDocument} uploading={uploading} allowedUploadAccept={allowedUploadAccept} setSelectedDocument={setSelectedDocument} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<ApprovalsSurface a={a} approvalUi={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} approvalDefaults={approvalDefaults} createApproval={createApproval} setSelectedApproval={setSelectedApproval} onBack={()=>{setApprovalDefaults({caseId:'',documentId:''});setSection('dashboard')}}/>)

  if(screen==='app'&&!selectedClient&&section==='pricing') return protectedWorkspace(<PricingSurface a={a} promo={promo} upgrades={upgrades} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'&&!selectedClient&&section==='account') return protectedWorkspace(<AccountSurface a={a} currentPlan={currentPlan} currentTier={currentTier} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion} onBack={()=>setSection('dashboard')}/>)

  if(screen==='app'){
    if(selectedClient) return protectedWorkspace(<ClientDetailSurface a={a} selectedClient={selectedClient} onBack={()=>setSelectedClient(null)}/>)
    if(section==='dashboard') return protectedWorkspace(<DashboardSurface core={core} handleQuickAction={handleQuickAction} deadlineCases={deadlineCases} a={a} user={user} currentTier={currentTier} dg={dg} setSection={setSection} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} currentSufficient={currentSufficient} currentPlan={currentPlan} access={access} data={data} lt={lt}/>)
    return protectedWorkspace(<ClientsSurface a={a} showClientForm={showClientForm} setShowClientForm={setShowClientForm} createClient={createClient} newClient={newClient} setNewClient={setNewClient} clients={data.clients} setSelectedClient={setSelectedClient} onBack={()=>setSection('dashboard')}/>)
  }

  return <PublicLanding t={publicT} a={publicA} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={publicCd} testerLinkText={testerLinkText} pa={publicPa} activePublicCase={publicActivePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={publicTt} jl={publicJl} localizedPlans={publicLocalizedPlans} rt={publicRt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={publicRecommendedPlan} recommendedTier={recommendedTier} eur={eur} period={publicPeriod} terms={terms} monthsLabel={publicMonthsLabel}/>
}
