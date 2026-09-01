'use client'

import { useEffect, useState } from 'react'
import { recordAuditEvent } from '../services/workspaceRepository'

export function useWorkspaceAudit({supabase,userId}){
  const [activityLog,setActivityLog]=useState([])
  const [serverAudit,setServerAudit]=useState([])

  useEffect(()=>{
    if(!userId) return
    try{
      const storageKey=`asgold-activity-${userId}`
      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]
      localStorage.setItem(storageKey,JSON.stringify(sanitized))
      setActivityLog(sanitized)
    }catch{
      setActivityLog([])
    }
  },[userId])

  function recordLocalAction(kind){
    if(!userId) return
    const entry={at:new Date().toISOString(),kind,detail:'✓'}
    setActivityLog(previous=>{
      const next=[entry,...previous].slice(0,50)
      localStorage.setItem(`asgold-activity-${userId}`,JSON.stringify(next))
      return next
    })
  }

  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){
    if(!userId) return false
    const {rows,error}=await recordAuditEvent(supabase,{ownerId:userId,eventType,metadata,entityType,entityId})
    if(error){console.error('record_gold_audit_event',error);return false}
    setServerAudit(rows||[])
    return true
  }

  function resetAudit(){
    setActivityLog([])
    setServerAudit([])
  }

  return {activityLog,serverAudit,setServerAudit,recordLocalAction,recordServerAudit,resetAudit}
}
