import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { deadlineTimestamp, buildDeadlineOverview, orderDeadlineCases } from '../app/modules/cases/deadlineCases.mjs'
import { deadlineUi, getDeadlineUi } from '../app/modules/cases/deadlineUi.mjs'

assert.equal(APP_RELEASE.number,129)
assert.equal(APP_VERSION,'V129')
assert.equal(deadlineTimestamp('not-a-date'),null)

const cases=[
  {id:'late',deadline_at:'2026-09-20T10:00:00Z'},
  {id:'missing',title:'B',deadline_at:'',traffic_light:'yellow'},
  {id:'invalid',title:'A',deadline_at:'not-a-date',traffic_light:'red'},
  {id:'early',deadline_at:'2026-09-10T10:00:00Z'}
]
const ordered=orderDeadlineCases(cases)
assert.deepEqual(ordered.map(item=>item.id),['early','late'])
const overview=buildDeadlineOverview(cases)
assert.deepEqual(overview.dated.map(item=>item.id),['early','late'])
assert.deepEqual(overview.unresolved.map(item=>item.id),['invalid','missing'])
assert.equal(overview.total,4)
assert.equal(Object.keys(deadlineUi).length,11)
for(const copy of Object.values(deadlineUi)){
  for(const field of ['title','dated','unresolved','button','datedShort','unresolvedShort','unresolvedBadge']) assert.ok(copy[field])
}
assert.equal(getDeadlineUi('unknown'),deadlineUi.de)

const controller=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')
const surfaces=fs.readFileSync(new URL('../app/modules/cases/WorkspaceCaseSurfaces.js',import.meta.url),'utf8')
const shell=fs.readFileSync(new URL('../app/modules/workspace/ProtectedWorkspaceShell.js',import.meta.url),'utf8')
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')
assert.match(controller,/action==='deadlines'\)\{openDeadlines\(\);return\}/)
assert.doesNotMatch(controller,/action==='deadlines'\)\{setSection\('cases'\)/)
assert.match(controller,/function openDeadlines\(\).*setSection\('deadlines'\)/s)
assert.match(controller,/section==='deadlines'.*<DeadlinesSurface/s)
assert.match(controller,/buildDeadlineOverview\(data\.cases\)/)
assert.match(controller,/unresolvedDeadlineCount=\{deadlineOverview\.unresolved\.length\}/)
assert.match(controller,/onOpenDeadlines=\{openDeadlines\}/)
assert.match(surfaces,/export function DeadlinesSurface/)
assert.match(surfaces,/data-persistent-back/)
assert.match(surfaces,/datedCases/)
assert.match(surfaces,/unresolvedCases/)
assert.match(surfaces,/deadlineUnknown/)
assert.match(surfaces,/unresolvedBadge/)
assert.match(surfaces,/setSelectedCase\(item\)/)
assert.match(shell,/persistentDeadlineButton/)
assert.match(shell,/unresolvedDeadlineCount/)
assert.match(shell,/onOpenDeadlines/)
assert.match(css,/\.persistentDeadlineButton/)
assert.match(css,/\.persistentDeadlineButton\.hasUnresolved/)

console.log('V129 deadlines surface verification passed.')
