export function createApprovalRecord(supabase,{ownerId,draft,linkedDocument}){
  const payload={owner_id:ownerId,case_id:draft.case_id,document_id:draft.document_id||null,approval_type:draft.approval_type,status:'pending',recipient:draft.recipient.trim()||null,subject:draft.subject.trim(),body:draft.body.trim(),attachment_names:linkedDocument?[linkedDocument.title]:[],preview_required:true}
  return supabase.from('approvals').insert(payload).select().single()
}

export async function updateApprovalRecord(supabase,{ownerId,approvalId,current,draft}){
  const next={recipient:draft.recipient.trim()||null,subject:draft.subject.trim(),body:draft.body.trim()}
  const contentChanged=(current.recipient||null)!==next.recipient||(current.subject||'')!==next.subject||(current.body||'')!==next.body
  const payload={...next}
  if(contentChanged&&current.status==='rejected')Object.assign(payload,{status:'pending',approved_at:null,approved_revision:null})
  const result=await supabase.from('approvals').update(payload).eq('id',approvalId).eq('owner_id',ownerId).eq('preview_revision',current.preview_revision).select().maybeSingle()
  const invalidated=!!result.data&&current.status==='approved'&&result.data.status==='pending'
  return {data:result.data||null,error:result.error||null,invalidated}
}

export function approveApprovalRecord(supabase,{ownerId,item}){
  return supabase.from('approvals').update({status:'approved',approved_at:new Date().toISOString(),approved_revision:item.preview_revision,invalidated_at:null}).eq('id',item.id).eq('owner_id',ownerId).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
}

export function rejectApprovalRecord(supabase,{ownerId,item}){
  return supabase.from('approvals').update({status:'rejected',approved_at:null,approved_revision:null}).eq('id',item.id).eq('owner_id',ownerId).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
}
