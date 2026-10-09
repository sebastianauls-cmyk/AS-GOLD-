import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'
import {validateV29Password} from '../app/lib/v29PasswordPolicy.mjs'
import {isAllowedTeamOrigin,readBearerToken,teamResponseHeaders} from '../app/modules/team-account/serverSecurity.js'

const source=fs.readFileSync(new URL('../app/api/team-account/setup/route.js',import.meta.url),'utf8')
  .replace(/^import .*$/gm,'').replace(/^export /gm,'')
const origin='https://app-gold-workspace.vercel.app'

function fixture({userError=null,role='owner',adminMissing=false,security={data:null,error:null,status:200}}={}){
  const calls={admin:0,read:0,write:0}
  const admin={from(){calls.write++;throw new Error('Unexpected database write')},auth:{admin:{updateUserById(){calls.write++;throw new Error('Unexpected password change')}}}}
  const context={Response,Date,JSON,createClient:()=>({
    auth:{getUser:async()=>({data:{user:{id:'owner-id',email:'synthetic@example.invalid',is_anonymous:false}},error:userError})},
    rpc:async()=>({data:[{app_role:role,active:true,status:'approved'}],error:null})
  }),SUPABASE_URL:'https://synthetic.invalid',SUPABASE_PUBLISHABLE_KEY:'synthetic-public-key',
  validateV29Password,isAllowedTeamOrigin,readBearerToken,teamResponseHeaders,
  createMasterPasswordHash(){calls.write++;throw new Error('Unexpected password hashing')},
  createTeamAdminClient(){calls.admin++;return adminMissing?null:admin},
  async readTeamSecurity(){calls.read++;return security},TEAM_SECURITY_SINGLETON:'primary'}
  vm.createContext(context)
  vm.runInContext(source+'\nthis.handle=POST',context)
  return {calls,async request({authenticated=true,body={mode:'status'}}={}){
    const response=await context.handle(new Request(origin+'/api/team-account/setup',{
      method:'POST',headers:{origin,'content-type':'application/json',...(authenticated?{authorization:'Bearer synthetic-session'}:{})},
      body:JSON.stringify(body)
    }))
    return {status:response.status,headers:response.headers,payload:await response.json()}
  }}
}

test('missing, invalid and non-owner sessions cannot inspect server configuration',async()=>{
  for(const options of [{authenticated:false},{userError:{message:'Invalid session'}},{role:'member'}]){
    const f=fixture(options)
    const result=await f.request({authenticated:options.authenticated!==false})
    assert.equal(result.status,options.role?403:401)
    assert.equal(f.calls.admin,0)
    assert.equal(f.calls.read,0)
    assert.equal(f.calls.write,0)
  }
})

test('a missing or rejected server key is distinguished from a personal password problem',async()=>{
  for(const options of [
    {adminMissing:true},
    {security:{data:null,error:{message:'Invalid API key',details:'synthetic-secret-must-not-leak'},status:401}}
  ]){
    const f=fixture(options)
    const result=await f.request()
    assert.equal(result.status,503)
    assert.deepEqual(result.payload,{ok:false,code:'setup_server_connection_failed'})
    assert.match(result.headers.get('cache-control'),/(?:^|,\s*)no-store(?:,|$)/)
    assert.equal(f.calls.write,0)
  }
})

test('unrelated database errors remain generic and cannot expose provider details',async()=>{
  const f=fixture({security:{data:null,error:{code:'42501',message:'sensitive provider detail'},status:403}})
  const result=await f.request()
  assert.equal(result.status,503)
  assert.deepEqual(result.payload,{ok:false,code:'setup_unavailable'})
  assert.equal(f.calls.write,0)
})

test('empty and completed setup states are read without creating or changing credentials',async()=>{
  for(const completed of [false,true]){
    const f=fixture({security:{data:completed?{owner_id:'owner-id',setup_completed_at:'2026-10-09T00:00:00Z'}:null,error:null,status:200}})
    const result=await f.request()
    assert.equal(result.status,200)
    assert.deepEqual(result.payload,{ok:true,configured:completed})
    assert.equal(f.calls.read,1)
    assert.equal(f.calls.write,0)
  }
})

test('setup belonging to another owner remains inaccessible',async()=>{
  const f=fixture({security:{data:{owner_id:'different-owner',setup_completed_at:null},error:null,status:200}})
  const result=await f.request()
  assert.equal(result.status,403)
  assert.deepEqual(result.payload,{ok:false,code:'owner_required'})
  assert.equal(f.calls.write,0)
})

test('server connection failure also prevents all configure writes',async()=>{
  const f=fixture({security:{data:null,error:{message:'Invalid API key'},status:401}})
  const result=await f.request({body:{mode:'configure',accessPassword:'synthetic-only',masterPassword:'synthetic-only'}})
  assert.equal(result.status,503)
  assert.equal(result.payload.code,'setup_server_connection_failed')
  assert.equal(f.calls.write,0)
})
