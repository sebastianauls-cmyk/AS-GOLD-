import { normalizeImprovementProposal, MONITOR_KINDS } from './continuousImprovementRegistry.mjs'

export const COMPETITOR_MONITOR_DIMENSIONS=Object.freeze([
  'pricing',
  'document_processing',
  'multilingual_workflow',
  'case_management',
  'ai_capabilities',
  'approvals',
  'exports',
  'integrations',
  'mobile_ux',
  'security_and_compliance',
  'positioning'
])

export function buildCompetitorMonitorProposal({title,finding,impact,recommendation,sourceUrls,evidence={},priority='medium',implementationScope=[]}){
  return normalizeImprovementProposal({
    monitor_kind:MONITOR_KINDS.competitor,
    title,
    finding,
    impact,
    recommendation,
    source_urls:sourceUrls,
    evidence:{...evidence,dimensions:COMPETITOR_MONITOR_DIMENSIONS},
    priority,
    implementation_scope:implementationScope
  })
}

export function competitorMonitorCheckPlan(){
  return {
    monitor_kind:MONITOR_KINDS.competitor,
    dimensions:[...COMPETITOR_MONITOR_DIMENSIONS],
    comparison_rule:'Only propose improvements that are useful for AS Workspace Gold; do not copy protected expression, source code, branding or proprietary assets.',
    result:'proposal_only',
    implementation:'requires_explicit_approval'
  }
}
