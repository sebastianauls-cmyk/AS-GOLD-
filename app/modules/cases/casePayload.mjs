export function normalizeCasePayload(draft){
  return {
    client_id:draft.client_id||null,
    title:draft.title.trim(),
    reference_no:draft.reference_no.trim()||null,
    goal:draft.goal.trim()||null,
    summary:draft.summary.trim()||null,
    deadline_at:draft.deadline_at?new Date(draft.deadline_at).toISOString():null,
    next_action:draft.next_action.trim()||null,
    home_country:String(draft.home_country||'DE').toUpperCase(),
    target_country:String(draft.target_country||'DE').toUpperCase(),
    test_case_id:draft.test_case_id||null,
    test_case_expected_ampel:draft.test_case_expected_ampel||null,
    test_case_language:draft.test_case_language||null,
    status:draft.status||'open'
  }
}
