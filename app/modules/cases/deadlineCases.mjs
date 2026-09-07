export function deadlineTimestamp(value=''){
  const timestamp=Date.parse(String(value||''))
  return Number.isFinite(timestamp)?timestamp:null
}

export function orderDeadlineCases(cases=[]){
  return cases
    .filter(item=>deadlineTimestamp(item?.deadline_at)!==null)
    .sort((left,right)=>deadlineTimestamp(left.deadline_at)-deadlineTimestamp(right.deadline_at))
}
