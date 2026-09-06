export function resolveWorkspaceEntry(session,requestedScreen){
  if(requestedScreen==='guest-test'&&session?.user?.is_anonymous===true)return {kind:'guest-test'}
  if(session)return {kind:'session'}
  return {kind:'screen',screen:requestedScreen}
}
