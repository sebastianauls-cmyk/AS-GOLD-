// A processing response is opaque; only a completed, server-reviewed record is
// returned to the UI. Never render or persist a candidate from an earlier stage.
export async function runRoadmapContinuation(invoke,body,{onProgress}={}) {
  let checkpoint
  for(let call=0;call<4;call++) {
    const response=await invoke({body:{...body,staged:true,...(checkpoint?{checkpoint}:{})}})
    if(response.error)return response
    const data=response.data
    if(data?.status==='completed'&&data.roadmap)return response
    if(data?.status!=='processing'||typeof data.checkpoint!=='string'||!data.checkpoint||call===3)throw new Error('Der Kundenfahrplan konnte nicht vollständig geprüft werden. Bitte erneut versuchen.')
    checkpoint=data.checkpoint
    onProgress?.({stage:data.stage,attempt:data.attempt})
  }
}
