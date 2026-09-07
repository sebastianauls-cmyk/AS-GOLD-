export function deadlineTimestamp(value=''){
  const timestamp=Date.parse(String(value||''))
  return Number.isFinite(timestamp)?timestamp:null
}

const trafficLightPriority={red:0,yellow:1,white:2,green:3}

export function buildDeadlineOverview(cases=[]){
  const dated=[]
  const unresolved=[]
  for(const item of cases){
    if(deadlineTimestamp(item?.deadline_at)===null) unresolved.push(item)
    else dated.push(item)
  }
  dated.sort((left,right)=>deadlineTimestamp(left.deadline_at)-deadlineTimestamp(right.deadline_at))
  unresolved.sort((left,right)=>{
    const priority=(trafficLightPriority[left?.traffic_light]??1)-(trafficLightPriority[right?.traffic_light]??1)
    return priority||String(left?.title||'').localeCompare(String(right?.title||''))
  })
  return {dated,unresolved,total:dated.length+unresolved.length}
}

export function orderDeadlineCases(cases=[]){
  return buildDeadlineOverview(cases).dated
}
