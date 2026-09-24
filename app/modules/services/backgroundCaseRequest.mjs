// An enqueue response can disappear after the server has accepted the job.
// Reconcile with saved state; never automatically repeat a paid-work request.
export async function runBackgroundCaseRequest({caseId,enqueue,readLatest}) {
  const read=async()=>{
    try{return await readLatest()}catch(error){return {data:null,error}}
  }
  const jobFrom=response=>response?.data?.find(job=>job.case_id===caseId)||null
  const before=await read()
  if(before.error)return {data:null,error:before.error}
  const previous=jobFrom(before)
  if(previous&&['queued','running'].includes(previous.status))return {data:{job:previous},error:null}
  let response
  try{response=await enqueue()}catch(error){response={data:null,error}}
  if(!response.error)return response
  const after=await read()
  const saved=after.error?null:jobFrom(after)
  if(saved&&saved.id!==previous?.id)return {data:{job:saved},error:null}
  return response
}
