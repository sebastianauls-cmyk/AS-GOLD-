import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceApp.js'
let source=fs.readFileSync(workspacePath,'utf8')

function ensureImport(anchor,line){
  if(source.includes(line))return
  if(!source.includes(anchor))throw new Error(`import anchor missing: ${anchor}`)
  source=source.replace(anchor,`${anchor}\n${line}`)
}
function replaceExact(oldText,newText,label){
  if(source.includes(newText))return
  if(!source.includes(oldText))throw new Error(`replacement anchor missing: ${label}`)
  source=source.replace(oldText,newText)
}
function replaceFunction(startName,nextName,replacement){
  const startCandidates=[`  async function ${startName}`,`  function ${startName}`]
  const startIndexes=startCandidates.map(token=>source.indexOf(token)).filter(index=>index>=0)
  const startIndex=startIndexes.length?Math.min(...startIndexes):-1
  const nextCandidates=[source.indexOf(`\n  async function ${nextName}`,startIndex),source.indexOf(`\n  function ${nextName}`,startIndex)].filter(index=>index>=0)
  const nextIndex=nextCandidates.length?Math.min(...nextCandidates):-1
  if(startIndex<0||nextIndex<0)throw new Error(`Could not isolate ${startName}`)
  source=source.slice(0,startIndex)+replacement+source.slice(nextIndex)
}

fs.writeFileSync('app/modules/services/authRepository.js',`export function getAuthSession(supabase){\n  return supabase.auth.getSession()\n}\n\nexport function watchAuthState(supabase,handler){\n  const {data:{subscription}}=supabase.auth.onAuthStateChange(handler)\n  return subscription\n}\n\nexport function signInSession(supabase,{email,password}){\n  return supabase.auth.signInWithPassword({email,password})\n}\n\nexport function sendPasswordReset(supabase,{email,redirectTo}){\n  return supabase.auth.resetPasswordForEmail(email,{redirectTo})\n}\n\nexport function registerTestAccount(supabase,{email,password,displayName,privacyNoticeVersion,termsVersion,emailRedirectTo}){\n  const legalAcknowledgedAt=new Date().toISOString()\n  return supabase.auth.signUp({email,password,options:{data:{display_name:displayName,privacy_notice_version:privacyNoticeVersion,terms_version:termsVersion,legal_acknowledged_at:legalAcknowledgedAt,test_data_only:true},emailRedirectTo}})\n}\n\nexport function signOutSession(supabase){\n  return supabase.auth.signOut()\n}\n`)

const anchor="import { approveApprovalRecord, createApprovalRecord, rejectApprovalRecord, updateApprovalRecord } from '../services/approvalRepository'"
ensureImport(anchor,"import { getAuthSession, registerTestAccount, sendPasswordReset, signInSession, signOutSession, watchAuthState } from '../services/authRepository'")

replaceExact(`  async function refresh(){ const {data:{session}} = await supabase.auth.getSession(); if(session) await loadApp(session) }`,`  async function refresh(){ const {data:{session}} = await getAuthSession(supabase); if(session) await loadApp(session) }`,'refresh session')

replaceExact(`  useEffect(()=>{\n    let alive = true\n    supabase.auth.getSession().then(({data:{session}})=>{ if(alive) session ? loadApp(session) : setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public') })\n    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session)=>{\n      if(!alive) return\n      if(event==='SIGNED_IN' && session) loadApp(session)\n      if(event==='SIGNED_OUT'){ setUser(null); setAccess(null); setPrivacySettings(null); setData(emptyData); setSelectedCase(null); setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null); setApprovalDefaults({caseId:'',documentId:''}); setServerAudit([]); setDeletionRequests([]); setActivityLog([]); setSection('dashboard'); setScreen('public') }\n    })\n    return ()=>{ alive=false; subscription.unsubscribe() }\n  },[])`,`  useEffect(()=>{\n    let alive = true\n    getAuthSession(supabase).then(({data:{session}})=>{ if(alive) session ? loadApp(session) : setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public') })\n    const subscription=watchAuthState(supabase,(event,session)=>{\n      if(!alive) return\n      if(event==='SIGNED_IN' && session) loadApp(session)\n      if(event==='SIGNED_OUT'){ setUser(null); setAccess(null); setPrivacySettings(null); setData(emptyData); setSelectedCase(null); setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null); setApprovalDefaults({caseId:'',documentId:''}); setServerAudit([]); setDeletionRequests([]); setActivityLog([]); setSection('dashboard'); setScreen('public') }\n    })\n    return ()=>{ alive=false; subscription.unsubscribe() }\n  },[])`,'auth lifecycle')

replaceFunction('signIn','resetPassword',`  async function signIn(e){\n    e.preventDefault(); setMessage('')\n    const {data,error}=await signInSession(supabase,{email:email.trim(),password})\n    if(error) return setMessage(error.message)\n    await loadApp(data.session)\n  }\n`)
replaceFunction('resetPassword','register',`  async function resetPassword(){\n    setMessage('')\n    if(!email.trim()) return setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')\n    const {error}=await sendPasswordReset(supabase,{email:email.trim(),redirectTo:window.location.origin})\n    if(error) return setMessage(error.message)\n    setMessage(lt.passwordSent)\n  }\n`)
replaceFunction('register','applyPromo',`  async function register(e){\n    e.preventDefault(); setMessage('')\n    if(!acceptedLegal||!confirmedTestData) return setMessage(v28.required)\n    if(!validateV29Password(password,{email,displayName}).valid) return setMessage(v29Password.invalid)\n    if(password!==password2) return setMessage(n.pwMismatch)\n    const {data,error}=await registerTestAccount(supabase,{email:email.trim(),password,displayName:displayName.trim(),privacyNoticeVersion:PRIVACY_NOTICE_VERSION,termsVersion:TERMS_VERSION,emailRedirectTo:'https://app-gold-workspace.vercel.app'})\n    if(error) return setMessage(error.message)\n    if(data.session) await loadApp(data.session)\n    else { setAcceptedLegal(false);setConfirmedTestData(false);setMessage(n.registered); setScreen('login') }\n  }\n`)
replaceExact(`onLogout={()=>supabase.auth.signOut()}`,`onLogout={()=>signOutSession(supabase)}`,'workspace logout')
fs.writeFileSync(workspacePath,source)

const guardPath='scripts/test_v46_modular_boundaries.mjs'
let guard=fs.readFileSync(guardPath,'utf8')
replaceGuard(`assert.match(workspace,/signInWithPassword/)`,`assert.match(workspace,/signInSession/)\nassert.match(read('app/modules/services/authRepository.js'),/signInWithPassword/)`)
function replaceGuard(oldText,newText){
  if(guard.includes(newText))return
  if(!guard.includes(oldText))throw new Error(`guard anchor missing: ${oldText}`)
  guard=guard.replace(oldText,newText)
}
const marker="console.log('V46 auth service boundary verified.')"
if(!guard.includes(marker)){
  guard += `\nexists('app/modules/services/authRepository.js')\nassert.match(workspace,/authRepository/)\nfor(const directAuth of ['supabase.auth.getSession','supabase.auth.onAuthStateChange','supabase.auth.signInWithPassword','supabase.auth.resetPasswordForEmail','supabase.auth.signUp','supabase.auth.signOut']) assert.ok(!workspace.includes(directAuth),\`workspace controller must not own auth transport: \${directAuth}\`)\nconsole.log('V46 auth service boundary verified.')\n`
}
fs.writeFileSync(guardPath,guard)

const readmePath='app/modules/README.md'
let readme=fs.readFileSync(readmePath,'utf8')
const note='- `services/authRepository.js`: session lookup/subscription, sign-in, reset, test registration and sign-out are isolated from WorkspaceApp; AuthSurface remains presentation-only.'
if(!readme.includes(note))fs.writeFileSync(readmePath,`${readme}\n${note}\n`)

console.log('V46 auth service extraction applied')
