'use client'

import { useEffect, useRef } from 'react'
import { getAuthSession, signOutSession, watchAuthState } from '../services/authRepository'
import { getWorkspaceAccess } from '../services/workspaceRepository'
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
    let guestExpiryTimer=null
    let guestAccessCheckTimer=null

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

    getAuthSession(supabase).then(({data:{session}})=>{
      if(!alive)return
      if(isPasswordRecoveryUrl()){recoveryRef.current?.();return}
      const entry=resolveWorkspaceEntry(session,requestedPublicScreen())
      if(entry.kind==='guest-test'){setScreen('guest-test');return}
      if(entry.kind==='session'){
        clearGuestTestRequest()
        loadAppRef.current(session)
        enforceGuestExpiry(session)
        return
      }
      setScreen(entry.screen)
    })

    const subscription=watchAuthState(supabase,(event,session)=>{
      if(!alive) return
      if(event==='PASSWORD_RECOVERY'){recoveryRef.current?.();return}
      if(event==='SIGNED_IN'&&session){
        if(isGuestTestRequest()&&isAnonymousTestSession(session))return
        clearGuestTestRequest()
        loadAppRef.current(session)
        enforceGuestExpiry(session)
      }
      if(event==='SIGNED_OUT'){
        clearGuestExpiryGuards()
        if(isGuestTestRequest())return
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
