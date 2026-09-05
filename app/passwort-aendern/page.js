'use client'

import {useEffect,useMemo,useState} from 'react'
import {ProductBrand} from '../modules/brand/ProductBrand.js'
import {PasswordField} from '../modules/auth/PasswordField.js'
import {PasswordPolicyChecklist,validateV29Password} from '../modules/auth/PasswordPolicy.js'
import {passwordUi} from '../modules/auth/passwordUi.js'
import {supabase} from '../modules/services/supabaseClient.js'
import {APP_VERSION} from '../modules/release/appRelease.mjs'

export default function ChangePasswordPage(){
  const [user,setUser]=useState(null)
  const [checking,setChecking]=useState(true)
  const [password,setPassword]=useState('')
  const [passwordRepeat,setPasswordRepeat]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [showPasswordRepeat,setShowPasswordRepeat]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const labels=passwordUi.de
  const displayName=user?.user_metadata?.display_name||''
  const passwordValid=useMemo(
    ()=>validateV29Password(password,{email:user?.email||'',displayName}).valid,
    [password,user,displayName]
  )
  const ready=passwordValid&&password.length>0&&password===passwordRepeat&&!busy

  useEffect(()=>{
    let active=true
    supabase.auth.getUser().then(({data,error})=>{
      if(!active)return
      setUser(error?null:data.user)
      setChecking(false)
    })
    return()=>{active=false}
  },[])

  async function savePassword(event){
    event.preventDefault()
    if(!ready)return
    setBusy(true)
    setMessage('Passwort wird sicher gespeichert …')
    const {error}=await supabase.auth.updateUser({password})
    setBusy(false)
    if(error){
      setMessage('Das Passwort konnte noch nicht gespeichert werden. Bitte die Seite neu öffnen und erneut versuchen.')
      return
    }
    setPassword('')
    setPasswordRepeat('')
    setShowPassword(false)
    setShowPasswordRepeat(false)
    setMessage('Ihr neues Passwort wurde erfolgreich gespeichert.')
  }

  return <main className="center">
    <section className="card authCard" aria-labelledby="change-password-title">
      <ProductBrand showDescriptor language="de"/>
      <h1 id="change-password-title">Passwort ändern</h1>

      {checking&&<p className="note" role="status">Anmeldung wird sicher geprüft …</p>}

      {!checking&&!user&&<>
        <p className="note" role="alert">Ihre Anmeldung ist in diesem Browser nicht mehr aktiv.</p>
        <a className="primary full btn" href={`/?start=reset&release=${APP_VERSION}`}>Neuen Passwort-Link anfordern</a>
      </>}

      {!checking&&user&&<>
        <p className="muted">Sie sind als <b>{user.email}</b> angemeldet. Legen Sie jetzt Ihr neues Passwort fest.</p>
        <form onSubmit={savePassword}>
          <PasswordField id="change-password" label="Neues Passwort" value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={labels} autoComplete="new-password" describedBy="change-password-policy"/>
          <PasswordField id="change-password-repeat" label="Neues Passwort wiederholen" value={passwordRepeat} onChange={event=>setPasswordRepeat(event.target.value)} visible={showPasswordRepeat} onToggle={()=>setShowPasswordRepeat(value=>!value)} labels={labels} autoComplete="new-password" describedBy="change-password-policy"/>
          <div id="change-password-policy"><PasswordPolicyChecklist language="de" password={password} passwordRepeat={passwordRepeat} email={user.email||''} displayName={displayName}/></div>
          <button className="primary full" disabled={!ready}>{busy?'Passwort wird gespeichert …':'Passwort speichern'}</button>
        </form>
        {message&&<p className="note" role="status">{message}</p>}
        <a className="backBtn full btn" href={`/?release=${APP_VERSION}`}>← Zurück zum Arbeitsbereich</a>
      </>}
    </section>
  </main>
}
