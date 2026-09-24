import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
import { processCaseAnalysisJob } from '../_shared/caseAnalysisWorker.mjs';

// Custom machine authentication: the database dispatches a random 244-bit,
// single-use capability for exactly one previously user-authorized job.
// No service key or user session is included in the dispatch request.
Deno.serve(async(req:Request)=>{
  const reply=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
  if(req.method!=='POST'||req.headers.has('Origin'))return reply(403);
  const body=await req.text();
  if(body.length>500)return reply(400);
  let input:any;try{input=JSON.parse(body)}catch{return reply(400)}
  if(!input||typeof input.job_id!=='string'||!/^[0-9a-f-]{36}$/i.test(input.job_id)||typeof input.token!=='string'||!/^[0-9a-f]{64}$/i.test(input.token))return reply(401);
  const url=Deno.env.get('SUPABASE_URL'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!secret)return reply(503);
  const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:job,error}=await client.rpc('claim_case_analysis_job',{p_job_id:input.job_id,p_token:input.token});
  if(error)return reply(503);
  if(!job)return reply(403);
  EdgeRuntime.waitUntil(processCaseAnalysisJob({client,job,secret,providerKey:Deno.env.get('OPENAI_API_KEY'),cacheNamespace:Deno.env.get('DENO_DEPLOYMENT_ID')}));
  return reply(202);
});
