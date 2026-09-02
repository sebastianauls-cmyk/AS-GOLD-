const moneyConcepts=['miete','pacht','forderung','schaden','rechnung','zahlung','betrag','preis','kosten']
const dateConcepts=['frist','kündigung','beginn','ende','zahlung','räumung','widerspruch']

function normalizeAmount(raw=''){
  const cleaned=String(raw).replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.')
  const value=Number.parseFloat(cleaned)
  return Number.isFinite(value)?value:null
}

function extractConceptAmounts(text=''){
  const lower=String(text).toLowerCase();const out=[]
  for(const concept of moneyConcepts){
    const re=new RegExp(`(?:${concept})[^\\n\\r]{0,60}?(\\d{1,3}(?:[.\\s]\\d{3})*(?:,\\d{2})?|\\d+(?:,\\d{2})?)\\s*(?:€|eur)`,'gi')
    for(const match of lower.matchAll(re)){const value=normalizeAmount(match[1]);if(value!==null)out.push({concept,value})}
  }
  return out
}

function extractConceptDates(text=''){
  const lower=String(text).toLowerCase();const out=[]
  for(const concept of dateConcepts){
    const re=new RegExp(`(?:${concept})[^\\n\\r]{0,70}?(\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{4})`,'gi')
    for(const match of lower.matchAll(re))out.push({concept,value:match[1]})
  }
  return out
}

function deviations(documents=[]){
  const grouped=new Map()
  for(const doc of documents){
    for(const item of [...extractConceptAmounts(doc.extracted_text),...extractConceptDates(doc.extracted_text)]){
      const key=`${typeof item.value==='number'?'amount':'date'}:${item.concept}`
      if(!grouped.has(key))grouped.set(key,new Map())
      const values=grouped.get(key);const normalized=String(item.value)
      if(!values.has(normalized))values.set(normalized,[])
      values.get(normalized).push(doc.title||'Dokument')
    }
  }
  return [...grouped.entries()].filter(([,values])=>values.size>1).map(([key,values])=>({concept:key.split(':')[1],type:key.split(':')[0],values:[...values.entries()].map(([value,docs])=>({value,docs}))}))
}

function assessmentComplexes(assessments=[]){
  const grouped=new Map()
  for(const assessment of assessments){
    const title=String(assessment?.title||'').trim()||'Ohne Bezeichnung'
    const key=title.toLocaleLowerCase('de-DE')
    if(!grouped.has(key))grouped.set(key,{title,total:0,red:0,yellow:0,green:0,withoutNext:0})
    const group=grouped.get(key)
    const traffic=['red','yellow','green'].includes(assessment?.traffic_light)?assessment.traffic_light:'yellow'
    group.total+=1
    group[traffic]+=1
    if(!assessment?.next_step?.trim())group.withoutNext+=1
  }
  return [...grouped.values()].sort((left,right)=>right.red-left.red||right.withoutNext-left.withoutNext||right.total-left.total||left.title.localeCompare(right.title,'de'))
}

function calculateScore({gaps,documents,unreadCount,redCount,redWithoutNextCount,deviationCount}){
  const fixedGaps=gaps.filter(gap=>!['unread_documents','red_without_next'].includes(gap))
  const fixedPenalty=fixedGaps.length*12
  const unreadRatio=documents.length?unreadCount/documents.length:0
  const unreadPenalty=unreadCount
    ?8+Math.min(12,unreadCount*2)+Math.min(8,Math.round(unreadRatio*16))
    :0
  const unresolvedRedPenalty=redWithoutNextCount
    ?8+Math.min(18,redWithoutNextCount*2)
    :0
  const redRiskPenalty=redCount?Math.min(14,Math.ceil(Math.sqrt(redCount)*1.5)):0
  const deviationPenalty=Math.min(30,deviationCount*10)
  const penalties={fixed:fixedPenalty,unread:unreadPenalty,unresolvedRed:unresolvedRedPenalty,redRisk:redRiskPenalty,deviations:deviationPenalty}
  const totalPenalty=Object.values(penalties).reduce((sum,value)=>sum+value,0)
  return {score:Math.max(0,100-totalPenalty),penalties,totalPenalty}
}

export function analyzeCaseConsistency({caseItem={},documents=[],assessments=[]}={}){
  const gaps=[]
  if(!caseItem.goal?.trim())gaps.push('goal')
  if(!caseItem.summary?.trim())gaps.push('summary')
  if(!caseItem.deadline_at)gaps.push('deadline')
  if(!caseItem.next_action?.trim())gaps.push('next_action')
  if(!documents.length)gaps.push('documents')
  const unread=documents.filter(doc=>!doc.extracted_text?.trim())
  if(unread.length)gaps.push('unread_documents')
  if(documents.length&&!assessments.length)gaps.push('assessment')
  const redWithoutNext=assessments.filter(a=>a.traffic_light==='red'&&!a.next_step?.trim())
  if(redWithoutNext.length)gaps.push('red_without_next')
  const variance=deviations(documents)
  const red=assessments.filter(assessment=>assessment.traffic_light==='red')
  const yellow=assessments.filter(assessment=>assessment.traffic_light==='yellow')
  const green=assessments.filter(assessment=>assessment.traffic_light==='green')
  const calculated=calculateScore({gaps,documents,unreadCount:unread.length,redCount:red.length,redWithoutNextCount:redWithoutNext.length,deviationCount:variance.length})
  return {
    gaps,
    unreadCount:unread.length,
    readableCount:documents.length-unread.length,
    documentCount:documents.length,
    assessmentCount:assessments.length,
    redCount:red.length,
    yellowCount:yellow.length,
    greenCount:green.length,
    redWithoutNextCount:redWithoutNext.length,
    redWithoutNextItems:redWithoutNext.map(assessment=>({id:assessment.id||'',title:assessment.title||'Ohne Bezeichnung'})),
    assessmentComplexes:assessmentComplexes(assessments),
    deviations:variance,
    score:calculated.score,
    penalties:calculated.penalties,
    status:calculated.score>=80?'good':calculated.score>=55?'review':'attention'
  }
}
