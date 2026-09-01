'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
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
import { emptyData, emptyCase, sectionNames } from './stateConfig'
import { launchTrustText, serverControlText, accessPendingMessages } from '../compliance/workspaceControlText'
import { notices, dashboardGuide, transparencyText, caseDiscoveryText, publicAudienceText, testerLinkText } from '../public/catalog'
import { terms, plans, planJourney, planText, journeyLabels, recommendationText, periodText, goalTier, tierRank } from '../pricing/catalog'
import { CaseDetail, CaseSection, DocumentDetail, DocumentSection, QuickActions, getV24Copy } from './components/V24Workspace'
import { ApprovalDetail, ApprovalSection, getV25ApprovalCopy } from './components/V25ApprovalWorkflow'
import { getV26AnalysisCopy } from './components/V26DocumentAnalysis'
import { LegalAcceptance, PRIVACY_NOTICE_VERSION, TERMS_VERSION, getV28PrivacyCopy } from './components/V28PrivacyControls'
import { getV29PasswordCopy, validateV29Password } from './components/V29PasswordPolicy'
import { PromoCodeControl } from './components/PromoCodeControl'
import { localeForLanguage, pageTranslations, rtlLanguages, supportedLanguages } from './lib/v30Languages.mjs'
import { promoTranslations } from './lib/v31PromoTranslations.mjs'


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
  const [selectedPublicCase,setSelectedPublicCase] = useState('insurance')
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

  useEffect(()=>{ localStorage.setItem('asgold-output-language',outputLanguage) },[outputLanguage])

  const currentTier = access?.permissions?.tier || 'free'
  const currentPlan = useMemo(() => plans.find(p=>p.key===currentTier) || plans[0],[currentTier])
  const dg = (dashboardGuide[language] || dashboardGuide.de)[currentTier] || dashboardGuide.de.free
  const rt = recommendationText[language] || recommendationText.de
  const tt = transparencyText[language] || transparencyText.de
  const cd = caseDiscoveryText[language] || caseDiscoveryText.de
  const pa = publicAudienceText[language] || publicAudienceText.de
  const activePublicCase = cd.cases.find(item=>item.key===selectedPublicCase) || cd.cases[0]
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
    const {error}=await supabase.rpc('record_gold_audit_event',{p_event_type:eventType,p_entity_type:entityType,p_entity_id:entityId,p_metadata:metadata})
    if(error){ console.error('record_gold_audit_event',error); return false }
    const {data:rows}=await supabase.from('audit_events').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(20)
    setServerAudit(rows||[])
    return true
  }

  async function requestAccountDeletion(){
    if(!user?.id || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await supabase.from('deletion_requests').insert({owner_id:user.id,scope:'account',reason:'requested_in_app'})
    if(error){ setDeletionBusy(false); return setMessage(error.code==='23505'?sct.deletionPending:error.message) }
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await supabase.from('deletion_requests').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionRequested)
  }

  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(r=>r.scope==='account'&&r.status==='requested')
    if(!pending || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await supabase.from('deletion_requests').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',pending.id).eq('owner_id',user.id)
    if(error){setDeletionBusy(false);return setMessage(error.message)}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await supabase.from('deletion_requests').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionCancelled)
  }

  async function loadApp(session){
    setMessage('')
    const { data: accessRows, error: accessError } = await supabase.rpc('current_gold_access')
    if(accessError){ setMessage(accessError.message); setScreen('login'); return }
    const row = accessRows?.[0]
    if(!row?.active || row?.status !== 'approved') { setMessage(accessPendingMessages[language]||accessPendingMessages.de); setScreen('login'); return }
    setAccess(row)
    const { data: upgradeRows } = await supabase.rpc('gold_available_upgrades')
    setUpgrades(upgradeRows || [])
    const ownerId = session.user.id
    const [cases,clients,documents,approvals,assessments,sourceStatus,auditRows,deletionRows,privacyRow] = await Promise.all([
      supabase.from('cases').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('clients').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('documents').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('approvals').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('assessments').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
      supabase.from('source_status').select('*').eq('owner_id',ownerId).order('checked_at',{ascending:false}),
      supabase.from('audit_events').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(20),
      supabase.from('deletion_requests').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
      supabase.from('account_privacy_settings').select('*').eq('owner_id',ownerId).maybeSingle()
    ])
    const firstDataError=[cases,clients,documents,approvals,assessments,sourceStatus,auditRows,deletionRows,privacyRow].find(result=>result.error)?.error
    if(firstDataError) setMessage(firstDataError.message)
    let nextPrivacy=privacyRow.data||null
    const registrationMeta=session.user?.user_metadata||{}
    if(!nextPrivacy && registrationMeta.privacy_notice_version===PRIVACY_NOTICE_VERSION && registrationMeta.terms_version===TERMS_VERSION && registrationMeta.test_data_only===true){
      const acknowledgedAt=registrationMeta.legal_acknowledged_at||new Date().toISOString()
      const createdPrivacy=await supabase.from('account_privacy_settings').insert({owner_id:ownerId,privacy_notice_version:PRIVACY_NOTICE_VERSION,privacy_notice_acknowledged_at:acknowledgedAt,terms_version:TERMS_VERSION,terms_acknowledged_at:acknowledgedAt,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}).select().single()
      if(!createdPrivacy.error) nextPrivacy=createdPrivacy.data
    }
    setData({cases:cases.data||[],clients:clients.data||[],documents:documents.data||[],approvals:approvals.data||[],assessments:assessments.data||[],sourceStatus:sourceStatus.data||[]})
    setServerAudit(auditRows.data||[])
    setDeletionRequests(deletionRows.data||[])
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
  }

  async function refresh(){ const {data:{session}} = await supabase.auth.getSession(); if(session) await loadApp(session) }

  useEffect(()=>{
    let alive = true
    supabase.auth.getSession().then(({data:{session}})=>{ if(alive) session ? loadApp(session) : setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public') })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session)=>{
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
      const pairs = await Promise.all(upgrades.map(async u=>{
        const args={p_to_plan:u.plan_key,p_term_months:termMonths}
        if(appliedPromoCode) args.p_promo_code=appliedPromoCode
        const {data,error}=await supabase.rpc('gold_upgrade_quote',args)
        return [u.plan_key,error?null:data]
      }))
      if(!cancelled){ setQuotes(Object.fromEntries(pairs)); setQuoteLoading(false) }
    })()
    return ()=>{cancelled=true}
  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])

  async function acknowledgeCurrentLegal(){
    if(!user?.id||privacyBusy) return false
    setPrivacyBusy(true);setMessage('')
    const now=new Date().toISOString()
    const payload={owner_id:user.id,privacy_notice_version:PRIVACY_NOTICE_VERSION,privacy_notice_acknowledged_at:now,terms_version:TERMS_VERSION,terms_acknowledged_at:now,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}
    const {data:stored,error}=await supabase.from('account_privacy_settings').upsert(payload,{onConflict:'owner_id'}).select().single()
    if(error){setPrivacyBusy(false);setMessage(error.message);return false}
    setPrivacySettings(stored)
    await recordServerAudit('legal_notices_acknowledged',{},'account',null)
    setPrivacyBusy(false);setMessage(v28.saved)
    return true
  }

  async function signIn(e){
    e.preventDefault(); setMessage('')
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password})
    if(error) return setMessage(error.message)
    await loadApp(data.session)
  }
  async function resetPassword(){
    setMessage('')
    if(!email.trim()) return setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin})
    if(error) return setMessage(error.message)
    setMessage(lt.passwordSent)
  }
  async function register(e){
    e.preventDefault(); setMessage('')
    if(!acceptedLegal||!confirmedTestData) return setMessage(v28.required)
    if(!validateV29Password(password,{email,displayName}).valid) return setMessage(v29Password.invalid)
    if(password!==password2) return setMessage(n.pwMismatch)
    const legalAcknowledgedAt=new Date().toISOString()
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim(),privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION,legal_acknowledged_at:legalAcknowledgedAt,test_data_only:true},emailRedirectTo:'https://app-gold-workspace.vercel.app'}})
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
    const args={p_to_plan:plan.plan_key,p_term_months:termMonths}
    if(appliedPromoCode) args.p_promo_code=appliedPromoCode
    const {data,error}=await supabase.rpc('gold_request_upgrade',args)
    if(error) return setMessage(appliedPromoCode?promo.invalid:error.message)
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:data?.promo_code_state==='valid'},'account',null)
    setMessage(`${n.upgradeReserved} ${n.selected}: ${data?.to_plan_name || plan.plan_name}, ${termMonths} ${termMonths===1?n.monthOne:n.monthMany}.`)
  }
  async function createClient(e){
    e.preventDefault(); setMessage('')
    const payload={owner_id:user.id,name:newClient.name.trim(),email:newClient.email.trim()||null,phone:newClient.phone.trim()||null,notes:newClient.notes.trim()||null}
    const {data:created,error}=await supabase.from('clients').insert(payload).select().single()
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
    const payload={...cleanCasePayload(newCase),owner_id:user.id,traffic_light:'yellow'}
    const {data:created,error}=await supabase.from('cases').insert(payload).select().single()
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_created'); await recordServerAudit('case_created',{},'case',created.id)
    setData(previous=>({...previous,cases:[created,...previous.cases]})); setNewCase(emptyCase); setShowCaseForm(false); setSelectedCase(created)
    return true
  }
  async function updateCase(caseId,draft){
    setMessage('')
    const payload={...cleanCasePayload(draft),updated_at:new Date().toISOString()}
    const {data:updated,error}=await supabase.from('cases').update(payload).eq('id',caseId).eq('owner_id',user.id).select().single()
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_updated'); await recordServerAudit('case_updated',{},'case',updated.id)
    setData(previous=>({...previous,cases:previous.cases.map(item=>item.id===updated.id?updated:item)})); setSelectedCase(updated)
    return true
  }
  async function createAssessment(caseId,draft){
    setMessage('')
    const payload={owner_id:user.id,case_id:caseId,title:draft.title.trim(),traffic_light:draft.traffic_light,reasoning:draft.reasoning.trim()||null,next_step:draft.next_step.trim()||null}
    const {data:created,error}=await supabase.from('assessments').insert(payload).select().single()
    if(error){setMessage(error.message);return false}
    const ranking={green:1,yellow:2,red:3}
    const current=data.cases.find(item=>item.id===caseId)?.traffic_light||'green'
    const overall=ranking[created.traffic_light]>ranking[current]?created.traffic_light:current
    const {data:updatedCase,error:caseError}=await supabase.from('cases').update({traffic_light:overall,updated_at:new Date().toISOString()}).eq('id',caseId).eq('owner_id',user.id).select().single()
    if(caseError){setMessage(caseError.message);return false}
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
    const enabled=await supabase.from('account_privacy_settings').update({ai_processing_enabled:true,updated_at:new Date().toISOString()}).eq('owner_id',user.id).eq('privacy_notice_version',PRIVACY_NOTICE_VERSION).eq('terms_version',TERMS_VERSION).select().single()
    if(enabled.error){setMessage(enabled.error.message);return false}
    const allowed=await supabase.from('documents').update({ai_processing_allowed:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,ai_notice_version:PRIVACY_NOTICE_VERSION,updated_at:new Date().toISOString()}).eq('id',document.id).eq('owner_id',user.id).in('data_classification',['synthetic','anonymized']).select().single()
    if(allowed.error){setMessage(allowed.error.message);return false}
    setPrivacySettings(enabled.data)
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
    const payload={title:String(draft.title||'').trim(),case_id:draft.case_id||null,document_type:String(draft.document_type||'').trim()||null,document_date:draft.document_date||null,extracted_text:String(draft.extracted_text||'').trim()||null,analysis_summary:String(draft.analysis_summary||'').trim()||null,analysis_next_step:String(draft.analysis_next_step||'').trim()||null,updated_at:new Date().toISOString()}
    const {data:updated,error}=await supabase.from('documents').update(payload).eq('id',documentId).eq('owner_id',user.id).select().single()
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
    const payload={
      owner_id:user.id,
      case_id:draft.case_id,
      document_id:draft.document_id||null,
      approval_type:draft.approval_type,
      status:'pending',
      recipient:draft.recipient.trim()||null,
      subject:draft.subject.trim(),
      body:draft.body.trim(),
      attachment_names:linkedDocument?[linkedDocument.title]:[],
      preview_required:true
    }
    const {data:created,error}=await supabase.from('approvals').insert(payload).select().single()
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
    const next={recipient:draft.recipient.trim()||null,subject:draft.subject.trim(),body:draft.body.trim()}
    const contentChanged=(current.recipient||null)!==next.recipient||(current.subject||'')!==next.subject||(current.body||'')!==next.body
    const payload={...next}
    if(contentChanged&&current.status==='rejected') Object.assign(payload,{status:'pending',approved_at:null,approved_revision:null})
    const {data:updated,error}=await supabase.from('approvals').update(payload).eq('id',approvalId).eq('owner_id',user.id).eq('preview_revision',current.preview_revision).select().maybeSingle()
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    const invalidated=current.status==='approved'&&updated.status==='pending'
    recordLocalAction(invalidated?'approval_invalidated':'approval_updated')
    await recordServerAudit(invalidated?'approval_invalidated':'approval_updated',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(item=>item.id===updated.id?updated:item)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.saved)
    return updated
  }
  async function approveApproval(item){
    setMessage('')
    const approvedAt=new Date().toISOString()
    const {data:updated,error}=await supabase.from('approvals').update({status:'approved',approved_at:approvedAt,approved_revision:item.preview_revision,invalidated_at:null}).eq('id',item.id).eq('owner_id',user.id).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
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
    const {data:updated,error}=await supabase.from('approvals').update({status:'rejected',approved_at:null,approved_revision:null}).eq('id',item.id).eq('owner_id',user.id).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
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
    const path=`${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const upload=await supabase.storage.from('goldstandard-private').upload(path,file,{upsert:false})
    if(upload.error){setUploading(false);return setMessage(upload.error.message)}
    let extractedText=null
    if(['txt','csv'].includes(extension) && file.size<=2*1024*1024){
      try{extractedText=(await file.text()).trim()||null}catch{extractedText=null}
    }
    const documentType=form.elements.document_type?.value.trim()||extension.toUpperCase()
    const documentDate=form.elements.document_date?.value||null
    const source=form.elements.source?.value||'upload'
    const insert=await supabase.from('documents').insert({owner_id:user.id,title:file.name,file_path:path,case_id:caseId,document_type:documentType,document_date:documentDate,source,extracted_text:extractedText,data_classification:dataClassification,privacy_notice_version:PRIVACY_NOTICE_VERSION,ai_processing_allowed:false}).select().single()
    if(insert.error){await supabase.storage.from('goldstandard-private').remove([path]);setUploading(false);return setMessage(insert.error.message)}
    recordLocalAction('document_uploaded'); await recordServerAudit('document_uploaded',{classification:dataClassification},'document',insert.data.id); setData(previous=>({...previous,documents:[insert.data,...previous.documents]})); setUploading(false); form.reset(); setSection('documents'); setSelectedDocument(insert.data)
  }
  async function openDocument(doc){
    if(!doc.file_path) return
    const {data:signed,error}=await supabase.storage.from('goldstandard-private').createSignedUrl(doc.file_path,300)
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
    const localStatus=s=>s==='open'?ex.open:s==='closed'?ex.closed:s||'—'
    const localLight=s=>s==='yellow'?`🟡 ${ex.yellow}`:s==='green'?`🟢 ${ex.green}`:s==='red'?`🔴 ${ex.red}`:s||'—'
    const caseDocuments=ref.kind==='case'?data.documents.filter(item=>item.case_id===ref.item.id):[]
    const caseAssessments=ref.kind==='case'?data.assessments.filter(item=>item.case_id===ref.item.id):[]
    const caseSources=ref.kind==='case'?data.sourceStatus.filter(item=>item.case_id===ref.item.id):[]
    const caseApprovals=ref.kind==='case'?data.approvals.filter(item=>item.case_id===ref.item.id):[]
    const rows=ref.kind==='case'
      ? [[ex.caseTitle,''],[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[core.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[core.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[core.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[core.currentAssessments,caseAssessments.map(item=>`${localLight(item.traffic_light)} · ${item.title}: ${item.reasoning||''}${item.next_step?` · ${core.nextAction}: ${item.next_step}`:''}`).join('\n')||ex.none],[core.sourceBasis,caseSources.map(item=>`${item.source_label||item.source_kind}: ${item.status}${item.details?` · ${item.details}`:''}`).join('\n')||ex.none],[approvalUi.title,caseApprovals.map(item=>`${item.subject||item.approval_type} · ${approvalUi[item.status]||item.status} · ${approvalUi.revision} ${item.preview_revision}`).join('\n')||ex.none]]
      : [[ex.documentTitle,''],[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,ref.item.analysis_summary||ex.noAnalysis],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||'']]
    const base=(ref.item.title||(ref.kind==='case'?'Fall':'Dokument')).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_').slice(0,80)
    try{
      if(type==='docx'){
        const {Document,Packer,Paragraph,TextRun}=await import('docx')
        const children=rows.flatMap((r,i)=>i===0?[new Paragraph({children:[new TextRun({text:r[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:`${r[0]}: `,bold:true}),new TextRun(String(r[1]||''))]})])
        const blob=await Packer.toBlob(new Document({sections:[{children}]})); downloadBlob(blob,`${base}.docx`)
      } else if(type==='pdf'){
        const {jsPDF}=await import('jspdf'); const pdf=new jsPDF(); let y=18
        rows.forEach((r,i)=>{const line=i===0?r[0]:`${r[0]}: ${r[1]||''}`;const split=pdf.splitTextToSize(String(line),175);if(y+7*split.length>280){pdf.addPage();y=18}pdf.setFont(undefined,i===0?'bold':'normal');pdf.text(split,18,y);y+=7*split.length+4}); pdf.save(`${base}.pdf`)
      } else if(type==='xlsx'){
        const {createXlsxBlob}=await import('./lib/officeExports')
        downloadBlob(await createXlsxBlob(rows),`${base}.xlsx`)
      } else if(type==='pptx'){
        const {createPptxBlob}=await import('./lib/officeExports')
        downloadBlob(await createPptxBlob(rows),`${base}.pptx`)
      } else if(type==='csv'){
        const q=v=>`"${String(v??'').replace(/"/g,'""')}"`; downloadBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),`${base}.csv`)
      } else if(type==='txt') downloadBlob(new Blob([rows.map((r,i)=>i===0?r[0]:`${r[0]}: ${r[1]||''}`).join('\r\n\r\n')],{type:'text/plain;charset=utf-8'}),`${base}.txt`)
      const {error:exportLogError}=await supabase.from('exports').insert({case_id:ref.kind==='case'?ref.item.id:ref.item.case_id||null,document_id:ref.kind==='document'?ref.item.id:null,export_type:type,title:`${ref.item.title||'AS Gold Export'} (${type.toUpperCase()})`,status:'ready'})
      if(exportLogError) throw exportLogError
      recordLocalAction('export_created')
      const auditSaved=await recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)
      setMessage(auditSaved?`${a.export}: ${type.toUpperCase()} ✓`:`${a.export}: ${type.toUpperCase()} ✓ · ${sct.auditFailed}`)
    } catch(err){ setMessage(`${a.export}: ${err.message}`) }
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
    const blob=new Blob([JSON.stringify(packageData,null,2)],{type:'application/json;charset=utf-8'})
    downloadBlob(blob,`AS_Gold_Datenexport_${new Date().toISOString().slice(0,10)}.json`)
    recordLocalAction('account_data_export')
    await recordServerAudit('account_data_export',{format:'JSON'},'account',null)
    setMessage(`${lt.dataExport} ✓`)
  }
  function downloadBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}

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
    return <ProtectedWorkspaceShell language={language} outputLanguage={outputLanguage} onLanguageChange={setLanguage} onOutputLanguageChange={setOutputLanguage} legalLabel={t.legal} languageLabel={t.language} outputLanguageLabel={t.outputLanguage} logoutLabel={a.logout} onLogout={()=>supabase.auth.signOut()} message={message}>{content}</ProtectedWorkspaceShell>
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
  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections.cases}</h2></div><CaseSection copy={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showForm={showCaseForm} setShowForm={setShowCaseForm} onSubmit={createCase} onSelect={setSelectedCase}/></>)
  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections.documents}</h2></div>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',data.documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<DocumentSection copy={core} privacy={v28} cases={data.cases} documents={data.documents} mode={documentMode} setMode={setDocumentMode} defaultCaseId={uploadCaseId} onSubmit={uploadDocument} uploading={uploading} accept={allowedUploadAccept} onSelect={setSelectedDocument}/></>)
  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>{setApprovalDefaults({caseId:'',documentId:''});setSection('dashboard')}}>{a.backOverview}</button><h2>{approvalUi.title}</h2></div><ApprovalSection copy={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} defaults={approvalDefaults} onCreate={createApproval} onSelect={setSelectedApproval}/></>)

  if(screen==='app'){
    const caseDocs=selectedCase?data.documents.filter(d=>d.case_id===selectedCase.id):[]
    return protectedWorkspace(<>
      {selectedCase?<><button className="backBtn" onClick={()=>setSelectedCase(null)}>{a.backCases}</button><h2>{selectedCase.title}</h2><div className="detailCard"><p><b>{eui.status}:</b> {statusLabel(selectedCase.status)}</p><p><b>{eui.traffic}:</b> {lightLabel(selectedCase.traffic_light)}</p><p><b>{a.summary}:</b> {selectedCase.summary||a.noSummary}</p></div><section className="whyResult"><div className="whyHeader"><span className="modeBadge">{lt.control}</span><h3>{lt.why}</h3></div><div className="whyGrid"><div><b>{lt.basis}</b><p>{lt.basisDocs.replace('{n}',caseDocs.length)}</p></div><div><b>{lt.finding}</b><p>{selectedCase.summary||a.noSummary}</p></div><div className={caseDocs.length?'':'attentionBox'}><b>{lt.missing}</b><p>{caseDocs.length?lt.missingOpen:lt.missingDocs}</p></div><div><b>{lt.assessment}</b><p>{caseDocs.length?`${lightLabel(selectedCase.traffic_light)} · ${lt.assessmentNote}`:`${lt.notFinal}: ${lt.notFinalNote}`}</p></div><div><b>{lt.next}</b><p>{caseDocs.length?lt.nextReview:lt.nextDocs}</p></div></div></section><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={e=>setExportType(e.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div><h3>{a.relatedDocs}</h3>{caseDocs.length?caseDocs.map(d=><button className="itemRow buttonRow" onClick={()=>openDocument(d)} key={d.id}><span>{d.title}</span><span>›</span></button>):<div className="emptyState">{a.noAssignedDocs}</div>}</>
      :selectedClient?<><button className="backBtn" onClick={()=>setSelectedClient(null)}>{a.backClients}</button><h2>{selectedClient.name}</h2><div className="detailCard"><p><b>E-Mail:</b> {selectedClient.email||'—'}</p><p><b>{a.phone}:</b> {selectedClient.phone||'—'}</p><p><b>{a.note}:</b> {selectedClient.notes||'—'}</p></div></>
      :section==='dashboard'?<><QuickActions copy={core} onAction={handleQuickAction} deadlineCases={deadlineCases}/><h2>{a.overview}</h2><p className="muted">{a.signedInAs} {user?.email}</p><section className={`dashboardGuide dash-${currentTier}`}><div className="dashboardGuideMain"><span className="modeBadge">{dg.mode}</span><h3>{dg.title}</h3><p>{dg.lead}</p><button className="primary nextAction" onClick={()=>setSection(dg.nextSection)}>{dg.next} →</button></div><div className="dashboardSteps">{dg.steps.map((step,i)=><div className="dashboardStep" key={step}><span>{i+1}</span><b>{step.replace(/^\d+\.\s*/,'')}</b></div>)}</div></section><section className="recommendationBox"><div><span className="modeBadge">{rt.recommended}</span><h3>{rt.title}</h3><p>{rt.lead}</p></div><select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>{showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}{recommendedTier==='free'&&<p className="freeFairNote">{rt.freeNote}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>document.querySelector('.upgradeBox')?.scrollIntoView({behavior:'smooth'})}>{rt.showBenefit}</button>}</div>}</section><div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span></div><section className="accountControl"><div className="accountControlHead"><span className="modeBadge">{lt.control}</span><h3>{lt.contract}</h3></div><div className="controlGrid"><div><b>{currentPlan.name}</b><p>{currentTier==='free'?lt.contractFree:lt.contractPaid}</p></div><div><b>{lt.paymentState}</b><p>{lt.paymentOff}</p></div><div><b>{lt.dataTitle}</b><p>{lt.dataNote}</p><button className="secondary controlAction" onClick={exportMyData}>{lt.dataExport}</button><small>{lt.dataExportHelp}</small></div><div><b>{lt.auditTitle}</b><p>{lt.auditNote}</p><div className="deviceHistory"><strong>{lt.historyTitle}</strong><small>{lt.historyHelp}</small>{activityLog.length?<ul>{activityLog.slice(0,5).map((e,i)=><li key={`${e.at}-${i}`}><time>{new Date(e.at).toLocaleString(localeForLanguage[language]||localeForLanguage.de)}</time><span>{e.kind.replaceAll('_',' ')} · {e.detail}</span></li>)}</ul>:<em>{lt.noHistory}</em>}</div></div><div><b>{sct.serverAudit}</b><p>{sct.serverAuditHelp}</p><div className="deviceHistory serverHistory">{serverAudit.length?<ul>{serverAudit.slice(0,8).map(e=><li key={e.id}><time>{new Date(e.created_at).toLocaleString(localeForLanguage[language]||localeForLanguage.de)}</time><span>{e.event_type.replaceAll('_',' ')}{e.event_data?.detail?` · ${e.event_data.detail}`:''}</span></li>)}</ul>:<em>{sct.noServerAudit}</em>}</div></div><div><b>{sct.deletion}</b><p>{sct.deletionHelp}</p>{deletionRequests.some(r=>r.scope==='account'&&r.status==='requested')?<><div className="retentionStatus">{sct.deletionPending}</div><button className="secondary controlAction" disabled={deletionBusy} onClick={cancelAccountDeletion}>{sct.cancelDeletion}</button></>:<button className="secondary controlAction dangerSoft" disabled={deletionBusy} onClick={requestAccountDeletion}>{sct.requestDeletion}</button>}</div></div></section><div className="stats">{[['cases',a.sections.cases],['clients',a.sections.clients],['documents',a.sections.documents],['approvals',a.sections.approvals]].map(([k,l])=><button className="stat statButton" onClick={()=>setSection(k)} key={k}><b>{data[k].length}</b><span>{l}</span><small>{a.open}</small></button>)}</div>{upgrades.length>0&&<div className="detailCard upgradeBox"><div className="upgradeHeader"><div><h3>{a.upgrade}</h3><p className="muted">{a.upgradeInfo}</p></div><span className="testBadge">{a.paymentOff}</span></div><PromoCodeControl copy={promo} code={promoCode} setCode={setPromoCode} applied={appliedPromoCode} onApply={applyPromo} onClear={clearPromo} loading={quoteLoading} quotes={quotes} anyValid={promoAnyValid} allInvalid={promoAllInvalid} someInvalid={promoSomeInvalid} formatMoney={eur}/><div className="termChooser">{terms.map(t=><button key={t.months} className={termMonths===t.months?'term active':'term'} onClick={()=>setTermMonths(t.months)}><b>{monthsLabel(t.months)}</b><small>{t.discount?a.discount.replace('{discount}',t.discount):a.regular}</small></button>)}</div><div className="upgradeGrid">{upgrades.map(u=>{const q=quotes[u.plan_key];return <article className="upgradeCard" key={u.plan_key}><div className="upgradeTitle"><b>{u.plan_name}</b><strong>{eur(u.price_eur)}<small>{period.d30}</small></strong></div>{quoteLoading&&!q?<p className="muted">{a.priceCalc}</p>:q?<><div className="quoteRow"><span>{a.dueNow}</span><b>{eur(q.upgrade_due_now)}</b></div><small className="quoteHelp">{a.prorataHelp}</small><div className="quoteRow"><span>{monthsLabel(termMonths)}</span><b>{eur(q.package_total)}</b></div>{Number(q.savings)>0&&<div className="saving">{a.youSave.replace('{amount}',eur(q.savings)).replace('{discount}',Number(q.discount_percent).toFixed(0))}</div>}<div className="quoteRow mutedRow"><span>{a.regularAfter}</span><b>{eur(q.next_regular_price)} {period.d30}</b></div><div className="noRenew">{a.noRenew}</div></>:<p className="muted">{a.quoteUnavailable}</p>}<button className="primary full" disabled={!!appliedPromoCode&&q?.promo_code_state!=='valid'} onClick={()=>requestUpgrade(u)}>{a.requestUpgrade}</button></article>})}</div><p className="testNotice"><b>{a.testPhase}</b> {a.testPhaseInfo}</p></div>}</>
      :<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections[section]}</h2></div>{section==='clients'&&<><button className="primary actionBtn" onClick={()=>setShowClientForm(v=>!v)}>{showClientForm?a.cancel:a.addClient}</button>{showClientForm&&<form className="actionCard" onSubmit={createClient}><label>{a.name}<input value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} required/></label><label>{a.email}<input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/></label><label>{a.phone}<input value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})}/></label><label>{a.note}<textarea value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})}/></label><button className="primary full">{a.saveClient}</button></form>}</>}{section==='documents'&&<form className="actionCard" onSubmit={uploadDocument}><h3>{a.uploadDoc}</h3>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',data.documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<label>{a.file}<input name="file" type="file" accept={allowedUploadAccept} required/></label><small className="authHelp">{uui.testLimit}</small><label>{a.case}<select name="case_id"><option value="">{a.withoutCase}</option>{data.cases.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label><label>{v28.classification}<select name="data_classification" defaultValue="" required><option value="" disabled>—</option><option value="synthetic">{v28.synthetic}</option><option value="anonymized">{v28.anonymized}</option></select></label><label className="documentPrivacyConfirm"><input name="test_data_confirmed" type="checkbox" required/><span>{v28.uploadConfirm}</span></label><button className="primary full" disabled={uploading}>{uploading?a.uploading:a.uploadDoc}</button></form>}{data[section].length?<div className="itemList">{data[section].map((item,i)=>section==='cases'?<button className="itemRow buttonRow" onClick={()=>setSelectedCase(item)} key={item.id||i}><div><b>{item.title||a.case}</b><div className="pills"><span className="pill">{statusLabel(item.status)}</span><span className={`pill ${item.traffic_light||''}`}>{lightLabel(item.traffic_light)}</span></div></div><span className="chev">›</span></button>:section==='clients'?<button className="itemRow buttonRow" onClick={()=>setSelectedClient(item)} key={item.id||i}><div><b>{item.name}</b>{item.email&&<p>{item.email}</p>}</div><span className="chev">›</span></button>:section==='documents'?<article className="itemRow documentRow" key={item.id||i}><button className="documentOpen" onClick={()=>openDocument(item)}><div><b>{item.title}</b></div><span className="chev">›</span></button><div className="miniExport"><select defaultValue="pdf"><option value="pdf">PDF</option><option value="docx">Word</option><option value="xlsx">Excel</option><option value="pptx">PowerPoint</option><option value="csv">CSV</option><option value="txt">Text</option></select><button className="secondary" onClick={e=>doExport({kind:'document',item},e.currentTarget.previousElementSibling?.value||'pdf')}>{a.export}</button></div></article>:<article className="itemRow" key={item.id||i}><b>{item.title||item.subject||item.id}</b></article>)}</div>:<div className="emptyState"><b>{a.noneYet.replace('{section}',a.sections[section].toLowerCase())}</b><p>{section==='clients'?a.firstClient:section==='documents'?a.firstDoc:a.appearsHere}</p></div>}</>}</>)
  }

  return <PublicLanding t={t} a={a} language={language} setLanguage={setLanguage} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} setScreen={setScreen} cd={cd} testerLinkText={testerLinkText} pa={pa} activePublicCase={activePublicCase} setSelectedPublicCase={setSelectedPublicCase} tt={tt} jl={jl} localizedPlans={localizedPlans} rt={rt} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} setShowRecommendation={setShowRecommendation} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} recommendedTier={recommendedTier} eur={eur} period={period} terms={terms} monthsLabel={monthsLabel}/>
}
