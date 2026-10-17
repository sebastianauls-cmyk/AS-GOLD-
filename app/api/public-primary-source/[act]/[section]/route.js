import { PRIMARY_SOURCE_CACHE } from '../../../../../supabase/functions/_shared/primarySourceCache.mjs'

export const dynamic='force-dynamic'
export const maxDuration=25

// Public statutory HTML only. There is no caller-selected host, case input,
// credential forwarding, model call or database access in this transport.
const allowed=new Set(PRIMARY_SOURCE_CACHE.map(item=>item.url))
const failure=status=>Response.json({error:'public_source_unavailable'},{status,headers:{'cache-control':'no-store'}})

export async function GET(request,{params}){
  const {act,section}=await params
  const url=`https://www.gesetze-im-internet.de/${act}/__${section}.html`
  if(new URL(request.url).search||!allowed.has(url))return failure(404)
  try{
    const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(18000),
      headers:{Accept:'text/html','User-Agent':'ASHWorkspaceGold/1.0 (public statutory text refresh)'}})
    if(response.status!==200||response.url!==url||!/^text\/html\b/i.test(response.headers.get('content-type')||'')){
      await response.body?.cancel();return failure(502)
    }
    if(Number(response.headers.get('content-length'))>1500000){await response.body?.cancel();return failure(502)}
    const reader=response.body?.getReader()
    if(!reader)return failure(502)
    const chunks=[];let length=0
    for(;;){
      const {value,done}=await reader.read()
      if(done)break
      length+=value.byteLength
      if(length>1500000){await reader.cancel();return failure(502)}
      chunks.push(value)
    }
    const body=new Uint8Array(length);let offset=0
    for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength}
    return new Response(body,{headers:{
      // Serve as inert bytes, never as third-party HTML on the application origin.
      'content-type':'application/octet-stream','x-content-type-options':'nosniff',
      'content-security-policy':"default-src 'none'; sandbox",'content-disposition':'attachment',
      'cache-control':'public, max-age=0, s-maxage=3600',
      'x-primary-source-url':url,'x-primary-source-content-type':response.headers.get('content-type'),
      'x-primary-source-checked-at':new Date().toISOString()
    }})
  }catch(error){
    console.error('public_primary_source_fetch_failed',{act,section,name:error?.name||'Error',code:error?.cause?.code||''})
    return failure(502)
  }
}
