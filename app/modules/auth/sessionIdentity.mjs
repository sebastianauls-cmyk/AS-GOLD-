export function isAnonymousTestSession(session){
  const user=session?.user
  if(!user)return false
  if(user.is_anonymous===true)return true
  return !user.email&&user.user_metadata?.test_data_only===true
}
