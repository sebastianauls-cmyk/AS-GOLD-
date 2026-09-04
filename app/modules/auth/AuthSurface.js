import { ProductBrand } from '../brand/ProductBrand'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { LegalFooter } from '../compliance/LegalFooter'
import { RegistrationLegalFields } from '../compliance/PrivacyControls'
import { PasswordPolicyChecklist } from './PasswordPolicy'
import { PasswordField } from './PasswordField'

export function AuthSurface({screen,t,a,language,setLanguage,tt,displayName,setDisplayName,email,setEmail,password,setPassword,password2,setPassword2,showPassword,setShowPassword,showPassword2,setShowPassword2,pui,recoveryCopy,v28,acceptedLegal,setAcceptedLegal,confirmedTestData,setConfirmedTestData,registerReady,recoveryReady,register,signIn,resetPassword,completePasswordRecovery,message,lt,setScreen}){
  const resetSensitiveFields=()=>{
    setShowPassword(false)
    setShowPassword2(false)
    setPassword('')
    setPassword2('')
    setAcceptedLegal(false)
    setConfirmedTestData(false)
  }

  const openResetRequest=()=>{
    resetSensitiveFields()
    setScreen('request-reset')
  }

  const submitResetRequest=event=>{
    event.preventDefault()
    resetPassword()
  }

  let authForm
  if(screen==='register'){
    authForm=<form onSubmit={register}>
      <label>{a.name}<input value={displayName} onChange={event=>setDisplayName(event.target.value)} autoComplete="name" required/></label>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required/></label>
      <PasswordField id="register-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordField id="register-password-repeat" label={a.passwordAgain} value={password2} onChange={event=>setPassword2(event.target.value)} visible={showPassword2} onToggle={()=>setShowPassword2(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordPolicyChecklist language={language} password={password} passwordRepeat={password2} email={email} displayName={displayName}/>
      <RegistrationLegalFields copy={v28} accepted={acceptedLegal} onAccepted={setAcceptedLegal} testOnly={confirmedTestData} onTestOnly={setConfirmedTestData}/>
      <button className="primary full" disabled={!registerReady}>{a.registerFree}</button>
    </form>
  }else if(screen==='recovery'){
    authForm=<form onSubmit={completePasswordRecovery}>
      <p className="muted">{recoveryCopy.lead}</p>
      <PasswordField id="recovery-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordField id="recovery-password-repeat" label={a.passwordAgain} value={password2} onChange={event=>setPassword2(event.target.value)} visible={showPassword2} onToggle={()=>setShowPassword2(value=>!value)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/>
      <PasswordPolicyChecklist language={language} password={password} passwordRepeat={password2} email={email} displayName={displayName}/>
      <button className="primary full" disabled={!recoveryReady}>{recoveryCopy.submit}</button>
    </form>
  }else if(screen==='request-reset'){
    authForm=<form onSubmit={submitResetRequest}>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required autoFocus/></label>
      <button className="primary full">{lt.passwordReset}</button>
      <small className="authHelp">{lt.passwordResetHelp}</small>
    </form>
  }else{
    authForm=<form onSubmit={signIn}>
      <label>{a.email}<input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="username" required/></label>
      <PasswordField id="login-password" label={a.password} value={password} onChange={event=>setPassword(event.target.value)} visible={showPassword} onToggle={()=>setShowPassword(value=>!value)} labels={pui} autoComplete="current-password"/>
      <button className="primary full">{t.login}</button>
      <button type="button" className="linkBtn full" onClick={openResetRequest}>{lt.passwordReset}</button>
      <small className="authHelp">{lt.passwordResetHelp}</small>
    </form>
  }

  const title=screen==='register'?a.registerTitle:screen==='recovery'?recoveryCopy.title:screen==='request-reset'?lt.passwordReset:a.protected
  const returnToLogin=screen==='register'||screen==='recovery'||screen==='request-reset'

  return <>
    <main className="center">
      <section className="card authCard">
        <ProductBrand showDescriptor language={language}/>
        <div className="languageSwitch"><span>{t.language}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/></div>
        <p className="muted">{title}</p>
        {screen==='register'&&<div className="registerTransparency"><b>{tt.registerTitle}</b><p>{tt.registerNote}</p><span>✓ {a.noSubscription}</span></div>}
        {authForm}
        {message&&<div className="note" role="status">{message}</div>}
        <button className="linkBtn full" onClick={()=>{resetSensitiveFields();setScreen(returnToLogin?'login':'register')}}>{returnToLogin?recoveryCopy.back:a.newHere}</button>
        <button className="backBtn full authBackBtn" onClick={()=>{resetSensitiveFields();setScreen('public')}}>{a.backExplanation}</button>
      </section>
    </main>
    <LegalFooter language={language}/>
  </>
}
