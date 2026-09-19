const normalize = value => String(value || '').trim().replace(/\s+/gu, ' ')
const belongsToCase = (entry, item) => entry.case_id === item?.id && (!item?.owner_id || entry.owner_id === item.owner_id)

export function currentAssessments(assessments = []) {
  const replaced = new Set(assessments.map(item => item.supersedes_assessment_id).filter(Boolean))
  return assessments.filter(item => !replaced.has(item.id))
}

export function assessmentEvidence(assessment, documents = []) {
  if (!assessment?.source_document_id) return {status: 'missing', document: null}
  const document = documents.find(item => item.id === assessment.source_document_id && item.case_id === assessment.case_id && (!assessment.owner_id || item.owner_id === assessment.owner_id))
  if (!document) return {status: 'missing', document: null}
  const snapshot = Date.parse(assessment.source_document_updated_at)
  const current = Date.parse(document.updated_at)
  if (!Number.isFinite(snapshot) || !Number.isFinite(current) || snapshot !== current) return {status: 'stale', document}
  const excerpt = normalize(assessment.source_excerpt)
  const matched = excerpt.length > 0 && normalize(document.extracted_text).includes(excerpt)
  const reviewed = assessment.source_reviewed_at && normalize(assessment.source_locator) && matched
  return {status: reviewed ? 'reviewed' : 'pending', document}
}

export function caseEvidenceStatus(item, documents = [], assessments = []) {
  const scoped = documents.filter(document => belongsToCase(document, item))
  const current = currentAssessments(assessments.filter(assessment => belongsToCase(assessment, item)))
  const entries = current.map(assessment => ({assessment, ...assessmentEvidence(assessment, scoped)}))
  const uncovered = scoped.filter(document => !entries.some(entry => entry.document?.id === document.id && entry.status === 'reviewed'))
  return {current, entries, uncovered, complete: scoped.length > 0 && entries.length > 0 && !uncovered.length && entries.every(entry => entry.status === 'reviewed')}
}

// Source review is a workflow state, never a legal success probability.
export function caseGuidance({item, documents = [], assessments = [], deadlineStatus = 'uncertain', deadlineDocument = null}) {
  const state = caseEvidenceStatus(item, documents, assessments)
  if (['overdue', 'immediate', 'high'].includes(deadlineStatus)) {
    const document = documents.find(entry => entry.id === deadlineDocument?.id && entry.case_id === item?.id && (!item?.owner_id || entry.owner_id === item.owner_id))
    return {kind: 'deadline', target: document ? 'document' : 'edit', document, state}
  }
  const scoped = documents.filter(document => belongsToCase(document, item))
  if (!scoped.length) return {kind: 'upload', target: 'upload', state}
  const unread = scoped.find(document => !normalize(document.extracted_text))
  if (unread) return {kind: 'read', target: 'document', document: unread, state}
  const outdated = state.entries.find(entry => entry.status === 'stale')
  if (outdated) return {kind: 'stale', target: 'assessment', ...outdated, state}
  const pending = state.entries.find(entry => entry.status !== 'reviewed')
  if (pending) return {kind: 'pending', target: 'assessment', ...pending, state}
  if (state.uncovered.length) return {kind: 'newDocument', target: 'assessment', document: state.uncovered[0], state}
  const rank = {red: 0, yellow: 1, white: 2, green: 3}
  const actionable = [...state.current].filter(entry => normalize(entry.next_step)).sort((a, b) => (rank[a.traffic_light] ?? 4) - (rank[b.traffic_light] ?? 4))[0]
  return {kind: 'next', target: actionable ? 'assessment' : 'edit', assessment: actionable, action: actionable?.next_step || item?.next_action || '', state}
}
