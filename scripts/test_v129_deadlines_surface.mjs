import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { deadlineTimestamp, orderDeadlineCases } from '../app/modules/cases/deadlineCases.mjs'

assert.equal(APP_RELEASE.number,129)
assert.equal(APP_VERSION,'V129')
assert.equal(deadlineTimestamp('not-a-date'),null)

const ordered=orderDeadlineCases([
  {id:'late',deadline_at:'2026-09-20T10:00:00Z'},
  {id:'missing',deadline_at:''},
  {id:'invalid',deadline_at:'not-a-date'},
  {id:'early',deadline_at:'2026-09-10T10:00:00Z'}
])
assert.deepEqual(ordered.map(item=>item.id),['early','late'])

const controller=fs.readFileSync(new URL('../app/modules/workspace/WorkspaceController.js',import.meta.url),'utf8')
const surfaces=fs.readFileSync(new URL('../app/modules/cases/WorkspaceCaseSurfaces.js',import.meta.url),'utf8')
assert.match(controller,/action==='deadlines'\)\{setSection\('deadlines'\);return\}/)
assert.doesNotMatch(controller,/action==='deadlines'\)\{setSection\('cases'\)/)
assert.match(controller,/section==='deadlines'.*<DeadlinesSurface/s)
assert.match(controller,/orderDeadlineCases\(data\.cases\)/)
assert.match(surfaces,/export function DeadlinesSurface/)
assert.match(surfaces,/data-persistent-back/)
assert.match(surfaces,/deadlineCases\.map/)
assert.match(surfaces,/setSelectedCase\(item\)/)

console.log('V129 deadlines surface verification passed.')
