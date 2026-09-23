import {ModelWorkflowError} from './modelQuality.mjs'

// Reservations commit BEFORE the paid request. Lost responses keep the full
// reservation; neither a retry nor a fresh worker lease refunds unknown usage.
export function caseModelBudget({client,job}) {
  let reservation=null,outputLimit=0
  const unavailable=()=>new ModelWorkflowError('Die Verbrauchsbegrenzung konnte nicht geprüft werden. Der Auftrag wurde gestoppt.',503,'budget_unavailable')
  return {
    async beforeRequest(request,{stage}) {
      if(reservation)throw unavailable()
      const searchCalls=request.tools?.length?request.max_tool_calls:0
      if(request.model!=='gpt-5.6-sol'||!Number.isSafeInteger(request.max_output_tokens)||request.max_output_tokens<1||request.max_output_tokens>22000||
        request.tools?.some(tool=>tool.type!=='web_search')||!Number.isSafeInteger(searchCalls)||searchCalls<0||searchCalls>2)throw unavailable()
      const {data,error}=await client.rpc('reserve_case_model_call',{
        p_job_id:job.id,p_lease:job.lease,p_output_tokens:request.max_output_tokens,
        p_request_bytes:new TextEncoder().encode(JSON.stringify({...request,store:false})).length,
        p_search_calls:searchCalls,p_stage:stage
      })
      if(error||!data)throw unavailable()
      if(!data.reservation_id)throw new ModelWorkflowError('Die Verbrauchsgrenze für diesen Auftrag oder den heutigen Betrieb ist erreicht. Es wurde keine weitere KI-Anfrage gestartet. Die Unterlagen bleiben gespeichert.',409,'budget_limit')
      reservation=data.reservation_id;outputLimit=request.max_output_tokens
    },
    async onResponse(event) {
      if(event.stage==='provider_error')return
      const usage=event.usage,input=usage?.input_tokens,output=usage?.output_tokens,cached=usage?.input_tokens_details?.cached_tokens??0
      if(!reservation||![input,output,cached].every(n=>Number.isSafeInteger(n)&&n>=0)||cached>input||output>outputLimit)throw unavailable()
      const {data,error}=await client.rpc('settle_case_model_call',{
        p_job_id:job.id,p_lease:job.lease,p_reservation_id:reservation,
        p_input_tokens:input,p_output_tokens:output,p_cached_tokens:cached
      })
      if(error||data!==true)throw unavailable()
      // One provider call per claimed worker step. Never reset this guard.
    }
  }
}
