import assert from 'node:assert/strict'
import {roadmapOverviewBlocks,roadmapOverviewCopy} from '../app/modules/cases/lib/roadmapOverview.mjs'
import {roadmapExportBlocks} from '../app/modules/services/customerRoadmapExport.mjs'
import {roadmapTestRecord} from '../app/modules/testing/customerRoadmapFixture.mjs'
import {ROADMAP_LANGUAGES,updateRoadmapProgress} from '../supabase/functions/_shared/customerRoadmap.mjs'

const record=roadmapTestRecord(),today='2026-10-07'
const before=structuredClone(record)
const overview=(value,options={})=>roadmapOverviewBlocks(value,{today,...options})
const count=(blocks,light)=>Number(blocks.find(block=>block.light===light)?.text.split(': ').at(-1)||0)
const initial=overview(record)
assert.equal(count(initial,'green'),0,'an analysed case is not a completed case')
assert.ok(initial.some(block=>block.text===record.result.opening),'preserve all qualifications in the opening')
for(const point of record.result.key_points)assert.ok(initial.some(block=>block.text===point))
assert.deepEqual(record,before,'summary must not rewrite stored findings or progress')

const dated=structuredClone(record)
dated.result.steps[0].deadline={date:'2026-10-15'}
dated.result.steps.forEach(step=>{step.light='yellow'})
assert.equal(count(overview(dated),'red'),0,'future date is not already overdue')
assert.equal(count(overview(dated,{today:'2026-10-15'}),'red'),1,'due date becomes urgent')
assert.equal(count(overview(dated,{today:'2026-10-16'}),'red'),1,'unconfirmed overdue work stays urgent')
dated.result.steps[0].deadline=null
assert.equal(count(overview(dated),'green'),0,'unknown dates cannot imply completion')

const completed=structuredClone(record)
for(const step of completed.result.steps)Object.assign(completed,updateRoadmapProgress(completed,{step_id:step.id,done:true,note:'Evidence of completion recorded.'}))
assert.equal(count(overview(completed),'green'),completed.result.steps.length)
assert.equal(count(overview(completed,{stale:true}),'green'),0,'stale inputs invalidate completion in the overview')
Object.assign(completed,updateRoadmapProgress(completed,{step_id:completed.result.steps[0].id,done:false,note:'Completion has been reopened.'}))
assert.ok(count(overview(completed),'green')<completed.result.steps.length,'reopening updates the summary')

const blocked=structuredClone(record)
blocked.result.steps[1].depends_on=[blocked.result.steps[0].id]
blocked.result.steps[1].light='red'
const blockedSummary=overview(blocked)
assert.ok(count(blockedSummary,'red')>=1,'blocked urgency remains visible')
const nextIndex=blockedSummary.findIndex(block=>block.text===roadmapOverviewCopy('de').next)
const deadlineIndex=blockedSummary.findIndex(block=>block.text===roadmapOverviewCopy('de').deadline)
assert.ok(!blockedSummary.slice(nextIndex+1,deadlineIndex).some(block=>block.text.includes(blocked.result.steps[1].title)),'do not tell the customer to skip prerequisites')
assert.ok(deadlineIndex-nextIndex-1<=3,'at most three next actions')

for(const language of ROADMAP_LANGUAGES){
  const localized={...record,output_language:language},blocks=overview(localized)
  assert.equal(blocks[0].text,roadmapOverviewCopy(language).title)
  assert.ok(blocks.every(block=>typeof block.text==='string'&&!block.text.includes('undefined')))
  if(language!=='de')assert.notEqual(blocks[0].text,initial[0].text)
}
const full=roadmapExportBlocks(record,{today})
assert.deepEqual(full.slice(0,initial.length),initial,'both exporters share the same overview')
assert.equal(full[initial.length].pageBreakBefore,true,'full report starts separately')
for(const letter of record.result.letters){
  const blocks=roadmapExportBlocks(record,{letterId:letter.id,today})
  assert.ok(!blocks.some(block=>block.compact||block.light),'customer letters contain no dashboard summary')
  assert.ok(blocks.some(block=>block.text===letter.subject))
}
console.log('Roadmap overview: confirmed progress, deadlines, reopening, dependencies, full source sentences, 11 languages and separate letters passed.')
