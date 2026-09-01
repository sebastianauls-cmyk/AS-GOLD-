import fs from 'node:fs'

const workspacePath='app/modules/workspace/WorkspaceAppV2.js'
const auditPath='app/modules/workspace/useWorkspaceAudit.js'
const sessionPath='app/modules/workspace/useWorkspaceSession.js'
const testPath='scripts/test_v46_workspace_session_audit.mjs'
const moduleReadmePath='app/modules/README.md'
const docsPath='docs/APP_GOLD_MODULARISIERUNG_V46.md'

const auditHook=`'use client'\n\nimport { useEffect, useState } from 'react'\nimport { recordAuditEvent } from '../services/workspaceRepository'\n\nexport function useWorkspaceAudit({supabase,userId}){\n  const [activityLog,setActivityLog]=useState([])\n  const [serverAudit,setServerAudit]=useState([])\n\n  useEffect(()=>{\n    if(!userId) return\n    try{\n      const storageKey=\`asgold-activity-\${userId}\`\n      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')\n      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]\n      localStorage.setItem(storageKey,JSON.stringify(sanitized))\n      setActivityLog(sanitized)\n    }catch{\n      setActivityLog([])\n    }\n  },[userId])\n\n  function recordLocalAction(kind){\n    if(!userId) return\n    const entry={at:new Date().toISOString(),kind,detail:'✓'}\n    setActivityLog(previous=>{\n      const next=[entry,...previous].slice(0,50)\n      localStorage.setItem(\`asgold-activity-\${userId}\`,JSON.stringify(next))\n      return next\n    })\n  }\n\n  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){\n    if(!userId) return false\n    const {rows,error}=await recordAuditEvent(supabase,{ownerId:userId,eventType,metadata,entityType,entityId})\n    if(error){console.error('record_gold_audit_event',error);return false}\n    setServerAudit(rows||[])\n    return true\n  }\n\n  function resetAudit(){\n    setActivityLog([])\n    setServerAudit([])\n  }\n\n  return {activityLog,serverAudit,setServerAudit,recordLocalAction,recordServerAudit,resetAudit}\n}\n`

const sessionHook=`'use client'\n\nimport { useEffect, useRef } from 'react'\nimport { getAuthSession, watchAuthState } from '../services/authRepository'\n\nexport function useWorkspaceSession({supabase,loadApp,setScreen,onSignedOut}){\n  const loadAppRef=useRef(loadApp)\n  const signedOutRef=useRef(onSignedOut)\n\n  useEffect(()=>{loadAppRef.current=loadApp},[loadApp])\n  useEffect(()=>{signedOutRef.current=onSignedOut},[onSignedOut])\n\n  useEffect(()=>{\n    let alive=true\n    getAuthSession(supabase).then(({data:{session}})=>{\n      if(alive) session?loadAppRef.current(session):setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public')\n    })\n    const subscription=watchAuthState(supabase,(event,session)=>{\n      if(!alive) return\n      if(event==='SIGNED_IN'&&session) loadAppRef.current(session)\n      if(event==='SIGNED_OUT') signedOutRef.current?.()\n    })\n    return ()=>{alive=false;subscription.unsubscribe()}\n  },[supabase,setScreen])\n}\n`

fs.writeFileSync(auditPath,auditHook)
fs.writeFileSync(sessionPath,sessionHook)

let source=fs.readFileSync(workspacePath,'utf8')

function replaceOnce(label,from,to){
  if(!source.includes(from)) throw new Error(`V46 session/audit split: expected ${label} source not found`)
  source=source.replace(from,to)
}

replaceOnce('workspace repository import',"import { recordAuditEvent } from '../services/workspaceRepository'\n",'')
replaceOnce('auth repository import',"import { getAuthSession, signOutSession, watchAuthState } from '../services/authRepository'","import { signOutSession } from '../services/authRepository'")
replaceOnce('workflow hook imports',"import { createAccountWorkflowActions } from '../compliance/accountWorkflow'","import { createAccountWorkflowActions } from '../compliance/accountWorkflow'\nimport { useWorkspaceAudit } from './useWorkspaceAudit'\nimport { useWorkspaceSession } from './useWorkspaceSession'")
replaceOnce('audit state',"  const [activityLog,setActivityLog]=useState([])\n  const [serverAudit,setServerAudit]=useState([])","  const {activityLog,serverAudit,setServerAudit,recordLocalAction,recordServerAudit,resetAudit}=useWorkspaceAudit({supabase,userId:user?.id})")

const auditBlock=`  useEffect(()=>{\n    if(!user?.id) return\n    try{\n      const storageKey=\`asgold-activity-\${user.id}\`\n      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')\n      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]\n      localStorage.setItem(storageKey,JSON.stringify(sanitized))\n      setActivityLog(sanitized)\n    }catch{\n      setActivityLog([])\n    }\n  },[user?.id])\n\n  function recordLocalAction(kind){\n    if(!user?.id) return\n    const entry={at:new Date().toISOString(),kind,detail:'✓'}\n    setActivityLog(previous=>{\n      const next=[entry,...previous].slice(0,50)\n      localStorage.setItem(\`asgold-activity-\${user.id}\`,JSON.stringify(next))\n      return next\n    })\n  }\n\n  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){\n    if(!user?.id) return false\n    const {rows,error}=await recordAuditEvent(supabase,{ownerId:user.id,eventType,metadata,entityType,entityId})\n    if(error){console.error('record_gold_audit_event',error);return false}\n    setServerAudit(rows||[])\n    return true\n  }\n\n`
replaceOnce('inline audit implementation',auditBlock,'')

const sessionBlock=`  useEffect(()=>{\n    let alive=true\n    getAuthSession(supabase).then(({data:{session}})=>{\n      if(alive) session?loadApp(session):setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public')\n    })\n    const subscription=watchAuthState(supabase,(event,session)=>{\n      if(!alive) return\n      if(event==='SIGNED_IN'&&session) loadApp(session)\n      if(event==='SIGNED_OUT'){\n        setUser(null)\n        setAccess(null)\n        setPrivacySettings(null)\n        setData(emptyData)\n        setSelectedCase(null)\n        setSelectedClient(null)\n        setSelectedDocument(null)\n        setSelectedApproval(null)\n        setApprovalDefaults({caseId:'',documentId:''})\n        setServerAudit([])\n        setDeletionRequests([])\n        setActivityLog([])\n        setSection('dashboard')\n        setScreen('public')\n      }\n    })\n    return ()=>{alive=false;subscription.unsubscribe()}\n  },[])\n`

const sessionReplacement=`  useWorkspaceSession({\n    supabase,\n    loadApp,\n    setScreen,\n    onSignedOut:()=>{\n      setUser(null)\n      setAccess(null)\n      setPrivacySettings(null)\n      setData(emptyData)\n      setSelectedCase(null)\n      setSelectedClient(null)\n      setSelectedDocument(null)\n      setSelectedApproval(null)\n      setApprovalDefaults({caseId:'',documentId:''})\n      setDeletionRequests([])\n      resetAudit()\n      setSection('dashboard')\n      setScreen('public')\n    }\n  })\n`
replaceOnce('inline auth session lifecycle',sessionBlock,sessionReplacement)

fs.writeFileSync(workspacePath,source)

const testScript=`import fs from 'node:fs'\n\nconst workspace=fs.readFileSync('app/modules/workspace/WorkspaceAppV2.js','utf8')\nconst audit=fs.readFileSync('app/modules/workspace/useWorkspaceAudit.js','utf8')\nconst session=fs.readFileSync('app/modules/workspace/useWorkspaceSession.js','utf8')\n\nfunction assert(condition,message){if(!condition) throw new Error(message)}\n\nassert(workspace.includes("import { useWorkspaceAudit } from './useWorkspaceAudit'"),'WorkspaceAppV2 must import useWorkspaceAudit')\nassert(workspace.includes("import { useWorkspaceSession } from './useWorkspaceSession'"),'WorkspaceAppV2 must import useWorkspaceSession')\nassert(!workspace.includes("recordAuditEvent"),'WorkspaceAppV2 must not own server audit persistence')\nassert(!workspace.includes("getAuthSession"),'WorkspaceAppV2 must not own auth session reads')\nassert(!workspace.includes("watchAuthState"),'WorkspaceAppV2 must not own auth state subscriptions')\nassert(!workspace.includes("setActivityLog(previous=>"),'WorkspaceAppV2 must not own activity log persistence')\nassert(audit.includes("recordAuditEvent"),'workspace audit hook must own server audit recording')\nassert(audit.includes("localStorage.getItem"),'workspace audit hook must own local activity restore')\nassert(audit.includes("resetAudit"),'workspace audit hook must expose a signed-out reset')\nassert(session.includes("getAuthSession"),'workspace session hook must own initial auth session lookup')\nassert(session.includes("watchAuthState"),'workspace session hook must own auth state subscription')\nassert(session.includes("subscription.unsubscribe()"),'workspace session hook must clean up the auth subscription')\nconsole.log('V46 workspace session/audit boundary guard passed')\n`
fs.writeFileSync(testPath,testScript)

const statusNote=`\n### Controller reduction — session/audit boundary (2 September 2026)\n\nThe active controller now delegates local activity persistence and server audit recording to \`workspace/useWorkspaceAudit.js\`, and delegates Supabase session bootstrap/auth-state subscription cleanup to \`workspace/useWorkspaceSession.js\`. \`WorkspaceAppV2.js\` keeps only composition state and explicit signed-out reset intent; it no longer imports \`recordAuditEvent\`, \`getAuthSession\` or \`watchAuthState\`. A dedicated guard verifies these boundaries before the full prebuild/build gate.\n`

for(const target of [moduleReadmePath,docsPath]){
  if(!fs.existsSync(target)) continue
  const current=fs.readFileSync(target,'utf8')
  if(!current.includes('Controller reduction — session/audit boundary')) fs.writeFileSync(target,current.trimEnd()+`\n${statusNote}\n`)
}

console.log('Prepared V46 workspace session/audit split')
