import { normalizeImprovementProposal, implementationTaskFromProposal } from './continuousImprovementRegistry.mjs'

export async function createImprovementProposal(supabase,{ownerId,proposal}){
  const normalized=normalizeImprovementProposal(proposal)
  return supabase.from('improvement_proposals').insert({owner_id:ownerId,...normalized,status:'pending'}).select().single()
}

export function listImprovementProposals(supabase,{ownerId,status}){
  let query=supabase.from('improvement_proposals').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false})
  if(status) query=query.eq('status',status)
  return query
}

export function approveImprovementProposal(supabase,{ownerId,proposalId}){
  const approvedAt=new Date().toISOString()
  return supabase.from('improvement_proposals').update({status:'approved',approved_at:approvedAt,rejected_at:null,updated_at:approvedAt}).eq('id',proposalId).eq('owner_id',ownerId).eq('status','pending').select().single()
}

export function rejectImprovementProposal(supabase,{ownerId,proposalId}){
  const rejectedAt=new Date().toISOString()
  return supabase.from('improvement_proposals').update({status:'rejected',rejected_at:rejectedAt,approved_at:null,updated_at:rejectedAt}).eq('id',proposalId).eq('owner_id',ownerId).eq('status','pending').select().single()
}

export async function prepareApprovedImplementation(supabase,{ownerId,proposalId}){
  const {data,error}=await supabase.from('improvement_proposals').select('*').eq('id',proposalId).eq('owner_id',ownerId).eq('status','approved').single()
  if(error) return {data:null,error}
  try{return {data:implementationTaskFromProposal(data),error:null}}
  catch(cause){return {data:null,error:cause}}
}

export function markImprovementImplemented(supabase,{ownerId,proposalId,implementationRef}){
  if(!implementationRef) throw new Error('Implementation reference required')
  const implementedAt=new Date().toISOString()
  return supabase.from('improvement_proposals').update({status:'implemented',implementation_ref:String(implementationRef),implemented_at:implementedAt,updated_at:implementedAt}).eq('id',proposalId).eq('owner_id',ownerId).eq('status','approved').select().single()
}
