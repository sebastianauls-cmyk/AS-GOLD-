import { normalizeImprovementProposal, MONITOR_KINDS } from './continuousImprovementRegistry.mjs'

export const LEGAL_MONITOR_SOURCE_RULES=Object.freeze({
  preferPrimarySources:true,
  requireSourceUrl:true,
  requireDecisionOrChangeDate:true,
  requireCountryContext:true,
  noAutomaticLegalRuleReplacement:true,
  noAutomaticProductionChange:true
})

export function buildLegalMonitorProposal({countryCode,title,finding,impact,recommendation,sourceUrls,evidence={},priority='medium',implementationScope=[]}){
  return normalizeImprovementProposal({
    monitor_kind:MONITOR_KINDS.legal,
    country_code:countryCode,
    title,
    finding,
    impact,
    recommendation,
    source_urls:sourceUrls,
    evidence:{...evidence,source_rules:LEGAL_MONITOR_SOURCE_RULES},
    priority,
    implementation_scope:implementationScope
  })
}

export function legalMonitorCheckPlan(countryContext){
  if(!countryContext?.code) throw new Error('Country context required')
  return {
    monitor_kind:MONITOR_KINDS.legal,
    country_code:countryContext.code,
    jurisdiction:countryContext.jurisdiction,
    topics:['new_case_law','statutory_changes','regulatory_guidance','procedural_deadlines','authority_process_changes'],
    result:'proposal_only',
    implementation:'requires_explicit_approval'
  }
}
