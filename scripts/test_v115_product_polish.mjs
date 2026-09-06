import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8')

assert.ok(APP_RELEASE.number>=115)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

const repository=read('../app/modules/services/documentRepository.js')
assert.match(repository,/export_type:type,format:type/,'every export entry must persist the selected format in both schema fields')
const exportService=read('../app/modules/services/exportService.js')
assert.match(exportService,/document\.body\.append\(anchor\)/,'browser downloads must attach the download anchor before activation')
assert.match(exportService,/setTimeout\(\(\)=>URL\.revokeObjectURL\(url\),1000\)/,'object URLs must remain valid until the browser has accepted the download')

const timeline=read('../app/modules/cases/CaseTimelineAutoAssessment.js')
assert.match(timeline,/detail:document\?\.document_type\|\|''/,'timeline details must describe the document instead of repeating its raw timestamp')
assert.match(timeline,/<time dateTime=\{entry\.date\}>\{entry\.date\}<\/time>/,'timeline dates must use semantic machine-readable time markup')
assert.doesNotMatch(timeline,/detail:String\(rawDate\)/,'raw ISO timestamps must not be repeated in the visible timeline')

const userFacingComponents=[
  '../app/modules/cases/CaseWorkspace.js',
  '../app/modules/cases/DeadlineCard.js',
  '../app/modules/cases/PrimaryNextStep.js',
  '../app/modules/cases/CaseTimelineAutoAssessment.js',
  '../app/modules/cases/ApprovalWorkflowUi.js',
  '../app/modules/cases/CaseCompletionPanels.js',
  '../app/modules/pricing/PromoCodeControl.js'
].map(read).join('\n')
assert.doesNotMatch(userFacingComponents,/className="modeBadge">V(?:26|28|31|38|39|40|41|42)</,'legacy internal release numbers must not appear as user-facing badges')

const privacy=read('../app/modules/compliance/PrivacyControls.js')
assert.ok(privacy.includes("replace(/^V\\d+\\s*·\\s*/,'')"),'legacy privacy badge versions must be removed before rendering')

console.log('V115 product-polish checks passed: export format metadata, clean timeline dates and version-neutral feature cards are active.')
