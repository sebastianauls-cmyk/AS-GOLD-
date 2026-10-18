import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {COMPLETE_ANALYSIS_SCHEMA} from '../supabase/functions/_shared/completeCaseAnalysis.mjs'
import {localizedRepairTargets,localizedRepairSchema,localizedRepairAssignments,applyLocalizedRepair} from '../supabase/functions/_shared/completeCaseRepair.mjs'
import {quotationIndex,resolveQuotationIds,indexedQuotationSchema} from '../supabase/functions/_shared/quotationIndex.mjs'

const fixture=JSON.parse(readFileSync(new URL('./fixtures/rejectedKautionCorrection.json',import.meta.url),'utf8'))
const previous={analysis:{topics:[fixture.before],calculations:[],limitations:[]}},unchanged=structuredClone(previous)
const targets=localizedRepairTargets(previous,[{...fixture.first_finding,location:'analysis.topics[0]'}],COMPLETE_ANALYSIS_SCHEMA)
const spec=localizedRepairSchema(targets,previous,COMPLETE_ANALYSIS_SCHEMA)
assert.deepEqual(localizedRepairAssignments(targets,previous)[0].check_fields,['conclusion','conditions'])
assert.deepEqual(spec.properties.topic_checks.anyOf[0].properties.edit_0.required,['conclusion','conditions'])
assert(Object.keys(spec.properties).indexOf('topic_checks')<Object.keys(spec.properties).indexOf('changes'),'field decisions precede the final replacement in the output schema')
assert.deepEqual(indexedQuotationSchema(spec).properties.topic_checks,spec.properties.topic_checks,'quotation indexing cannot remove the field decisions')
const decision={action:'replace',reason:'Synthetic response replaces this field; the independent review still decides whether it is supported.'}
const valid={requires_full_correction:false,reason:'',topic_checks:{edit_0:{conclusion:{...decision},conditions:{...decision}}},changes:{edit_0:fixture.after}}
const apply=reply=>applyLocalizedRepair(reply,targets,previous,COMPLETE_ANALYSIS_SCHEMA,value=>value)
const assembled=apply(valid)
assert.deepEqual(assembled.analysis.topics[0],fixture.after,'structural decisions alone do not pretend to approve the historically rejected text')
assert(!Object.hasOwn(assembled,'topic_checks'),'self-assessments are not customer output or review receipts')
assert.deepEqual(previous,unchanged,'patch assembly leaves the sealed original unchanged')

for(const mutate of [
  reply=>{delete reply.topic_checks},
  reply=>{reply.topic_checks=null},
  reply=>{delete reply.topic_checks.edit_0.conditions},
  reply=>{reply.topic_checks.edit_1=reply.topic_checks.edit_0},
  reply=>{reply.topic_checks.edit_0.conditions.action='preserve'},
  reply=>{reply.changes.edit_0.conditions=fixture.before.conditions},
  reply=>{reply.topic_checks.edit_0.conditions.reason='   '},
  reply=>{reply.topic_checks.edit_0.conditions.reason='x'.repeat(501)},
  reply=>{reply.topic_checks.edit_0.conditions.approved=true},
  reply=>{reply.topic_checks.edit_0.conditions.action='approved'}
]){
  const invalid=structuredClone(valid);mutate(invalid)
  assert.throws(()=>apply(invalid),/Korrektur|Feldprüfung/,'missing, contradictory or invented decisions cannot reach independent review')
}
const preserved=structuredClone(valid)
preserved.changes.edit_0.conditions=fixture.before.conditions
preserved.topic_checks.edit_0.conditions.action='preserve'
assert.equal(apply(preserved).analysis.topics[0].conditions,fixture.before.conditions,'an internally consistent preservation decision still needs semantic review')
assert.equal(apply({requires_full_correction:true,reason:'A necessary new item is outside this patch.',topic_checks:null,changes:null}),null)
assert.throws(()=>apply({...valid,requires_full_correction:true,reason:'A wider change is needed.',changes:null}),/Gesamtkorrektur/)

// Compare the expanded source text. Selecting its already cited passage again
// does not count as changing an existing conclusion or force a spurious edit.
{
  const research=[{url:'https://www.gesetze-im-internet.de/synthetic_field_check/__1.html',source_text:'SYNTHETIC RULE. This is fixture text, not a real legal proposition.'}]
  const index=quotationIndex({documents:[]},research),passage=index.get('@s0_0')
  const candidate={analysis:{...previous.analysis,topics:[{...fixture.before,conclusion:'Text: „'+passage.quote+'“',sources:[{url:passage.url,quote:passage.quote}]}]}}
  const patch={requires_full_correction:false,reason:'',topic_checks:{edit_0:{conclusion:{action:'preserve',reason:'The already cited exact synthetic text remains unchanged.'},conditions:{action:'preserve',reason:'The synthetic condition remains subject to independent review.'}}},changes:{edit_0:{...candidate.analysis.topics[0],conclusion:'Text: [[rule:@s0_0]]',sources:[{quote:'@s0_0'}]}}}
  assert.deepEqual(applyLocalizedRepair(patch,targets,candidate,COMPLETE_ANALYSIS_SCHEMA,(value,pathPrefix)=>resolveQuotationIds(value,index,{pathPrefix})),candidate)
}
console.log('Repair field decisions: both topic fields required, inconsistent/missing decisions rejected, source text compared after expansion; structural checks never confer semantic approval.')
