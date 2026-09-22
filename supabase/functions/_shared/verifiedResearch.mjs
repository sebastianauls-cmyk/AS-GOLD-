import { PRIMARY_SOURCE_CACHE } from './primarySourceCache.mjs'
const SNAPSHOT_URL='https://raw.githubusercontent.com/sebastianauls-cmyk/AS-GOLD-/main/supabase/functions/_shared/primarySourceCache.json'
const snapshots=new WeakMap()
// The daily refresh updates this public JSON independently of edge deployments.
// A failed read can use the bundled snapshot only while its observed date is fresh.
export async function loadPrimarySources(fetchImpl=fetch){
  const previous=snapshots.get(fetchImpl)
  if(previous&&Date.now()-previous.at<60000)return previous.promise
  const promise=(async()=>{
    try{
      const response=await fetchImpl(SNAPSHOT_URL,{redirect:'error',signal:AbortSignal.timeout(5000),headers:{Accept:'application/json'}})
      if(!response.ok||Number(response.headers.get('content-length'))>300000){await response.body?.cancel();return PRIMARY_SOURCE_CACHE}
      const reader=response.body?.getReader();if(!reader)return PRIMARY_SOURCE_CACHE
      const parts=[];let length=0
      while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>300000){await reader.cancel();return PRIMARY_SOURCE_CACHE}parts.push(value)}
      const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
      const data=JSON.parse(new TextDecoder().decode(bytes))
      if(!Array.isArray(data)||data.length>60)return PRIMARY_SOURCE_CACHE
      const valid=data.filter(item=>item&&typeof item.url==='string'&&typeof item.title==='string'&&typeof item.source_text==='string'&&item.source_text.length>=100&&item.source_text.length<=64000&&typeof item.checked_at==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(item.checked_at)&&/^[a-f0-9]{64}$/.test(item.content_sha256)&&item.retrieval_mode==='verified_snapshot')
      return [...new Map([...PRIMARY_SOURCE_CACHE,...valid].map(item=>[item.url,item])).values()]
    }catch{return PRIMARY_SOURCE_CACHE}
  })()
  snapshots.set(fetchImpl,{at:Date.now(),promise});return promise
}
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

// Discovery is not verification. A proposed official URL may be fetched even
// when the search response only reports opening another page. It supports no
// statement until readable text was fetched and the content review passed.
export function researchSourceCandidates(proposed,searched,domains) {
  const candidates=new Map(searched)
  for(const source of Array.isArray(proposed)?proposed:[]) {
    const url=officialUrl(source?.url,domains)
    if(url&&!candidates.has(url))candidates.set(url,{url,title:String(source.title||url).slice(0,260)})
  }
  return candidates
}

export function primarySourceCatalogue(domains,now=Date.now(),records=PRIMARY_SOURCE_CACHE) {
  // Compare UTC dates because the refresh runner and edge clocks can differ.
  // A failed scheduled refresh never renews a source's observed date.
  const today=Date.parse(new Date(now).toISOString().slice(0,10))
  return records.filter(item=>{const day=Date.parse(item.checked_at.slice(0,10));return officialUrl(item.url,domains)&&day<=today&&today-day<=86400000})
    .map(({url,title,checked_at})=>({url,title,checked_at}))
}
async function cachedSource(url,domains,maxChars,records){
  if(!primarySourceCatalogue(domains,Date.now(),records).some(item=>item.url===url))return null
  const item=records.find(item=>item.url===url)
  const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('')
  if(await hash(item.source_text)!==item.content_sha256)return null
  const source_text=item.source_text.slice(0,maxChars)
  return {...item,source_text,truncated:source_text.length<item.source_text.length,content_sha256:await hash(source_text)}
}

// A selected provision often needs its tariff, eligibility or procedure. Some
// operative rules are in a separate implementing act: § 55 SGB XI alone still
// prints 3.4%, while PBAV 2025 § 1 sets the rate from 2025. Supply that fetched
// text and its commencement clause, not a hard-coded rate or case conclusion.
// Freshness, content hashes and the country allowlist apply to every dependency.
const SUPPORTING_ACTS={sgb_11:['pbav_2025']}
export async function supportingPrimaryEvidence(selectedUrls,domains,records){
  const act=url=>{try{const parsed=new URL(url);return parsed.hostname==='www.gesetze-im-internet.de'?/^\/([a-z0-9_]+)\/__[a-z0-9]+\.html$/.exec(parsed.pathname)?.[1]:null}catch{return null}}
  const acts=new Set(selectedUrls.map(act).filter(Boolean))
  for(const selected of [...acts])for(const related of SUPPORTING_ACTS[selected]||[])acts.add(related)
  const relevant=primarySourceCatalogue(domains,Date.now(),records).filter(item=>acts.has(act(item.url)))
  return (await Promise.all(relevant.map(item=>cachedSource(item.url,domains,22000,records)))).filter(Boolean)
}

const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß',sect:'§',ndash:'–',mdash:'—'}
export function readableSourceText(body,type) {
  let source=body
  if(type!=='text/plain') {
    source=source.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/giu,' ')
    // Keep substantive text ahead of large government navigation trees. The
    // source hash refers to precisely this extracted, possibly truncated text.
    source=/<main\b[^>]*>([\s\S]*?)<\/main\s*>/iu.exec(source)?.[1]||source
    const contentStart=/<(?:div|section)\b[^>]*\bid=["'](?:content|main-content|mainContent)["'][^>]*>/iu.exec(source)
    if(contentStart)source=source.slice(contentStart.index)
    source=source.replace(/<(nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/giu,' ').replace(/<[^>]+>/gu,' ')
  }
  return source.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu,(whole,entity)=>{
    if(entity[0]!=='#') return entities[entity]??whole
    const code=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10)
    return Number.isInteger(code)&&code>0&&code<=0x10ffff?String.fromCodePoint(code):whole
  }).replace(/\s+/gu,' ').trim()
}

async function fetchOfficialSource(item,domains,fetchImpl,maxChars=48000) {
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
    if(fullText.length<100||/verifying your browser|radware page|security check|access denied/iu.test(fullText.slice(0,250))) return null
    const retrievedText=fullText.slice(0,maxChars)
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(retrievedText))
    const title=type==='text/plain'?new URL(current).hostname:readableSourceText(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/iu.exec(markup)?.[1]||'','text/html').slice(0,260)||new URL(current).hostname
    return {url:original,final_url:current,title,source_text:retrievedText,truncated:fullText.length>retrievedText.length,checked_at:new Date().toISOString(),content_sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}
  } catch {return null}
}

export async function retrieveOfficialEvidence(items,domains,{fetchImpl=fetch,maxSources=8,maxChars=48000,snapshotRecords=[]}={}) {
  const unique=[...new Map(items.map(item=>[item.url,item])).values()].slice(0,Math.min(maxSources,20))
  const fetched=await Promise.all(unique.map(async item=>await fetchOfficialSource(item,domains,fetchImpl,Math.min(maxChars,48000))||await cachedSource(item.url,domains,Math.min(maxChars,48000),snapshotRecords)))
  return new Map(fetched.filter(Boolean).map(item=>[item.url,item]))
}
