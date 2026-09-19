// A model-supplied URL or citation is not evidence that a source was retrieved.
export function officialUrl(value,domains) {
  try {
    const url=new URL(String(value||'')),host=url.hostname.toLowerCase()
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!domains.some(domain=>host===domain||host.endsWith('.'+domain))) return null
    url.hash=''; return url.href
  } catch { return null }
}

export function searchRetrievedSources(raw,domains) {
  const found=new Map()
  const add=source=>{
    const url=officialUrl(source?.url||source?.link,domains)
    if(url) found.set(url,{url,title:String(source.title||source.name||url).slice(0,260)})
  }
  for(const item of raw?.output||[]) {
    if(item?.type!=='web_search_call'||item.status!=='completed') continue
    for(const source of item.action?.sources||[]) add(source)
    if(item.action?.type==='open_page'&&item.action.url) add(item.action)
  }
  return found
}

const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß',sect:'§',ndash:'–',mdash:'—'}
export function readableSourceText(body,type) {
  let source=body
  if(type!=='text/plain') source=source.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/giu,' ').replace(/<[^>]+>/gu,' ')
  return source.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu,(whole,entity)=>{
    if(entity[0]!=='#') return entities[entity]??whole
    const code=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10)
    return Number.isInteger(code)&&code>0&&code<=0x10ffff?String.fromCodePoint(code):whole
  }).replace(/\s+/gu,' ').trim()
}

async function fetchOfficialSource(item,domains,fetchImpl) {
  const original=officialUrl(item.url,domains)
  if(!original) return null
  const signal=AbortSignal.timeout(8000)
  let current=original,response
  try {
    for(let redirects=0;redirects<=3;redirects++) {
      response=await fetchImpl(current,{method:'GET',redirect:'manual',signal,headers:{Accept:'text/html, application/xhtml+xml, text/plain'}})
      if([301,302,303,307,308].includes(response.status)) {
        const location=response.headers.get('location');await response.body?.cancel()
        const next=location?officialUrl(new URL(location,current).href,domains):null
        if(!next||redirects===3)return null
        current=next; continue
      }
      break
    }
    if(response?.status!==200){await response?.body?.cancel();return null}
    const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
    if(!['text/html','application/xhtml+xml','text/plain'].includes(type)){await response.body?.cancel();return null}
    if(Number(response.headers.get('content-length'))>1500000){await response.body?.cancel();return null}
    const reader=response.body?.getReader();if(!reader)return null
    const chunks=[];let length=0
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>1500000){await reader.cancel();return null}chunks.push(value)}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
    // Many official legacy pages declare ISO-8859-1 in HTML, not in HTTP headers.
    const head=new TextDecoder('windows-1252').decode(bytes.subarray(0,4096))
    const charset=/charset\s*=\s*["']?([\w-]+)/i.exec(response.headers.get('content-type')||'')?.[1]
      ||/<meta\b[^>]*charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1]
      ||/<\?xml\b[^>]*encoding\s*=\s*["']([\w-]+)/i.exec(head)?.[1]||'utf-8'
    const markup=new TextDecoder(charset,{fatal:true}).decode(bytes)
    const fullText=readableSourceText(markup,type)
    if(fullText.length<100) return null
    const retrievedText=fullText.slice(0,48000)
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(retrievedText))
    const title=type==='text/plain'?new URL(current).hostname:readableSourceText(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/iu.exec(markup)?.[1]||'','text/html').slice(0,260)||new URL(current).hostname
    return {url:original,final_url:current,title,source_text:retrievedText,truncated:fullText.length>retrievedText.length,checked_at:new Date().toISOString(),content_sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}
  } catch {return null}
}

export async function retrieveOfficialEvidence(items,domains,{fetchImpl=fetch}={}) {
  const unique=[...new Map(items.map(item=>[item.url,item])).values()].slice(0,8)
  const fetched=await Promise.all(unique.map(item=>fetchOfficialSource(item,domains,fetchImpl)))
  return new Map(fetched.filter(Boolean).map(item=>[item.url,item]))
}
