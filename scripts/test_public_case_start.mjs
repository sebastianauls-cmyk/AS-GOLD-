import assert from 'node:assert/strict'
import {createPublicCaseStart,PUBLIC_CASE_START_KEY} from '../app/modules/public/publicCaseStart.mjs'
import {COUNTRY_CATALOG} from '../app/modules/country/countryRegistry.mjs'
import {LANGUAGE_CATALOG} from '../app/modules/language/languageRegistry.mjs'

const values=new Map()
const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
let time=Date.parse('2026-09-20T21:30:00Z')
const queue=()=>createPublicCaseStart({storage:()=>storage,now:()=>time})
const chosen={home:'PL',target:'DE',output:'pl'}
const received=[]
const ready={screen:'app',userId:'synthetic-user',privacyCurrent:true,onContinue:value=>received.push(value)}

// All supported languages/country pairs, including same-country cases, survive
// a reload and are consumed exactly once after the account and privacy gates.
for(const home of COUNTRY_CATALOG)for(const target of COUNTRY_CATALOG)for(const output of LANGUAGE_CATALOG){
  const choice={home:home.key,target:target.key,output:output.key}
  assert.equal(queue().stage({...choice,ignoredPrivateText:'must never be stored'}),true)
  const stored=JSON.parse(storage.getItem(PUBLIC_CASE_START_KEY))
  assert.deepEqual(Object.keys(stored).sort(),['createdAt','home','output','target'])
  const reloaded=queue()
  for(const screen of ['loading','public','login','register','recovery','workspace-connecting','workspace-unavailable']){
    assert.equal(reloaded.resume({...ready,screen}),false)
    assert.ok(storage.getItem(PUBLIC_CASE_START_KEY),'auth retry must retain the choices')
  }
  assert.equal(reloaded.resume({...ready,userId:null}),false)
  assert.equal(reloaded.resume({...ready,privacyCurrent:false}),false)
  assert.equal(reloaded.resume(ready),true)
  assert.deepEqual(received.pop(),choice)
  assert.equal(reloaded.resume(ready),false,'repeated auth/effect must not reopen the form')
  assert.equal(queue().resume(ready),false,'the consumed choice must not return after reload')
}

// Back/cancel and sign-out discard the explicit start, including on reload.
{
  const entry=queue()
  entry.stage(chosen)
  entry.cancel()
  assert.equal(entry.resume(ready),false)
  assert.equal(queue().resume(ready),false)
}

// Storage failures do not stop a same-page login flow.
{
  const entry=createPublicCaseStart({storage:()=>{throw new Error('storage disabled')},now:()=>time})
  assert.equal(entry.stage(chosen),true)
  assert.equal(entry.resume(ready),true)
  assert.deepEqual(received.pop(),chosen)
  assert.equal(entry.resume(ready),false)
}

for(const invalid of [null,{}, {...chosen,home:'XX'}, {...chosen,target:'xx'}, {...chosen,output:'xx'}]){
  const entry=queue()
  assert.equal(entry.stage(invalid),false)
  assert.equal(entry.resume(ready),false)
}
for(const raw of ['not json','null','[]',JSON.stringify({...chosen}),JSON.stringify({...chosen,createdAt:time+1}),JSON.stringify({...chosen,createdAt:time-2*60*60*1000-1})]){
  storage.setItem(PUBLIC_CASE_START_KEY,raw)
  assert.equal(queue().resume(ready),false,'invalid or expired choices must not be applied')
  assert.equal(storage.getItem(PUBLIC_CASE_START_KEY),null)
}
{
  const entry=queue()
  entry.stage(chosen)
  entry.stage({home:'VN',target:'FR',output:'ar'})
  assert.equal(entry.resume(ready),true)
  assert.deepEqual(received.pop(),{home:'VN',target:'FR',output:'ar'},'the latest explicit choice wins')
}
assert.equal(received.length,0)
console.log('Public case start passed: 2,156 combinations; sign-in/privacy gates; reload, one-time continuation, cancellation, invalid/expired choices and blocked storage. No live account writes or browser acceptance claimed.')
