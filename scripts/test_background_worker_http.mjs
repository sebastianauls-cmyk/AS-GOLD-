import assert from 'node:assert/strict'
import fs from 'node:fs'
import {transformSync} from 'next/dist/build/swc/index.js'
let handler,claimCalls=0,processed=[],tasks=[],available=true
const job={id:'11111111-1111-4111-8111-111111111111',owner_id:'verified-database-owner',checkpoint:'database-only'}
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server-only-secret',OPENAI_API_KEY:'synthetic-only'}
const createClient=()=>({rpc:async(name,args)=>{claimCalls++;assert.equal(name,'claim_case_analysis_job');assert.deepEqual(Object.keys(args).sort(),['p_job_id','p_token']);return {data:available?job:null,error:null}}})
const source=fs.readFileSync('supabase/functions/gold-case-worker/index.ts','utf8')
const code=transformSync(source.replace(/^import [^\n]+\n/gm,''),{filename:'worker.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}}).code
new Function('Deno','createClient','EdgeRuntime','processCaseAnalysisJob',code)({env:{get:name=>env[name]},serve:value=>{handler=value}},createClient,{waitUntil:promise=>tasks.push(promise)},async args=>processed.push(args))
const body={job_id:job.id,token:'a'.repeat(64)}
const request=(input=body,headers={},method='POST')=>handler(new Request('https://synthetic.invalid/worker',{method,headers:{'Content-Type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(input)}:{})}))
assert.equal((await request({}, {},'GET')).status,403)
assert.equal((await request(body,{Origin:'https://app-gold-workspace.vercel.app'})).status,403)
assert.equal((await request({job_id:job.id,token:'invalid'})).status,401)
assert.equal((await request({...body,padding:'x'.repeat(600)})).status,400)
assert.equal(claimCalls,0)
available=false;assert.equal((await request()).status,403);assert.equal(tasks.length,0)
available=true;assert.equal((await request({...body,owner_id:'forged',checkpoint:'forged'})).status,202)
await Promise.all(tasks)
assert.equal(processed.length,1);assert.equal(processed[0].job,job,'worker only sees the database-claimed payload')
assert.equal(processed[0].job.owner_id,'verified-database-owner')
console.log('Background worker HTTP: method/origin/body limits, required one-use capability, denied claim, no caller identity/checkpoint injection and registered background task passed.')
