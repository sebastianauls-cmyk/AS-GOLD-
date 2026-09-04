export const CONTINUOUS_IMPROVEMENT_VERSION='v83'

export const MONITOR_KINDS=Object.freeze({
  legal:'legal_monitor',
  competitor:'competitor_monitor'
})

export const MONITORS=Object.freeze({
  legal_monitor:Object.freeze({
    key:'legal_monitor',
    title:'Rechtsprechungs- und Rechtsänderungs-Monitor',
    purpose:'Neue Rechtsprechung, Gesetzesänderungen und relevante Behörden-/Verwaltungsänderungen je Land oder Rechtsraum erkennen und auf Auswirkungen für AS Workspace Gold prüfen.',
    requiresCountryContext:true,
    mayAutoImplement:false,
    requiredProposalFields:Object.freeze(['title','finding','impact','recommendation','source_urls','priority','implementation_scope'])
  }),
  competitor_monitor:Object.freeze({
    key:'competitor_monitor',
    title:'Wettbewerbs- und Verbesserungs-Monitor',
    purpose:'Relevante Wettbewerber, Preise, Produktfunktionen, UX-Änderungen und neue Marktstandards beobachten und daraus konkrete Verbesserungsvorschläge ableiten.',
    requiresCountryContext:false,
    mayAutoImplement:false,
    requiredProposalFields:Object.freeze(['title','finding','impact','recommendation','source_urls','priority','implementation_scope'])
  })
})

export const IMPROVEMENT_STATUSES=Object.freeze(['pending','approved','rejected','implemented'])

export function monitorByKind(kind){
  return MONITORS[kind]||null
}

export function normalizeImprovementProposal(input={}){
  const monitor=monitorByKind(input.monitor_kind)
  if(!monitor) throw new Error('Unknown improvement monitor')
  const proposal={
    monitor_kind:monitor.key,
    country_code:input.country_code?String(input.country_code).toUpperCase():null,
    title:String(input.title||'').trim(),
    finding:String(input.finding||'').trim(),
    impact:String(input.impact||'').trim(),
    recommendation:String(input.recommendation||'').trim(),
    source_urls:Array.isArray(input.source_urls)?input.source_urls.filter(Boolean).map(String):[],
    evidence:input.evidence&&typeof input.evidence==='object'?input.evidence:{},
    priority:['low','medium','high','critical'].includes(input.priority)?input.priority:'medium',
    implementation_scope:Array.isArray(input.implementation_scope)?input.implementation_scope.filter(Boolean).map(String):[]
  }
  for(const field of monitor.requiredProposalFields){
    const value=proposal[field]
    if((Array.isArray(value)&&value.length===0)||(!Array.isArray(value)&&!value)) throw new Error(`Missing proposal field: ${field}`)
  }
  if(monitor.requiresCountryContext&&!proposal.country_code) throw new Error('Legal proposals require a country context')
  return proposal
}

export function canCreateImplementationTask(proposal){
  return proposal?.status==='approved'&&!!proposal?.approved_at
}

export function implementationTaskFromProposal(proposal){
  if(!canCreateImplementationTask(proposal)) throw new Error('Explicit approval is required before implementation')
  return {
    proposal_id:proposal.id,
    monitor_kind:proposal.monitor_kind,
    country_code:proposal.country_code||null,
    title:proposal.title,
    recommendation:proposal.recommendation,
    implementation_scope:Array.isArray(proposal.implementation_scope)?proposal.implementation_scope:[],
    source_urls:Array.isArray(proposal.source_urls)?proposal.source_urls:[],
    approval_required:false,
    production_deploy_allowed:false
  }
}

export function continuousImprovementContract(){
  return {
    version:CONTINUOUS_IMPROVEMENT_VERSION,
    monitors:Object.values(MONITORS).map(({key,requiresCountryContext,mayAutoImplement})=>({key,requiresCountryContext,mayAutoImplement})),
    statuses:[...IMPROVEMENT_STATUSES],
    approvalGate:'pending -> explicit approval -> implementation task -> tests -> explicit production release'
  }
}
