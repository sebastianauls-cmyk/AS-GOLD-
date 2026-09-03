import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const allowedOrigin=(origin:string|null)=>{
  if(origin==='https://app-gold-workspace.vercel.app') return origin;
  if(origin==='http://localhost:3000') return origin;
  if(origin&&/^https:\/\/app-gold-workspace(?:-[a-z0-9-]+){1,3}\.vercel\.app$/i.test(origin)) return origin;
  return null;
};

const headersFor=(req:Request)=>{
  const origin=allowedOrigin(req.headers.get('Origin'));
  return {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
};
const reply=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headersFor(req)});
const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';

async function fingerprint(req:Request){
  const forwarded=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const day=new Date().toISOString().slice(0,10);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${day}:${forwarded}:as-gold-withdrawal-v1`));
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return allowedOrigin(req.headers.get('Origin'))?new Response(null,{status:204,headers:headersFor(req)}):reply(req,{error:'Origin not allowed'},403);
  if(req.method!=='POST') return reply(req,{error:'Method not allowed'},405);
  if(!allowedOrigin(req.headers.get('Origin'))) return reply(req,{error:'Origin not allowed'},403);

  const body=await req.json().catch(()=>({}));
  const name=clean(body?.name,160);
  const contractReference=clean(body?.contract_reference,200);
  const startedAt=Date.parse(clean(body?.started_at,40));
  if(clean(body?.company,120)) return reply(req,{error:'Anfrage abgelehnt'},400);
  if(name.length<2||contractReference.length<3||body?.confirmation_channel!=='download') return reply(req,{error:'Bitte füllen Sie die erforderlichen Angaben aus.'},400);
  if(!Number.isFinite(startedAt)||Date.now()-startedAt<1500||Date.now()-startedAt>60*60*1000) return reply(req,{error:'Bitte starten Sie die Widerrufsfunktion erneut.'},400);

  const url=Deno.env.get('SUPABASE_URL');
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!serviceKey) return reply(req,{error:'Der Widerrufsdienst ist nicht verfügbar.'},503);
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const requestFingerprint=await fingerprint(req);
  const receivedAt=new Date();
  const retentionUntil=new Date(Date.UTC(receivedAt.getUTCFullYear()+4,0,1));
  const declaration='Hiermit widerrufe ich den über die AS-Gold-Online-Benutzeroberfläche geschlossenen Vertrag beziehungsweise den durch die angegebene Referenz bezeichneten Vertragsteil.';
  const {data:rows,error}=await admin.rpc('gold_record_electronic_withdrawal',{p_consumer_name:name,p_contract_reference:contractReference,p_confirmation_channel:'download',p_declaration:declaration,p_request_fingerprint:requestFingerprint,p_retention_until:retentionUntil.toISOString()});
  if(error?.code==='P0001') return reply(req,{error:'Zu viele Anfragen. Bitte versuchen Sie es später erneut oder nutzen Sie die Kontakt-E-Mail.'},429);
  const data=rows?.[0];
  if(error||!data) return reply(req,{error:'Der Widerruf konnte nicht gespeichert werden.'},503);

  const confirmationText=[
    'AS Workspace Gold – Eingangsbestätigung des Widerrufs',
    '',`Widerrufs-ID: ${data.id}`,`Eingang (UTC): ${data.received_at}`,`Name: ${name}`,`Vertrags-/Kontoreferenz: ${contractReference}`,
    '',declaration,'','Empfänger: Sebastian Auls – Unternehmens- und Konzeptberatung, Chrysanderstraße 75, 21029 Hamburg','Kontakt: sebastian.auls@gmail.com'
  ].join('\n');
  return reply(req,{status:'received',withdrawal_id:data.id,received_at:data.received_at,confirmation_channel:'download',confirmation_text:confirmationText},201);
});
