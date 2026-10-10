// Model transport fixture only: preserve the supplied narrative unless a test
// explicitly supplies a different answer. No real model/provider call occurs.
export function reconciliationFixture(request){
  const {checked_analysis}=JSON.parse(request.input.at(-1).content[0].text)
  return {topics:checked_analysis.topics.map(({id,status,conclusion,conditions,sources})=>({id,status,conclusion,conditions,sources:structuredClone(sources)})),limitations:structuredClone(checked_analysis.limitations)}
}
