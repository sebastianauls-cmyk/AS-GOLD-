import { ensureRegistrationPrivacy, getWorkspaceAccess, loadWorkspaceBundle } from '../services/workspaceRepository'
import { AUTH_REDIRECT_URL, getAuthSession, registerTestAccount, sendPasswordReset, signInSession, startAnonymousTestSession, updatePassword } from '../services/authRepository'
import { clearGuestTestRequest } from './guestTestRequest.mjs'
import { getAuthErrorMessage } from './authMessages.mjs'

const resetFeedback={
  de:{emailRequired:'Bitte zuerst Ihre E-Mail-Adresse eingeben.',sent:'Wenn die Adresse registriert ist, wurde ein Link zum Zurücksetzen gesendet.'},
  en:{emailRequired:'Please enter your email address first.',sent:'If the address is registered, a password reset link has been sent.'},
  fr:{emailRequired:'Veuillez d’abord saisir votre adresse e-mail.',sent:'Si cette adresse est enregistrée, un lien de réinitialisation a été envoyé.'},
  tr:{emailRequired:'Lütfen önce e-posta adresinizi girin.',sent:'Adres kayıtlıysa parola sıfırlama bağlantısı gönderildi.'},
  pl:{emailRequired:'Najpierw wpisz swój adres e-mail.',sent:'Jeśli adres jest zarejestrowany, wysłano link do zresetowania hasła.'},
  ru:{emailRequired:'Сначала введите адрес электронной почты.',sent:'Если адрес зарегистрирован, ссылка для сброса пароля была отправлена.'},
  ar:{emailRequired:'يرجى إدخال عنوان بريدك الإلكتروني أولاً.',sent:'إذا كان العنوان مسجلاً، فقد تم إرسال رابط لإعادة تعيين كلمة المرور.'},
  fa:{emailRequired:'لطفاً ابتدا نشانی ایمیل خود را وارد کنید.',sent:'اگر این نشانی ثبت شده باشد، پیوند بازنشانی گذرواژه ارسال شده است.'},
  ro:{emailRequired:'Introduceți mai întâi adresa de e-mail.',sent:'Dacă adresa este înregistrată, a fost trimis un link pentru resetarea parolei.'},
  bg:{emailRequired:'Първо въведете имейл адреса си.',sent:'Ако адресът е регистриран, е изпратена връзка за нулиране на паролата.'},
  vi:{emailRequired:'Vui lòng nhập địa chỉ email trước.',sent:'Nếu địa chỉ đã được đăng ký, liên kết đặt lại mật khẩu đã được gửi.'}
}

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
  guestCopy,
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
  setMessage,
  sessionLoadRef
}){
  async function performLoadApp(session){
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

  function loadApp(session){
    const key=`${session?.user?.id||''}:${session?.access_token||''}`
    const active=sessionLoadRef?.current
    if(key&&active?.key===key&&active.promise)return active.promise
    const promise=performLoadApp(session)
    if(sessionLoadRef)sessionLoadRef.current={key,promise}
    return promise
  }

  async function signIn(event){
    event.preventDefault()
    setMessage('')
    const {data:authData,error}=await signInSession(supabase,{email:email.trim(),password})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    return loadApp(authData.session)
  }

  async function startGuestTest(){
    setMessage('')
    const {data:authData,error}=await startAnonymousTestSession(supabase,{displayName:guestCopy.displayName,privacyNoticeVersion,termsVersion})
    if(error||!authData.session){
      setMessage(guestCopy.unavailable)
      setScreen('login')
      return false
    }
    clearGuestTestRequest()
    return loadApp(authData.session)
  }

  async function resetPassword(){
    setMessage('')
    const resetCopy=resetFeedback[language]||resetFeedback.de
    if(!email.trim()){
      setMessage(resetCopy.emailRequired)
      return false
    }
    const {error}=await sendPasswordReset(supabase,{email:email.trim(),redirectTo:AUTH_REDIRECT_URL})
    if(error){setMessage(getAuthErrorMessage(error,language));return false}
    setMessage(resetCopy.sent)
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

  return {loadApp,signIn,startGuestTest,resetPassword,completePasswordRecovery,register}
}