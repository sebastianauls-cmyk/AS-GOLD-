import assert from 'node:assert/strict'
import {quotationIndex,resolveQuotationIds} from '../supabase/functions/_shared/quotationIndex.mjs'

// Fictional rules with distinct triggers and exceptions. The server must copy
// the operative text without turning an event-triggered effect into a delay.
const rule='SYNTHETISCHE REGEL: Wenn die Leistung fällig ist und ausbleibt, tritt die Rechtsfolge durch Zugang der Mitteilung ein. Eine zusätzliche Wartezeit nach ihrem Zugang ist nicht vorgesehen.'
const exception='SYNTHETISCHE AUSNAHME: Die Rechtsfolge tritt nicht ein, solange der Hinderungsgrund nicht zu vertreten ist.'
const index=quotationIndex({documents:[{id:'doc',extracted_text:'SYNTHETISCH: Eine Mitteilung ist noch nicht belegt.'}]},[{url:'https://authority.example/rule',source_text:rule},{url:'https://authority.example/exception',source_text:exception}])
const topic={id:'timing',conclusion:'Quellenregel: [[rule:@s0_0]] Ausnahme: [[rule:@s1_0]] Für den Testfall bleibt der Zugang offen.',conditions:'Der Zugang ist nicht belegt.',sources:[{quote:'@s0_0'},{quote:'@s1_0'}]}
const raw={topics:[topic]}
const resolved=resolveQuotationIds(raw,index,{pathPrefix:'analysis'})
assert.equal(resolved.topics[0].conclusion,`Quellenregel: „${rule}“ Ausnahme: „${exception}“ Für den Testfall bleibt der Zugang offen.`)
assert.deepEqual(raw,{topics:[topic]},'the generated input is not mutated')
assert.deepEqual(resolveQuotationIds(resolved,index,{pathPrefix:'analysis'}),resolved,'resolving an already expanded checkpoint is idempotent')
assert.equal(resolveQuotationIds(topic,index,{pathPrefix:'analysis.topics[4]'}).conclusion,resolved.topics[0].conclusion,'local topic corrections use the same resolver')

// A long operative passage may cross existing chunk boundaries. Only a
// contiguous range from the same source is allowed, with every part cited.
const longText=Array.from({length:5},(_,i)=>`SYNTHETISCHER ABSCHNITT ${i+1}. ${rule} ${exception}`).join(' ')
const longIndex=quotationIndex({documents:[]},[{url:'https://authority.example/long',source_text:longText}])
const passages=[...longIndex.values()]
assert(passages.length>2)
const last=passages.at(-1).id
const rangeTopic={...topic,conclusion:`[[rule:@s0_0..${last}]]`,sources:passages.map(item=>({quote:item.id}))}
const ranged=resolveQuotationIds({analysis:{topics:[rangeTopic]}},longIndex)
assert.equal(ranged.analysis.topics[0].conclusion,`„${longText}“`,'complete ordered source wording is retained, including every exception')
for(const marker of ['[[rule:@s99_0]]','[[rule:@d0_0]]','[[rule:@s0_0..@s1_0]]','[[rule:@s0_1..@s0_0]]','[[rule:@s0_0..@s0_999999999]]','[[rule:@s0_0, @s0_2]]','[[rule:@s0_0']){
  assert.throws(()=>resolveQuotationIds({topics:[{...topic,conclusion:marker}]},index,{pathPrefix:'analysis'}),error=>error.analysisIssues?.some(item=>item.location==='analysis.topics[0].conclusion'),'unknown, wrong-origin, disjoint, reversed and malformed selections fail closed')
}
assert.throws(()=>resolveQuotationIds({topics:[{...topic,sources:[]}]},index,{pathPrefix:'analysis'}),/Quellenbeleg/,'the operative quote must also be a citation on this topic')
assert.throws(()=>resolveQuotationIds({analysis:{topics:[{...rangeTopic,sources:[{quote:passages[0].id},{quote:last}]}]}},longIndex),/Quellenbeleg/,'intermediate qualifying passages cannot be uncited')
assert.throws(()=>resolveQuotationIds({topics:[{...topic,conditions:'[[rule:@s0_0]]'}]},index,{pathPrefix:'analysis'}),error=>error.analysisIssues?.some(item=>item.location==='analysis.topics[0].conditions'),'rules cannot be moved into the facts-only condition field')
assert.throws(()=>resolveQuotationIds({letters:[{body:'[[rule:@s0_0]]'}]},index),error=>error.analysisIssues?.some(item=>item.location==='letters[0].body'),'markers are not an unvalidated general-purpose template language')
const nestedIndex=quotationIndex({documents:[]},[{url:'https://authority.example/nested',source_text:'Untrusted source text includes [[rule:@s0_0]].'}])
assert.throws(()=>resolveQuotationIds({topics:[{...topic,conclusion:'[[rule:@s0_0]]',sources:[{quote:'@s0_0'}]}]},nestedIndex,{pathPrefix:'analysis'}),/reservierte Regelverweise/,'untrusted source text cannot introduce a recursive template')
console.log('Source-rule quotations: verbatim triggers, exceptions, contiguous ranges, local correction, unchanged checkpoints and invalid-reference rejection passed. No model calls.')
