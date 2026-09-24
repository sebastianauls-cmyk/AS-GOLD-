import {ModelWorkflowError} from './modelQuality.mjs'

// A separate encrypted envelope, never a renewed job capability/checkpoint.
// The deployment and complete model context (including review date) must match.
const encoder=new TextEncoder(),MAX_BYTES=500000,TTL_MS=24*60*60*1000
const domain='ash-retained-case-work-v1'
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value
function encode(bytes){let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function decode(value){const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0));if(encode(bytes)!==value)throw Error('encoding');return bytes}
const unavailable=()=>new ModelWorkflowError('Der gesicherte Arbeitsstand ist derzeit nicht verfügbar. Die Verarbeitung wurde angehalten; kein neues Ergebnis gespeichert.',503,'retained_work_unavailable')
async function keyFor(secret){
  if(typeof secret!=='string'||secret.length<32)throw unavailable()
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveKey'])
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode(domain),info:encoder.encode('case-work')},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
}
export async function sealRetainedCaseWork({state,binding,secret,originJobId,now=Date.now()}){
  const bytes=encoder.encode(JSON.stringify({state,savedAt:now,originJobId}))
  if(bytes.length>MAX_BYTES)throw new ModelWorkflowError('Der Arbeitsstand ist zu groß für eine sichere Speicherung.',413,'retained_work_invalid')
  const iv=crypto.getRandomValues(new Uint8Array(12))
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(binding)},await keyFor(secret),bytes)
  return encode(iv)+'.'+encode(new Uint8Array(data))
}
export async function openRetainedCaseWork({token,binding,secret,originJobId,now=Date.now()}){
  try{
    if(typeof token!=='string'||token.length>700000||!/^[-\w]+\.[-\w]+$/u.test(token))throw Error('format')
    const [iv,data]=token.split('.').map(decode)
    if(iv.length!==12||data.length>MAX_BYTES+16)throw Error('size')
    const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(binding)},await keyFor(secret),data)
    const payload=JSON.parse(new TextDecoder().decode(bytes))
    if(!Number.isFinite(payload.savedAt)||payload.savedAt>now||now-payload.savedAt>=TTL_MS||payload.originJobId!==originJobId||!payload.state||typeof payload.state!=='object'||Array.isArray(payload.state))throw Error('expired or invalid')
    return payload.state
  }catch{throw new ModelWorkflowError('Der gespeicherte Arbeitsstand konnte nicht sicher übernommen werden. Kein neues Ergebnis gespeichert.',409,'retained_work_invalid')}
}
export async function retainedCaseWork({client,job,secret,namespace,request,reviewContent}){
  if(typeof namespace!=='string'||!namespace.trim())throw unavailable()
  const context=JSON.stringify(canonical({domain,namespace,owner:job.owner_id,case:job.case_id,fingerprint:job.source_fingerprint,request:job.request,modelRequest:request,reviewContent}))
  const binding=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(context))),byte=>byte.toString(16).padStart(2,'0')).join('')
  const call=async(name,extra={})=>{
    const {data,error}=await client.rpc(name,{p_job_id:job.id,p_lease:job.lease,p_cache_key:binding,...extra})
    if(error||!data)throw unavailable()
    return data
  }
  return {
    async restore(){
      const saved=await call('read_retained_case_work')
      return saved.ciphertext?openRetainedCaseWork({token:saved.ciphertext,binding,secret,originJobId:saved.origin_job_id}):null
    },
    async save(state){
      const ciphertext=await sealRetainedCaseWork({state,binding,secret,originJobId:job.id})
      await call('save_retained_case_work',{p_ciphertext:ciphertext})
    }
  }
}
