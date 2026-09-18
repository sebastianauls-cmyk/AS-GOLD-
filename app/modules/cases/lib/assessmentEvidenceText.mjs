import { assessmentEvidence, currentAssessments } from './caseEvidence.mjs'
import { caseGuidanceCopy } from './caseGuidanceCopy.mjs'

export function assessmentEvidenceText(assessment,documents,language='de',assessments=[]) {
  const c=caseGuidanceCopy(language)
  const evidence=assessmentEvidence(assessment,documents)
  const current=new Set(currentAssessments(assessments).map(entry=>entry.id))
  return [
    assessments.length&&!current.has(assessment.id)?c.history:'',
    `${c.progress}: ${c[evidence.status]}`,
    `${c.kind}: ${c[assessment.statement_kind]||c.unknown}`,
    `${c.source}: ${assessment.source_title_snapshot||'—'}`,
    `${c.locator}: ${assessment.source_locator||'—'}`,
    `${c.excerpt}: ${assessment.source_excerpt||'—'}`,
    assessment.source_reviewed_at?`${c.reviewed}: ${assessment.source_reviewed_at}`:'',
    c.boundary
  ].filter(Boolean).join('\n')
}
