'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { cancelDeletionRecord, createAssessmentRecord, createCaseRecord, createClientRecord, ensureRegistrationPrivacy, getWorkspaceAccess, listDeletionRequests, loadWorkspaceBundle, recordAuditEvent, requestDeletionRecord, updateCaseRecord } from '../services/workspaceRepository'
import { getUpgradeQuotes, requestUpgradeRecord } from '../services/pricingRepository'
import { acknowledgeLegalSettings, authorizeDocumentAnalysis } from '../services/complianceRepository'
import { createWorkspaceDocumentSignedUrl, recordExportEntry, updateDocumentRecord, uploadWorkspaceDocument } from '../services/documentRepository'
import { approveApprovalRecord, createApprovalRecord, rejectApprovalRecord, updateApprovalRecord } from '../services/approvalRepository'
import { getAuthSession, registerTestAccount, sendPasswordReset, signInSession, signOutSession, watchAuthState } from '../services/authRepository'
import { createAccountDataArtifact, createWorkspaceExportArtifact, downloadExportArtifact } from '../services/exportService'
import { invokeDocumentAnalysis } from '../services/documentAnalysis'
import { allowedUploadAccept, allowedUploadExtensions, maxUploadBytes, uploadUi } from '../documents/uploadConfig'
import { appText } from './workspaceText'
import { exportUi } from '../documents/exportUi'
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
import { emptyData, emptyCase, sectionNames } from './stateConfig'
import { launchTrustText, serverControlText, accessPendingMessages } from '../compliance/workspaceControlText'
import { notices, dashboardGuide, transparencyText, caseDiscoveryText, publicAudienceText, testerLinkText } from '../public/catalog'
import { terms, plans, planJourney, planText, journeyLabels, recommendationText, periodText, goalTier, tierRank } from '../pricing/catalog'
import { CaseDetail, DocumentDetail, getV24Copy } from './components/V24Workspace'
import { ApprovalDetail, getV25ApprovalCopy } from './components/V25ApprovalWorkflow'
import { getV26AnalysisCopy } from './components/V26DocumentAnalysis'
import { LegalAcceptance, PRIVACY_NOTICE_VERSION, TERMS_VERSION, getV28PrivacyCopy } from './components/V28PrivacyControls'
import { getV29PasswordCopy, validateV29Password } from './components/V29PasswordPolicy'
import { localeForLanguage, pageTranslations, rtlLanguages, supportedLanguages } from './lib/v30Languages.mjs'
import { promoTranslations } from './lib/v31PromoTranslations.mjs'
import { orderCasesByResearch } from '../public/casePriorityV56.mjs'


const languages = supportedLanguages

























const eur = v => `${Number(v || 0).toFixed(2).replace('.', ',')} €`
const statusText = s => s === 'open' ? 'Offen' : s === 'closed' ? 'Geschlossen' : s || '—'



const pageCatalogs = {
  passwordUi,uploadUi,ui,exportUi,appText,planJourney,planText,notices,
  journeyLabels,dashboardGuide,recommendationText,transparencyText,
  caseDiscoveryText,publicAudienceText,testerLinkText,periodText,
  launchTrustText,serverControlText
}

for (const [catalogName, translations] of Object.entries(pageTranslations)) {
  Object.assign(pageCatalogs[catalogName], translations)
}

const lightText = s => s === 'yellow' ? '🟡 Gelb' : s === 'green' ? '🟢 Grün' : s === 'red' ? '🔴 Rot' : s || '—'


export default function Home(){
  const [screen,setScreen] = useState('loading')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [password2,setPassword2] = useState('')
  const [showPassword,setShowPassword] = useState(false)
  const [showPassword2,setShowPassword2] = useState(false)
  const [displayName,setDisplayName] = useState('')
  const [acceptedLegal,setAcceptedLegal] = useState(false)
  const [confirmedTestData,setConfirmedTestData] = useState(false)
  const [message,setMessage] = useState('')
  const [user,setUser] = useState(null)
  const [privacySettings,setPrivacySettings] = useState(null)
  const [privacyBusy,setPrivacyBusy] = useState(false)
  const [data,setData] = useState(emptyData)
  const [section,setSection] = useState('dashboard')
  const [selectedCase,setSelectedCase] = useState(null)
  const [selectedClient,setSelectedClient] = useState(null)
  const [selectedDocument,setSelectedDocument] = useState(null)
  const [selectedApproval,setSelectedApproval] = useState(null)
  const [approvalDefaults,setApprovalDefaults] = useState({caseId:'',documentId:''})
  const [access,setAccess] = useState(null)
  const [upgrades,setUpgrades] = useState([])
  const [termMonths,setTermMonths] = useState(1)
  const [quotes,setQuotes] = useState({})
  const [quoteLoading,setQuoteLoading] = useState(false)
  const [promoCode,setPromoCode] = useState('')
  const [appliedPromoCode,setAppliedPromoCode] = useState('')
  const [promoRevision,setPromoRevision] = useState(0)
  const [newClient,setNewClient] = useState({name:'',email:'',phone:'',notes:''})
  const [showClientForm,setShowClientForm] = useState(false)
  const [newCase,setNewCase] = useState(emptyCase)
  const [showCaseForm,setShowCaseForm] = useState(false)
  const [documentMode,setDocumentMode] = useState('upload')
  const [uploadCaseId,setUploadCaseId] = useState('')
  const [uploading,setUploading] = useState(false)
  const [exportType,setExportType] = useState('pdf')
  const [language,setLanguage] = useState('de')
  const [outputLanguage,setOutputLanguage] = useState('de')
  const [selectedGoal,setSelectedGoal] = useState('overview')
  const [showRecommendation,setShowRecommendation] = useState(false)
  const [selectedPublicCase,setSelectedPublicCase] = useState('work')
  const [activityLog,setActivityLog] = useState([])
  const [serverAudit,setServerAudit] = useState([])
  const [deletionRequests,setDeletionRequests] = useState([])
  const [deletionBusy,setDeletionBusy] = useState(false)
  const t = ui[language] || ui.de
  const a = appText[language] || appText.de
  const n = notices[language] || notices.de
  const pui = passwordUi[language] || passwordUi.de
  const uui = uploadUi[language] || uploadUi.de
  const v28 = getV28PrivacyCopy(language)
  const v29Password = getV29PasswordCopy(language)
  const passwordPolicy = validateV29Password(password,{email,displayName})
  const passwordMatches = password.length>0&&password===password2
  const registerReady = acceptedLegal&&confirmedTestData&&passwordPolicy.valid&&passwordMatches
  const localizedPlans = plans.map((p,index)=>{ const v=(planText[language]||{})[p.key]; const j=(planJourney[language]||planJourney.de)[p.key] || {}; const base=v?{...p,audience:v[0],checks:v[1],result:v[2],excluded:v[3]}:p; return {...base,...j,level:index+1} })
  const period = periodText[language] || periodText.de
  const jl = journeyLabels[language] || journeyLabels.de
  const eui = exportUi[language] || exportUi.de
  const statusLabel = s => s === 'open' ? eui.open : s === 'closed' ? eui.closed : s || '—'
  const lightLabel = s => s === 'yellow' ? `🟡 ${eui.yellow}` : s === 'green' ? `🟢 ${eui.green}` : s === 'red' ? `🔴 ${eui.red}` : s || '—'
  const monthsLabel = value => a.months.replace('{n}',value).replace('{plural}', value>1 ? (language==='de'?'e':language==='en'?'s':'') : '')

  useEffect(()=>{
    const queryLanguage = new URLSearchParams(window.location.search).get('lang')
    const savedLanguage = localStorage.getItem('asgold-language')
    const savedOutput = localStorage.getItem('asgold-output-language')
    if(queryLanguage && languages.some(l=>l.key===queryLanguage)) setLanguage(queryLanguage)
    else if(savedLanguage && languages.some(l=>l.key===savedLanguage)) setLanguage(savedLanguage)
    if(savedOutput && languages.some(l=>l.key===savedOutput)) setOutputLanguage(savedOutput)
  },[])

  useEffect(()=>{
    document.documentElement.lang = language
    document.documentElement.dir = rtlLanguages.has(language) ? 'rtl' : 'ltr'
    localStorage.setItem('asgold-language',language)
    return ()=>{ document.documentElement.dir = 'ltr' }
  },[language])

  useEffect(()=>{
    localStorage.setItem('asgold-output-language',outputLanguage)
    document.documentElement.dataset.outputLanguage=outputLanguage
    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))
  },[outputLanguage])

  const currentTier = access?.permissions?.tier || 'free'
  const currentPlan = useMemo(() => plans.find(p=>p.key===currentTier) || plans[0],[currentTier])
  const dg = (dashboardGuide[language] || dashboardGuide.de)[currentTier] || dashboardGuide.de.free
  const rt = recommendationText[language] || recommendationText.de
  const tt = transparencyText[language] || transparencyText.de
  const cd = caseDiscoveryText[language] || caseDiscoveryText.de
  const orderedPublicCases = orderCasesByResearch(cd.cases)
  const pa = publicAudienceText[language] || publicAudienceText.de
  const activePublicCase = orderedPublicCases.find(item=>item.key===selectedPublicCase) || orderedPublicCases[0]
  const lt = launchTrustText[language] || launchTrustText.de
  const sct = serverControlText[language] || serverControlText.de
  const promo = promoTranslations[language] || promoTranslations.de
  const core = getV24Copy(language)
  const approvalUi = getV25ApprovalCopy(language)
  const analysisUi = getV26AnalysisCopy(language)
  const privacyCurrent = privacySettings?.privacy_notice_version===PRIVACY_NOTICE_VERSION && privacySettings?.terms_version===TERMS_VERSION && !!privacySettings?.privacy_notice_acknowledged_at && !!privacySettings?.terms_acknowledged_at
  const recommendedTier = goalTier[selectedGoal] || 'free'
  const recommendedPlan = localizedPlans.find(p=>p.key===recommendedTier) || localizedPlans[0]
  const currentSufficient = (tierRank[currentTier]||1) >= (tierRank[recommendedTier]||1)
  const deadlineCases = useMemo(()=>data.cases.filter(item=>item.deadline_at).sort((left,right)=>new Date(left.deadline_at)-new Date(right.deadline_at)),[data.cases])
  const promoQuotes = Object.values(quotes).filter(Boolean)
  const promoAnyValid = !!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='valid')
  const promoAllInvalid = !!appliedPromoCode&&promoQuotes.length===upgrades.length&&promoQuotes.every(quote=>quote.promo_code_state==='invalid')
  const promoSomeInvalid = !!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='invalid')

  useEffect(()=>{
    if(!user?.id) return
    try{
      const storageKey=`asgold-activity-${user.id}`
      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]
      localStorage.setItem(storageKey,JSON.stringify(sanitized))
      setActivityLog(sanitized)
    }catch{ setActivityLog([]) }
  },[user?.id])

  function recordLocalAction(kind){
    if(!user?.id) return
    const entry={at:new Date().toISOString(),kind,detail:'✓'}
    setActivityLog(prev=>{
      const next=[entry,...prev].slice(0,50)
      localStorage.setItem(`asgold-activity-${user.id}`,JSON.stringify(next))
      return next
    })
  }

  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){
    if(!user?.id) return false
    const {rows,error}=await recordAuditEvent(supabase,{ownerId:user.id,eventType,metadata,entityType,entityId})
    if(error){ console.error('record_gold_audit_event',error); return false }
    setServerAudit(rows||[])
    return true
  }

  async function requestAccountDeletion(){
    if(!user?.id || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await requestDeletionRecord(supabase,user.id)
    if(error){ setDeletionBusy(false); return setMessage(error.code==='23505'?sct.deletionPending:error.message) }
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionRequested)
  }

  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(r=>r.scope==='account'&&r.status==='requested')
    if(!pending || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await cancelDeletionRecord(supabase,{ownerId:user.id,requestId:pending.id})
    if(error){setDeletionBusy(false);return setMessage(error.message)}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await listDeletionRequests(supabase,user.id)
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionCancelled)
  }

  async function loadApp(session){
    setMessage('')
    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){ setMessage(accessSnapshot.error.message); setScreen('login'); return }
    const row=accessSnapshot.access
    if(!row?.active || row?.status !== 'approved') { setMessage(accessPendingMessages[language]||accessPendingMessages.de); setScreen('login'); return }
    setAccess(row)
    setUpgrades(accessSnapshot.upgrades||[])
    const ownerId=session.user.id
    const bundle=await loadWorkspaceBundle(supabase,ownerId)
    if(bundle.error)setMessage(bundle.error.message)
    let nextPrivacy=bundle.privacy
    if(!nextPrivacy){
      const createdPrivacy=await ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta:session.user?.user_metadata||{},privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
      if(!createdPrivacy.error&&createdPrivacy.data)nextPrivacy=createdPrivacy.data
    }
    setData(bundle.data)
    setServerAudit(bundle.audit)
    setDeletionRequests(bundle.deletionRequests)
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
  }

  async function refresh(){ const {data:{session}} = await getAuthSession(supabase); if(session) await loadApp(session) }

  useEffect(()=>{
    let alive = true
    getAuthSession(supabase).then(({data:{session}})=>{ if(alive) session ? loadApp(session) : setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public') })
    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='SIGNED_IN' && session) loadApp(session)
      if(event==='SIGNED_OUT'){ setUser(null); setAccess(null); setPrivacySettings(null); setData(emptyData); setSelectedCase(null); setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null); setApprovalDefaults({caseId:'',documentId:''}); setServerAudit([]); setDeletionRequests([]); setActivityLog([]); setSection('dashboard'); setScreen('public') }
    })
    return ()=>{ alive=false; subscription.unsubscribe() }
  },[])

  useEffect(()=>{
    if(screen!=='app' || !upgrades.length) return
    let cancelled=false
    ;(async()=>{
      setQuoteLoading(true)
      const nextQuotes=await getUpgradeQuotes(supabase,{upgrades,termMonths,promoCode:appliedPromoCode})
      if(!cancelled){ setQuotes(nextQuotes); setQuoteLoading(false) }
    })()
    return ()=>{cancelled=true}
  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])

  async function acknowledgeCurrentLegal(){
    if(!user?.id||privacyBusy) return false
    setPrivacyBusy(true);setMessage('')
    const {data:stored,error}=await acknowledgeLegalSettings(supabase,{ownerId:user.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(error){setPrivacyBusy(false);setMessage(error.message);return false}
    setPrivacySettings(stored)
    await recordServerAudit('legal_notices_acknowledged',{},'account',null)
    setPrivacyBusy(false);setMessage(v28.saved)
    return true
  }

  async function signIn(e){
    e.preventDefault(); setMessage('')
    const {data,error}=await signInSession(supabase,{email:email.trim(),password})
    if(error) return setMessage(error.message)
    await loadApp(data.session)
  }

  async function resetPassword(){
    setMessage('')
    if(!email.trim()) return setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')
    const {error}=await sendPasswordReset(supabase,{email:email.trim(),redirectTo:window.location.origin})
    if(error) return setMessage(error.message)
    setMessage(lt.passwordSent)
  }

  async function register(e){
    e.preventDefault(); setMessage('')
    if(!acceptedLegal||!confirmedTestData) return setMessage(v28.required)
    if(!validateV29Password(password,{email,displayName}).valid) return setMessage(v29Password.invalid)
    if(password!==password2) return setMessage(n.pwMismatch)
    const {data,error}=await registerTestAccount(supabase,{email:email.trim(),password,displayName:displayName.trim(),privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,emailRedirectTo:'https://app-gold-workspace.vercel.app'})
    if(error) return setMessage(error.message)
    if(data.session) await loadApp(data.session)
    else { setAcceptedLegal(false);setConfirmedTestData(false);setMessage(n.registered); setScreen('login') }
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
    const {data,error}=await requestUpgradeRecord(supabase,{planKey:plan.plan_key,termMonths,promoCode:appliedPromoCode})
    if(error) return setMessage(appliedPromoCode?promo.invalid:error.message)
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:data?.promo_code_state==='valid'},'account',null)
    setMessage(`${n.upgradeReserved} ${n.selected}: ${data?.to_plan_name || plan.plan_name}, ${termMonths} ${termMonths===1?n.monthOne:n.monthMany}.`)
  }

  async function createClient(e){
    e.preventDefault(); setMessage('')
    const {data:created,error}=await createClientRecord(supabase,{ownerId:user.id,draft:newClient})
    if(error) return setMessage(error.message)
    recordLocalAction('client_created'); await recordServerAudit('client_created',{},'client',created.id); setData(previous=>({...previous,clients:[created,...previous.clients]})); setNewClient({name:'',email:'',phone:'',notes:''}); setShowClientForm(false); setSection('clients')
  }
  function cleanCasePayload(draft){
    return {
      client_id:draft.client_id||null,
      title:draft.title.trim(),
      reference_no:draft.reference_no.trim()||null,
      goal:draft.goal.trim()||null,
      summary:draft.summary.trim()||null,
      deadline_at:draft.deadline_at?new Date(draft.deadline_at).toISOString():null,
      next_action:draft.next_action.trim()||null,
      status:draft.status||'open'
    }
  }

  async function createCase(e){
    e.preventDefault(); setMessage('')
    const {data:created,error}=await createCaseRecord(supabase,{ownerId:user.id,payload:cleanCasePayload(newCase)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_created'); await recordServerAudit('case_created',{},'case',created.id)
    setData(previous=>({...previous,cases:[created,...previous.cases]})); setNewCase(emptyCase); setShowCaseForm(false); setSelectedCase(created)
    return true
  }

  async function updateCase(caseId,draft){
    setMessage('')
    const {data:updated,error}=await updateCaseRecord(supabase,{ownerId:user.id,caseId,payload:cleanCasePayload(draft)})
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_updated'); await recordServerAudit('case_updated',{},'case',updated.id)
    setData(previous=>({...previous,cases:previous.cases.map(item=>item.id===updated.id?updated:item)})); setSelectedCase(updated)
    return true
  }

  async function createAssessment(caseId,draft){
    setMessage('')
    const currentTrafficLight=data.cases.find(item=>item.id===caseId)?.traffic_light||'green'
    const {assessment:created,updatedCase,error}=await createAssessmentRecord(supabase,{ownerId:user.id,caseId,draft,currentTrafficLight})
    if(error){setMessage(error.message);return false}
    recordLocalAction('assessment_created'); await recordServerAudit('assessment_created',{},'case',caseId)
    setData(previous=>({...previous,assessments:[created,...previous.assessments],cases:previous.cases.map(item=>item.id===caseId?updatedCase:item)})); setSelectedCase(updatedCase)
    return true
  }

  async function functionErrorMessage(error,fallback){
    if(!error) return fallback
    try{
      if(typeof error.context?.json==='function'){
        const payload=await error.context.json()
        return payload?.error||payload?.message||payload?.detail||error.message||fallback
      }
    }catch{}
    return error.message||fallback
  }
  async function analyzeDocument(document){
    if(!document?.file_path) return false
    setMessage('')
    if(!privacyCurrent){setMessage(v28.required);return false}
    if(!['synthetic','anonymized'].includes(document.data_classification)){setMessage(v28.uploadRequired);return false}
    const authorization=await authorizeDocumentAnalysis(supabase,{ownerId:user.id,documentId:document.id,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(authorization.error){setMessage(authorization.error.message);return false}
    setPrivacySettings(authorization.privacy)
    await recordServerAudit('document_ai_transfer_authorized',{classification:document.data_classification},'document',document.id)
    const {data:result,error}=await invokeDocumentAnalysis({supabase,documentId:document.id,filePath:document.file_path,outputLanguage,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION})
    if(error){setMessage(await functionErrorMessage(error,analysisUi.failed));return false}
    if(result?.status==='configuration_required'){setMessage(result.message||analysisUi.failed);return false}
    const suggestedCase=data.cases.some(item=>item.id===result?.suggested_case_id)?result.suggested_case_id:null
    const generated={
      fields:{
        extracted_text:result?.extracted_text||'',
        document_type:result?.document_type||document.document_type||'',
        document_date:/^\d{4}-\d{2}-\d{2}$/.test(result?.document_date||'')?result.document_date:(document.document_date||''),
        case_id:suggestedCase||document.case_id||'',
        analysis_summary:result?.summary||'',
        analysis_next_step:result?.next_step||''
      },
      facts:{
        sender_or_author:result?.sender_or_author||null,
        recipient:result?.recipient||null,
        reference_numbers:Array.isArray(result?.reference_numbers)?result.reference_numbers:[],
        deadlines:Array.isArray(result?.deadlines)?result.deadlines:[],
        monetary_amounts:Array.isArray(result?.monetary_amounts)?result.monetary_amounts:[],
        confidence:result?.confidence||null
      }
    }
    recordLocalAction('document_analysis_generated')
    const auditSaved=await recordServerAudit('document_analysis_generated',{status:'provisional'},'document',document.id)
    setMessage(auditSaved?analysisUi.ready:`${analysisUi.ready} · ${sct.auditFailed}`)
    return generated
  }
  async function updateDocument(documentId,draft){
    setMessage('')
    const {data:updated,error}=await updateDocumentRecord(supabase,{ownerId:user.id,documentId,draft})
    if(error){setMessage(error.message);return false}
    const eventType=draft.analysis_generated?'document_analysis_saved':'document_reviewed'
    recordLocalAction(eventType)
    const auditSaved=await recordServerAudit(eventType,{status:'saved'},'document',updated.id)
    setData(previous=>({...previous,documents:previous.documents.map(item=>item.id===updated.id?updated:item)})); setSelectedDocument(updated)
    setMessage(auditSaved?(draft.analysis_generated?analysisUi.savedMessage:`${core.documentReview} ✓`):sct.auditFailed)
    return true
  }

  async function createApproval(draft){
    setMessage('')
    if(!draft.case_id){setMessage(approvalUi.caseRequired);return false}
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(draft.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const linkedDocument=draft.document_id?data.documents.find(item=>item.id===draft.document_id):null
    if(linkedDocument?.case_id!==draft.case_id&&draft.document_id){setMessage(approvalUi.documentMismatch);return false}
    const {data:created,error}=await createApprovalRecord(supabase,{ownerId:user.id,draft,linkedDocument})
    if(error){setMessage(error.message);return false}
    recordLocalAction('approval_created')
    await recordServerAudit('approval_created',{revision:Number(created.preview_revision)},'approval',created.id)
    setData(previous=>({...previous,approvals:[created,...previous.approvals]}))
    setApprovalDefaults({caseId:'',documentId:''})
    setSelectedApproval(created)
    setMessage(approvalUi.created)
    return created
  }

  async function updateApproval(approvalId,draft){
    setMessage('')
    const current=data.approvals.find(item=>item.id===approvalId)
    if(!current) return false
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(current.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const {data:updated,error,invalidated}=await updateApprovalRecord(supabase,{ownerId:user.id,approvalId,current,draft})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction(invalidated?'approval_invalidated':'approval_updated')
    await recordServerAudit(invalidated?'approval_invalidated':'approval_updated',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(item=>item.id===updated.id?updated:item)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.saved)
    return updated
  }

  async function approveApproval(item){
    setMessage('')
    const {data:updated,error}=await approveApprovalRecord(supabase,{ownerId:user.id,item})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_approved')
    await recordServerAudit('approval_approved',{revision:Number(updated.approved_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.approvedMessage)
    return updated
  }

  async function rejectApproval(item){
    setMessage('')
    const {data:updated,error}=await rejectApprovalRecord(supabase,{ownerId:user.id,item})
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_rejected')
    await recordServerAudit('approval_rejected',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.rejectedMessage)
    return updated
  }
  function prepareDocumentApproval(document){
    setSelectedDocument(null);setSelectedCase(null);setSelectedApproval(null)
    setApprovalDefaults({caseId:document.case_id||'',documentId:document.id})
    setSection('approvals')
  }

  async function uploadDocument(e){
    e.preventDefault(); setMessage('')
    const form=e.currentTarget
    const file=form.elements.file.files[0], caseId=form.elements.case_id.value||null
    if(!file) return setMessage(n.chooseFile)
    const dataClassification=form.elements.data_classification?.value
    const testDataConfirmed=!!form.elements.test_data_confirmed?.checked
    if(!['synthetic','anonymized'].includes(dataClassification)||!testDataConfirmed) return setMessage(v28.uploadRequired)
    if(!privacyCurrent) return setMessage(v28.required)
    const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
    if(!allowedUploadExtensions.has(extension)) return setMessage(uui.unsupported)
    if(file.size>maxUploadBytes) return setMessage(uui.tooLarge)
    const limit=Number(access?.permissions?.document_limit||0)
    if(access?.app_role!=='owner' && limit>0 && data.documents.length>=limit) return setMessage(n.docLimit.replace('{limit}',limit))
    setUploading(true)
    const {data:created,error}=await uploadWorkspaceDocument(supabase,{ownerId:user.id,file,caseId,dataClassification,privacyNoticeVersion:PRIVACY_NOTICE_VERSION,documentType:form.elements.document_type?.value.trim()||extension.toUpperCase(),documentDate:form.elements.document_date?.value||null,source:form.elements.source?.value||'upload'})
    if(error){setUploading(false);return setMessage(error.message)}
    recordLocalAction('document_uploaded'); await recordServerAudit('document_uploaded',{classification:dataClassification},'document',created.id); setData(previous=>({...previous,documents:[created,...previous.documents]})); setUploading(false); form.reset(); setSection('documents'); setSelectedDocument(created)
  }

  async function openDocument(doc){
    if(!doc.file_path) return
    const {data:signed,error}=await createWorkspaceDocumentSignedUrl(supabase,doc.file_path,300)
    if(error) return setMessage(error.message)
    recordLocalAction('document_opened'); await recordServerAudit('document_opened',{},'document',doc.id); window.open(signed.signedUrl,'_blank','noopener')
  }

  function canExport(type){
    if(access?.app_role==='owner') return true
    const p=access?.permissions||{}
    return type==='docx'?!!p.export_word:type==='pdf'?!!p.export_pdf:type==='xlsx'?!!p.export_excel:type==='pptx'?!!p.export_pptx:type==='csv'?!!p.export_csv:type==='txt'?!!p.export_txt:false
  }
  async function doExport(ref,type){
    if(!canExport(type)) return setMessage(n.exportLocked)
    const ex=exportUi[outputLanguage]||exportUi.de
    const outputCore=getV24Copy(outputLanguage)
    const outputApprovalUi=getV25ApprovalCopy(outputLanguage)
    try{
      const artifact=await createWorkspaceExportArtifact({ref,type,data,copy:{ex,core:outputCore,approvalUi:outputApprovalUi}})
      downloadExportArtifact(artifact)
      const {error:exportLogError}=await recordExportEntry(supabase,{ref,type})
      if(exportLogError) throw exportLogError
      recordLocalAction('export_created')
      const auditSaved=await recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)
      setMessage(a.export+': '+type.toUpperCase()+' ✓'+(auditSaved?'':' · '+sct.auditFailed))
    } catch(err){ setMessage(a.export+': '+err.message) }
  }

  async function exportMyData(){
    const packageData={
      product:'AS Gold',
      exported_at:new Date().toISOString(),
      account:{email:user?.email||null,user_id:user?.id||null},
      access:{tier:currentTier,plan:currentPlan.name,status:access?.status||null,active:!!access?.active,payment:'disabled'},
      privacy_settings:privacySettings,
      retention_note:a.pauseInfo,
      data:{cases:data.cases,clients:data.clients,documents:data.documents,assessments:data.assessments,source_status:data.sourceStatus,approvals:data.approvals}
    }
    downloadExportArtifact(createAccountDataArtifact(packageData))
    recordLocalAction('account_data_export')
    await recordServerAudit('account_data_export',{format:'JSON'},'account',null)
    setMessage(lt.dataExport+' ✓')
  }

  function handleQuickAction(action,item=null){
    setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null)
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
  if(screen==='app'&&selectedDocument) return protectedWorkspace(<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} item={selectedDocument} cases={data.cases} onBack={()=>setSelectedDocument(null)} onSave={updateDocument} onAnalyze={analyzeDocument} onOpen={openDocument} onPrepareApproval={prepareDocumentApproval} approvalLabel={approvalUi.prepareFromDocument}/>)
  if(screen==='app'&&selectedCase){
    const caseDocs=data.documents.filter(document=>document.case_id===selectedCase.id)
    const caseAssessments=data.assessments.filter(assessment=>assessment.case_id===selectedCase.id)
    return protectedWorkspace(<><CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} item={selectedCase} clients={data.clients} documents={caseDocs} assessments={caseAssessments} onBack={()=>setSelectedCase(null)} onSave={updateCase} onAddAssessment={createAssessment} onAddDocument={caseId=>{setUploadCaseId(caseId);setDocumentMode('upload');setSelectedCase(null);setSection('documents')}} onOpenDocument={setSelectedDocument}/><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={e=>setExportType(e.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div></>)
  }
  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<CasesSurface a={a} core={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showCaseForm={showCaseForm} setShowCaseForm={setShowCaseForm} createCase={createCase} setSelectedCase={setSelectedCase} onBack={()=>setSection('dashboard')}/>)
  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<DocumentsSurface a={a} access={access} documents={data.documents} core={core} v28={v28} cases={data.cases} documentMode={documentMode} setDocumentMode={setDocumentMode} uploadCaseId={uploadCaseId} uploadDocument={uploadDocument} uploading={uploading} allowedUploadAccept={allowedUploadAccept} setSelectedDocument={setSelectedDocument} onBack={()=>setSection('dashboard')}/>)
  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<ApprovalsSurface a={a} approvalUi={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} approvalDefaults={approvalDefaults} createApproval={createApproval} setSelectedApproval={setSelectedApproval} onBack={()=>{setApprovalDefaults({caseId:'',documentId:''});setSection('dashboard')}}/>)

  if(screen==='app'){
    const caseDocs=selectedCase?data.documents.filter(d=>d.case_id===selectedCase.id):[]
    return protectedWorkspace(<>
      {selectedCase?<><button className="backBtn" onClick={()=>setSelectedCase(null)}>{a.backCases}</button><h2>{selectedCase.title}</h2><div className="detailCard"><p><b>{eui.status}:</b> {statusLabel(selectedCase.status)}</p><p><b>{eui.traffic}:</b> {lightLabel(selectedCase.traffic_light)}</p><p><b>{a.summary}:</b> {selectedCase.summary||a.noSummary}</p></div><section className="whyResult"><div className="whyHeader"><span className="modeBadge">{lt.control}</span><h3>{lt.why}</h3></div><div className="whyGrid"><div><b>{lt.basis}</b><p>{lt.basisDocs.replace('{n}',caseDocs.length)}</p></div><div><b>{lt.finding}</b><p>{selectedCase.summary||a.noSummary}</p></div><div className={caseDocs.length?'':'attentionBox'}><b>{lt.missing}</b><p>{caseDocs.length?lt.missingOpen:lt.missingDocs}</p></div><div><b>{lt.assessment}</b><p>{caseDocs.length?`${lightLabel(selectedCase.traffic_light)} · ${lt.assessmentNote}`:`${lt.notFinal}: ${lt.notFinalNote}`}</p></div><div><b>{lt.next}</b><p>{caseDocs.length?lt.nextReview:lt.nextDocs}</p></div></div></section><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={e=>setExportType(e.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div><h3>{a.relatedDocs}</h3>{caseDocs.length?caseDocs.map(d=><button className="itemRow buttonRow" onClick={()=>openDocument(d)} key={d.id}><span>{d.title}</span><span>›</span></button>):<div className="emptyState">{a.noAssignedDocs}</div>}</>
      :selectedClient?<ClientDetailSurface a={a} selectedClient={selectedClient} onBack={()=>setSelectedClient(null)}/>
      :section==='dashboard'?<DashboardSurface core={core} handleQuickAction={handleQuickAction} deadlineCases={deadlineCases} a={a} user={user} currentTier={currentTier} dg={dg} setSection={setSection} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} currentSufficient={currentSufficient} recommendedTier={recommendedTier} currentPlan={currentPlan} access={access} lt={lt} exportMyData={exportMyData} activityLog={activityLog} localeForLanguage={localeForLanguage} language={language} sct={sct} serverAudit={serverAudit} deletionRequests={deletionRequests} deletionBusy={deletionBusy} cancelAccountDeletion={cancelAccountDeletion} requestAccountDeletion={requestAccountDeletion} data={data} upgrades={upgrades} promo={promo} promoCode={promoCode} setPromoCode={setPromoCode} appliedPromoCode={appliedPromoCode} applyPromo={applyPromo} clearPromo={clearPromo} quoteLoading={quoteLoading} quotes={quotes} promoAnyValid={promoAnyValid} promoAllInvalid={promoAllInvalid} promoSomeInvalid={promoSomeInvalid} eur={eur} terms={terms} termMonths={termMonths} setTermMonths={setTermMonths} monthsLabel={monthsLabel} period={period} requestUpgrade={requestUpgrade}/>
      :<ClientsSurface a={a} showClientForm={showClientForm} setShowClientForm={setShowClientForm} createClient={createClient} newClient={newClient} setNewClient={setNewClient} clients={data.clients} setSelectedClient={setSelectedClient} onBack={()=>setSection('dashboard')}/>}</>)
  }

  return <PublicLanding t={t} a={a} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={cd} testerLinkText={testerLinkText} pa={pa} activePublicCase={activePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={tt} jl={jl} localizedPlans={localizedPlans} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} recommendedTier={recommendedTier} eur={eur} period={period} terms={terms} monthsLabel={monthsLabel}/>
}
