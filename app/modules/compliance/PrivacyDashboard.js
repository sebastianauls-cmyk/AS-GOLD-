'use client'

import { useEffect, useState } from 'react'
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from './PrivacyControls'
import { useLegalLanguage } from '../language/LegalLanguageContext'
import { privacyDashboardCopy } from './privacyInteractionTranslations.mjs'
import { supabase } from '../services/supabaseClient'

export default function PrivacyDashboard(){
  const language=useLegalLanguage()
  const [session,setSession]=useState(null)
  const [settings,setSettings]=useState(null)
  const [state,setState]=useState('loading')
  const [message,setMessage]=useState('')
  const on=privacyDashboardCopy[language]||privacyDashboardCopy.de

  useEffect(()=>{
    let active=true
    async function load(nextSession){
      if(!active) return
      setSession(nextSession||null)
      if(!nextSession){setSettings(null);setState('signed-out');return}
      setState('loading')
      const {data,error}=await supabase.from('account_privacy_settings').select('*').eq('owner_id',nextSession.user.id).maybeSingle()
      if(!active) return
      if(error){setMessage(error.message);setState('error');return}
      setSettings(data||null);setState('ready')
    }
    supabase.auth.getSession().then(({data})=>load(data.session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>load(nextSession))
    return ()=>{active=false;subscription.unsubscribe()}
  },[])

  async function disableAi(){
    if(!session?.user?.id||state==='busy') return
    setState('busy');setMessage('')
    const now=new Date().toISOString()
    const {data,error}=await supabase.from('account_privacy_settings').update({ai_processing_enabled:false,updated_at:now}).eq('owner_id',session.user.id).select().single()
    if(error){setMessage(error.message);setState('error');return}
    const documentsUpdate=await supabase.from('documents').update({ai_processing_allowed:false,updated_at:now}).eq('owner_id',session.user.id).eq('ai_processing_allowed',true)
    if(documentsUpdate.error){setMessage(documentsUpdate.error.message);setState('error');return}
    const audit=await supabase.rpc('record_gold_audit_event',{p_event_type:'account_ai_processing_disabled',p_entity_type:'account',p_entity_id:null,p_metadata:{status:'completed'}})
    if(audit.error){setMessage(audit.error.message);setState('error');return}
    setSettings(data);setMessage(on.done);setState('ready')
  }

  if(state==='loading') return <div className="privacyDashboard"><p>{on.loading}</p></div>
  if(state==='signed-out') return <div className="privacyDashboard"><h3>{on.signedOut}</h3><p>{on.signedOutText}</p><a className="primary btn" href={language==='de'?'/':`/?lang=${language}`}>{on.signIn}</a></div>

  const current=settings?.privacy_notice_version===PRIVACY_NOTICE_VERSION&&settings?.terms_version===TERMS_VERSION
  return <div className="privacyDashboard">
    <div className="privacyStatusGrid">
      <div><small>{on.legal}</small><b>{current?on.current:on.pending}</b><span>{settings?.privacy_notice_version||'—'} · {settings?.terms_version||'—'}</span></div>
      <div><small>{on.ai}</small><b>{settings?.ai_processing_enabled?on.enabled:on.disabled}</b><span>{settings?.ai_processing_enabled?on.aiEnabled:on.aiDisabled}</span></div>
      <div><small>{on.real}</small><b>{settings?.real_data_authorized?on.enabled:on.blocked}</b><span>{on.realNote}</span></div>
      <div><small>{on.special}</small><b>{settings?.special_categories_authorized?on.enabled:on.blocked}</b><span>{on.specialNote}</span></div>
    </div>
    {message&&<div className={`legalNotice ${state==='error'?'legalNotice-warning':'legalNotice-success'}`} role="status">{message}</div>}
    {settings?.ai_processing_enabled?<button className="secondary" disabled={state==='busy'} onClick={disableAi}>{state==='busy'?on.disabling:on.disable}</button>:<p className="privacySafeState">{on.safe}</p>}
    <p className="privacyControlNote">{on.note}</p>
  </div>
}
