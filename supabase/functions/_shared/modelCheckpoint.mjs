import { ModelWorkflowError } from './modelQuality.mjs'

const encoder=new TextEncoder(),MAX_BYTES=500000,TTL_MS=15*60*1000
const domain='ash-reviewed-model-checkpoint-v1'
function encode(bytes) {let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function decode(value) {const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0));if(encode(bytes)!==value)throw Error('non-canonical encoding');return bytes}
async function keyFor(secret) {
  if(typeof secret!=='string'||secret.length<32)throw new ModelWorkflowError('Die sichere Fortsetzung ist nicht eingerichtet.',503)
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveKey'])
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode(domain),info:encoder.encode('roadmap')},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
}
export async function sealModelCheckpoint({state,binding,secret,issuedAt=Date.now(),now=Date.now()}) {
  if(now-issuedAt>TTL_MS)throw new ModelWorkflowError('Die Erstellung ist abgelaufen. Bitte neu starten.',409)
  const bytes=encoder.encode(JSON.stringify({state,issuedAt}))
  if(bytes.length>MAX_BYTES)throw new ModelWorkflowError('Der Zwischenstand ist zu groß. Bitte den Fall sachlich aufteilen.',413)
  const iv=crypto.getRandomValues(new Uint8Array(12))
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(binding))},await keyFor(secret),bytes)
  return encode(iv)+'.'+encode(new Uint8Array(data))
}
export async function openModelCheckpoint({token,binding,secret,now=Date.now()}) {
  try {
    if(typeof token!=='string'||token.length>700000||!/^[-\w]+\.[-\w]+$/u.test(token))throw Error('format')
    const [iv,data]=token.split('.').map(decode)
    if(iv.length!==12||data.length>MAX_BYTES+16)throw Error('size')
    const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify(binding))},await keyFor(secret),data)
    const payload=JSON.parse(new TextDecoder().decode(bytes))
    if(!Number.isFinite(payload.issuedAt)||payload.issuedAt>now||now-payload.issuedAt>TTL_MS)throw Error('expired')
    return payload
  } catch {throw new ModelWorkflowError('Der Zwischenstand ist ungültig, abgelaufen oder die Fallgrundlage hat sich geändert. Bitte neu erstellen.',409)}
}
