import { roadmapFingerprint, roadmapSource } from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import { roadmapUi } from '../cases/lib/customerRoadmapCopy.mjs'

// Exports read the saved result and current originals, rather than relying on
// the workspace list or whichever report happens to be open in another panel.
async function ownedRows(supabase,table,ownerId,caseId){
  const rows=[]
  for(let offset=0;;offset+=500){
    let query=supabase.from(table).select('*').eq('owner_id',ownerId).order('id')
    if(caseId)query=query.eq('case_id',caseId)
    const {data,error}=await query.range(offset,offset+499)
    if(error)throw error
    rows.push(...(data||[]))
    if((data||[]).length<500)return rows
  }
}

export async function loadCaseExportData(supabase,{ownerId,caseId,language='de'}){
  const ui=roadmapUi(language)
  if(!ownerId||!caseId)throw new Error(ui.error)
  const [itemResult,roadmapResult,documents,assessments,sourceStatus,approvals]=await Promise.all([
    supabase.from('cases').select('*').eq('id',caseId).eq('owner_id',ownerId).maybeSingle(),
    supabase.from('case_roadmaps').select('*').eq('case_id',caseId).eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(1),
    ...['documents','assessments','source_status','approvals'].map(table=>ownedRows(supabase,table,ownerId,caseId))
  ])
  if(itemResult.error)throw itemResult.error
  if(roadmapResult.error)throw roadmapResult.error
  const item=itemResult.data,roadmap=roadmapResult.data?.[0]||null
  if(!item||item.owner_id!==ownerId)throw new Error(ui.error)
  if(roadmap){
    if(roadmap.owner_id!==ownerId||roadmap.case_id!==caseId)throw new Error(ui.error)
    if(roadmap.source_fingerprint!==await roadmapFingerprint(roadmapSource(item,documents,assessments)))throw new Error(ui.stale)
  }
  return {ref:{kind:'case',item},data:{documents,assessments,sourceStatus,approvals},roadmap,
    outputLanguage:roadmap?.output_language||language}
}

export async function loadAccountExportData(supabase,ownerId){
  if(!ownerId)throw new Error('Missing account')
  const tables=['cases','clients','documents','assessments','source_status','approvals','case_roadmaps','legal_comparisons']
  const values=await Promise.all(tables.map(table=>ownedRows(supabase,table,ownerId)))
  return Object.fromEntries(tables.map((table,index)=>[table,values[index]]))
}
