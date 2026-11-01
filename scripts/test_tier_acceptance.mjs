import assert from 'node:assert/strict'
import fs from 'node:fs'
import JSZip from 'jszip'
import {loadWorkspaceBundle} from '../app/modules/services/workspaceRepository.js'
import {approveApprovalRecord} from '../app/modules/services/approvalRepository.js'
import {createWorkspaceExportArtifact} from '../app/modules/services/exportService.js'
import {plans} from '../app/modules/pricing/catalog.js'
import {analyzeCaseDeadlines} from '../app/modules/cases/lib/caseDeadlineEvidence.mjs'
import {autoDocumentAssessment,documentTimelineEntry,sortTimelineEntries} from '../app/modules/cases/lib/caseIntelligence.mjs'
import {prioritizeNextStep} from '../app/modules/cases/lib/nextStepEngine.mjs'
import {analyzeCaseConsistency} from '../app/modules/cases/lib/caseConsistency.mjs'
import {buildProfessionalHandoff} from '../app/modules/lib/professionalHandoff.mjs'
import {caseEvidenceStatus} from '../app/modules/cases/lib/caseEvidence.mjs'

const byKey=Object.fromEntries(plans.map(plan=>[plan.key,plan]))

// START: one simple matter. ASH must identify the urgent issue and return a usable next step
// without pretending to perform the deeper Analyse/Komplett workflow.
const startCase={id:'tier-start',owner_id:'tier-owner',title:'Mahnung nach Teilzahlung',goal:'Verstehen, was jetzt zu tun ist',summary:'Eine Rechnung wurde teilweise bezahlt.',next_action:''}
const startDoc={id:'tier-start-doc',case_id:startCase.id,owner_id:startCase.owner_id,title:'Mahnung',document_date:'2026-10-29',created_at:'2026-10-29T10:00:00Z',updated_at:'2026-10-29T10:00:00Z',extracted_text:'Mahnung. Restbetrag 3.000,00 EUR. Bitte zahlen Sie bis 02.11.2026. Eine Abschlussbestätigung liegt noch nicht vor.'}
const startDeadline=analyzeCaseDeadlines(startCase,[startDoc],new Date('2026-10-30T12:00:00Z'))
assert.equal(startDeadline.status,'high','Start must surface a deadline within seven days')
const startAmpel=autoDocumentAssessment(startDoc.extracted_text,startDeadline)
assert.ok(['yellow','red'].includes(startAmpel.trafficLight),'Start must not turn an unresolved dunning matter green')
const startNext=prioritizeNextStep({language:'de',deadlineStatus:startDeadline.status,deadlineAction:'Zahlungsfrist und offenen Restbetrag prüfen.'})
assert.equal(startNext.kind,'deadline')
assert.ok(startNext.action.length>10)

// ANALYSE/KOMPLETT: several documents with different amounts, dates and missing evidence.
// ASH must make the conflict visible, preserve chronology, require evidence and create a usable handoff.
const proCase={id:'tier-professional',owner_id:'tier-owner',title:'Mehrdokumentenfall',goal:'Forderung und Zahlungen abgleichen',summary:'Mehrere Schreiben enthalten unterschiedliche Beträge.',deadline_at:'2026-11-05',next_action:'Differenzen und Belege prüfen'}
const proDocs=[
 {id:'p1',case_id:proCase.id,owner_id:proCase.owner_id,title:'Rechnung',document_date:'2026-10-20',created_at:'2026-10-20T10:00:00Z',updated_at:'2026-10-20T10:00:00Z',extracted_text:'Rechnung. Forderung 4.800,00 EUR. Zahlung 1.800,00 EUR bestätigt.'},
 {id:'p2',case_id:proCase.id,owner_id:proCase.owner_id,title:'Mahnung',document_date:'2026-10-25',created_at:'2026-10-25T10:00:00Z',updated_at:'2026-10-25T10:00:00Z',extracted_text:'Mahnung. Forderung 3.300,00 EUR. Zahlung bis 05.11.2026. Begründung für 300,00 EUR fehlt.'},
 {id:'p3',case_id:proCase.id,owner_id:proCase.owner_id,title:'Korrektur',document_date:'2026-10-28',created_at:'2026-10-28T10:00:00Z',updated_at:'2026-10-28T10:00:00Z',extracted_text:'Korrektur. Forderung 3.000,00 EUR. Die zusätzliche Forderung von 300,00 EUR wird zurückgezogen. Zahlung ist noch nicht bestätigt.'}
]
const proConsistency=analyzeCaseConsistency({caseItem:proCase,documents:proDocs,assessments:[]})
assert.ok(proConsistency.deviations.length>0,'Analyse must expose conflicting amounts/dates across documents')
const timeline=sortTimelineEntries(proDocs.map(documentTimelineEntry))
assert.deepEqual(timeline.map(row=>row.date),['2026-10-20','2026-10-25','2026-10-28'],'Analyse must preserve document chronology')
const assessment={id:'a1',case_id:proCase.id,owner_id:proCase.owner_id,title:'Offener Restbetrag',traffic_light:'yellow',reasoning:'Die Korrektur nennt 3.000,00 EUR; Zahlung ist noch offen.',next_step:'Zahlungsempfängerdaten und Abschlussbestätigung anfordern.',source_document_id:'p3',source_document_updated_at:'2026-10-28T10:00:00Z',source_excerpt:'Zahlung ist noch nicht bestätigt.',source_locator:'Korrektur, letzter Satz',source_reviewed_at:'2026-10-30T12:00:00Z'}
const evidence=caseEvidenceStatus(proCase,proDocs,[assessment])
assert.equal(evidence.entries[0].status,'reviewed','Analyse must retain a verifiable source reference')
const handoff=buildProfessionalHandoff({title:proCase.title,goal:proCase.goal,summary:proCase.summary,deadline:proCase.deadline_at,nextAction:proCase.next_action,documents:proDocs.map(d=>({title:d.title,date:d.document_date})),assessments:[{trafficLight:'yellow',title:assessment.title,reasoning:assessment.reasoning,nextStep:assessment.next_step}],timeline})
assert.equal(handoff.ready,true,'Komplett must create a complete structured handoff')

// BUSINESS: Komplett plus organization/control. The active product must expose multiple clients/cases,
// approvals, audit trail, integrations and exports instead of merely promising "more AI".
const controller=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')
const repoSource=fs.readFileSync(new URL('../app/modules/services/workspaceRepository.js',import.meta.url),'utf8')
const approval=fs.readFileSync(new URL('../app/modules/cases/ApprovalsSurface.js',import.meta.url),'utf8')
const registry=fs.readFileSync(new URL('../app/modules/workspace/productModuleRegistry.mjs',import.meta.url),'utf8')
const integration=fs.readFileSync(new URL('../app/modules/integrations/IntegrationHub.js',import.meta.url),'utf8')
for(const token of ['ClientsSurface','CasesSurface','ApprovalsSurface','recordServerAudit']) assert.match(controller,new RegExp(token),`Business control path missing: ${token}`)
for(const token of ["from('clients')","from('cases')","from('approvals')","from('audit_events')"]) assert.match(repoSource,new RegExp(token.replace(/[()'\.]/g,'\\$&')),`Business persistence missing: ${token}`)
assert.match(approval,/Freigabe|approval/i)
assert.match(registry,/integrations/)
assert.match(integration,/connectMailbox\('google'\)/);assert.match(integration,/connectMailbox\('microsoft'\)/);assert.match(integration,/not_configured/)
assert.match(byKey.business.checks,/Freigaben/)
assert.match(byKey.business.checks,/Audit/)
assert.match(byKey.business.checks,/Integrationen/)


// Synthetic Business execution: run owner-scoped reopening, revision-safe
// approvals and an actual Office file writer. This is an in-memory adapter
// test; it does not claim production RLS, payment or live multi-user sign-off.
function syntheticBusinessDatabase(tables){
  return {from(table){
    const filters=[]
    let patch=null,onlyOne=false,maximum=Infinity
    const query={
      select(){return this},
      eq(key,value){filters.push([key,value]);return this},
      order(){return this},
      limit(n){maximum=n;return this},
      update(payload){patch=payload;return this},
      maybeSingle(){onlyOne=true;return this.then(value=>value)},
      then(resolve,reject){
        const rows=(tables[table]||[]).filter(row=>filters.every(([key,value])=>row[key]===value)).slice(0,maximum)
        if(patch!==null)for(const row of rows)Object.assign(row,patch)
        return Promise.resolve({data:structuredClone(onlyOne?rows[0]||null:rows),error:null}).then(resolve,reject)
      }
    }
    return query
  }}
}
const businessOwner='synthetic-business-owner',foreignOwner='synthetic-foreign-owner'
const businessTables={
  clients:[
    {id:'business-client-a',owner_id:businessOwner,name:'Mandat A'},
    {id:'business-client-b',owner_id:businessOwner,name:'Mandat B'},
    {id:'foreign-client',owner_id:foreignOwner,name:'Fremdmandat'}
  ],
  cases:[
    {id:'business-case-a',owner_id:businessOwner,client_id:'business-client-a',title:'Business-Fall A',status:'open',traffic_light:'yellow'},
    {id:'business-case-b',owner_id:businessOwner,client_id:'business-client-b',title:'Business-Fall B',status:'open',traffic_light:'red'},
    {id:'foreign-case',owner_id:foreignOwner,client_id:'foreign-client',title:'Fremdfall'}
  ],
  documents:[
    {id:'business-document-a',owner_id:businessOwner,case_id:'business-case-a',title:'Bescheid A'},
    {id:'foreign-document',owner_id:foreignOwner,case_id:'foreign-case',title:'Fremddokument'}
  ],
  approvals:[
    {id:'business-approval-a',owner_id:businessOwner,case_id:'business-case-a',status:'pending',approval_type:'letter',preview_revision:2,approved_revision:null,subject:'Antwortentwurf A',body:'Synthetischer Antwortentwurf'},
    {id:'foreign-approval',owner_id:foreignOwner,case_id:'foreign-case',status:'pending',preview_revision:1,subject:'Fremdentwurf'}
  ],
  assessments:[],source_status:[],deletion_requests:[],
  audit_events:[{id:'business-audit',owner_id:businessOwner,event_type:'approval_created'},{id:'foreign-audit',owner_id:foreignOwner,event_type:'approval_created'}],
  account_privacy_settings:[{owner_id:businessOwner}]
}
const businessDb=syntheticBusinessDatabase(businessTables)
const businessFirst=await loadWorkspaceBundle(businessDb,businessOwner)
assert.equal(businessFirst.error,null)
assert.equal(businessFirst.data.clients.length,2,'Business must load multiple own clients')
assert.equal(businessFirst.data.cases.length,2,'Business must load multiple own cases')
assert.equal(businessFirst.data.documents.length,1,'Business must not load a foreign document')
assert.equal(businessFirst.data.approvals.length,1,'Business must not load a foreign approval')
assert.equal(businessFirst.audit.length,1,'Business audit reads must remain owner-scoped')
const pendingApproval=businessFirst.data.approvals[0]
const denied=await approveApprovalRecord(businessDb,{ownerId:foreignOwner,item:pendingApproval})
assert.equal(denied.data,null,'Foreign owner must not approve another owner’s draft')
const wrongRevision=await approveApprovalRecord(businessDb,{ownerId:businessOwner,item:{...pendingApproval,preview_revision:1}})
assert.equal(wrongRevision.data,null,'Stale preview must not be approved')
const accepted=await approveApprovalRecord(businessDb,{ownerId:businessOwner,item:pendingApproval})
assert.equal(accepted.error,null)
assert.equal(accepted.data.status,'approved')
assert.equal(accepted.data.approved_revision,2,'Approval must record the preview revision')
const replay=await approveApprovalRecord(businessDb,{ownerId:businessOwner,item:pendingApproval})
assert.equal(replay.data,null,'Approved draft must not be approved a second time')
const businessReopened=await loadWorkspaceBundle(businessDb,businessOwner)
assert.equal(businessReopened.data.approvals[0].status,'approved','Approved version must survive a fresh data load')
assert.equal(businessReopened.data.approvals[0].approved_revision,2)
const copyLabels=new Proxy({},{get:(_,key)=>String(key)})
const businessArtifact=await createWorkspaceExportArtifact({
  ref:{kind:'case',item:businessReopened.data.cases[0]},
  type:'docx',data:businessReopened.data,
  copy:{ex:copyLabels,core:copyLabels,approvalUi:copyLabels},outputLanguage:'de'
})
assert.ok(businessArtifact.blob.size>500,'Business must produce a nonempty real Word file')
const businessArchive=await JSZip.loadAsync(await businessArtifact.blob.arrayBuffer())
const businessXml=await businessArchive.file('word/document.xml').async('string')
for(const marker of ['Business-Fall A','Bescheid A','Antwortentwurf A']) assert.match(businessXml,new RegExp(marker),'Export must retain case, evidence and approval')
assert.doesNotMatch(businessXml,/Fremdfall|Fremddokument|Fremdentwurf/,'Export must not include foreign owner records')

console.log('TIER ACCEPTANCE PASS')
console.log(`START: deadline=${startDeadline.status}, ampel=${startAmpel.trafficLight}, next=${startNext.kind}`)
console.log(`ANALYSE/KOMPLETT: deviations=${proConsistency.deviations.length}, chronology=${timeline.length}, evidence=${evidence.entries[0].status}, handoff=${handoff.ready}`)
console.log('BUSINESS: synthetic owner-scoped multi-client reopen, stale/foreign approval rejection, approved revision persistence and real DOCX archive passed (not a live E2E test)')
