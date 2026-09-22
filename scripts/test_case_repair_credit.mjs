import assert from 'node:assert/strict'

// Called by the real Postgres/worker integration test after all live migrations.
// No model or network calls, production approval or live credits are created here.
export async function testCaseRepairCredit(db){
  const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0]||{})[0]
  const source='a'.repeat(64),repair='b'.repeat(40)
  const input={style:{},output_language:'de',reference_language:'de',draft_letters:true,acknowledged:true,privacy_notice_version:'2026-08-30-v1',terms_version:'2026-08-30-test-v1'}
  const fixture=async(count=20)=>{
    const owner=await scalar('insert into auth.users(id) values(gen_random_uuid()) returning id')
    await db.query("insert into private.user_access values($1,true,'approved','{\"full_analysis\":true,\"draft_letters\":true}')",[owner])
    await db.query("insert into public.account_privacy_settings values($1,true,'2026-08-30-v1',now(),'2026-08-30-test-v1',now())",[owner])
    const caseId=await scalar('insert into public.cases values(gen_random_uuid(),$1) returning id',[owner])
    const otherCase=await scalar('insert into public.cases values(gen_random_uuid(),$1) returning id',[owner])
    const jobs=(await db.query("insert into public.case_analysis_jobs(owner_id,case_id,source_fingerprint,status,error_code,finished_at) select $1,$2,$3,'failed','source_unresolved',now() from generate_series(1,$4) returning *",[owner,caseId,source,count])).rows
    return {owner,caseId,otherCase,jobs}
  }
  const enqueue=(f,overrides={},fingerprint=source,caseId=f.caseId)=>scalar('select public.enqueue_case_analysis_job($1,$2,$3,$4)',[f.owner,caseId,fingerprint,{...input,...overrides}])
  const grant=(f,id=f.jobs[0].id,reason='Synthetic repaired source parsing defect',commit=repair,approval='Synthetic test approval; not a production approval')=>scalar('select private.grant_case_analysis_repair_credit($1,$2,$3,$4)',[id,reason,commit,approval])
  const credit=id=>scalar('select to_jsonb(c) from private.case_analysis_repair_credits c where id=$1',[id])
  const countJobs=f=>scalar('select count(*)::integer from public.case_analysis_jobs where owner_id=$1',[f.owner])
  const f=await fixture()
  await assert.rejects(enqueue(f),/daily limit/,'deployment alone never grants an extra attempt')
  for(const role of ['anon','authenticated','service_role']){
    await db.exec(`set role ${role}`)
    await assert.rejects(grant(f),/permission denied/)
    await assert.rejects(db.query('select * from private.case_analysis_repair_credits'),/permission denied/)
    await assert.rejects(db.query('update private.case_analysis_repair_credits set used_at=null'),/permission denied/)
    await db.exec('reset role')
  }
  for(const args of [[null,repair,'Synthetic explicit approval'],['short',repair,'Synthetic explicit approval'],['Synthetic repaired source defect',null,'Synthetic explicit approval'],['Synthetic repaired source defect',repair,null]]){
    await assert.rejects(grant(f,f.jobs[0].id,...args),/references required/)
  }
  for(const code of ['provider_quota','provider_rate_limit','provider_auth','provider_invalid_json','job_stopped','source_changed']){
    await db.query('update public.case_analysis_jobs set error_code=$2 where id=$1',[f.jobs[0].id,code])
    await assert.rejects(grant(f),/Eligible failed/)
  }
  await db.query("update public.case_analysis_jobs set error_code='source_unresolved',status='cancelled' where id=$1",[f.jobs[0].id])
  await assert.rejects(grant(f),/Eligible failed/)
  await db.query("update public.case_analysis_jobs set status='failed',created_at=now()-interval '2 days' where id=$1",[f.jobs[0].id])
  await assert.rejects(grant(f),/Eligible failed/)
  await assert.rejects(grant(f,f.jobs[1].id),/normal daily limit/)
  await db.query('update public.case_analysis_jobs set created_at=$2 where id=$1',[f.jobs[0].id,f.jobs[0].created_at])
  const originalJobs=(await db.query('select * from public.case_analysis_jobs where owner_id=$1 order by id',[f.owner])).rows
  const c=await grant(f)
  assert.equal(new Date(c.expires_at)-new Date(c.granted_at),30*60*1000)
  assert.equal(c.source_fingerprint,source);assert.equal(c.failed_job_id,f.jobs[0].id)
  assert.equal(c.used_at,null);assert.equal(c.used_by_job_id,null)
  assert.deepEqual(await grant(f),c,'repeated approval is idempotent, not another credit')
  await assert.rejects(grant(f,f.jobs[1].id),/credit daily limit/)
  assert.equal(await countJobs(f),20,'approval does not start a job or erase failures')

  await assert.rejects(enqueue(f,{acknowledged:false}),/authorization/)
  await assert.rejects(enqueue(f,{},'c'.repeat(64)),/daily limit/)
  await assert.rejects(enqueue(f,{},source,f.otherCase),/daily limit/)
  const other=await fixture()
  await assert.rejects(enqueue(other),/daily limit/,'a different owner cannot spend this credit')
  for(const [deny,restore] of [
    ["update auth.users set banned_until=now()+interval '1 day' where id=$1",'update auth.users set banned_until=null where id=$1'],
    ['update private.user_access set active=false where user_id=$1','update private.user_access set active=true where user_id=$1'],
    ['update public.account_privacy_settings set ai_processing_enabled=false where owner_id=$1','update public.account_privacy_settings set ai_processing_enabled=true where owner_id=$1'],
    ["update private.user_access set permissions=jsonb_set(permissions,'{draft_letters}','false') where user_id=$1","update private.user_access set permissions=jsonb_set(permissions,'{draft_letters}','true') where user_id=$1"],
  ]){
    await db.query(deny,[f.owner]);await assert.rejects(enqueue(f),/authorization/)
    assert.equal((await credit(c.id)).used_at,null);await db.query(restore,[f.owner])
  }
  await db.exec('update private.case_analysis_config set enabled=false')
  await assert.rejects(enqueue(f),/Background service unavailable/)
  await db.exec('update private.case_analysis_config set enabled=true')
  await assert.rejects(enqueue(f,{style:{oversized:'x'.repeat(11000)}}),/check constraint/)
  assert.equal(await countJobs(f),20,'failed request insertion rolls back the entire new job')
  assert.equal((await credit(c.id)).used_at,null,'transaction rollback leaves the approval unused')

  const [job,duplicate]=await Promise.all([enqueue(f),enqueue(f)])
  assert.equal(job.id,duplicate.id,'double submission creates only one additional job')
  assert.equal(await countJobs(f),21)
  assert.equal(new Date(job.expires_at)-new Date(job.created_at),60*60*1000,'normal job lifetime is unchanged')
  const used=await credit(c.id)
  assert(used.used_at);assert.equal(used.used_by_job_id,job.id)
  const work=(await db.query('select * from private.case_analysis_work where job_id=$1',[job.id])).rows[0]
  assert.equal(work.steps,0);assert.equal(work.attempts,0);assert.equal(work.checkpoint,null)
  assert.equal(await scalar('select count(*)::integer from public.case_roadmaps where owner_id=$1',[f.owner]),0)
  assert.deepEqual((await db.query('select * from public.case_analysis_jobs where owner_id=$1 and id<>$2 order by id',[f.owner,job.id])).rows,originalJobs,'original failure history and expiry dates remain intact')
  const body=await scalar("select body from private.test_dispatch where body->>'job_id'=$1 order by id desc limit 1",[job.id])
  const claimed=await scalar('select public.claim_case_analysis_job($1,$2)',[job.id,body.token])
  await assert.rejects(scalar('select public.finish_case_analysis_job($1,$2,$3)',[job.id,claimed.lease,{status:'completed',result:{},workflow_version:'test'}]),/Invalid reviewed result/,'an additional attempt still cannot publish an unchecked result')
  await db.query("update public.case_analysis_jobs set status='failed',error_code='source_unresolved',finished_at=now() where id=$1",[job.id])
  await assert.rejects(enqueue(f),/daily limit/,'failure of the approved attempt does not replenish it')
  await assert.rejects(grant(f,job.id),/credit daily limit/)
  assert.deepEqual(await grant(f),used,'a consumed approval cannot be refreshed')

  const expired=await fixture(),expiredCredit=await grant(expired)
  await db.query("update private.case_analysis_repair_credits set granted_at=now()-interval '31 minutes',expires_at=now()-interval '1 minute' where id=$1",[expiredCredit.id])
  await assert.rejects(enqueue(expired),/daily limit/)
  assert(new Date((await grant(expired)).expires_at)<new Date(),'re-granting an expired credit never renews it')
  await assert.rejects(grant(expired,expired.jobs[1].id),/credit daily limit/)

  const revoked=await fixture(),revokedCredit=await grant(revoked)
  await db.query('update private.case_analysis_repair_credits set revoked_at=now() where id=$1',[revokedCredit.id])
  await assert.rejects(enqueue(revoked),/daily limit/)
  assert((await grant(revoked)).revoked_at,'revocation is retained when approval is repeated')

  const belowLimit=await fixture(),belowCredit=await grant(belowLimit)
  await db.query("update public.case_analysis_jobs set created_at=now()-interval '2 days' where id=$1",[belowLimit.jobs[1].id])
  await enqueue(belowLimit)
  assert.equal((await credit(belowCredit.id)).used_at,null,'an ordinary available slot does not consume the credit')
  await db.query('delete from public.cases where id=$1',[belowLimit.caseId])

  const guest=await fixture(4)
  await db.query('update auth.users set is_anonymous=true where id=$1',[guest.owner])
  await db.query("update private.user_access set permissions=permissions||jsonb_build_object('access_source','anonymous_test','guest_access_ends_at',now()+interval '1 day') where user_id=$1",[guest.owner])
  await assert.rejects(enqueue(guest),/daily limit/,'the anonymous four-job limit is unchanged')
  await assert.rejects(grant(guest),/authorization/)
  await db.query('delete from public.cases where id=$1',[f.caseId])
  assert.equal(await credit(c.id),undefined,'deleting a case also deletes its private credit record')
  console.log('Repair credit SQL: no automatic grant, administrator-only approval, one extra charged job, unchanged sources/access/reviews, atomic consumption, expiry, revocation, no renewal and guest limits passed. No live credit granted.')
}
