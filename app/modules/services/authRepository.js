export const AUTH_REDIRECT_URL='https://app-gold-workspace.vercel.app'

export function getAuthSession(supabase){
  return supabase.auth.getSession()
}

export function watchAuthState(supabase,handler){
  const {data:{subscription}}=supabase.auth.onAuthStateChange(handler)
  return subscription
}

export function signInSession(supabase,{email,password}){
  return supabase.auth.signInWithPassword({email,password})
}

export function sendPasswordReset(supabase,{email,redirectTo}){
  return supabase.auth.resetPasswordForEmail(email,{redirectTo})
}

export function updatePassword(supabase,{password}){
  return supabase.auth.updateUser({password})
}

export function registerTestAccount(supabase,{email,password,displayName,privacyNoticeVersion,termsVersion,emailRedirectTo}){
  const legalAcknowledgedAt=new Date().toISOString()
  return supabase.auth.signUp({email,password,options:{data:{display_name:displayName,privacy_notice_version:privacyNoticeVersion,terms_version:termsVersion,legal_acknowledged_at:legalAcknowledgedAt,test_data_only:true},emailRedirectTo}})
}

export function signOutSession(supabase){
  return supabase.auth.signOut()
}
