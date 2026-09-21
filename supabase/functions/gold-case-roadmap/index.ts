import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
import { sealModelCheckpoint, openModelCheckpoint } from '../_shared/modelCheckpoint.mjs';
import { advanceCompleteAnalysis, completeAnalysisStage } from '../_shared/completeCaseAnalysis.mjs';
import { loadRoadmapSource as loadSource, roadmapModelContext } from '../_shared/roadmapModelContext.mjs';
import { CASE_EVIDENCE_RULES } from '../_shared/caseEvidenceRules.mjs';
import { runReviewedModel, advanceReviewedModel, MODEL_QUALITY_VERSION, ModelWorkflowError } from '../_shared/modelQuality.mjs';
import { ROADMAP_SCHEMA, ROADMAP_LANGUAGES, ROADMAP_VERSION, roadmapStyle, roadmapSource, roadmapModelSource, roadmapFingerprint, validateRoadmapInput, splitVerbatimRoadmapEvidence, validateRoadmapResult, updateRoadmapProgress } from '../_shared/customerRoadmap.mjs';

const PRIVACY='2026-08-30-v1', TERMS='2026-08-30-test-v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedOrigin=(origin:string|null)=>origin==='https://app-gold-workspace.vercel.app'||origin==='http://localhost:3000'||!!origin&&/^https:\/\/app-gold-workspace(?:-[a-z0-9-]+){1,3}\.vercel\.app$/i.test(origin)?origin:null;
function headers(req:Request) { const origin=allowedOrigin(req.headers.get('Origin')); return {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})}; }
const reply=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headers(req)});


Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return allowedOrigin(req.headers.get('Origin'))?new Response(null,{status:204,headers:headers(req)}):reply(req,{error:'Origin not allowed'},403);
  if(req.method!=='POST') return reply(req,{error:'Method not allowed'},405);
  if(req.headers.get('Origin')&&!allowedOrigin(req.headers.get('Origin'))) return reply(req,{error:'Origin not allowed'},403);
  const authorization=req.headers.get('Authorization');
  if(!authorization?.startsWith('Bearer ')) return reply(req,{error:'Nicht angemeldet'},401);
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!secret) return reply(req,{error:'Dienst nicht konfiguriert'},503);
  const client=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await client.auth.getUser();
  const user=userData?.user;
  if(userError||!user) return reply(req,{error:'Sitzung ungültig'},401);
  const body=await req.json().catch(()=>null);
  if(!body||!UUID.test(body.case_id)||JSON.stringify(body).length>800000||JSON.stringify({...body,checkpoint:undefined}).length>10000) return reply(req,{error:'Ungültige Anfrage'},400);
  if(!['generate','enqueue','cancel','progress'].includes(body.action)) return reply(req,{error:'Unbekannte Aktion'},400);
  try {
    // Caller-scoped reads enforce RLS and the active test-access boundary before
    // any service-role write or provider call. A guessed ID grants no access.
    const source=await loadSource(client,body.case_id,user.id);
    if(!source) return reply(req,{error:'Fall nicht gefunden oder Zugriff abgelaufen'},404);
    const fingerprint=await roadmapFingerprint(source);
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    if(body.action==='cancel') {
      if(!UUID.test(body.job_id))return reply(req,{error:'Auftrags-ID ungültig'},400);
      const {data:job,error}=await admin.rpc('cancel_case_analysis_job',{p_owner_id:user.id,p_case_id:body.case_id,p_job_id:body.job_id});
      if(error||!job)return reply(req,{error:'Der Auftrag konnte nicht beendet werden.'},409);
      return reply(req,{job});
    }
    if(body.action==='progress') {
      if(!UUID.test(body.roadmap_id)) return reply(req,{error:'Fahrplan-ID ungültig'},400);
      const {data:record,error}=await client.from('case_roadmaps').select('*').eq('id',body.roadmap_id).eq('case_id',body.case_id).eq('owner_id',user.id).maybeSingle();
      if(error||!record) return reply(req,{error:'Fahrplan nicht gefunden'},404);
      const {data:latest,error:latestError}=await client.from('case_roadmaps').select('id').eq('case_id',body.case_id).eq('owner_id',user.id).order('created_at',{ascending:false}).limit(1).single();
      if(latestError||latest.id!==record.id||record.source_fingerprint!==fingerprint) return reply(req,{error:'Die Fallgrundlage hat sich geändert. Bitte einen neuen Fahrplan erstellen.'},409);
      const changes=updateRoadmapProgress(record,body);
      const {data:saved,error:saveError}=await admin.from('case_roadmaps').update({...changes,updated_at:new Date().toISOString()}).eq('id',record.id).eq('owner_id',user.id).eq('updated_at',record.updated_at).select().maybeSingle();
      if(saveError||!saved) return reply(req,{error:'Der Stand wurde zwischenzeitlich geändert. Bitte neu laden.'},409);
      return reply(req,{status:'completed',roadmap:saved});
    }
    if(body.acknowledged!==true||body.privacy_notice_version!==PRIVACY||body.terms_version!==TERMS) return reply(req,{error:'Bitte die Verarbeitung dieses Testfalls bestätigen.'},412);
    const [{data:settings,error:settingsError},{count,error:countError},{data:accessRows,error:accessError}]=await Promise.all([
      client.from('account_privacy_settings').select('*').eq('owner_id',user.id).maybeSingle(),
      client.from('case_roadmaps').select('id',{count:'exact',head:true}).eq('owner_id',user.id).gte('created_at',new Date(Date.now()-86400000).toISOString()),
      client.rpc('current_gold_access')
    ]);
    if(settingsError||countError||accessError) return reply(req,{error:'Der Verarbeitungsstatus konnte nicht geprüft werden.'},503);
    const permissions=accessRows?.[0]?.permissions;
    if(permissions?.full_analysis!==true) return reply(req,{error:'Für den Kundenfahrplan ist ein Zugang mit Fallanalyse erforderlich. Bitte zuerst den Leistungsumfang vergleichen.'},403);
    if(!settings?.ai_processing_enabled||settings.privacy_notice_version!==PRIVACY||!settings.privacy_notice_acknowledged_at||settings.terms_version!==TERMS||!settings.terms_acknowledged_at) return reply(req,{error:'Die aktuelle Datenschutzbestätigung oder KI-Freigabe fehlt.'},412);
    validateRoadmapInput(source);
    const providerKey=Deno.env.get('OPENAI_API_KEY');
    const outputLanguage=ROADMAP_LANGUAGES.includes(body.output_language)?body.output_language:'de';
    const referenceLanguage=ROADMAP_LANGUAGES.includes(body.reference_language)?body.reference_language:outputLanguage;
    const style=roadmapStyle(body.style);
    if(style.letterhead.split('\n').length>6||style.letterhead.length>600||style.letterhead.split('\n').some(line=>line.length>80)) return reply(req,{error:'Bitte den Briefkopf auf höchstens sechs Zeilen mit jeweils 80 Zeichen begrenzen.'},400);
    if(body.action==='enqueue') {
      if(!providerKey)return reply(req,{error:'Die KI-Erstellung ist noch nicht eingerichtet.'},503);
      const {data:job,error}=await admin.rpc('enqueue_case_analysis_job',{p_owner_id:user.id,p_case_id:body.case_id,p_fingerprint:fingerprint,p_request:{style,output_language:outputLanguage,reference_language:referenceLanguage,draft_letters:permissions.draft_letters===true,acknowledged:true,privacy_notice_version:PRIVACY,terms_version:TERMS}});
      if(error)return reply(req,{error:'Der Auftrag konnte nicht gespeichert werden. Bitte den laufenden Auftrag oder die Zugangsfreigabe prüfen.'},409);
      return reply(req,{status:'queued',job},202);
    }
    // MODEL_WORKFLOW_START: same model flow in production and synthetic evaluation.
    const {request,reviewContent,validate}=roadmapModelContext({source,style,outputLanguage,referenceLanguage,permissions});
    // MODEL_CONFIGURATION_END
    const complete=body.analysis_mode==='complete';
    const binding={workflow:complete?'complete-case-v157':'roadmap-staged-v1',owner_id:user.id,case_id:body.case_id,fingerprint,outputLanguage,referenceLanguage,style,draft_letters:permissions.draft_letters===true};
    const checkpoint=body.checkpoint?await openModelCheckpoint({token:body.checkpoint,binding,secret}):null;
    // A sealed run identity makes a retried completion return the original
    // saved result. The current caller, permissions, privacy and sources have
    // already been checked above; this lookup cannot bypass those boundaries.
    const runId=checkpoint?.runId||crypto.randomUUID();
    const existingRun=()=>client.from('case_roadmaps').select('*').eq('id',runId).eq('case_id',body.case_id).eq('owner_id',user.id).maybeSingle();
    if(checkpoint) {
      const {data:existing,error:existingError}=await existingRun();
      if(existingError)return reply(req,{error:'Der gespeicherte Stand konnte nicht geprüft werden.'},503);
      if(existing)return reply(req,{status:'completed',roadmap:existing});
    }
    if((count||0)>=((user as any).is_anonymous?4:20)) return reply(req,{error:'Das Tageslimit für neue Kundenfahrpläne ist erreicht.'},429);
    if(!providerKey) return reply(req,{error:'Die KI-Erstellung ist noch nicht eingerichtet.'},503);
    const onResponse=({stage,attempt,response_id,status}:any)=>console.info('[gold-case-roadmap] model stage',{stage,attempt,response_id,status});
    const analysis=complete
      ?await advanceCompleteAnalysis({providerKey,source,style,outputLanguage,referenceLanguage,baseRequest:request,baseReviewContent:reviewContent,draftLetters:permissions.draft_letters===true,state:checkpoint?.state,onResponse})
      :body.staged===true
      ?await advanceReviewedModel({providerKey,request,reviewContent,validate,state:checkpoint?.state,onResponse})
      :await runReviewedModel({providerKey,request,reviewContent,validate,onResponse});
    if(analysis.status==='processing') {
      const token=await sealModelCheckpoint({state:analysis.state,binding,secret,runId,issuedAt:checkpoint?.issuedAt});
      return reply(req,{status:'processing',checkpoint:token,stage:complete?completeAnalysisStage(analysis.state):analysis.state.stage==='generation'?'correction':'review',attempt:analysis.state.attempt},202);
    }
    const result=analysis.result;
    // MODEL_WORKFLOW_END
    const fresh=await loadSource(client,body.case_id,user.id);
    if(!fresh||await roadmapFingerprint(fresh)!==fingerprint) return reply(req,{error:'Während der Erstellung wurden Unterlagen geändert. Bitte den aktuellen Stand neu erstellen.'},409);
    const {data:record,error:saveError}=await admin.from('case_roadmaps').insert({owner_id:user.id,id:runId,case_id:body.case_id,output_language:outputLanguage,reference_language:referenceLanguage,style,result,source_fingerprint:fingerprint,source_documents:source.documents.map((doc:any)=>({id:doc.id,title:doc.title,updated_at:doc.updated_at})),model:analysis.model||request.model,workflow_version:MODEL_QUALITY_VERSION}).select().single();
    // Concurrent completions can race after the lookup. The existing primary
    // key permits one insert only; never overwrite its result or progress.
    if(saveError?.code==='23505'&&checkpoint) {
      const {data:existing,error:existingError}=await existingRun();
      if(!existingError&&existing)return reply(req,{status:'completed',roadmap:existing});
    }
    if(saveError) {console.error('[gold-case-roadmap] save failed',{code:saveError.code});return reply(req,{error:'Der Kundenfahrplan konnte nicht gespeichert werden.'},503);}
    return reply(req,{status:'completed',roadmap:record});
  } catch(error) {
    console.warn('[gold-case-roadmap] workflow failed',{code:error instanceof ModelWorkflowError?error.code:'request_failed'});
    return reply(req,{code:error instanceof ModelWorkflowError?error.code:'request_failed',error:error instanceof Error?error.message:'Der Kundenfahrplan konnte nicht verarbeitet werden.',...(error instanceof ModelWorkflowError&&error.issues?.length?{issues:error.issues}:{})},error instanceof ModelWorkflowError?error.status:400);
  }
});
