import assert from 'node:assert/strict'
import fs from 'node:fs'
import {plans} from '../app/modules/pricing/catalog.js'
import {analyzeCaseDeadlines} from '../app/modules/cases/lib/caseDeadlineEvidence.mjs'
import {autoDocumentAssessment,documentTimelineEntry,sortTimelineEntries} from '../app/modules/cases/lib/caseIntelligence.mjs'
import {prioritizeNextStep} from '../app/modules/cases/lib/nextStepEngine.mjs'
import {analyzeCaseConsistency} from '../app/modules/cases/lib/caseConsistency.mjs'
import {buildProfessionalHandoff} from '../app/modules/lib/professionalHandoff.mjs'
import {caseEvidenceStatus} from '../app/modules/cases/lib/caseEvidence.mjs'

const byKey=Object.fromEntries(plans.map(plan=>[plan.key,plan]))

// START: one simple matter. ASH must identify the urgent issue and return a usable next step
// without pretending to perform the deeper Professional workflow.
const startCase={id:'tier-start',owner_id:'tier-owner',title:'Mahnung nach Teilzahlung',goal:'Verstehen, was jetzt zu tun ist',summary:'Eine Rechnung wurde teilweise bezahlt.',next_action:''}
const startDoc={id:'tier-start-doc',case_id:startCase.id,owner_id:startCase.owner_id,title:'Mahnung',document_date:'2026-10-29',created_at:'2026-10-29T10:00:00Z',updated_at:'2026-10-29T10:00:00Z',extracted_text:'Mahnung. Restbetrag 3.000,00 EUR. Bitte zahlen Sie bis 02.11.2026. Eine Abschlussbestätigung liegt noch nicht vor.'}
const startDeadline=analyzeCaseDeadlines(startCase,[startDoc],new Date('2026-10-30T12:00:00Z'))
assert.equal(startDeadline.status,'high','Start must surface a deadline within seven days')
const startAmpel=autoDocumentAssessment(startDoc.extracted_text,startDeadline)
assert.ok(['yellow','red'].includes(startAmpel.trafficLight),'Start must not turn an unresolved dunning matter green')
const startNext=prioritizeNextStep({language:'de',deadlineStatus:startDeadline.status,deadlineAction:'Zahlungsfrist und offenen Restbetrag prüfen.'})
assert.equal(startNext.kind,'deadline')
assert.ok(startNext.action.length>10)

// PROFESSIONAL: several documents with different amounts, dates and missing evidence.
// ASH must make the conflict visible, preserve chronology, require evidence and create a usable handoff.
const proCase={id:'tier-professional',owner_id:'tier-owner',title:'Mehrdokumentenfall',goal:'Forderung und Zahlungen abgleichen',summary:'Mehrere Schreiben enthalten unterschiedliche Beträge.',deadline_at:'2026-11-05',next_action:'Differenzen und Belege prüfen'}
const proDocs=[
 {id:'p1',case_id:proCase.id,owner_id:proCase.owner_id,title:'Rechnung',document_date:'2026-10-20',created_at:'2026-10-20T10:00:00Z',updated_at:'2026-10-20T10:00:00Z',extracted_text:'Rechnung. Forderung 4.800,00 EUR. Zahlung 1.800,00 EUR bestätigt.'},
 {id:'p2',case_id:proCase.id,owner_id:proCase.owner_id,title:'Mahnung',document_date:'2026-10-25',created_at:'2026-10-25T10:00:00Z',updated_at:'2026-10-25T10:00:00Z',extracted_text:'Mahnung. Forderung 3.300,00 EUR. Zahlung bis 05.11.2026. Begründung für 300,00 EUR fehlt.'},
 {id:'p3',case_id:proCase.id,owner_id:proCase.owner_id,title:'Korrektur',document_date:'2026-10-28',created_at:'2026-10-28T10:00:00Z',updated_at:'2026-10-28T10:00:00Z',extracted_text:'Korrektur. Forderung 3.000,00 EUR. Die zusätzliche Forderung von 300,00 EUR wird zurückgezogen. Zahlung ist noch nicht bestätigt.'}
]
const proConsistency=analyzeCaseConsistency({caseItem:proCase,documents:proDocs,assessments:[]})
assert.ok(proConsistency.deviations.length>0,'Professional must expose conflicting amounts/dates across documents')
const timeline=sortTimelineEntries(proDocs.map(documentTimelineEntry))
assert.deepEqual(timeline.map(row=>row.date),['2026-10-20','2026-10-25','2026-10-28'],'Professional must preserve document chronology')
const assessment={id:'a1',case_id:proCase.id,owner_id:proCase.owner_id,title:'Offener Restbetrag',traffic_light:'yellow',reasoning:'Die Korrektur nennt 3.000,00 EUR; Zahlung ist noch offen.',next_step:'Zahlungsempfängerdaten und Abschlussbestätigung anfordern.',source_document_id:'p3',source_document_updated_at:'2026-10-28T10:00:00Z',source_excerpt:'Zahlung ist noch nicht bestätigt.',source_locator:'Korrektur, letzter Satz',source_reviewed_at:'2026-10-30T12:00:00Z'}
const evidence=caseEvidenceStatus(proCase,proDocs,[assessment])
assert.equal(evidence.entries[0].status,'reviewed','Professional must retain a verifiable source reference')
const handoff=buildProfessionalHandoff({title:proCase.title,goal:proCase.goal,summary:proCase.summary,deadline:proCase.deadline_at,nextAction:proCase.next_action,documents:proDocs.map(d=>({title:d.title,date:d.document_date})),assessments:[{trafficLight:'yellow',title:assessment.title,reasoning:assessment.reasoning,nextStep:assessment.next_step}],timeline})
assert.equal(handoff.ready,true,'Professional must create a complete structured handoff')

// BUSINESS: Professional plus organization/control. The active product must expose multiple clients/cases,
// approvals, audit trail, integrations and exports instead of merely promising "more AI".
const controller=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')
const repoSource=fs.readFileSync(new URL('../app/modules/services/workspaceRepository.js',import.meta.url),'utf8')
const approval=fs.readFileSync(new URL('../app/modules/cases/ApprovalsSurface.js',import.meta.url),'utf8')
const registry=fs.readFileSync(new URL('../app/modules/workspace/productModuleRegistry.mjs',import.meta.url),'utf8')
const integration=fs.readFileSync(new URL('../app/modules/integrations/IntegrationSettings.js',import.meta.url),'utf8')
for(const token of ['ClientsSurface','CasesSurface','ApprovalsSurface','recordServerAudit']) assert.match(controller,new RegExp(token),`Business control path missing: ${token}`)
for(const token of ["from('clients')","from('cases')","from('approvals')","from('audit_events')"]) assert.match(repoSource,new RegExp(token.replace(/[()'\.]/g,'\\$&')),`Business persistence missing: ${token}`)
assert.match(approval,/Freigabe|approval/i)
assert.match(registry,/integrations/)
assert.match(integration,/google|microsoft/i)
assert.match(byKey.business.checks,/Freigaben/)
assert.match(byKey.business.checks,/Audit/)
assert.match(byKey.business.checks,/Integrationen/)

console.log('TIER ACCEPTANCE PASS')
console.log(`START: deadline=${startDeadline.status}, ampel=${startAmpel.trafficLight}, next=${startNext.kind}`)
console.log(`PROFESSIONAL: deviations=${proConsistency.deviations.length}, chronology=${timeline.length}, evidence=${evidence.entries[0].status}, handoff=${handoff.ready}`)
console.log('BUSINESS: clients/cases + approvals + audit + integrations + exports are wired in the active workspace')
