export const EVIDENCE_ACTION_LAYER_VERSION='v93'

const AMPEL=Object.freeze({
  green:'🟢',
  yellow:'🟡',
  red:'🔴',
  white:'⚪'
})

function list(value){return Array.isArray(value)?value.filter(Boolean):[]}
function uniq(values=[]){return [...new Set(values.map(String).filter(Boolean))]}

function evidenceSources(record={}){
  return uniq([
    ...list(record.official_sources),
    ...list(record.court_sources),
    ...list(record.authority_sources),
    ...list(record.entry_sources),
    ...list(record.residence_sources)
  ])
}

export function evidenceConfidence(record={}){
  const sources=evidenceSources(record)
  const ready=record.status==='ready'
  const sourceReviewed=!!record.source_reviewed_at
  const baseline=!!record.baseline_checked_at
  const entryOk=!!record.entry_requirements_verified
  const residenceOk=!!record.residence_requirements_verified
  let score=0
  if(ready) score+=30
  if(sourceReviewed) score+=15
  if(baseline) score+=20
  score+=Math.min(20,sources.length*2)
  if(entryOk) score+=7.5
  if(residenceOk) score+=7.5
  score=Math.round(Math.min(100,score))
  const level=score>=80?'high':score>=55?'medium':'low'
  return {score,level,sources}
}

export function buildEvidenceActionResult({
  language='de',
  homeCountry=null,
  targetCountry=null,
  topic=null,
  targetRecord={},
  comparisonRows=[],
  nextActions=[]
}={}){
  const confidence=evidenceConfidence(targetRecord)
  const verified=targetRecord.status==='ready' && confidence.level==='high'
  const rows=list(comparisonRows).map(row=>({
    ...row,
    ampel:row.ampel||AMPEL.white,
    source_status:verified?'verified':'needs_review'
  }))
  const gaps=[]
  if(targetRecord.status!=='ready') gaps.push('country_not_ready')
  if(!targetRecord.baseline_checked_at) gaps.push('baseline_missing')
  if(!targetRecord.source_reviewed_at) gaps.push('source_review_missing')
  if(!targetRecord.entry_requirements_verified) gaps.push('entry_requirements_unverified')
  if(!targetRecord.residence_requirements_verified) gaps.push('residence_requirements_unverified')
  if(confidence.sources.length===0) gaps.push('sources_missing')

  const ampel=gaps.length===0?AMPEL.green:(targetRecord.status==='setup_required'||confidence.sources.length===0?AMPEL.red:AMPEL.yellow)
  const actions=uniq(nextActions)

  return {
    version:EVIDENCE_ACTION_LAYER_VERSION,
    language,
    home_country:homeCountry,
    target_country:targetCountry,
    topic,
    ampel,
    confidence,
    verified,
    comparison_rows:rows,
    source_provenance:confidence.sources,
    gaps,
    next_actions:actions,
    user_message:verified
      ?'Die Aussage ist auf dem aktuell geprüften Länderprofil aufgebaut. Quellen und Prüfstatus bleiben sichtbar.'
      :'Für diese Aussage fehlen noch vollständig geprüfte Grundlagen. Fehlende Punkte werden sichtbar markiert und nicht als gesichert dargestellt.',
    rules:Object.freeze({
      source_required:true,
      confidence_required:true,
      visible_gaps_required:true,
      action_required:true,
      no_unverified_legal_claims:true,
      language_does_not_change_country:true
    })
  }
}

export function evidenceActionContract(){
  return {
    version:EVIDENCE_ACTION_LAYER_VERSION,
    purpose:'Evidence-backed cross-country explanation with visible provenance, confidence, gaps and concrete next actions.',
    ampel:AMPEL,
    differentiator:'AS Workspace Gold verbindet Quellenprüfung mit verständlicher Ländererklärung und direkt umsetzbarer Handlung.'
  }
}
