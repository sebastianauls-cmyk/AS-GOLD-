'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getV28PrivacyCopy, PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../components/V28PrivacyControls'

const supabase=createClient(
  'https://bcvggtnvuesaihqvgisg.supabase.co',
  'sb_publishable_O0JQYoJW-60sh3_5f7yr2Q_czCPZNH0',
  {auth:{persistSession:true,autoRefreshToken:true}}
)

export default function PrivacyDashboard(){
  const [session,setSession]=useState(null)
  const [settings,setSettings]=useState(null)
  const [state,setState]=useState('loading')
  const [message,setMessage]=useState('')
  const on=getV28PrivacyCopy('de')

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
    await supabase.from('audit_events').insert({owner_id:session.user.id,event_type:'account_ai_processing_disabled',entity_type:'account',event_data:{detail:'all outstanding document permissions revoked'},source:'app'})
    setSettings(data);setMessage(on.disableAiDone);setState('ready')
  }

  if(state==='loading') return <div className="privacyDashboard"><p>Status wird sicher geladen …</p></div>
  if(state==='signed-out') return <div className="privacyDashboard"><h3>Anmeldung erforderlich</h3><p>Die Rechtstexte sind öffentlich. Ihre persönlichen Freigaben können Sie nach der Anmeldung prüfen und ändern.</p><a className="primary btn" href="/">Zur Anmeldung</a></div>

  const current=settings?.privacy_notice_version===PRIVACY_NOTICE_VERSION&&settings?.terms_version===TERMS_VERSION
  return <div className="privacyDashboard">
    <div className="privacyStatusGrid">
      <div><small>Rechtstexte</small><b>{current?'Aktuelle Version bestätigt':'Bestätigung ausstehend'}</b><span>{settings?.privacy_notice_version||'—'} · {settings?.terms_version||'—'}</span></div>
      <div><small>{on.aiControl}</small><b>{settings?.ai_processing_enabled?'Freigegeben':'Ausgeschaltet'}</b><span>{settings?.ai_processing_enabled?on.aiEnabled:on.aiDisabled}</span></div>
      <div><small>Echte personenbezogene Daten</small><b>{settings?.real_data_authorized?'Freigegeben':'Gesperrt'}</b><span>Im kontrollierten V28-Test muss diese Freigabe ausgeschaltet bleiben.</span></div>
      <div><small>Besondere Kategorien</small><b>{settings?.special_categories_authorized?'Freigegeben':'Gesperrt'}</b><span>Daten nach Art. 9 DSGVO sind im Test gesperrt.</span></div>
    </div>
    {message&&<div className={`legalNotice ${state==='error'?'legalNotice-warning':'legalNotice-success'}`} role="status">{message}</div>}
    {settings?.ai_processing_enabled?<button className="secondary" disabled={state==='busy'} onClick={disableAi}>{state==='busy'?'Wird ausgeschaltet …':on.disableAi}</button>:<p className="privacySafeState">Es bestehen keine offenen KI-Kontofreigaben. Eine neue Analyse braucht wieder die ausdrückliche Dokumentbestätigung.</p>}
    <p className="privacyControlNote">Das Ausschalten beendet keine bereits abgeschlossene Übermittlung rückwirkend. Löschung, Auskunft oder Widerspruch können zusätzlich über die Kontofunktionen oder per E-Mail angefragt werden.</p>
  </div>
}
