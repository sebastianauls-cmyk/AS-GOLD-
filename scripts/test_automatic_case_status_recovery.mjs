import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {transformSync} from 'next/dist/build/swc/index.js'
import {createAutomaticCaseRun} from '../app/modules/cases/lib/automaticCaseRun.mjs'
import {roadmapTestCase,roadmapTestDocuments} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {automaticCaseCopy} from '../app/modules/cases/lib/automaticCaseCopy.mjs'
import {offlineNetworkAttempts} from './offline/noNetwork.mjs'

// Render the production panel and run its actual effects with controlled
// transport and hook state. No browser session, provider or live data is used.
const require=createRequire(import.meta.url)
const nodes=value=>Array.isArray(value)?value.flatMap(nodes):!React.isValidElement(value)?[]:[value,...nodes(value.props.children)]
function scenario({readError=true,existingJob=null,allow=true}={}){
  const slots=[],pending=[],cache=new Map(),timers=new Map()
  let cursor=0,dirty=true,tree,disposed=false,nextTimer=0
  const state={readError,latest:existingJob,reads:0,starts:0,authorizations:0}
  const hooks={...React,
    useState(initial){const index=cursor++;if(!(index in slots))slots[index]={value:typeof initial==='function'?initial():initial};return [slots[index].value,value=>{if(disposed)return;const next=typeof value==='function'?value(slots[index].value):value;if(!Object.is(next,slots[index].value)){slots[index].value=next;dirty=true}}]},
    useRef(initial){return hooks.useState(()=>({current:initial}))[0]},
    useMemo(callback,deps){const index=cursor++,old=slots[index];if(!old||deps.some((value,i)=>!Object.is(value,old.deps[i])))slots[index]={value:callback(),deps};return slots[index].value},
    useEffect(callback,deps){const index=cursor++,old=slots[index];if(!old||!deps||deps.some((value,i)=>!Object.is(value,old.deps?.[i]))){slots[index]={deps,cleanup:old?.cleanup};pending.push(()=>{slots[index].cleanup?.();slots[index].cleanup=callback()})}}
  }
  const schedule=(callback,delay=0)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id}
  const cancel=id=>timers.delete(id)
  const service={
    listCustomerRoadmaps:async()=>({data:[],error:null}),
    latestCustomerRoadmapJob:async()=>{state.reads++;return state.readError?{data:null,error:new TypeError('Synthetic connection interruption')}:{data:state.latest?[state.latest]:[],error:null}},
    authorizeRoadmap:async()=>{state.authorizations++;return {data:{},error:null}},
    generateCustomerRoadmap:async()=>{state.starts++;state.latest={id:'new-job',case_id:roadmapTestCase.id,status:'queued',stage:'capacity'};return {data:{job:state.latest},error:null}},
    roadmapErrorMessage:async()=> 'Synthetic failure'
  }
  function load(file){
    file=path.resolve(file)
    if(file.endsWith('.css'))return {}
    if(file.endsWith('/services/customerRoadmap.js'))return service
    if(cache.has(file))return cache.get(file).exports
    const mod={exports:{}};cache.set(file,mod)
    const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
    const localRequire=specifier=>{
      if(specifier==='react')return hooks
      if(!specifier.startsWith('.'))return require(specifier)
      const target=path.resolve(path.dirname(file),specifier)
      return load([target,target+'.js',target+'.mjs'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile()))
    }
    new Function('require','module','exports','setTimeout','clearTimeout','requestAnimationFrame','cancelAnimationFrame',code)(localRequire,mod,mod.exports,schedule,cancel,schedule,cancel)
    return mod.exports
  }
  const Panel=load('app/modules/cases/CustomerRoadmapPanel.js').CustomerRoadmapPanel
  const input={ownerId:roadmapTestCase.owner_id,item:roadmapTestCase,documents:roadmapTestDocuments,assessments:[],outputLanguage:'de'}
  const props={...input,supabase:{},continuation:{canContinue:allow},automaticRun:createAutomaticCaseRun(input)}
  return {state,props,
    async flush(){
      for(let turn=0;turn<30;turn++){
        if(dirty){dirty=false;cursor=0;tree=Panel(props);while(pending.length)pending.shift()()}
        await new Promise(setImmediate)
      }
      assert.equal(dirty,false,'controlled component must settle')
      return tree
    },
    retry(){const button=nodes(tree).find(node=>node.type==='button'&&node.props.children===automaticCaseCopy('de').status);assert.ok(button,'status-only retry is visible');button.props.onClick()},
    tick(){const [id,timer]=timers.entries().next().value||[];assert.ok(timer,'a bounded status refresh is scheduled');timers.delete(id);timer.callback();return timer.delay},
    get pendingTimers(){return timers.size},
    render(){dirty=true},
    dispose(){disposed=true;for(const slot of slots)slot?.cleanup?.();timers.clear()}
  }
}

{
  const test=scenario()
  try{
    await test.flush()
    assert.equal(test.state.starts,0,'uncertain saved job status cannot start work')
    test.state.readError=false;test.retry();await test.flush()
    assert.equal(test.state.starts,1,'a successful status-only retry must preserve the original one-time upload consent')
    test.render();await test.flush()
    assert.equal(test.state.starts,1,'rerendering cannot start a second job')
  }finally{test.dispose()}
}
{
  const test=scenario()
  try{
    await test.flush();assert.equal(test.state.starts,0)
    test.state.readError=false;assert.equal(test.tick(),3000);await test.flush()
    assert.equal(test.state.starts,1,'a transient status failure recovers automatically without a second upload or consent')
  }finally{test.dispose()}
}
{
  const test=scenario()
  try{
    await test.flush()
    assert.equal(test.tick(),3000);await test.flush()
    assert.equal(test.tick(),6000);await test.flush()
    assert.equal(test.state.reads,3,'persistent failures stop after the initial read and two retries')
    assert.equal(test.pendingTimers,0,'no infinite polling after a persistent failure')
    assert.equal(test.state.starts,0)
    test.state.readError=false;test.retry();await test.flush()
    assert.equal(test.state.starts,1,'manual status recovery remains available after bounded retries')
  }finally{test.dispose()}
}
for(const status of ['queued','running']){
  const test=scenario({existingJob:{id:'already-saved',case_id:roadmapTestCase.id,status,stage:'review'}})
  try{
    await test.flush();test.state.readError=false;test.retry();await test.flush()
    assert.equal(test.state.starts,0,'recovering status must observe an existing job, never enqueue again')
    assert.equal(test.state.authorizations,0)
    assert.equal(test.props.automaticRun.claim(test.props),'consumed','an observed active job consumes the handoff')
  }finally{test.dispose()}
}
{
  const test=scenario()
  try{
    await test.flush()
    test.props.documents=test.props.documents.map((doc,index)=>index?doc:{...doc,updated_at:'2026-10-19T10:00:00Z'})
    test.state.readError=false;test.retry();await test.flush()
    assert.equal(test.state.starts,0,'changed originals cannot reuse upload consent')
    assert.equal(test.props.automaticRun.claim(test.props),'consumed')
  }finally{test.dispose()}
}
{
  const test=scenario({readError:false,allow:false})
  try{
    await test.flush();test.props.continuation={canContinue:true};test.render();await test.flush()
    assert.equal(test.state.starts,0,'restoring access cannot resurrect a refused handoff')
  }finally{test.dispose()}
}
{
  const test=scenario()
  try{
    await test.flush();test.props.automaticRun.cancel()
    test.state.readError=false;test.tick();await test.flush()
    assert.equal(test.state.starts,0,'cancelled upload consent cannot be revived by status recovery')
  }finally{test.dispose()}
}
{
  const test=scenario()
  await test.flush();assert.equal(test.pendingTimers,1)
  test.dispose();assert.equal(test.pendingTimers,0,'leaving the panel cancels pending status retries')
  assert.equal(test.state.starts,0)
}
assert.deepEqual(offlineNetworkAttempts(),[],'no network transport may be attempted')
console.log('Automatic case status recovery passed: temporary read failure, exactly one authorized handoff, existing jobs, changed originals and access refusal. Production component effects; all service responses simulated.')
