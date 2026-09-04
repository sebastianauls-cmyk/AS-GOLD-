export const RECOVERY_LIVE_URL='https://app-gold-workspace.vercel.app/'

export function repairRecoveryUrl(rawLink){
  let source
  try{
    source=new URL(String(rawLink||'').trim())
  }catch{
    return {ok:false,code:'invalid_link'}
  }

  const params=new URLSearchParams(source.hash.replace(/^#/,''))
  const isLocalRecovery=source.hostname==='localhost'&&source.port==='3000'&&params.get('type')==='recovery'
  const hasSession=Boolean(params.get('access_token')&&params.get('refresh_token'))
  if(!isLocalRecovery||!hasSession){
    return {ok:false,code:'invalid_recovery_link'}
  }

  const target=new URL(RECOVERY_LIVE_URL)
  target.searchParams.set('release','V104')
  target.hash=source.hash
  return {ok:true,url:target.toString()}
}
