import { analyzeDeadlines } from './deadlineIntelligence.mjs'

// Analyse each original separately so a deadline cue in one document cannot
// turn an ordinary date from another document into a deadline.
export function analyzeCaseDeadlines(item,documents=[],now=new Date()){
  const caseResult=analyzeDeadlines({caseDeadline:item?.deadline_at||'',now})
  const results=[caseResult]
  for(const document of documents){
    if(document.case_id!==item?.id||(item?.owner_id&&document.owner_id!==item.owner_id))continue
    const result=analyzeDeadlines({text:document.extracted_text||'',now})
    if(result.primary)results.push({...result,document})
  }
  const dated=results.filter(result=>result.primary)
    .sort((left,right)=>left.primary.date.localeCompare(right.primary.date))
  if(!dated.length)return caseResult
  return {...dated[0],candidates:results.reduce((sum,result)=>sum+result.candidates,0)}
}
