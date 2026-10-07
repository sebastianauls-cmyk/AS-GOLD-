import assert from 'node:assert/strict'
import {monthlyCalculationSummaries} from '../app/modules/cases/lib/monthlyCalculationSummary.mjs'
import {completeAnalysisBlocks} from '../app/modules/cases/lib/completeAnalysisDisplay.mjs'

const monthly=(id,result)=>({id,title:id,unit:'USD per month',result,decimal_places:2,inputs:[],expression:'',topic_ids:[],conditions:'',explanation:''})
const period=(id,source,result)=>({id,title:id,unit:'USD',result,decimal_places:2,
  inputs:[{name:'amount',kind:'calculation',calculation_id:source.id,value:source.result},
    {name:'months',kind:'document',document_id:'contract',quote:'Both amounts apply for 12 months.',value:'12'}],
  expression:'amount * months',topic_ids:[],conditions:'Same twelve-month scenario.',explanation:''})
const a=monthly('first','13.27'),b=monthly('second','8.08')
const pa=period('first-year',a,'159.24'),pb=period('second-year',b,'96.96')
const total={id:'total',title:'Conditional annual sum',unit:'USD',result:'256.20',decimal_places:2,
  inputs:[{name:'first',kind:'calculation',calculation_id:pa.id,value:pa.result},{name:'second',kind:'calculation',calculation_id:pb.id,value:pb.result}],
  expression:'first + second',topic_ids:[],conditions:'Separate positions remain separate.',explanation:''}
const base={topics:[],limitations:[],research_sources:[],calculations:[a,b,pa,pb,total]}
const original=JSON.stringify(base),summary=monthlyCalculationSummaries(base)
assert.equal(summary.length,1);assert.equal(summary[0].result,'21.35');assert.equal(summary[0].unit,'USD per month')
assert.equal(JSON.stringify(base),original,'derived display must not mutate the reviewed record')
for(const language of ['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']){
  const blocks=completeAnalysisBlocks(base,language)
  assert.ok(blocks.some(block=>block.kind==='heading'&&block.text.includes('USD per month')))
  assert.ok(blocks.some(block=>block.text.includes('Separate positions remain separate.')),'conditions remain visible')
}
const reject=(label,change)=>{const value=structuredClone(base);change(value.calculations);assert.equal(monthlyCalculationSummaries(value).length,0,label)}
reject('different currencies',c=>{c[1].unit='EUR per month'})
reject('monthly and yearly rates cannot be mixed',c=>{c[1].unit='USD per year'})
reject('different periods',c=>{c[3].inputs[1].value='24';c[3].result='193.92';c[4].inputs[1].value='193.92';c[4].result='353.16'})
reject('equal numbers from different period sources',c=>{c[3].inputs[1].document_id='another-contract'})
reject('equal periods with different dated evidence',c=>{c[3].inputs[1].quote='A different twelve-month interval.'})
reject('no period evidence',c=>{delete c[2].inputs[1].quote})
reject('a difference is not a combined monthly sum',c=>{c[4].expression='first - second';c[4].result='62.28'})
reject('same component counted twice',c=>{c[3].inputs[0].calculation_id='first';c[3].inputs[0].value='13.27';c[3].result='159.24';c[4].inputs[1].value='159.24';c[4].result='318.48'})
reject('stale referenced input',c=>{c[2].inputs[0].value='13.28'})
reject('wrong accepted total',c=>{c[4].result='256.21'})
reject('extra unaccounted-for input',c=>{c[4].inputs.push({name:'extra',kind:'assumption',value:'1'})})
reject('duplicate input names',c=>{c[4].inputs[1].name='first'})
reject('duplicate calculation identities',c=>{c[1].id='first'})
reject('unsafe expression',c=>{c[4].expression='globalThis.fetch()'})
reject('zero period',c=>{c[2].inputs[1].value='0'})
console.log('Monthly control totals: exact arithmetic, common sourced period, unchanged record, 11 display languages and ambiguous-input rejection passed.')
