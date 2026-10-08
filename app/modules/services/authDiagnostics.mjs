// Keep only fixed phase names and numeric HTTP status codes in page memory.
// Never retain SDK argument objects, URLs, user details or session/token values.
const phases=[]
const phaseNames=new Set(['lock_wait','lock_acquired','lock_released','lock_end','recover_begin','recover_end','refresh_begin','refresh_end','initialized','visibility_setup','visibility_change','token_request','token_headers','token_failure'])
const authEvents=new Set(['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY','TOKEN_REFRESHED','USER_UPDATED','MFA_CHALLENGE_VERIFIED','INITIAL_SESSION'])

function phase(name,status){
  if(!phaseNames.has(name)&&!/^notify_(?:begin|end)_(?:SIGNED_IN|SIGNED_OUT|PASSWORD_RECOVERY|TOKEN_REFRESHED|USER_UPDATED|MFA_CHALLENGE_VERIFIED|INITIAL_SESSION)$/.test(name))return
  const entry={phase:name}
  if(Number.isInteger(status)&&status>=100&&status<=599)entry.status=status
  phases.push(entry)
  if(phases.length>20)phases.shift()
}

export function recordAuthDiagnostic(_prefix,method,stage){
  if(typeof method!=='string')return
  if(method==='#_acquireLock'){
    const names={begin:'lock_wait','lock acquired for storage key':'lock_acquired','lock released for storage key':'lock_released',end:'lock_end'}
    if(names[stage])phase(names[stage])
  }else if(method==='#_recoverAndRefresh()'&&(stage==='begin'||stage==='end'))phase(`recover_${stage}`)
  else if(method.startsWith('#_callRefreshToken(')&&(stage==='begin'||stage==='end'))phase(`refresh_${stage}`)
  else if(method==='#_initialize()'&&stage==='end')phase('initialized')
  else if(method==='#_handleVisibilityChange()')phase('visibility_setup')
  else if(method==='#_onVisibilityChanged(true)'||method==='#_onVisibilityChanged(false)')phase('visibility_change')
  else{
    const event=method.match(/^#_notifyAllSubscribers\(([^)]+)\)$/)?.[1]
    if(authEvents.has(event)&&(stage==='begin'||stage==='end'))phase(`notify_${stage}_${event}`)
  }
}

export async function observeAuthTransport(fetchImpl,input,init,authOrigin){
  let observed=false
  try{
    const url=new URL(typeof input==='string'?input:input.url||input.href)
    observed=url.origin===authOrigin&&url.pathname==='/auth/v1/token'
  }catch{}
  if(!observed)return fetchImpl(input,init)
  phase('token_request')
  try{const response=await fetchImpl(input,init);phase('token_headers',response.status);return response}
  catch(error){phase('token_failure');throw error}
}

export function sessionDiagnosticSnapshot(){return {version:1,phases:phases.map(entry=>({...entry}))}}

export function reportSessionCheckFailure(){
  console.warn('ASH_SESSION_CHECK_UNAVAILABLE '+JSON.stringify(sessionDiagnosticSnapshot()))
}
