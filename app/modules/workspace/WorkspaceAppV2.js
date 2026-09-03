'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { signOutSession } from '../services/authRepository'
import { allowedUploadAccept, uploadUi } from '../documents/uploadConfig'
import { exportUi } from '../documents/exportUi'
import { appText } from './workspaceText'
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
import { promoTranslations } from '../pricing/v31PromoTranslations.mjs'
import { orderCasesByResearch } from '../public/casePriorityV56.mjs'
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

const eur=value=>`${Number(value||0).toFixed(2).replace('.',',')} €`

const pageCatalogs={passwordUi,uploadUi,ui,exportUi,appText,planJourney,planText,notices,journeyLabels,dashboardGuide,recommendationText,transparencyText,caseDiscoveryText,publicAudienceText,testerLinkText,periodText,launchTrustText,serverControlText}
for(const [catalogName,translations] of Object.entries(pageTranslations)){Object.assign(pageCatalogs[catalogName],translations)}

export default function WorkspaceAppV2(){
  const [screen,setScreen]=useState('loading');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [password2,setPassword2]=useState('');const [showPassword,setShowPassword]=useState(false);const [showPassword2,setShowPassword2]=useState(false);const [displayName,setDisplayName]=useState('');const [acceptedLegal,setAcceptedLegal]=useState(false);const [confirmedTestData,setConfirmedTestData]=useState(false);const [message,setMessage]=useState('');const [user,setUser]=useState(null);const [privacySettings,setPrivacySettings]=useState(null);const [privacyBusy,setPrivacyBusy]=useState(false);const [data,setData]=useState(emptyData);const [section,setSection]=useState('dashboard');const [selectedCase,setSelectedCase]=useState(null);const [selectedClient,setSelectedClient]=useState(null);const [selectedDocument,setSelectedDocument]=useState(null);const [selectedApproval,setSelectedApproval]=useState(null);const [approvalDefaults,setApprovalDefaults]=useState({caseId:'',documentId:''});const [access,setAccess]=useState(null);const [upgrades,setUpgrades]=useState([]);const [termMonths,setTermMonths]=useState(1);const [promoCode,setPromoCode]=useState('');const [appliedPromoCode,setAppliedPromoCode]=useState('');const [quotes,setQuotes]=useState({});const [quoteLoading,setQuoteLoading]=useState(false);const [promoRevision,setPromoRevision]=useState(0);const [activeDocumentBusy,setActiveDocumentBusy]=useState(false);const [integrationStatus,setIntegrationStatus]=useState(null);const [integrationBusy,setIntegrationBusy]=useState(false)
  const {language,setLanguage,outputLanguage,setOutputLanguage}=useLanguagePreferences()
  const copy=useMemo(()=>Object.fromEntries(Object.entries(pageCatalogs).map(([key,catalog])=>[key,catalog[language]||catalog.de||catalog])),[language])
  const outputCopy=useMemo(()=>({case:getV24Copy(outputLanguage),approval:getV25ApprovalCopy(outputLanguage),analysis:getV26AnalysisCopy(outputLanguage),privacy:getV28PrivacyCopy(outputLanguage),password:getV29PasswordCopy(outputLanguage),promo:promoTranslations[outputLanguage]||promoTranslations.de}),[outputLanguage])
  const {activityLog,setActivityLog,recordServerAudit,resetAudit}=useWorkspaceAudit({supabase,user})
  const {sessionReady}=useWorkspaceSession({supabase,setUser,onSignedOut:()=>{setScreen('public');setData(emptyData);setAccess(null);setUpgrades([]);setSelectedCase(null);setSelectedClient(null);setSelectedDocument(null);setSelectedApproval(null);resetAudit()}})
  useEffect(()=>{if(sessionReady&&screen==='loading')setScreen(user?'workspace':'public')},[sessionReady,user,screen])
  const allCases=useMemo(()=>orderCasesByResearch(data.cases||[]),[data.cases]);const selectedCaseRecord=useMemo(()=>allCases.find(item=>item.id===selectedCase)||null,[allCases,selectedCase]);const selectedClientRecord=useMemo(()=>(data.clients||[]).find(item=>item.id===selectedClient)||null,[data.clients,selectedClient]);const selectedDocumentRecord=useMemo(()=>(data.documents||[]).find(item=>item.id===selectedDocument)||null,[data.documents,selectedDocument]);const selectedApprovalRecord=useMemo(()=>(data.approvals||[]).find(item=>item.id===selectedApproval)||null,[data.approvals,selectedApproval])
  const authActions=createWorkspaceAuthActions({supabase,email,password,password2,displayName,acceptedLegal,confirmedTestData,setMessage,setUser,setScreen,setData,setAccess,setUpgrades,setPrivacySettings,setActivityLog,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,passwordPolicy:{validate:validateV29Password,copy:outputCopy.password}})
  const pricingActions=createPricingWorkflowActions({supabase,user,access,upgrades,setAccess,setUpgrades,termMonths,promoCode,appliedPromoCode,quotes,setQuotes,setPromoCode,setAppliedPromoCode,setPromoRevision,setQuoteLoading,setMessage,promoCopy:outputCopy.promo,notices:copy.notices,recordServerAudit})
  const accountActions=createAccountWorkflowActions({supabase,user,privacySettings,setPrivacySettings,setPrivacyBusy,setMessage,recordServerAudit});const caseActions=createCaseWorkflowActions({supabase,user,data,setData,setMessage,setSelectedCase,setSelectedClient,recordServerAudit});const approvalActions=createApprovalWorkflowActions({supabase,user,data,setData,setMessage,setSelectedApproval,recordServerAudit});const documentActions=createDocumentWorkflowActions({supabase,user,data,setData,setMessage,setSelectedDocument,setActiveDocumentBusy,recordServerAudit,outputLanguage,privacyCopy:outputCopy.privacy,analysisCopy:outputCopy.analysis});const exportActions=createExportWorkflowActions({supabase,user,access,data,setMessage,recordServerAudit,outputLanguage})
  void exportActions;void promoRevision;void integrationStatus;void integrationBusy;void accessPendingMessages;void terms;void goalTier;void tierRank
  function navigate(next){setSection(next);setMessage('')}function openCase(id){setSelectedCase(id);navigate('case-detail')}function openClient(id){setSelectedClient(id);navigate('client-detail')}function openDocument(id){setSelectedDocument(id);navigate('document-detail')}function openApproval(id){setSelectedApproval(id);navigate('approval-detail')}
  if(screen==='loading')return <LoadingSurface/>
  if(screen==='public')return <PublicLanding language={language} onLanguageChange={setLanguage} outputLanguage={outputLanguage} onOutputLanguageChange={setOutputLanguage} onOpenLogin={()=>setScreen('auth')} copy={copy}/>
  if(screen==='auth')return <AuthSurface language={language} copy={copy} email={email} setEmail={setEmail} password={password} setPassword={setPassword} password2={password2} setPassword2={setPassword2} showPassword={showPassword} setShowPassword={setShowPassword} showPassword2={showPassword2} setShowPassword2={setShowPassword2} displayName={displayName} setDisplayName={setDisplayName} acceptedLegal={acceptedLegal} setAcceptedLegal={setAcceptedLegal} confirmedTestData={confirmedTestData} setConfirmedTestData={setConfirmedTestData} onSignIn={authActions.signIn} onRegister={authActions.register} onPasswordReset={authActions.resetPassword} onBack={()=>setScreen('public')} message={message}/>
  const workspaceProps={language,outputLanguage,setOutputLanguage,copy,outputCopy,user,access,data,message,navigate,activityLog,recordServerAudit};let content=null
  if(section==='dashboard')content=<DashboardSurface {...workspaceProps} cases={allCases} onOpenCase={openCase} onOpenDocument={openDocument} onOpenApproval={openApproval} onOpenClient={openClient}/>
  if(section==='cases')content=<CasesSurface {...workspaceProps} cases={allCases} onOpenCase={openCase} onCreateCase={()=>{setSelectedCase(null);navigate('case-new')}}/>
  if(section==='case-new')content=<CaseDetail caseItem={emptyCase} clients={data.clients||[]} documents={data.documents||[]} assessments={data.assessments||[]} copy={outputCopy.case} analysisCopy={outputCopy.analysis} onSave={caseActions.saveCase} onCancel={()=>navigate('cases')}/>
  if(section==='case-detail'&&selectedCaseRecord)content=<CaseDetail caseItem={selectedCaseRecord} clients={data.clients||[]} documents={data.documents||[]} assessments={data.assessments||[]} copy={outputCopy.case} analysisCopy={outputCopy.analysis} onSave={caseActions.saveCase} onCancel={()=>navigate('cases')} onOpenDocument={openDocument}/>
  if(section==='clients')content=<ClientsSurface {...workspaceProps} clients={data.clients||[]} onOpenClient={openClient}/>
  if(section==='client-detail'&&selectedClientRecord)content=<ClientDetailSurface {...workspaceProps} client={selectedClientRecord} cases={allCases} onOpenCase={openCase}/>
  if(section==='documents')content=<DocumentsSurface {...workspaceProps} documents={data.documents||[]} cases={allCases} onOpenDocument={openDocument} onUpload={documentActions.uploadDocument} allowedUploadAccept={allowedUploadAccept}/>
  if(section==='document-detail'&&selectedDocumentRecord)content=<DocumentDetail document={selectedDocumentRecord} cases={allCases} copy={outputCopy.case} analysisCopy={outputCopy.analysis} privacy={outputCopy.privacy} busy={activeDocumentBusy} onAuthorize={documentActions.authorizeAnalysis} onAnalyze={documentActions.analyzeDocument} onSave={documentActions.saveDocument} onBack={()=>navigate('documents')}/>
  if(section==='approvals')content=<ApprovalsSurface {...workspaceProps} approvals={data.approvals||[]} cases={allCases} documents={data.documents||[]} onOpenApproval={openApproval} onNewApproval={(caseId,documentId)=>{setApprovalDefaults({caseId:caseId||'',documentId:documentId||''});setSelectedApproval(null);navigate('approval-detail')}}/>
  if(section==='approval-detail')content=<ApprovalDetail approval={selectedApprovalRecord} defaults={approvalDefaults} cases={allCases} documents={data.documents||[]} copy={outputCopy.approval} onSave={approvalActions.saveApproval} onApprove={approvalActions.approveApproval} onReject={approvalActions.rejectApproval} onBack={()=>navigate('approvals')}/>
  if(section==='pricing')content=<PricingSurface {...workspaceProps} plans={plans} upgrades={upgrades} termMonths={termMonths} setTermMonths={setTermMonths} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} quotes={quotes} quoteLoading={quoteLoading} onApplyPromo={pricingActions.applyPromo} onRequestUpgrade={pricingActions.requestUpgrade} eur={eur}/>
  if(section==='account')content=<AccountSurface {...workspaceProps} privacySettings={privacySettings} privacyBusy={privacyBusy} onSavePrivacy={accountActions.savePrivacy} onRequestDeletion={accountActions.requestDeletion} onCancelDeletion={accountActions.cancelDeletion} integrationStatus={integrationStatus} integrationBusy={integrationBusy} setIntegrationStatus={setIntegrationStatus} setIntegrationBusy={setIntegrationBusy}/>
  return <ProtectedWorkspaceShell language={language} outputLanguage={outputLanguage} onLanguageChange={setLanguage} onOutputLanguageChange={setOutputLanguage} user={user} onSignOut={async()=>{await signOutSession(supabase);setScreen('public')}} section={section} navigate={navigate} copy={copy} message={message}>{content}</ProtectedWorkspaceShell>
}
