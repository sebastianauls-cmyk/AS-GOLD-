// Evidence-based initial priorities for the German market.
// Source basis: Destatis 2025 statistics for civil, labour and social courts.
// Contract combines purchase, passenger-rights, travel, credit/leasing and
// regulated-fee claims. Property combines residential/other rent and WEG.
// Insurance combines insurance-contract and traffic-accident matters because
// AS Workspace Gold's insurance category explicitly includes motor claims.
export const researchedCaseVolumes=Object.freeze({
  work:327119,
  contract:271155,
  authority:251895,
  property:237513,
  insurance:116490,
})

// Workflow/catch-all categories do not have a non-overlapping Destatis subject
// group, so they follow the statistically measurable categories instead of
// receiving invented market volumes.
export const caseOrder=Object.freeze([
  'work',
  'contract',
  'authority',
  'property',
  'insurance',
  'business',
  'dispute',
  'private',
])

export const caseFrequencyWeight=Object.freeze({
  work:100,
  contract:83,
  authority:77,
  property:73,
  insurance:36,
  business:20,
  dispute:10,
  private:1,
})

export function orderCasesByResearch(cases=[]){
  const rank=new Map(caseOrder.map((key,index)=>[key,index]))
  return [...cases].sort((left,right)=>(rank.get(left.key)??99)-(rank.get(right.key)??99))
}
