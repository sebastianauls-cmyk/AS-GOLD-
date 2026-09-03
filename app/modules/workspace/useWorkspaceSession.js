'use client'

import { useEffect, useRef } from 'react'
import { getAuthSession, watchAuthState } from '../services/authRepository'

function isPasswordRecoveryUrl(){
  if(typeof window==='undefined')return false
  const query=new URLSearchParams(window.location.search)
  const hash=new URLSearchParams(window.location.hash.replace(/^#/,''))
  return query.get('type')==='recovery'||hash.get('type')==='recovery'
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
      session?loadAppRef.current(session):setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public')
    })
    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='PASSWORD_RECOVERY'){recoveryRef.current?.();return}
      if(event==='SIGNED_IN'&&session) loadAppRef.current(session)
      if(event==='SIGNED_OUT') signedOutRef.current?.()
    })
    return ()=>{alive=false;subscription.unsubscribe()}
  },[supabase,setScreen])
}
