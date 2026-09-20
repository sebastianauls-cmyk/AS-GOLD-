'use client'

import { useEffect, useRef } from 'react'
import { getAuthSession, signOutSession, watchAuthState } from '../services/authRepository'
import { getWorkspaceAccess } from '../services/workspaceRepository'
import { clearGuestTestRequest, isGuestTestRequest } from '../auth/guestTestRequest.mjs'
import { isAnonymousTestSession } from '../auth/sessionIdentity.mjs'
import { resolveWorkspaceEntry } from './sessionEntry.mjs'
import { capturePasswordRecovery, enterPasswordRecovery, isPasswordRecoveryActive, isPasswordRecoveryLocation } from '../auth/passwordRecoveryFlow.mjs'

function isPasswordRecoveryUrl(){
  if(typeof window==='undefined')return false
  return isPasswordRecoveryLocation(window.location)
}

function requestedPublicScreen(){
  const start=new URLSearchParams(window.location.search).get('start')
  if(start==='team-login')return 'team-login'
  if(start==='login')return 'login'
  if(start==='register')return 'register'
  if(start==='reset')return 'request-reset'
  if(start==='guest-test')return 'guest-test'
  return 'public'
}

export function useWorkspaceSession({supabase,loadApp,setScreen,onPasswordRecovery,onPasswordRecoveryError,onSignedOut}){
  const loadAppRef=useRef(loadApp)
  const recoveryRef=useRef(onPasswordRecovery)
  const recoveryErrorRef=useRef(onPasswordRecoveryError)
  const signedOutRef=useRef(onSignedOut)

  useEffect(()=>{loadAppRef.current=loadApp},[loadApp])
  useEffect(()=>{recoveryRef.current=onPasswordRecovery},[onPasswordRecovery])
  useEffect(()=>{recoveryErrorRef.current=onPasswordRecoveryError},[onPasswordRecoveryError])
  useEffect(()=>{signedOutRef.current=onSignedOut},[onSignedOut])

  useEffect(()=>{
    let alive=true
    let guestExpiryTimer=null
    let guestAccessCheckTimer=null
    let authEventHandled=false
    capturePasswordRecovery()

    function showRecovery(session){
      clearGuestExpiryGuards()
      enterPasswordRecovery()
      if(session?.user&&!isAnonymousTestSession(session))recoveryRef.current?.(session)
      else recoveryErrorRef.current?.()
    }

    function clearGuestExpiryGuards(){
      if(guestExpiryTimer){clearTimeout(guestExpiryTimer);guestExpiryTimer=null}
      if(guestAccessCheckTimer){clearInterval(guestAccessCheckTimer);guestAccessCheckTimer=null}
    }

    async function enforceGuestExpiry(session){
      clearGuestExpiryGuards()
      if(!alive||!isAnonymousTestSession(session))return

      async function checkAccess(){
        if(!alive)return false
        const snapshot=await getWorkspaceAccess(supabase)
        if(snapshot.error)return true
        const access=snapshot.access
        if(!access?.active||access?.status!=='approved'){
          await signOutSession(supabase)
          return false
        }
        const endsAt=access?.permissions?.guest_access_ends_at
        if(!endsAt)return true
        const remaining=new Date(endsAt).getTime()-Date.now()
        if(!Number.isFinite(remaining)||remaining<=0){
          await signOutSession(supabase)
          return false
        }
        if(guestExpiryTimer)clearTimeout(guestExpiryTimer)
        guestExpiryTimer=setTimeout(()=>{if(alive)signOutSession(supabase)},Math.min(remaining,2147483647))
        return true
      }

      const active=await checkAccess()
      if(active&&alive){
        guestAccessCheckTimer=setInterval(()=>{checkAccess()},60_000)
      }
    }

    getAuthSession(supabase).then(({data,error})=>{
      if(!alive||authEventHandled)return
      const session=error?null:data?.session
      if(isPasswordRecoveryActive()||isPasswordRecoveryUrl()){showRecovery(session);return}
      const entry=resolveWorkspaceEntry(session,requestedPublicScreen())
      if(entry.kind==='guest-test'){setScreen('guest-test');return}
      if(entry.kind==='session'){
        clearGuestTestRequest()
        loadAppRef.current(session)
        enforceGuestExpiry(session)
        return
      }
      setScreen(entry.screen)
    }).catch(()=>{
      if(!alive||authEventHandled)return
      if(isPasswordRecoveryActive()||isPasswordRecoveryUrl()){showRecovery(null);return}
      setScreen('login')
    })

    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='PASSWORD_RECOVERY'){authEventHandled=true;showRecovery(session);return}
      if(event==='SIGNED_IN'&&session){
        if(isPasswordRecoveryActive()||isPasswordRecoveryUrl()){authEventHandled=true;showRecovery(session);return}
        if(isGuestTestRequest()&&isAnonymousTestSession(session))return
        authEventHandled=true
        clearGuestTestRequest()
        loadAppRef.current(session)
        enforceGuestExpiry(session)
      }
      if(event==='SIGNED_OUT'){
        if(isGuestTestRequest())return
        if(isPasswordRecoveryActive()){
          authEventHandled=true
          clearGuestExpiryGuards()
          signedOutRef.current?.()
          recoveryErrorRef.current?.()
          return
        }
        authEventHandled=true
        clearGuestExpiryGuards()
        signedOutRef.current?.()
      }
    })

    return ()=>{
      alive=false
      clearGuestExpiryGuards()
      subscription.unsubscribe()
    }
  },[supabase,setScreen])
}
