import {calculateExpression} from '../../../../supabase/functions/_shared/checkedCalculations.mjs'

const identifier='[A-Za-z_][A-Za-z0-9_]*'
const monthlyUnit=/^([A-Z]{3})\s*(?:pro\s+Monat|per\s+month|par\s+mois|monthly|miesięcznie|в\s+месяц|pe\s+lună|на\s+месец|mỗi\s+tháng|شهريًا|در\s+ماه|\/\s*(?:Monat|month|mois|ay|miesiąc|месяц|lună|месец|tháng))$/iu
const same=(a,b)=>calculateExpression('a-b',{a,b},8)==='0.00000000'
const values=calculation=>Object.fromEntries(calculation.inputs.map(input=>[input.name,input.value]))
function operands(calculation,operator){
  const inputs=calculation?.inputs
  if(!Array.isArray(inputs)||new Set(inputs.map(input=>input.name)).size!==inputs.length)return null
  const expression=String(calculation.expression||'').replace(/\s/g,'')
  if(!new RegExp('^'+identifier+'(?:\\'+operator+identifier+')+$').test(expression))return null
  const names=expression.split(operator)
  if(names.length!==inputs.length||new Set(names).size!==names.length)return null
  const selected=names.map(name=>inputs.find(input=>input.name===name))
  if(selected.some(input=>!input))return null
  if(!same(calculateExpression(calculation.expression,values(calculation),8),calculation.result))return null
  return selected
}
function monthlyPart(calculation,currency,byId){
  if(!calculation||calculation.unit!==currency)return null
  const inputs=operands(calculation,'*')
  if(inputs?.length!==2)return null
  const amount=inputs.find(input=>input.kind==='calculation'&&monthlyUnit.test(byId.get(input.calculation_id)?.unit||''))
  if(!amount)return null
  const source=byId.get(amount.calculation_id),period=inputs.find(input=>input!==amount)
  if(monthlyUnit.exec(source.unit)?.[1].toUpperCase()!==currency||!same(amount.value,source.result))return null
  if(!['document','source','assumption'].includes(period.kind)||!/^\d{1,8}$/.test(period.value)||BigInt(period.value)===0n)return null
  // A shared period needs the same source/assumption, not merely the same number.
  const provenance=JSON.stringify([period.kind,period.document_id||period.url||'',period.quote||period.explanation||'',period.value])
  if(!period.quote&&!period.explanation)return null
  return {source,period,provenance}
}

// Only unpack an already explicit total of amounts over the same sourced period.
// Never group entries by title, person, equal unit, or a hard-coded case value.
export function monthlyCalculationSummaries(analysis){
  const calculations=analysis?.calculations||[],byId=new Map(calculations.map(entry=>[entry.id,entry])),summaries=[]
  if(byId.size!==calculations.length)return summaries
  for(const total of calculations)try{
    if(!/^[A-Z]{3}$/.test(total.unit))continue
    const inputs=operands(total,'+')
    if(!inputs||inputs.length<2||inputs.some(input=>input.kind!=='calculation'))continue
    const parts=inputs.map(input=>{
      const calculation=byId.get(input.calculation_id)
      return calculation&&same(input.value,calculation.result)?monthlyPart(calculation,total.unit,byId):null
    })
    if(parts.some(part=>!part)||new Set(parts.map(part=>part.provenance)).size!==1)continue
    if(new Set(parts.map(part=>part.source.id)).size!==parts.length||new Set(parts.map(part=>part.source.unit)).size!==1)continue
    const variables=Object.fromEntries(parts.map((part,index)=>['part_'+index,part.source.result]))
    const expression=Object.keys(variables).join(' + '),places=Math.max(...parts.map(part=>part.source.decimal_places??2))
    const result=calculateExpression(expression,variables,places)
    if(!same(calculateExpression('amount * months',{amount:result,months:parts[0].period.value},8),total.result))continue
    summaries.push({total,result,unit:parts[0].source.unit,parts:parts.map(part=>part.source)})
  }catch{/* Ambiguous or malformed historical records receive no inferred total. */}
  return summaries
}
