import { isAnonymousTestSession } from '../auth/sessionIdentity.mjs'

export function resolveWorkspaceEntry(session,requestedScreen){
  if(requestedScreen==='guest-test'&&isAnonymousTestSession(session))return {kind:'guest-test'}
  if(session)return {kind:'session'}
  return {kind:'screen',screen:requestedScreen}
}
