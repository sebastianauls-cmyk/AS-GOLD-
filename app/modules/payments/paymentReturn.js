'use client'

export function cleanPaymentReturnUrl(url){
  url.searchParams.delete('payment')
  url.searchParams.delete('session_id')
  url.searchParams.delete('request_id')
  window.history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`)
}
