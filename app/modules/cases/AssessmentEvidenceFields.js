'use client'

import { caseGuidanceCopy } from './lib/caseGuidanceCopy.mjs'

export function AssessmentEvidenceFields({language,caseId,documents,assessment,setAssessment}) {
  const c=caseGuidanceCopy(language)
  const update=patch=>setAssessment(current=>({...current,...patch,source_reviewed:false}))
  const source=documents.find(document=>document.id===assessment.source_document_id)
  const id=name=>`${caseId}-evidence-${name}`
  return <fieldset className="assessmentEvidenceFields">
    <legend>{c.source}</legend>
    <label htmlFor={id('document')}>{c.source}<select id={id('document')} value={assessment.source_document_id||''} onChange={event=>update({source_document_id:event.target.value,source_excerpt:'',source_locator:''})}><option value="">—</option>{documents.map(document=><option key={document.id} value={document.id}>{document.title}</option>)}</select></label>
    <label htmlFor={id('kind')}>{c.kind}<select id={id('kind')} value={assessment.statement_kind||'inference'} onChange={event=>update({statement_kind:event.target.value})}>{['content','party','inference','unknown'].map(kind=><option key={kind} value={kind}>{c[kind]}</option>)}</select></label>
    {source&&<>
      <label htmlFor={id('locator')}>{c.locator}<input id={id('locator')} value={assessment.source_locator||''} onChange={event=>update({source_locator:event.target.value})} required={assessment.source_reviewed}/></label>
      <label htmlFor={id('excerpt')}>{c.excerpt}<textarea id={id('excerpt')} rows={4} value={assessment.source_excerpt||''} onChange={event=>update({source_excerpt:event.target.value})} required={assessment.source_reviewed}/></label>
      <details><summary>{c.content}</summary><p style={{whiteSpace:'pre-wrap',maxHeight:240,overflow:'auto'}}>{source.extracted_text||c.read}</p></details>
      <label className="documentPrivacyConfirm"><input type="checkbox" checked={!!assessment.source_reviewed} disabled={!assessment.source_excerpt?.trim()||!assessment.source_locator?.trim()||!source.extracted_text?.trim()} onChange={event=>setAssessment(current=>({...current,source_reviewed:event.target.checked}))}/><span>{c.confirm}</span></label>
    </>}
    <p className="analysisManualNote">{c.boundary}</p>
  </fieldset>
}
