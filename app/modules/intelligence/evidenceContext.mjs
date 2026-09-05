export function selectEvidenceContext(data={}){
  const assessments=Array.isArray(data.assessments)?data.assessments:[]
  const sourceStatus=Array.isArray(data.sourceStatus)?data.sourceStatus:[]
  const latest=assessments[0]||null
  const caseId=latest?.case_id||sourceStatus.find(Boolean)?.case_id||null
  return {latest,caseId,sources:sourceStatus.filter(source=>source?.case_id===caseId)}
}
