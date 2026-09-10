'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PasswordField } from '../auth/PasswordField'
import { passwordUi } from '../auth/passwordUi'
import { ProductBrand } from '../brand/ProductBrand'
import { supabase } from '../services/supabaseClient'
import { signInTeamAccount } from '../team-account/teamAccountRepository'
import { InsiderLanding } from './InsiderLanding'

const errorText={
  team_credentials_invalid:'Das Zugangspasswort ist nicht richtig.',
  too_many_requests:'Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.',
  team_account_not_configured:'Der interne Zugang wurde noch nicht eingerichtet. Sebastian muss zuerst die beiden Passwörter festlegen.',
  team_access_not_allowed:'Dieses Konto ist nicht für den internen Bereich freigeschaltet.',
  team_login_unavailable:'Der interne Zugang ist momentan nicht erreichbar.'
}

export function InsiderAccessController(){
  const [stage,setStage]=useState('loading')
  const [password,setPassword]=useState('')
  const [visible,setVisible]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function verifyAccess(session){
    if(!session){setStage('login');return false}
    const {data:userData,error:userError}=await supabase.auth.getUser()
    if(userError||!userData?.user){
      await supabase.auth.signOut({scope:'local'})
      setStage('login');return false
    }
    const {data:rows,error}=await supabase.rpc('current_gold_access')
    const access=rows?.[0]
    const allowed=!error&&access?.active===true&&access?.status==='approved'&&(access?.app_role==='owner'||access?.permissions?.shared_team_access===true)
    setStage(allowed?'allowed':'forbidden')
    return allowed
  }

  useEffect(()=>{
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active)verifyAccess(data?.session||null)})
    return()=>{active=false}
  },[])

  async function signIn(event){
    event.preventDefault()
    if(!password||busy)return
    setBusy(true);setMessage('')
    const {data,error}=await signInTeamAccount(supabase,{password})
    setPassword('');setVisible(false);setBusy(false)
    if(error||!data?.session){setMessage(errorText[error?.code]||errorText.team_login_unavailable);return}
    setStage('loading');await verifyAccess(data.session)
  }

  async function switchAccount(){
    await supabase.auth.signOut({scope:'local'})
    setMessage('');setStage('login')
  }

  if(stage==='allowed')return <InsiderLanding/>

  return <main className="insiderGate">
    <section className="insiderGateCard" aria-labelledby="insider-gate-title">
      <ProductBrand showDescriptor language="de" className="insiderGateBrand"/>
      <span className="insiderGateBadge">GESCHÜTZTER INTERNER BEREICH</span>
      <h1 id="insider-gate-title">Interner Zugang</h1>
      <p>Diese Fläche ist nicht für Nutzer bestimmt. Passwort 1 gibt autorisierten Personen Vollzugriff auf das gesamte AS Workspace.</p>

      {stage==='loading'&&<div className="insiderGateState">Zugang wird geprüft …</div>}

      {stage==='login'&&<form className="insiderGateForm" onSubmit={signIn}>
        <PasswordField id="insider-access-password" label="Passwort 1 · gemeinsames Zugangspasswort" value={password} onChange={event=>setPassword(event.target.value)} visible={visible} onToggle={()=>setVisible(value=>!value)} labels={passwordUi.de} autoComplete="current-password"/>
        <button className="primary" disabled={busy||!password}>{busy?'Zugang wird geprüft …':'Vollzugriff auf alles öffnen'}</button>
        {message&&<div className="insiderGateMessage" role="alert">{message}</div>}
        <small>Passwort 2 wird hier niemals eingegeben. Es gibt nur eine fertige Änderung als neue Live-Version frei.</small>
      </form>}

      {stage==='forbidden'&&<div className="insiderGateBlocked">
        <strong>Kein interner Zugang mit dem aktuell angemeldeten Konto.</strong>
        <button type="button" className="secondary" onClick={switchAccount}>Abmelden und Teamzugang öffnen</button>
      </div>}

      <div className="insiderGateActions">
        <Link href="/">Zur öffentlichen Nutzerseite</Link>
        <Link href="/insider/einrichten">Private Ersteinrichtung</Link>
      </div>
    </section>
  </main>
}
