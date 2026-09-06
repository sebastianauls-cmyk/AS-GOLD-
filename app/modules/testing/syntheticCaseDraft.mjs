export function buildSyntheticCaseDraft(tester){
  if(!tester)return null
  return {
    title:`${tester.id} · ${tester.problem}`,
    reference_no:`TEST-${tester.id}`,
    goal:tester.problem,
    summary:`${tester.profile}\n${tester.home_country} → ${tester.target_country}\n${tester.documents.join(' · ')}`,
    next_action:tester.expected_actions?.[0]||'',
    home_country:String(tester.home_country||'DE').toUpperCase(),
    target_country:String(tester.target_country||'DE').toUpperCase(),
    test_case_id:tester.id,
    test_case_expected_ampel:tester.expected_ampel,
    test_case_language:tester.language,
    test_case_home_country:tester.home_country,
    test_case_target_country:tester.target_country
  }
}
