import {ModelWorkflowError} from './modelQuality.mjs'
import {openRetainedCaseWork,sealRetainedCaseWork} from './retainedCaseWork.mjs'

// Reusable draft responses, never review approvals or job capabilities. Every
// hit passes the CURRENT stage validators again. Discovery can be reused only
// for the exact dated search request; its URLs are fetched again by advance().
// Source bodies, corrections and independent review approvals are not cached.
const stages=new Set(['planning','analysis_generation','generation'])
const discoveryStages=new Set(['research','research_recovery'])
const domain='ash-validated-case-response-v1'
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value
const unavailable=()=>new ModelWorkflowError('Bereits erarbeitete Teilergebnisse konnten nicht sicher geladen oder gespeichert werden. Der Auftrag wurde angehalten.',503,'retained_work_unavailable')
const eligible=(request,stage)=>{
  if(stages.has(stage))return !request.tools?.length
  if(!discoveryStages.has(stage)||request.tools?.length!==1||request.tools[0].type!=='web_search')return false
  try{
    const input=JSON.parse(request.input)
    return /^\d{4}-\d{2}-\d{2}$/.test(input.review_date)&&Array.isArray(input.research_topics)&&input.research_topics.length>0
  }catch{return false}
}

export function caseResponseCache({client,job,secret,onReuse}){
  const pending=new Map()
  const binding=async(request,stage)=>{
    const context={domain,owner:job.owner_id,case:job.case_id,fingerprint:job.source_fingerprint,
      options:job.request,stage,request:{...request,service_tier:request.service_tier??'auto',store:false}}
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(context))))
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
  }
  const rpc=async(name,args)=>{
    const {data,error}=await client.rpc(name,{p_job_id:job.id,p_lease:job.lease,...args})
    if(error||!data)throw unavailable()
    return data
  }
  return {
    async read(request,stage){
      if(!eligible(request,stage))return null
      const key=await binding(request,stage)
      const saved=await rpc('read_case_response_cache',{p_cache_key:key})
      if(!saved.ciphertext)return null
      const result=await openRetainedCaseWork({token:saved.ciphertext,binding:domain+':'+key,secret,originJobId:saved.origin_job_id})
      if(result.response?.status!=='completed'||result.response_id!==saved.response_id||result.response?.id!==saved.response_id||!result.parsed||typeof result.parsed!=='object')throw unavailable()
      onReuse?.({stage,response_id:result.response_id,origin_job_id:saved.origin_job_id})
      return {...result,reused:true}
    },
    async remember(request,stage,result){
      if(!eligible(request,stage))return
      // Copy before the stage's validators mutate or assemble the response.
      pending.set(await binding(request,stage),{stage,result:structuredClone(result)})
    },
    async commit(){
      // Called only AFTER advance() validates the whole step and the worker
      // confirms that the source fingerprint is still unchanged.
      for(const [key,{stage,result}] of pending){
        const ciphertext=await sealRetainedCaseWork({state:result,binding:domain+':'+key,secret,originJobId:job.id})
        await rpc('save_case_response_cache',{p_cache_key:key,p_stage:stage,p_response_id:result.response_id,p_ciphertext:ciphertext})
      }
      pending.clear()
    }
  }
}
