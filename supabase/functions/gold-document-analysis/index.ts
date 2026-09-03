import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const PRIVACY_NOTICE_VERSION='2026-08-30-v1';
const TERMS_VERSION='2026-08-30-test-v1';
const MAX_BYTES=18*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OUTPUT_LANGUAGES=new Set(['de','en','fr','tr','pl','ru','ar','fa','ro','bg']);
const OUTPUT_LANGUAGE_NAMES:Record<string,string>={de:'Deutsch',en:'Englisch',fr:'Französisch',tr:'Türkisch',pl:'Polnisch',ru:'Russisch',ar:'Arabisch',fa:'Farsi',ro:'Rumänisch',bg:'Bulgarisch'};
const allowedOrigin=(origin:string|null)=>origin==='https://app-gold-workspace.vercel.app'||origin==='http://localhost:3000'||!!origin&&/^https:\/\/app-gold-workspace(?:-[a-z0-9-]+){1,3}\.vercel\.app$/i.test(origin)?origin:null;
const headersFor=(req:Request)=>{const origin=allowedOrigin(req.headers.get('Origin'));return {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};};
const reply=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headersFor(req)});
function base64(bytes:Uint8Array){let binary='';for(let index=0;index<bytes.length;index+=0x8000) binary+=String.fromCharCode(...bytes.subarray(index,Math.min(index+0x8000,bytes.length)));return btoa(binary);}
function mime(path:string,type?:string){if(type)return type;const lower=path.toLowerCase();if(lower.endsWith('.pdf'))return'application/pdf';if(lower.endsWith('.png'))return'image/png';if(lower.endsWith('.webp'))return'image/webp';if(lower.endsWith('.gif'))return'image/gif';return'image/jpeg';}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return allowedOrigin(req.headers.get('Origin'))?new Response(null,{status:204,headers:headersFor(req)}):reply(req,{error:'Origin not allowed'},403);
  if(req.method!=='POST') return reply(req,{error:'Method not allowed'},405);
  if(req.headers.get('Origin')&&!allowedOrigin(req.headers.get('Origin'))) return reply(req,{error:'Origin not allowed'},403);
  const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer ')) return reply(req,{error:'Nicht angemeldet'},401);
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!anon) return reply(req,{error:'Dienst nicht konfiguriert'},503);
  const client=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await client.auth.getUser();const user=userData?.user;if(userError||!user) return reply(req,{error:'Sitzung ungültig'},401);

  const body=await req.json().catch(()=>({}));const filePath=body?.file_path,documentId=body?.document_id;
  const requestedOutputLanguage=typeof body?.output_language==='string'&&OUTPUT_LANGUAGES.has(body.output_language)?body.output_language:'de';
  const outputLanguageName=OUTPUT_LANGUAGE_NAMES[requestedOutputLanguage]||'Deutsch';
  if(body?.acknowledged!==true||body?.privacy_notice_version!==PRIVACY_NOTICE_VERSION||body?.terms_version!==TERMS_VERSION) return reply(req,{error:'Aktuelle Datenschutzbestätigung fehlt'},412);
  if(typeof filePath!=='string'||filePath.length>240||!filePath.startsWith(`${user.id}/`)) return reply(req,{error:'Kein Zugriff auf diese Datei'},403);
  if(typeof documentId!=='string'||!UUID.test(documentId)) return reply(req,{error:'Dokument-ID ungültig'},400);

  const [{data:settings,error:settingsError},{data:document,error:documentError}]=await Promise.all([
    client.from('account_privacy_settings').select('privacy_notice_version,privacy_notice_acknowledged_at,terms_version,terms_acknowledged_at,ai_processing_enabled').eq('owner_id',user.id).maybeSingle(),
    client.from('documents').select('id,file_path,data_classification,privacy_notice_version,ai_processing_allowed').eq('id',documentId).eq('owner_id',user.id).maybeSingle()
  ]);
  if(settingsError||documentError) return reply(req,{error:'Datenschutzstatus konnte nicht geprüft werden'},503);
  if(!settings||settings.privacy_notice_version!==PRIVACY_NOTICE_VERSION||!settings.privacy_notice_acknowledged_at||settings.terms_version!==TERMS_VERSION||!settings.terms_acknowledged_at||!settings.ai_processing_enabled) return reply(req,{error:'Aktueller Datenschutzstatus oder KI-Freigabe fehlt'},412);
  if(!document||document.file_path!==filePath) return reply(req,{error:'Dokument nicht gefunden'},404);
  if(!document.ai_processing_allowed||document.privacy_notice_version!==PRIVACY_NOTICE_VERSION) return reply(req,{error:'Dokument ist nicht für KI-Verarbeitung freigegeben'},403);

  const providerKey=Deno.env.get('OPENAI_API_KEY');
  if(!providerKey) return reply(req,{status:'configuration_required',message:'KI-Dienst ist serverseitig noch nicht freigegeben.'},503);
  const {data:file,error:downloadError}=await client.storage.from('goldstandard-private').download(filePath);
  if(downloadError||!file) return reply(req,{error:'Datei konnte nicht geladen werden'},400);
  const fileMime=mime(filePath,file.type);if(!(fileMime.startsWith('image/')||fileMime==='application/pdf')) return reply(req,{error:'Automatisches Auslesen unterstützt Bilder und PDF-Dateien.'},415);
  const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.byteLength>MAX_BYTES) return reply(req,{error:'Datei ist für die direkte Analyse zu groß (max. 18 MB).'},413);

  const dataUrl=`data:${fileMime};base64,${base64(bytes)}`;
  const filePart=fileMime==='application/pdf'?{type:'input_file',filename:'document.pdf',file_data:dataUrl}:{type:'input_image',image_url:dataUrl,detail:'high'};
  const schema={type:'object',additionalProperties:false,properties:{extracted_text:{type:'string'},document_type:{type:['string','null']},summary:{type:'string'},next_step:{type:'string'},document_date:{type:['string','null']},sender_or_author:{type:['string','null']},recipient:{type:['string','null']},reference_numbers:{type:'array',items:{type:'string'}},deadlines:{type:'array',items:{type:'string'}},monetary_amounts:{type:'array',items:{type:'string'}},confidence:{type:'string',enum:['hoch','mittel','niedrig']}},required:['extracted_text','document_type','summary','next_step','document_date','sender_or_author','recipient','reference_numbers','deadlines','monetary_amounts','confidence']};
  const instructions=`Lies das Dokument sachlich und vollständig aus. Erfinde keine Angaben. Nenne Fristen nur, wenn sie ausdrücklich im Dokument stehen oder unmittelbar aus einem ausdrücklich genannten Datum und Zeitraum folgen. Formuliere Zusammenfassung und nächsten Schritt als vorläufigen organisatorischen Vorschlag, nicht als Rechtsberatung. Schreibe summary und next_step vollständig auf ${outputLanguageName}. extracted_text bleibt möglichst originalgetreu in der Sprache des Dokuments. Strukturierte Eigennamen, Aktenzeichen, Beträge und Datumsangaben nicht übersetzen.`;
  const provider=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(90000),headers:{Authorization:`Bearer ${providerKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-luna',store:false,reasoning:{effort:'low'},instructions,input:[{role:'user',content:[{type:'input_text',text:`Lies dieses Dokument aus und gib ausschließlich die strukturierte Analyse zurück. Ausgabesprache für Zusammenfassung und nächsten Schritt: ${outputLanguageName}.`},filePart]}],text:{format:{type:'json_schema',name:'as_gold_document_analysis_v80',strict:true,schema}},max_output_tokens:7000})}).catch(()=>null);
  if(!provider) return reply(req,{error:'KI-Dienst ist derzeit nicht erreichbar'},502);
  const raw=await provider.json().catch(()=>({}));
  if(!provider.ok) return reply(req,{error:'KI-Dienst konnte das Dokument nicht verarbeiten',provider_status:provider.status},502);
  const output=raw?.output_text??raw?.output?.flatMap((item:any)=>item?.content||[]).find((item:any)=>item?.type==='output_text')?.text;
  if(!output) return reply(req,{error:'KI-Dienst hat kein auswertbares Ergebnis geliefert'},502);
  let parsed;try{parsed=JSON.parse(output);}catch{return reply(req,{error:'KI-Ergebnis hatte ein ungültiges Format'},502);}

  const processedAt=new Date().toISOString();
  const {data:consumed,error:consumeError}=await client.from('documents').update({ai_processing_allowed:false,ai_last_processed_at:processedAt,ai_notice_version:PRIVACY_NOTICE_VERSION,ai_provider:'openai',updated_at:processedAt}).eq('id',documentId).eq('owner_id',user.id).eq('ai_processing_allowed',true).select('id').maybeSingle();
  if(consumeError) return reply(req,{error:'Analyse war erfolgreich, konnte aber nicht sicher abgeschlossen werden'},503);
  if(!consumed) return reply(req,{error:'Die Analysefreigabe wurde zwischenzeitlich bereits verwendet. Bitte erneut bestätigen.'},409);

  return reply(req,{status:'completed',message:'Dokument wurde automatisch ausgelesen. Bitte Ergebnis prüfen und bewusst speichern.',release:'V80',output_language:requestedOutputLanguage,suggested_case_id:null,case_match_reason:null,...parsed});
});
