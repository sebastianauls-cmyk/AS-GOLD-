import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile,stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

const root=fileURLToPath(new URL('../docs/testing/product-acceptance-2026-10-09/',import.meta.url))
const plan=JSON.parse(await readFile(new URL('live-run-plan.json',`file://${root}/`),'utf8'))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')

assert.equal(plan.schema_version,1)
assert.equal(plan.status,'prepared_not_authorized')
assert.equal(plan.live_model_run_authorized,false)
assert.equal(plan.capacity_acceptance_in_scope,false)
assert.equal(plan.case.create_new_case_through_normal_ui,true)
assert.equal(plan.case.restart_prior_job,false)
assert.deepEqual(plan.run_limits,{
  maximum_new_jobs:1,
  maximum_historical_restarts:0,
  maximum_automatic_retries:0,
  maximum_input_files:2,
  maximum_runtime_minutes:60
})

for(const input of plan.locked_inputs){
  const url=new URL(input.path,`file://${root}/`),bytes=await readFile(url)
  assert.equal((await stat(url)).size,input.bytes,input.path+' byte length changed')
  assert.equal(hash(bytes),input.sha256,input.path+' content changed')
}

const criteriaBytes=await readFile(new URL(plan.locked_content_criteria.path,`file://${root}/`))
assert.equal(hash(criteriaBytes),plan.locked_content_criteria.sha256,'locked criteria changed')
const criteria=JSON.parse(criteriaBytes)
assert.equal(criteria.criteria.length,plan.locked_content_criteria.criteria_count)
assert.equal(new Set(criteria.criteria).size,criteria.criteria.length)

const required=new Set(plan.required_evidence)
for(const evidence of [
  'normal_authentication_and_access',
  'two_original_uploads_with_names_sizes_and_hashes',
  'readable_saved_originals_and_actual_original_open',
  'exactly_one_authorized_job_id',
  'unchanged_generation_correction_and_independent_review_gates',
  'completed_job_with_saved_roadmap_id',
  'all_eight_locked_content_criteria_checked_against_originals',
  'result_reopened_after_leaving_the_case',
  'downloaded_docx_for_report_and_each_letter',
  'downloaded_pdf_for_report_and_each_letter',
  'downloaded_files_opened_and_content_compared_with_saved_result',
  'android_login_original_open_result_reopen_and_download_controls',
  'actual_runtime_and_provider_usage_record'
])assert(required.has(evidence),'missing evidence gate: '+evidence)

assert.ok(plan.preconditions_before_the_single_start.some(value=>/provider-balance/i.test(value)))
assert.ok(plan.preconditions_before_the_single_start.some(value=>/monetary cap/i.test(value)))
assert.ok(plan.preconditions_before_the_single_start.some(value=>/explicitly authorized/i.test(value)))
assert.match(plan.pass_rule,/not a pass/)
assert.ok(plan.stop_and_fail_conditions.some(value=>/second job/i.test(value)))

console.log('Single-case live-run plan passed: 2 locked synthetic originals, 8 unchanged content criteria, 1-job/no-retry boundary, normal auth/upload/reopen/Word/PDF/Android evidence gates, and explicit balance/cap/authorization preconditions. Live model authorization remains false.')
