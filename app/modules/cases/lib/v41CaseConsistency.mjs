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
  const score=Math.max(0,100-(gaps.length*12)-(variance.length*10))
  return {gaps,unreadCount:unread.length,deviations:variance,score,status:score>=80?'good':score>=55?'review':'attention'}
}
