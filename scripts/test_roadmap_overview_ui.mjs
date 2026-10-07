import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {roadmapOverview,roadmapOverviewCopy,roadmapOverviewBlocks} from '../app/modules/cases/lib/roadmapOverview.mjs'
import {roadmapUi} from '../app/modules/cases/lib/customerRoadmapCopy.mjs'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {ROADMAP_LANGUAGES,updateRoadmapProgress} from '../supabase/functions/_shared/customerRoadmap.mjs'

// Render the actual component and invoke its real step callbacks. This is a
// server-rendered regression check, not an authenticated browser acceptance run.
const require=createRequire(import.meta.url),cache=new Map()
function load(file){
  file=path.resolve(file)
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    const resolved=[target,target+'.js',target+'.mjs'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile())
    if(!resolved)throw new Error('Cannot resolve '+specifier+' from '+file)
    return load(resolved)
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
const {RoadmapOverview}=load('app/modules/cases/RoadmapOverview.js')
const nodes=element=>Array.isArray(element)?element.flatMap(nodes):!React.isValidElement(element)?[]:[element,...nodes(element.props.children)]
const today='2026-10-07',record=roadmapTestRecord(),before=structuredClone(record)
const state=(value,options={})=>roadmapOverview(value,{today,...options})
const props=(value,options={})=>({overview:state(value,options),language:value.output_language,onOpenStep(){}})
const html=(value,options={})=>renderToStaticMarkup(React.createElement(RoadmapOverview,props(value,options)))
const buttons=tree=>nodes(tree).filter(node=>node.type==='button')

assert.deepEqual(state(record).counts,{red:1,yellow:3,green:0,white:0})
assert.deepEqual(state(record).next.map(step=>step.id),['frist','anfragen'],'blocked replies and closure must not be suggested')
assert.deepEqual(state(record).deadline.deadline.date,'2026-09-30')
const opened=[]
let tree=RoadmapOverview({...props(record),onOpenStep:id=>opened.push(id)})
for(const button of buttons(tree))button.props.onClick()
assert.deepEqual(opened,['frist','anfragen'],'each visible shortcut opens its own saved step')
assert.equal(buttons(RoadmapOverview({...props(record),onOpenStep:undefined})).length,0,'read-only overview exposes no action')
assert.ok(buttons(RoadmapOverview({...props(record),busy:true})).every(button=>button.props.disabled),'ongoing operations disable all shortcuts')

const parallel=roadmapTestRecord()
parallel.result.steps.forEach(step=>{step.depends_on=[];step.light='yellow';step.deadline=null;step.phase='parallel'})
parallel.result.steps[3].deadline={date:'2026-10-07'}
assert.deepEqual(state(parallel).next.map(step=>step.id),['abschluss','frist','anfragen'],'urgent work comes first and the list stops after three')
tree=RoadmapOverview(props(parallel))
assert.equal(buttons(tree).length,3)
assert.deepEqual(nodes(tree).filter(node=>node.type==='li').map(node=>node.props.value),[4,1,2],'shortcuts keep original step numbers after prioritisation')

let confirmed=roadmapTestRecord()
for(const step of confirmed.result.steps)confirmed={...confirmed,...updateRoadmapProgress(confirmed,{step_id:step.id,done:true,note:'Synthetic completion with confirmation recorded.'})}
assert.deepEqual(state(confirmed).counts,{red:0,yellow:0,green:4,white:0})
assert.equal(buttons(RoadmapOverview(props(confirmed))).length,0)
assert.equal(state(confirmed).deadline,null,'completed deadlines disappear')
assert.ok(html(confirmed).includes(state(confirmed).current.next))
assert.deepEqual(state(confirmed,{stale:true}).counts,{red:0,yellow:0,green:0,white:4})
assert.equal(buttons(RoadmapOverview(props(confirmed,{stale:true}))).length,0)
assert.ok(html(confirmed,{stale:true}).includes(roadmapUi('de').stale))
assert.doesNotMatch(html(record,{stale:true}),/<time\b/,'an old date is not presented as the current next deadline')

const reopened={...confirmed,...updateRoadmapProgress(confirmed,{step_id:'anfragen',done:false,note:'Synthetic missing document requires renewed review.'})}
assert.deepEqual(state(reopened).counts,{red:0,yellow:3,green:1,white:0})
assert.deepEqual(state(reopened).next.map(step=>step.id),['anfragen'],'reopening invalidates downstream completion')
const waiting={...reopened,...updateRoadmapProgress(reopened,{step_id:'anfragen',done:true,note:'Synthetic requests sent and delivery documented.'})}
assert.equal(state(waiting).current.state,'waiting')
assert.ok(html(waiting).includes(roadmapUi('de').waiting),'waiting is visibly labelled rather than treating a reply as received')

const unknown=roadmapTestRecord()
unknown.result.steps.forEach(step=>{step.deadline=null;step.light='yellow'})
assert.ok(html(unknown).includes(roadmapOverviewCopy('de').noDate))
assert.equal(state(unknown).counts.green,0,'missing dates never turn green')

for(const language of ROADMAP_LANGUAGES){
  const localized={...record,output_language:language},copy=roadmapOverviewCopy(language)
  const rendered=html(localized),blocks=roadmapOverviewBlocks(localized,{today})
  assert.ok(rendered.includes(copy.title),language+': translated overview')
  assert.ok(rendered.includes(copy.next),language+': translated next steps')
  assert.ok(rendered.includes(copy.deadline),language+': translated deadline')
  assert.doesNotMatch(rendered,/undefined|NaN/)
  for(const light of ['red','yellow','green'])assert.ok(blocks.some(block=>block.text===`${copy[light]}: ${state(localized).counts[light]}`),'UI and exports share traffic-light counts')
}
assert.deepEqual(record,before,'viewing an overview never rewrites evidence, progress or letters')
console.log('Roadmap overview UI: real React render, correct step callbacks, read-only/busy gates, three-step limit, evidence dates, blocked/waiting/completed/reopened/stale states and 11 languages passed (SSR; no browser session).')
