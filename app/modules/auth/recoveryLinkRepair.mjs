export const RECOVERY_LIVE_URL='https://app-gold-workspace.vercel.app/'
export const RECOVERY_SUPABASE_HOST='bcvggtnvuesaihqvgisg.supabase.co'

export function inspectRecoveryLink(rawLink){
  let source
  try{
    source=new URL(String(rawLink||'').trim())
  }catch{
    return {ok:false,code:'invalid_link'}
  }

  const hashParams=new URLSearchParams(source.hash.replace(/^#/,''))
  const isLocalRecovery=source.hostname==='localhost'&&source.port==='3000'&&hashParams.get('type')==='recovery'
  const hasSession=Boolean(hashParams.get('access_token')&&hashParams.get('refresh_token'))
  if(isLocalRecovery&&hasSession){
    const target=new URL(RECOVERY_LIVE_URL)
    target.searchParams.set('release','V105')
    target.hash=source.hash
    return {ok:true,kind:'session',url:target.toString()}
  }

  const isSupabaseRecovery=source.protocol==='https:'&&source.hostname===RECOVERY_SUPABASE_HOST&&source.pathname==='/auth/v1/verify'&&source.searchParams.get('type')==='recovery'
  const tokenHash=source.searchParams.get('token')||source.searchParams.get('token_hash')
  if(isSupabaseRecovery&&tokenHash){
    return {ok:true,kind:'token_hash',tokenHash}
  }

  return {ok:false,code:'invalid_recovery_link'}
}

export const repairRecoveryUrl=inspectRecoveryLink
