// Only a completed, independently reviewed draft reaches the document editor.
// Do not retry an uncertain request automatically: document consent is one-use.
export async function runDocumentAnalysisContinuation(invoke,body,{onProgress}={}) {
  let checkpoint
  onProgress?.({stage:'generation',attempt:1})
  for(let call=0;call<4;call++) {
    const response=await invoke({body:{...body,staged:true,...(checkpoint?{checkpoint}:{})}})
    if(response.error||response.data?.status==='configuration_required')return response
    const data=response.data
    if(data?.status==='completed'&&typeof data.extracted_text==='string'&&data.extracted_text.trim())return response
    if(data?.status!=='processing'||typeof data.checkpoint!=='string'||!data.checkpoint||!['review','correction'].includes(data.stage)||![1,2].includes(data.attempt)||call===3) {
      throw new Error('Document analysis did not return a fully reviewed result')
    }
    checkpoint=data.checkpoint
    onProgress?.({stage:data.stage,attempt:data.attempt})
  }
}
