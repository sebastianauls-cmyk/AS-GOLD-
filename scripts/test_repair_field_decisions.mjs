import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {COMPLETE_ANALYSIS_SCHEMA} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {localizedRepairTargets,localizedRepairSchema,localizedRepairAssignments,applyLocalizedRepair} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {quotationIndex,resolveQuotationIds,indexedQuotationSchema} from '../supabase/functions/_shared/quotationIndex.mjs'

const fixture=JSON.parse(readFileSync(new URL('./fixtures/rejectedKautionCorrection.json',import.meta.url),'utf8'))
const previous={analysis:{topics:[fixture.before],calculations:[],limitations:[]}},unchanged=structuredClone(previous)
const targets=localizedRepairTargets(previous,[{...fixture.first_finding,location:'analysis.topics[0]'}],COMPLETE_ANALYSIS_SCHEMA)
const spec=localizedRepairSchema(targets,previous,COMPLETE_ANALYSIS_SCHEMA)
const decision=replacement=>({action:'replace',reason:'Synthetic replacement; the independent review still decides whether it is supported.',replacement})
const preserve={action:'preserve',reason:'Retain this complete field for independent review.',replacement:null}
const {conclusion,conditions,...otherFields}=fixture.after
const valid={requires_full_correction:false,reason:'',topic_checks:{edit_0:{conclusion:decision(conclusion),conditions:decision(conditions)}},changes:{edit_0:otherFields}}
const apply=reply=>applyLocalizedRepair(reply,targets,previous,COMPLETE_ANALYSIS_SCHEMA,value=>value)
const assembled=apply(valid)
assert.deepEqual(assembled.analysis.topics[0],fixture.after,'atomic field decisions assemble the complete replacement without conferring semantic approval')
assert(!Object.hasOwn(assembled,'topic_checks'),'decisions are not customer output or review receipts')
assert.deepEqual(previous,unchanged,'patch assembly leaves the sealed original unchanged')
assert.deepEqual(localizedRepairAssignments(targets,previous)[0].check_fields,['conclusion','conditions'])
assert.deepEqual(spec.properties.topic_checks.anyOf[0].properties.edit_0.required,['conclusion','conditions'])
assert(Object.keys(spec.properties).indexOf('topic_checks')<Object.keys(spec.properties).indexOf('changes'))
assert.deepEqual(indexedQuotationSchema(spec).properties.topic_checks,spec.properties.topic_checks)
for(const field of ['conclusion','conditions']){
  assert(!Object.hasOwn(spec.properties.changes.anyOf[0].properties.edit_0.properties,field),'the same text is never requested a second time')
  const branches=spec.properties.topic_checks.anyOf[0].properties.edit_0.properties[field].anyOf
  assert.deepEqual(branches.map(branch=>branch.properties.action.enum),[['preserve'],['replace']])
  assert.equal(branches[0].properties.replacement.type,'null')
  assert.equal(branches[1].properties.replacement.type,'string')
  assert.equal(branches[0].properties.reason.pattern,'\\S','blank reasons are excluded by the model response schema too')
}

for(const mutate of [
  reply=>{delete reply.topic_checks},
  reply=>{reply.topic_checks=null},
  reply=>{delete reply.topic_checks.edit_0.conditions},
  reply=>{reply.topic_checks.edit_1=reply.topic_checks.edit_0},
  reply=>{reply.topic_checks.edit_0.conditions.action='preserve'},
  reply=>{reply.topic_checks.edit_0.conditions.replacement=null},
  reply=>{reply.topic_checks.edit_0.conditions.replacement=fixture.before.conditions},
  reply=>{reply.topic_checks.edit_0.conditions.reason='   '},
  reply=>{reply.topic_checks.edit_0.conditions.reason='x'.repeat(501)},
  reply=>{reply.topic_checks.edit_0.conditions.approved=true},
  reply=>{reply.topic_checks.edit_0.conditions.action='approved'},
  reply=>{reply.changes.edit_0.conditions='A second conflicting text must not be silently ignored.'},
  reply=>{reply.changes.edit_0.id='unassigned'}
]){
  const invalid=structuredClone(valid);mutate(invalid)
  assert.throws(()=>apply(invalid),/Korrektur|Feldprüfung/,'missing, contradictory or invented decisions cannot reach independent review')
}
const preserved=structuredClone(valid)
preserved.topic_checks.edit_0.conditions={...preserve}
assert.equal(apply(preserved).analysis.topics[0].conditions,fixture.before.conditions,'preservation copies the server-held original verbatim, without model retranscription')
assert.equal(apply({requires_full_correction:true,reason:'A necessary new item is outside this patch.',topic_checks:null,changes:null}),null)
assert.throws(()=>apply({...valid,requires_full_correction:true,reason:'A wider change is needed.',changes:null}),/Gesamtkorrektur/)

// Expand a replacement in its real topic location before checking citations and
// actual changes. Preservation never asks the model to reconstruct a quotation.
{
  const research=[{url:'https://www.gesetze-im-internet.de/synthetic_field_check/__1.html',source_text:'SYNTHETIC RULE. This is fixture text, not a real legal proposition.'}]
  const index=quotationIndex({documents:[]},research),passage=index.get('@s0_0')
  const candidate={analysis:{...previous.analysis,topics:[{...fixture.before,conclusion:'Text: „'+passage.quote+'“',sources:[{url:passage.url,quote:passage.quote}]}]}}
  const {conclusion,conditions,...rest}=candidate.analysis.topics[0]
  const patch={requires_full_correction:false,reason:'',topic_checks:{edit_0:{conclusion:{...preserve},conditions:{...preserve}}},changes:{edit_0:{...rest,sources:[{quote:'@s0_0'}]}}}
  const applyIndexed=reply=>applyLocalizedRepair(reply,targets,candidate,COMPLETE_ANALYSIS_SCHEMA,(value,pathPrefix)=>resolveQuotationIds(value,index,{pathPrefix}))
  assert.deepEqual(applyIndexed(patch),candidate)
  patch.topic_checks.edit_0.conclusion=decision('Changed text: [[rule:@s0_0]]')
  assert.equal(applyIndexed(patch).analysis.topics[0].conclusion,'Changed text: „'+passage.quote+'“')
  patch.topic_checks.edit_0.conclusion=decision('Text: [[rule:@s0_0]]')
  assert.throws(()=>applyIndexed(patch),/Feldprüfung/,'a different marker spelling is not an actual text change')
  patch.topic_checks.edit_0.conclusion=decision('Changed text: [[rule:@s9_9]]')
  assert.throws(()=>applyIndexed(patch),/Recherchebeleg/,'an atomic replacement cannot invent evidence')
}
console.log('Atomic repair decisions: each text supplied once; preserve copies the original; malformed decisions, duplicated fields, no-op replacements and fabricated citations stay rejected. Semantic approval remains independent.')
