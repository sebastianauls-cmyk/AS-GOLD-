import { ensureRegistrationPrivacy, getWorkspaceAccess, loadWorkspaceBundle } from '../services/workspaceRepository'
import { AUTH_REDIRECT_URL, getAuthSession, registerTestAccount, sendPasswordReset, signInSession, updatePassword } from '../services/authRepository'
import { getAuthErrorMessage } from './authMessages.mjs'

export function createWorkspaceAuthActions({
  supabase,
  language,
  pendingMessages,
  privacyNoticeVersion,
  termsVersion,
  legalCopy,
  passwordCopy,
  notices,
  trustCopy,
  recoveryCopy,
  email,
  password,
  password2,
  displayName,
  acceptedLegal,
  confirmedTestData,
  validatePassword,
  setPassword,
  setPassword2,
  setAcceptedLegal,
  setConfirmedTestData,
  setAccess,
  setUpgrades,
  setData,
  setServerAudit,
  setDeletionRequests,
  setPrivacySettings,
  setUser,
  setScreen,
  setMessage
}){
  async function loadApp(session){
    setMessage('')
    const accessSnapshot=await getWorkspaceAccess(supabase)
    if(accessSnapshot.error){setMessage(accessSnapshot.error.message);setScreen('login');return false}
    const row=accessSnapshot.access
    if(!row?.active||row?.status!=='approved'){
      setMessage(pendingMessages[language]||pendingMessages.de)
      setScreen('login')
      return false
    }
    setAccess(row)
    setUpgrades(accessSnapshot.upgrades||[])
    const ownerId=session.user.id
    const bundle=await loadWorkspaceBundle(supabase,ownerId)
    if(bundle.error) setMessage(bundle.error.message)
    let nextPrivacy=bundle.privacy
    if(!nextPrivacy){
      const createdPrivacy=await ensureRegistrationPrivacy(supabase,{ownerId,registrationMeta:session.user?.user_metadata||{},privacyNoticeVersion,termsVersion})
      if(!createdPrivacy.error&&createdPrivacy.data) nextPrivacy=createdPrivacy.data
    }
    setData(bundle.data)
    setServerAudit(bundle.audit)
    setDeletionRequests(bundle.deletionRequests)
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
    return true
  }

  async function signIn(event){
    event.preventDefault()
    setMessage('')
    const {data:authData,error}=await signInSession(supabase,{email:email.trim(),password})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    return loadApp(authData.session)
  }

  async function resetPassword(){
    setMessage('')
    if(!email.trim()){
      setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')
      return false
    }
    const {error}=await sendPasswordReset(supabase,{email:email.trim(),redirectTo:AUTH_REDIRECT_URL})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    setMessage(trustCopy.passwordSent)
    return true
  }

  async function completePasswordRecovery(event){
    event.preventDefault()
    setMessage('')
    if(!validatePassword(password,{email,displayName}).valid){setMessage(passwordCopy.invalid);return false}
    if(password!==password2){setMessage(notices.pwMismatch);return false}
    const {error}=await updatePassword(supabase,{password})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    setPassword('')
    setPassword2('')
    const {data:{session}}=await getAuthSession(supabase)
    if(!session){setScreen('login');setMessage(recoveryCopy.updated);return true}
    const loaded=await loadApp(session)
    if(loaded)setMessage(recoveryCopy.updated)
    else setMessage(`${recoveryCopy.updated} ${pendingMessages[language]||pendingMessages.de}`)
    return true
  }

  async function register(event){
    event.preventDefault()
    setMessage('')
    if(!acceptedLegal||!confirmedTestData){setMessage(legalCopy.required);return false}
    if(!validatePassword(password,{email,displayName}).valid){setMessage(passwordCopy.invalid);return false}
    if(password!==password2){setMessage(notices.pwMismatch);return false}
    const {data:authData,error}=await registerTestAccount(supabase,{email:email.trim(),password,displayName:displayName.trim(),privacyNoticeVersion,termsVersion,emailRedirectTo:AUTH_REDIRECT_URL})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    if(authData.session) return loadApp(authData.session)
    setAcceptedLegal(false)
    setConfirmedTestData(false)
    setMessage(notices.registered)
    setScreen('login')
    return true
  }

  return {loadApp,signIn,resetPassword,completePasswordRecovery,register}
}
