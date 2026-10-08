import { observeAuthTransport } from './authDiagnostics.mjs'

export const PASSWORD_SIGN_IN_TIMEOUT_MS=20_000

// Bound only password sign-in transport. Uploads, queries, token refreshes and
// other origins retain their existing behavior. No request is retried here.
export function createAuthFetch({supabaseUrl,timeoutMs=PASSWORD_SIGN_IN_TIMEOUT_MS,fetchImpl=(...args)=>globalThis.fetch(...args)}){
  const authOrigin=new URL(supabaseUrl).origin
  const trackedFetch=(input,init)=>observeAuthTransport(fetchImpl,input,init,authOrigin)
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new RangeError('Invalid sign-in timeout')

  return function authFetch(input,init){
    let url
    try{url=new URL(typeof input==='string'?input:input.url||input.href)}catch{return trackedFetch(input,init)}
    const method=(init?.method||input?.method||'GET').toUpperCase()
    if(url.origin!==authOrigin||url.pathname!=='/auth/v1/token'||url.searchParams.get('grant_type')!=='password'||method!=='POST'){
      return trackedFetch(input,init)
    }
    return requestPasswordToken(input,init)
  }

  async function requestPasswordToken(input,init){
    const originalSignal=init?.signal||input?.signal
    if(originalSignal?.aborted)throw originalSignal.reason||new DOMException('Request aborted','AbortError')
    const controller=new AbortController()
    let timer
    let onAbort
    const cancelled=new Promise((_,reject)=>{
      onAbort=()=>{
        const error=originalSignal?.reason||new DOMException('Request aborted','AbortError')
        controller.abort(error)
        reject(error)
      }
      originalSignal?.addEventListener('abort',onAbort,{once:true})
      timer=setTimeout(()=>{
        const error=new DOMException('Sign-in request timed out','AbortError')
        controller.abort(error)
        reject(error)
      },timeoutMs)
    })
    try{
      const completed=(async()=>{
        const response=await trackedFetch(input,{...init,signal:controller.signal})
        // Keep the deadline active through the small auth response body too.
        // Headers arriving alone must not leave the SDK waiting indefinitely.
        if(!response.body)return response
        const body=await response.arrayBuffer()
        return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers})
      })()
      return await Promise.race([completed,cancelled])
    }finally{
      clearTimeout(timer)
      originalSignal?.removeEventListener('abort',onAbort)
    }
  }
}
