'use client'

import { useEffect, useRef } from 'react'
import { getAuthSession, watchAuthState } from '../services/authRepository'

export function useWorkspaceSession({supabase,loadApp,setScreen,onSignedOut}){
  const loadAppRef=useRef(loadApp)
  const signedOutRef=useRef(onSignedOut)

  useEffect(()=>{loadAppRef.current=loadApp},[loadApp])
  useEffect(()=>{signedOutRef.current=onSignedOut},[onSignedOut])

  useEffect(()=>{
    let alive=true
    getAuthSession(supabase).then(({data:{session}})=>{
      if(alive) session?loadAppRef.current(session):setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public')
    })
    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='SIGNED_IN'&&session) loadAppRef.current(session)
      if(event==='SIGNED_OUT') signedOutRef.current?.()
    })
    return ()=>{alive=false;subscription.unsubscribe()}
  },[supabase,setScreen])
}
