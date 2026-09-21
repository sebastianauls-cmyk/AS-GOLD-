// A processing response is opaque; only a completed, server-reviewed record is
// returned to the UI. Never render or persist a candidate from an earlier stage.
export async function runRoadmapContinuation(invoke,body,{onProgress,resultKey='roadmap',maxCalls=4}={}) {
  let checkpoint,retried=false
  for(let call=0;call<maxCalls;call++) {
    const options={body:{...body,staged:true,...(checkpoint?{checkpoint}:{})}}
    let response=await invoke(options)
    // The sealed checkpoint identifies the same server-side run. A response
    // lost after persistence can be recovered once without saving a duplicate.
    // Do not retry new generation or a server rejection (auth, quota, evidence).
    if(checkpoint&&!retried&&response.error?.name==='FunctionsFetchError') {
      retried=true
      response=await invoke(options)
    }
    if(response.error)return response
    const data=response.data
    if(data?.status==='completed'&&data[resultKey])return response
    if(data?.status!=='processing'||typeof data.checkpoint!=='string'||!data.checkpoint||call===maxCalls-1)throw new Error('Das Ergebnis konnte nicht vollständig geprüft werden. Bitte erneut versuchen.')
    checkpoint=data.checkpoint
    onProgress?.({stage:data.stage,attempt:data.attempt})
  }
}
