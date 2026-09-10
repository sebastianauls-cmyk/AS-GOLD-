'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { validateV29Password } from '../auth/v29PasswordPolicy.mjs'
import { PasswordField } from '../auth/PasswordField'
import { passwordUi } from '../auth/passwordUi'
import { ProductBrand } from '../brand/ProductBrand'
import { supabase } from '../services/supabaseClient'

const initialPasswords={access:'',accessRepeat:'',master:'',masterRepeat:''}
const initialVisibility={login:false,access:false,accessRepeat:false,master:false,masterRepeat:false}

const ruleLabels={
  length:'Mindestens 12 Zeichen',
  letter:'Mindestens ein Buchstabe',
  number:'Mindestens eine Zahl',
  symbol:'Mindestens ein Sonderzeichen',
  variety:'Mindestens 8 unterschiedliche Zeichen',
  personal:'Kein Name, E-Mail-Bestandteil oder häufiges Passwort'
}

const errorCopy={
  authentication_required:'Bitte melde dich zuerst persönlich an.',
  owner_required:'Diese Einrichtung ist ausschließlich für Sebastian freigeschaltet.',
  passwords_invalid:'Beide Passwörter müssen alle Sicherheitsregeln erfüllen und jeweils übereinstimmen.',
  passwords_must_differ:'Zugangspasswort und Masterpasswort müssen verschieden sein.',
  already_configured:'Die beiden Passwörter wurden bereits eingerichtet.',
  access_password_not_saved:'Das Zugangspasswort konnte nicht gespeichert werden. Bitte versuche es erneut.',
  setup_incomplete:'Das Zugangspasswort wurde übernommen, die Einrichtung konnte aber nicht vollständig abgeschlossen werden. Bitte melde dich erneut an und öffne diese Seite wieder.',
  setup_unavailable:'Die sichere Einrichtung ist momentan nicht verfügbar.'
}

function PasswordRules({password,passwordRepeat,identity,label}){
  const {rules}=validateV29Password(password,identity)
  const matches=password.length>0&&password===passwordRepeat
  return <div className="teamSetupRules" aria-live="polite">
    <strong>{label}</strong>
    <ul>
      {Object.entries(ruleLabels).map(([key,text])=><li className={rules[key]?'isMet':'isMissing'} key={key}><span aria-hidden="true">{rules[key]?'✓':'○'}</span>{text}</li>)}
      <li className={matches?'isMet':'isMissing'}><span aria-hidden="true">{matches?'✓':'○'}</span>Beide Eingaben stimmen überein</li>
    </ul>
  </div>
}

async function setupRequest(session,body){
  try{
    const response=await fetch('/api/team-account/setup',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},
      cache:'no-store',
      body:JSON.stringify(body)
    })
    const payload=await response.json().catch(()=>({}))
    return {payload,error:response.ok?null:(payload.code||'setup_unavailable')}
  }catch{return {payload:null,error:'setup_unavailable'}}
}

export function TeamPasswordSetup(){
  const [stage,setStage]=useState('loading')
  const [session,setSession]=useState(null)
  const [identity,setIdentity]=useState({email:'',displayName:''})
  const [login,setLogin]=useState({email:'',password:''})
  const [passwords,setPasswords]=useState(initialPasswords)
  const [visible,setVisible]=useState(initialVisibility)
  const [confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  const loadSetup=useCallback(async currentSession=>{
    if(!currentSession){setStage('login');return}
    setSession(currentSession)
    const {data:accessRows,error:accessError}=await supabase.rpc('current_gold_access')
    const access=accessRows?.[0]
    if(accessError||access?.active!==true||access?.status!=='approved'||access?.app_role!=='owner'){
      setStage('forbidden');return
    }
    setIdentity({email:currentSession.user?.email||'',displayName:access.display_name||''})
    const {payload,error}=await setupRequest(currentSession,{mode:'status'})
    if(error){setMessage(errorCopy[error]||errorCopy.setup_unavailable);setStage('error');return}
    setStage(payload.configured?'configured':'form')
  },[])

  useEffect(()=>{
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active)loadSetup(data?.session||null)})
    return()=>{active=false}
  },[loadSetup])

  const accessCheck=useMemo(()=>validateV29Password(passwords.access,identity),[passwords.access,identity])
  const masterCheck=useMemo(()=>validateV29Password(passwords.master,identity),[passwords.master,identity])
  const different=passwords.access.length>0&&passwords.master.length>0&&passwords.access.normalize('NFKC')!==passwords.master.normalize('NFKC')
  const ready=accessCheck.valid&&masterCheck.valid&&passwords.access===passwords.accessRepeat&&passwords.master===passwords.masterRepeat&&different&&confirmed

  function updatePassword(name,value){setPasswords(current=>({...current,[name]:value}))}
  function toggle(name){setVisible(current=>({...current,[name]:!current[name]}))}

  async function signIn(event){
    event.preventDefault();setBusy(true);setMessage('')
    const {data,error}=await supabase.auth.signInWithPassword({email:login.email.trim(),password:login.password})
    setBusy(false);setLogin(current=>({...current,password:''}))
    if(error||!data?.session){setMessage('Die persönliche Anmeldung ist fehlgeschlagen.');return}
    setStage('loading');await loadSetup(data.session)
  }

  async function configure(event){
    event.preventDefault()
    if(!ready||!session)return
    setBusy(true);setMessage('')
    const {error}=await setupRequest(session,{
      mode:'configure',
      accessPassword:passwords.access,
      accessPasswordRepeat:passwords.accessRepeat,
      masterPassword:passwords.master,
      masterPasswordRepeat:passwords.masterRepeat
    })
    setBusy(false)
    if(error){setMessage(errorCopy[error]||errorCopy.setup_unavailable);return}
    setPasswords(initialPasswords);setVisible(initialVisibility);setConfirmed(false);setStage('complete')
  }

  async function openTeamLogin(){
    await supabase.auth.signOut({scope:'local'})
    window.location.assign('/?start=team-login')
  }

  return <main className="teamSetupPage">
    <section className="teamSetupShell" aria-labelledby="team-setup-title">
      <ProductBrand showDescriptor language="de" className="teamSetupBrand"/>
      <div className="teamSetupBadge">PRIVATE ERSTEINRICHTUNG</div>
      <h1 id="team-setup-title">Passwort 1 und Passwort 2 sicher festlegen</h1>
      <p className="teamSetupLead">Nur du richtest den Vollzugriff auf das gesamte AS Workspace und deine persönliche Freigabe für neue Live-Versionen ein.</p>

      <div className="teamSetupSeparation" aria-label="Aufgaben der beiden Passwörter">
        <article><span>1</span><div><strong>Passwort 1 · Vollzugriff auf alles</strong><p>Damit öffnet das autorisierte Team das gesamte AS Workspace und darf in allen Bereichen arbeiten und Änderungen vorbereiten.</p></div></article>
        <article className="master"><span>2</span><div><strong>Passwort 2 · Persönliches Masterpasswort</strong><p>Damit gibst ausschließlich du eine fertig vorbereitete Änderung als neue Live-Version frei.</p></div></article>
      </div>

      {message&&<div className="teamSetupMessage" role="alert">{message}</div>}

      {stage==='loading'&&<div className="teamSetupState">Berechtigung wird sicher geprüft …</div>}

      {stage==='login'&&<section className="teamSetupPanel">
        <h2>Zuerst persönlich anmelden</h2>
        <p>Damit niemand anderes die beiden Passwörter festlegen kann, bestätigst du zuerst deinen bisherigen persönlichen Zugang.</p>
        <form onSubmit={signIn} className="teamSetupForm">
          <label>E-Mail-Adresse<input type="email" value={login.email} onChange={event=>setLogin(current=>({...current,email:event.target.value}))} autoComplete="username" required/></label>
          <PasswordField id="setup-personal-password" label="Bisheriges persönliches Passwort" value={login.password} onChange={event=>setLogin(current=>({...current,password:event.target.value}))} visible={visible.login} onToggle={()=>toggle('login')} labels={passwordUi.de} autoComplete="current-password"/>
          <button className="primary" disabled={busy}>{busy?'Anmeldung wird geprüft …':'Persönlich anmelden'}</button>
        </form>
      </section>}

      {stage==='form'&&<form className="teamSetupForm teamSetupPanel" onSubmit={configure}>
        <section aria-labelledby="access-password-title">
          <h2 id="access-password-title">1. Passwort 1 · Vollzugriff auf alles</h2>
          <p>Dieses Passwort darfst du anschließend an die berechtigten internen Personen weitergeben.</p>
          <div className="teamSetupNotice">Es ersetzt dein bisheriges Anmeldepasswort für dieses gemeinsame interne Konto.</div>
          <PasswordField id="setup-access-password" label="Neues Passwort 1" value={passwords.access} onChange={event=>updatePassword('access',event.target.value)} visible={visible.access} onToggle={()=>toggle('access')} labels={passwordUi.de} autoComplete="new-password" describedBy="setup-access-rules"/>
          <PasswordField id="setup-access-repeat" label="Passwort 1 wiederholen" value={passwords.accessRepeat} onChange={event=>updatePassword('accessRepeat',event.target.value)} visible={visible.accessRepeat} onToggle={()=>toggle('accessRepeat')} labels={passwordUi.de} autoComplete="new-password" describedBy="setup-access-rules"/>
          <div id="setup-access-rules"><PasswordRules password={passwords.access} passwordRepeat={passwords.accessRepeat} identity={identity} label="Sicherheitsprüfung Zugangspasswort"/></div>
        </section>

        <section className="teamSetupMaster" aria-labelledby="master-password-title">
          <h2 id="master-password-title">2. Passwort 2 · Freigabe der Live-Version</h2>
          <p>Dieses Masterpasswort bleibt ausschließlich bei dir. Es wird nicht an das Team weitergegeben und nur einmal je fertigem Änderungsentwurf vor der Veröffentlichung geprüft.</p>
          <PasswordField id="setup-master-password" label="Neues Passwort 2 (Masterpasswort)" value={passwords.master} onChange={event=>updatePassword('master',event.target.value)} visible={visible.master} onToggle={()=>toggle('master')} labels={passwordUi.de} autoComplete="new-password" describedBy="setup-master-rules"/>
          <PasswordField id="setup-master-repeat" label="Passwort 2 wiederholen" value={passwords.masterRepeat} onChange={event=>updatePassword('masterRepeat',event.target.value)} visible={visible.masterRepeat} onToggle={()=>toggle('masterRepeat')} labels={passwordUi.de} autoComplete="new-password" describedBy="setup-master-rules"/>
          <div id="setup-master-rules"><PasswordRules password={passwords.master} passwordRepeat={passwords.masterRepeat} identity={identity} label="Sicherheitsprüfung Masterpasswort"/></div>
        </section>

        <div className={different?'teamSetupDifference isMet':'teamSetupDifference isMissing'}><span aria-hidden="true">{different?'✓':'○'}</span>Die beiden Passwörter sind unterschiedlich</div>
        <label className="teamSetupConfirm"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>Ich verwahre Passwort 2 sicher und gebe es nicht an das Team weiter.</span></label>
        <button className="primary teamSetupSubmit" disabled={!ready||busy}>{busy?'Passwörter werden sicher gespeichert …':'Beide Passwörter verbindlich festlegen'}</button>
        <small className="teamSetupPrivacy">Die Passwörter werden weder angezeigt noch im Klartext in AS Workspace gespeichert.</small>
      </form>}

      {stage==='complete'&&<section className="teamSetupPanel teamSetupSuccess" role="status">
        <div className="teamSetupSuccessIcon" aria-hidden="true">✓</div>
        <h2>Beide Passwörter sind eingerichtet</h2>
        <p>Passwort 1 öffnet jetzt das gesamte AS Workspace. Passwort 2 wird nur abgefragt, wenn du eine fertige Änderung als neue Live-Version freigibst.</p>
        <button type="button" className="primary" onClick={openTeamLogin}>Gemeinsamen Zugang jetzt testen</button>
      </section>}

      {stage==='configured'&&<section className="teamSetupPanel teamSetupSuccess">
        <div className="teamSetupSuccessIcon" aria-hidden="true">✓</div>
        <h2>Die Passwörter sind bereits eingerichtet</h2>
        <p>Aus Sicherheitsgründen werden sie hier nicht angezeigt und können über die Ersteinrichtung nicht überschrieben werden.</p>
        <button type="button" className="primary" onClick={openTeamLogin}>Gemeinsamen Zugang öffnen</button>
      </section>}

      {stage==='forbidden'&&<section className="teamSetupPanel"><h2>Kein Zugriff</h2><p>Diese Ersteinrichtung ist nur über deinen freigeschalteten persönlichen Chefzugang möglich.</p><Link href="/?start=login" className="primary teamSetupLink">Zur persönlichen Anmeldung</Link></section>}
      {stage==='error'&&<section className="teamSetupPanel"><h2>Einrichtung noch nicht verfügbar</h2><p>Bitte versuche es nach der Veröffentlichung erneut.</p></section>}

      <nav className="teamSetupFooter" aria-label="Zurück"><Link href="/insider">Zur internen Übersicht</Link></nav>
    </section>
  </main>
}
