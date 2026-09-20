// Only a completed, independently reviewed draft reaches the document editor.
// Do not retry an uncertain request automatically: document consent is one-use.
export async function runDocumentAnalysisContinuation(invoke,body,{onProgress}={}) {
  let checkpoint
  let progress={stage:'generation',attempt:1}
  onProgress?.({stage:'generation',attempt:1})
  for(let call=0;call<4;call++) {
    const context={...progress,request_id:crypto.randomUUID()}
    let response
    try {response=await invoke({body:{...body,staged:true,request_id:context.request_id,...(checkpoint?{checkpoint}:{})}})}
    catch(error){throw Object.assign(new Error('Document analysis request failed'),{cause:error,analysis_context:context})}
    if(response.error||response.data?.status==='configuration_required')return {...response,analysis_context:context}
    const data=response.data
    if(data?.status==='completed'&&typeof data.extracted_text==='string'&&data.extracted_text.trim())return response
    if(data?.status!=='processing'||typeof data.checkpoint!=='string'||!data.checkpoint||!['review','correction'].includes(data.stage)||![1,2].includes(data.attempt)||call===3) {
      throw Object.assign(new Error('Document analysis did not return a fully reviewed result'),{code:'invalid_response',analysis_context:context})
    }
    checkpoint=data.checkpoint
    progress={stage:data.stage,attempt:data.attempt}
    onProgress?.(progress)
  }
}
