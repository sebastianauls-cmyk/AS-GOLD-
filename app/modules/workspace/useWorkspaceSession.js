'use client'

import { useEffect, useRef } from 'react'
import { getAuthSession, watchAuthState } from '../services/authRepository'
import { clearGuestTestRequest, isGuestTestRequest } from '../auth/guestTestRequest.mjs'
import { isAnonymousTestSession } from '../auth/sessionIdentity.mjs'
import { resolveWorkspaceEntry } from './sessionEntry.mjs'

function isPasswordRecoveryUrl(){
  if(typeof window==='undefined')return false
  const query=new URLSearchParams(window.location.search)
  const hash=new URLSearchParams(window.location.hash.replace(/^#/,''))
  return query.get('type')==='recovery'||hash.get('type')==='recovery'
}

function requestedPublicScreen(){
  const start=new URLSearchParams(window.location.search).get('start')
  if(start==='register')return 'register'
  if(start==='reset')return 'request-reset'
  if(start==='guest-test')return 'guest-test'
  return 'public'
}

export function useWorkspaceSession({supabase,loadApp,setScreen,onPasswordRecovery,onSignedOut}){
  const loadAppRef=useRef(loadApp)
  const recoveryRef=useRef(onPasswordRecovery)
  const signedOutRef=useRef(onSignedOut)

  useEffect(()=>{loadAppRef.current=loadApp},[loadApp])
  useEffect(()=>{recoveryRef.current=onPasswordRecovery},[onPasswordRecovery])
  useEffect(()=>{signedOutRef.current=onSignedOut},[onSignedOut])

  useEffect(()=>{
    let alive=true
    getAuthSession(supabase).then(({data:{session}})=>{
      if(!alive)return
      if(isPasswordRecoveryUrl()){recoveryRef.current?.();return}
      const entry=resolveWorkspaceEntry(session,requestedPublicScreen())
      if(entry.kind==='guest-test'){setScreen('guest-test');return}
      if(entry.kind==='session'){clearGuestTestRequest();loadAppRef.current(session);return}
      setScreen(entry.screen)
    })
    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='PASSWORD_RECOVERY'){recoveryRef.current?.();return}
      if(event==='SIGNED_IN'&&session){
        if(isGuestTestRequest()&&isAnonymousTestSession(session))return
        clearGuestTestRequest()
        loadAppRef.current(session)
      }
      if(event==='SIGNED_OUT'){
        if(isGuestTestRequest())return
        signedOutRef.current?.()
      }
    })
    return ()=>{alive=false;subscription.unsubscribe()}
  },[supabase,setScreen])
}
