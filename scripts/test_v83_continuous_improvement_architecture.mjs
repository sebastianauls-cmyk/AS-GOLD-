import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  MONITORS,
  IMPROVEMENT_STATUSES,
  continuousImprovementContract,
  implementationTaskFromProposal
} from '../app/modules/intelligence/continuousImprovementRegistry.mjs'
import { legalMonitorCheckPlan } from '../app/modules/intelligence/legalMonitor.mjs'
import { competitorMonitorCheckPlan } from '../app/modules/intelligence/competitorMonitor.mjs'

const contract=continuousImprovementContract()
const repo=fs.readFileSync('app/modules/intelligence/improvementProposalRepository.js','utf8')
const migration=fs.readFileSync('supabase/migrations/20260904013000_v83_continuous_improvement_proposals.sql','utf8')

assert.equal(MONITORS.legal_monitor.mayAutoImplement,false)
assert.equal(MONITORS.competitor_monitor.mayAutoImplement,false)
assert.equal(MONITORS.legal_monitor.requiresCountryContext,true)
assert.deepEqual(IMPROVEMENT_STATUSES,['pending','approved','rejected','implemented'])
assert.match(contract.approvalGate,/explicit approval/i)
assert.equal(legalMonitorCheckPlan({code:'DE',jurisdiction:'Deutschland / deutscher Rechtsraum'}).result,'proposal_only')
assert.equal(competitorMonitorCheckPlan().result,'proposal_only')
assert.throws(()=>implementationTaskFromProposal({status:'pending'}),/Explicit approval/)
assert.equal(implementationTaskFromProposal({id:'x',status:'approved',approved_at:new Date().toISOString(),monitor_kind:'legal_monitor',title:'Test',recommendation:'Change',implementation_scope:['module'],source_urls:['https://example.com']}).production_deploy_allowed,false)
assert.match(repo,/eq\('status','pending'\)/)
assert.match(repo,/eq\('status','approved'\)/)
assert.match(migration,/enable row level security/i)
assert.match(migration,/legal_monitor/)
assert.match(migration,/competitor_monitor/)
assert.match(migration,/status in \('pending','approved','rejected','implemented'\)/)

console.log('V83 continuous-improvement architecture guard passed: legal and competitor monitors remain proposal-only until explicit approval.')
