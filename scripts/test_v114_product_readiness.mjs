import assert from 'node:assert/strict'
import fs from 'node:fs'
import { APP_RELEASE, APP_VERSION } from '../app/modules/release/appRelease.mjs'
import { documentUploadReadinessMessage, isImageDocument, parseIntakeQuality, validateDocumentUploadReadiness } from '../app/modules/documents/documentUploadReadiness.mjs'

assert.ok(APP_RELEASE.number>=114)
assert.equal(APP_VERSION,`V${APP_RELEASE.number}`)

const check=input=>validateDocumentUploadReadiness(input)
assert.equal(check({fileType:'application/pdf',extension:'pdf',intakeQuality:{state:'unknown'}}).ok,true,'non-image documents must remain uploadable')
assert.deepEqual(check({fileType:'image/jpeg',extension:'jpg',intakeQuality:{state:'checking'}}),{ok:false,code:'quality_pending'})
assert.deepEqual(check({fileType:'',extension:'png',intakeQuality:parseIntakeQuality('invalid')}),{ok:false,code:'quality_pending'})
assert.deepEqual(check({source:'scan',intakeQuality:{state:'bad'}}),{ok:false,code:'quality_bad'})
assert.equal(check({fileType:'image/webp',extension:'webp',intakeQuality:{state:'weak'}}).ok,true,'readable images with warnings may be uploaded')
assert.equal(check({fileType:'image/png',extension:'png',intakeQuality:{state:'good'}}).ok,true,'good images must be uploadable')
assert.equal(isImageDocument({fileType:'',extension:'jpg'}),true,'image extensions must be checked even when the browser omits a MIME type')

for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']){
  assert.ok(documentUploadReadinessMessage(language,'quality_pending'))
  assert.ok(documentUploadReadinessMessage(language,'quality_bad'))
  assert.ok(documentUploadReadinessMessage(language,'upload_failed'))
  assert.ok(documentUploadReadinessMessage(language,'upload_network'))
}

const workflow=fs.readFileSync(new URL('../app/modules/documents/documentWorkflow.js',import.meta.url),'utf8')
const surface=fs.readFileSync(new URL('../app/modules/documents/DocumentsSurface.js',import.meta.url),'utf8')
const intake=fs.readFileSync(new URL('../app/modules/documents/DocumentFileIntake.js',import.meta.url),'utf8')
const caseWorkspace=fs.readFileSync(new URL('../app/modules/cases/CaseWorkspace.js',import.meta.url),'utf8')
const migration=fs.readFileSync(new URL('../supabase/migrations/20260906105041_v114_anonymous_test_resource_limits.sql',import.meta.url),'utf8')
assert.match(workflow,/validateDocumentUploadReadiness/,'upload workflow must enforce image readiness')
assert.match(workflow,/finally\{\s*setUploading\(false\)/,'upload busy state must always reset')
assert.match(surface,/setIntakeRevision\(current=>current\+1\)/,'successful uploads must reset controlled intake state')
assert.match(intake,/setQuality\(\{state:'checking',kind:'image'\}\)/,'a newly selected image must invalidate stale quality results')
assert.match(caseWorkspace,/\{APP_VERSION\}/,'quick actions must show the active release')
for(const path of ['../app/error.js','../app/global-error.js','../app/not-found.js'])assert.equal(fs.existsSync(new URL(path,import.meta.url)),true,`${path} must exist`)
assert.match(migration,/gold_guest_insert_allowed/,'anonymous test resources must be server-side limited')
assert.match(migration,/select count\(\*\)<20 into v_guest_allowed/,'daily anonymous access must stop at exactly 20 users')
assert.match(migration,/when 'email_connections' then false/,'anonymous testers must not connect external mailboxes')

console.log('V114 product-readiness checks passed: image gating, state reset, recovery screens, current version and 11-language messages are active.')
