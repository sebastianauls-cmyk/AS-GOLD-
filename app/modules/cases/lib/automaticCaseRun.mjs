import { roadmapSource } from '../../../../supabase/functions/_shared/customerRoadmap.mjs'

function runScope({ownerId,item,documents,assessments=[],outputLanguage,referenceLanguage=outputLanguage}) {
  const originals=documents.filter(doc=>doc.case_id===item.id).sort((a,b)=>a.id.localeCompare(b.id)).map(doc=>[doc.id,doc.owner_id,doc.file_path])
  return JSON.stringify([ownerId,item.id,item.owner_id,outputLanguage,referenceLanguage,originals,roadmapSource(item,documents,assessments)])
}

// A consented upload hands off one run in this mounted workspace. This is not a
// remembered permission: navigation, reloads and subsequent uploads cannot replay it.
export function createAutomaticCaseRun(input) {
  const scope=runScope(input)
  let pending=true
  return {
    caseId:input.item.id,
    ownerId:input.ownerId,
    claim(current) {
      if(!pending)return 'consumed'
      pending=false
      return runScope(current)===scope?'ready':'changed'
    },
    cancel(){pending=false}
  }
}
