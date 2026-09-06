export function isGuestTestRequest(location=globalThis.location){
  if(!location)return false
  return new URLSearchParams(location.search||'').get('start')==='guest-test'
}

export function clearGuestTestRequest({location=globalThis.location,history=globalThis.history}={}){
  if(!location||!history||!isGuestTestRequest(location))return false
  const url=new URL(location.href)
  url.searchParams.delete('start')
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`)
  return true
}
