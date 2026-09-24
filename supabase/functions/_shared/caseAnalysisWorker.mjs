import {caseModelBudget} from './caseModelBudget.mjs'
import {loadRoadmapSource,roadmapModelContext} from './roadmapModelContext.mjs'
import {roadmapFingerprint,validateRoadmapInput} from './customerRoadmap.mjs'
import {advanceCompleteAnalysis,completeAnalysisStage} from './completeCaseAnalysis.mjs'
import {openModelCheckpoint,sealModelCheckpoint} from './modelCheckpoint.mjs'
import {retainedCaseWork} from './retainedCaseWork.mjs'
import {MODEL_QUALITY_VERSION,ModelWorkflowError} from './modelQuality.mjs'

// Called only with a database-claimed, single-use job lease. No caller-supplied
// identity, model input, checkpoint or result can enter this worker endpoint.
export async function processCaseAnalysisJob({client,job,secret,providerKey,cacheNamespace,advance=advanceCompleteAnalysis}) {
  const log=(event,extra={})=>console.info('[case-analysis-job]',{event,job_id:job.id,...extra})
  const finish=async outcome=>{
    const {data,error}=await client.rpc('finish_case_analysis_job',{p_job_id:job.id,p_lease:job.lease,...outcome})
    if(error||!data)throw new Error('Job persistence unavailable or lease no longer current')
    return data
  }
  try {
    log('step_started',{stage:job.stage})
    if(!providerKey)throw new ModelWorkflowError('Die KI-Erstellung ist noch nicht eingerichtet.',503,'provider_missing')
    const source=await loadRoadmapSource(client,job.case_id,job.owner_id)
    if(!source||await roadmapFingerprint(source)!==job.source_fingerprint)throw new ModelWorkflowError('Die Fallgrundlage wurde geändert. Der Auftrag wurde beendet; bitte den aktuellen Stand neu beauftragen.',409,'source_changed')
    validateRoadmapInput(source)
    const {style,output_language:outputLanguage,reference_language:referenceLanguage,draft_letters:draftLetters}=job.request
    const binding={workflow:'background-complete-case-v165',owner_id:job.owner_id,case_id:job.case_id,fingerprint:job.source_fingerprint,outputLanguage,referenceLanguage,style,draft_letters:draftLetters}
    const checkpoint=job.checkpoint?await openModelCheckpoint({token:job.checkpoint,binding,secret}):null
    if(checkpoint&&(checkpoint.runId!==job.id||checkpoint.issuedAt!==Date.parse(job.created_at)))throw new ModelWorkflowError('Der gespeicherte Auftrag stimmt nicht mit dem Zwischenstand überein.',409,'checkpoint_invalid')
    const {request,reviewContent}=roadmapModelContext({source,style,outputLanguage,referenceLanguage,permissions:{draft_letters:draftLetters}})
    const retained=await retainedCaseWork({client,job,secret,namespace:cacheNamespace,request,reviewContent})
    const state=checkpoint?.state??await retained.restore()
    if(!checkpoint&&state)log('saved_work_restored',{stage:completeAnalysisStage(state)})
    const budget=caseModelBudget({client,job})
    const analysis=await advance({providerKey,source,style,outputLanguage,referenceLanguage,baseRequest:request,baseReviewContent:reviewContent,draftLetters,state,beforeRequest:budget.beforeRequest,onResponse:async event=>{if(event.stage==='retrieval')return;await budget.onResponse(event);const {stage,attempt,response_id,status,provider_status,provider_error_code,retry_after,usage}=event;log('model_response',{stage,attempt,response_id,status,provider_status,provider_error_code,retry_after,...(usage?{input_tokens:usage.input_tokens,output_tokens:usage.output_tokens,cached_tokens:usage.input_tokens_details?.cached_tokens??0,cache_write_tokens:Number.isSafeInteger(usage.input_tokens_details?.cache_write_tokens)&&usage.input_tokens_details.cache_write_tokens>=0&&usage.input_tokens_details.cache_write_tokens<=usage.input_tokens?usage.input_tokens_details.cache_write_tokens:null}:{})})}})
    const fresh=await loadRoadmapSource(client,job.case_id,job.owner_id)
    if(!fresh||await roadmapFingerprint(fresh)!==job.source_fingerprint)throw new ModelWorkflowError('Während der Verarbeitung wurden Unterlagen geändert. Es wurde kein neues Ergebnis gespeichert.',409,'source_changed')
    if(analysis.status==='processing') {
      await retained.save(analysis.state)
      const token=await sealModelCheckpoint({state:analysis.state,binding,secret,runId:job.id,issuedAt:Date.parse(job.created_at)})
      const saved=await finish({p_outcome:{status:'processing',checkpoint:token,stage:completeAnalysisStage(analysis.state)}})
      log(saved.status==='queued'?'step_saved':'job_stopped',{stage:completeAnalysisStage(analysis.state)})
    } else if(analysis.status==='completed'&&analysis.result) {
      const saved=await finish({p_outcome:{status:'completed',result:analysis.result,model:analysis.model||request.model,workflow_version:MODEL_QUALITY_VERSION,source_documents:source.documents.map(({id,title,updated_at})=>({id,title,updated_at}))}})
      log(saved.status==='completed'?'reviewed_result_saved':'job_stopped')
    } else throw new ModelWorkflowError('Die Verarbeitung hat keinen gültigen Zwischenstand geliefert.',502,'workflow_invalid')
  } catch(error) {
    let code=error instanceof ModelWorkflowError?error.code:'worker_failed'
    if(code==='provider_invalid_json'&&error.provider_response_phase==='envelope')code='provider_response_format'
    log('step_failed',{code})
    // SQL allows one transport/protocol retry per interrupted step, at most
    // three per fixed-lifetime job. Unreadable provider envelopes share that
    // budget; malformed generated JSON, refusals, content, consent, quota and access
    // failures are never silently retried or waived.
    const providerStatus=error instanceof ModelWorkflowError&&Number.isInteger(error.provider_status)&&error.provider_status>=400&&error.provider_status<=599?error.provider_status:null
    const retryAfter=Number.isInteger(error.retry_after)&&error.retry_after>=0&&error.retry_after<=86400?error.retry_after:null
    const retry=['provider_network','provider_timeout','provider_response_format'].includes(code)||(code==='provider_http'&&[500,502,503,504].includes(providerStatus))
    const message=error instanceof ModelWorkflowError?error.message:'Die Hintergrundverarbeitung konnte nicht abgeschlossen werden. Kein neues Ergebnis gespeichert.'
    const issues=Array.isArray(error.issues)?error.issues.slice(0,8).map(issue=>({code:String(issue.code||'').slice(0,80),location:String(issue.location||'').slice(0,160),reason:String(issue.reason||'').slice(0,700)})):[]
    try {await finish({p_outcome:{status:'failed',code,message:message.slice(0,1200),issues,retry,provider_status:providerStatus,retry_after:retryAfter}})}catch{log('failure_save_unavailable')}
  }
}
