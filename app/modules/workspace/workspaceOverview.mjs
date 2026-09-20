import {assessmentEvidence,currentAssessments} from '../cases/lib/caseEvidence.mjs'
import {buildDeadlineOverview,deadlineTimestamp} from '../cases/deadlineCases.mjs'

// Derive tasks from the signed-in user's loaded records. Colour alone and a
// saved AI draft never establish a checked document or a confirmed deadline.
export function workspaceOverview(data={},now=new Date()){
  const cases=data.cases||[],documents=data.documents||[],approvals=data.approvals||[]
  const verified=new Set(currentAssessments(data.assessments||[]).filter(item=>assessmentEvidence(item,documents).status==='reviewed').map(item=>item.source_document_id))
  const reviewDocuments=documents.filter(item=>!verified.has(item.id))
  const unread=reviewDocuments.filter(item=>!String(item.extracted_text||'').trim())
  const pendingApprovals=approvals.filter(item=>item.status==='pending')
  const deadlines=buildDeadlineOverview(cases,documents)
  const urgent=deadlines.dated.find(item=>deadlineTimestamp(item.deadline_at)<=now.getTime()+2*86400000)
  const recentCases=[...cases].sort((a,b)=>(Date.parse(b.updated_at||b.created_at)||0)-(Date.parse(a.updated_at||a.created_at)||0)).slice(0,3)
  let next
  if(urgent)next={kind:'deadline',item:urgent}
  else if(pendingApprovals.length)next={kind:'approval',item:pendingApprovals[0]}
  else if(unread.length)next={kind:'read',item:unread[0]}
  else if(reviewDocuments.length)next={kind:'review',item:reviewDocuments[0]}
  else if(recentCases.length)next={kind:'case',item:recentCases[0]}
  else next={kind:'create',item:null}
  return {cases,documents,reviewDocuments,pendingApprovals,deadlines,recentCases,next}
}
