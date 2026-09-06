import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const PRIVACY_NOTICE_VERSION='2026-08-30-v1';
const TERMS_VERSION='2026-08-30-test-v1';
const MAX_BYTES=18*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OUTPUT_LANGUAGES=new Set(['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']);
const OUTPUT_LANGUAGE_NAMES:Record<string,string>={de:'Deutsch',en:'Englisch',fr:'Französisch',tr:'Türkisch',pl:'Polnisch',ru:'Russisch',ar:'Arabisch',fa:'Farsi',ro:'Rumänisch',bg:'Bulgarisch',vi:'Vietnamesisch'};
const COUNTRY_CONTEXTS:Record<string,string>={DE:'Deutschland / deutscher Rechtsraum',PL:'Polen / polnischer Rechtsraum',FR:'Frankreich / französischer Rechtsraum',TR:'Türkei / türkischer Rechtsraum',GB:'Vereinigtes Königreich',US:'USA',RU:'Russland / russischer Rechtsraum',RO:'Rumänien / rumänischer Rechtsraum',BG:'Bulgarien / bulgarischer Rechtsraum',VN:'Vietnam / vietnamesischer Rechtsraum',SA:'Saudi-Arabien',AE:'Vereinigte Arabische Emirate',IR:'Iran',AF:'Afghanistan'};
const allowedOrigin=(origin:string|null)=>origin==='https://app-gold-workspace.vercel.app'||origin==='http://localhost:3000'||!!origin&&/^https:\/\/app-gold-workspace(?:-[a-z0-9-]+){1,3}\.vercel\.app$/i.test(origin)?origin:null;
const headersFor=(req:Request)=>{const origin=allowedOrigin(req.headers.get('Origin'));return {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};};
const reply=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headersFor(req)});
function base64(bytes:Uint8Array){let binary='';for(let index=0;index<bytes.length;index+=0x8000) binary+=String.fromCharCode(...bytes.subarray(index,Math.min(index+0x8000,bytes.length)));return btoa(binary);}
function mime(path:string,type?:string){
  if(type&&type!=='application/octet-stream')return type;
  const extension=path.toLowerCase().split('.').pop()||'';
  const types:Record<string,string>={pdf:'application/pdf',png:'image/png',webp:'image/webp',gif:'image/gif',jpg:'image/jpeg',jpeg:'image/jpeg',txt:'text/plain',csv:'text/csv',rtf:'application/rtf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',odt:'application/vnd.oasis.opendocument.text',ods:'application/vnd.oasis.opendocument.spreadsheet',odp:'application/vnd.oasis.opendocument.presentation',eml:'message/rfc822'};
  return types[extension]||'application/octet-stream';
}

Deno.serve(async(req:Request)=>{
  const attemptId=crypto.randomUUID();
  const log=(level:'info'|'error',stage:string,details:Record<string,unknown>={})=>console[level]('[gold-document-analysis]',{attempt_id:attemptId,stage,...details});
  if(req.method==='OPTIONS') return allowedOrigin(req.headers.get('Origin'))?new Response(null,{status:204,headers:headersFor(req)}):reply(req,{error:'Origin not allowed'},403);
  if(req.method!=='POST') return reply(req,{error:'Method not allowed'},405);
  if(req.headers.get('Origin')&&!allowedOrigin(req.headers.get('Origin'))) return reply(req,{error:'Origin not allowed'},403);
  const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer ')) return reply(req,{error:'Nicht angemeldet'},401);
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!anon) return reply(req,{error:'Dienst nicht konfiguriert'},503);
  const client=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await client.auth.getUser();const user=userData?.user;if(userError||!user) return reply(req,{error:'Sitzung ungültig'},401);
  log('info','authenticated');

  const body=await req.json().catch(()=>({}));const filePath=body?.file_path,documentId=body?.document_id;
  const requestedOutputLanguage=typeof body?.output_language==='string'&&OUTPUT_LANGUAGES.has(body.output_language)?body.output_language:'de';
  const outputLanguageName=OUTPUT_LANGUAGE_NAMES[requestedOutputLanguage]||'Deutsch';
  const requestedCountry=typeof body?.target_country==='string'&&COUNTRY_CONTEXTS[body.target_country.toUpperCase()]?body.target_country.toUpperCase():'DE';
  const countryContextName=COUNTRY_CONTEXTS[requestedCountry]||COUNTRY_CONTEXTS.DE;
  if(body?.acknowledged!==true||body?.privacy_notice_version!==PRIVACY_NOTICE_VERSION||body?.terms_version!==TERMS_VERSION) return reply(req,{error:'Aktuelle Datenschutzbestätigung fehlt'},412);
  if(typeof filePath!=='string'||filePath.length>240||!filePath.startsWith(`${user.id}/`)) return reply(req,{error:'Kein Zugriff auf diese Datei'},403);
  if(typeof documentId!=='string'||!UUID.test(documentId)) return reply(req,{error:'Dokument-ID ungültig'},400);

  const [{data:settings,error:settingsError},{data:document,error:documentError}]=await Promise.all([
    client.from('account_privacy_settings').select('privacy_notice_version,privacy_notice_acknowledged_at,terms_version,terms_acknowledged_at,ai_processing_enabled').eq('owner_id',user.id).maybeSingle(),
    client.from('documents').select('id,file_path,data_classification,privacy_notice_version,ai_processing_allowed,source_language,voice_context,voice_language').eq('id',documentId).eq('owner_id',user.id).maybeSingle()
  ]);
  if(settingsError||documentError) return reply(req,{error:'Datenschutzstatus konnte nicht geprüft werden'},503);
  if(!settings||settings.privacy_notice_version!==PRIVACY_NOTICE_VERSION||!settings.privacy_notice_acknowledged_at||settings.terms_version!==TERMS_VERSION||!settings.terms_acknowledged_at||!settings.ai_processing_enabled) return reply(req,{error:'Aktueller Datenschutzstatus oder KI-Freigabe fehlt'},412);
  if(!document||document.file_path!==filePath) return reply(req,{error:'Dokument nicht gefunden'},404);
  if(!document.ai_processing_allowed||document.privacy_notice_version!==PRIVACY_NOTICE_VERSION) return reply(req,{error:'Dokument ist nicht für KI-Verarbeitung freigegeben'},403);

  const providerKey=Deno.env.get('OPENAI_API_KEY');
  if(!providerKey){log('error','configuration_required');return reply(req,{status:'configuration_required',message:'KI-Dienst ist serverseitig noch nicht freigegeben.',attempt_id:attemptId},200);}
  const {data:file,error:downloadError}=await client.storage.from('goldstandard-private').download(filePath);
  if(downloadError||!file){log('error','storage_download_failed');return reply(req,{error:'Datei konnte nicht geladen werden',attempt_id:attemptId},400);}
  const fileMime=mime(filePath,file.type);const supportedDocumentMime=new Set(['application/pdf','text/plain','text/csv','application/rtf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.oasis.opendocument.text','application/vnd.oasis.opendocument.spreadsheet','application/vnd.oasis.opendocument.presentation','message/rfc822']);if(!(fileMime.startsWith('image/')||supportedDocumentMime.has(fileMime))) return reply(req,{error:'Dieses Dateiformat kann gespeichert, aber noch nicht automatisch ausgelesen werden.'},415);
  const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.byteLength>MAX_BYTES) return reply(req,{error:'Datei ist für die direkte Analyse zu groß (max. 18 MB).'},413);

  const voiceContext=typeof document.voice_context==='string'&&document.voice_context.trim()?document.voice_context.trim().slice(0,4000):null;
  const voiceLanguage=typeof document.voice_language==='string'&&document.voice_language.trim()?document.voice_language.trim():null;
  const dataUrl=`data:${fileMime};base64,${base64(bytes)}`;
  const filePart=fileMime.startsWith('image/')?{type:'input_image',image_url:dataUrl,detail:'high'}:{type:'input_file',filename:filePath.split('/').pop()||'document',file_data:dataUrl};
  const schema={type:'object',additionalProperties:false,properties:{
    source_language:{type:'string'},extracted_text:{type:'string'},document_translation:{type:'string'},document_type:{type:['string','null']},summary:{type:'string'},next_step:{type:'string'},response_letter_de:{type:'string'},customer_copy:{type:'string'},response_recipient:{type:['string','null']},response_subject:{type:'string'},traffic_light:{type:'string',enum:['green','yellow','red','white']},assessment_reasoning:{type:'string'},document_date:{type:['string','null']},sender_or_author:{type:['string','null']},recipient:{type:['string','null']},reference_numbers:{type:'array',items:{type:'string'}},deadlines:{type:'array',items:{type:'string'}},monetary_amounts:{type:'array',items:{type:'string'}},confidence:{type:'string',enum:['hoch','mittel','niedrig']}
  },required:['source_language','extracted_text','document_translation','document_type','summary','next_step','response_letter_de','customer_copy','response_recipient','response_subject','traffic_light','assessment_reasoning','document_date','sender_or_author','recipient','reference_numbers','deadlines','monetary_amounts','confidence']};

  const spokenContextInstruction=voiceContext?`\n\nZusätzlicher, vom Nutzer bestätigter gesprochener Kontext (${voiceLanguage||'Sprache unbekannt'}): ${voiceContext}\nDieser Kontext ist NICHT Teil des Dokuments. Verwende ihn nur zur Einordnung in summary, next_step und gegebenenfalls response_letter_de/customer_copy. Er darf niemals in extracted_text oder document_translation hineingemischt werden.`:'';
  const instructions=`Du verarbeitest ein Dokument für AS Workspace Gold in einem kontrollierten Arbeitsablauf. Kundensprache/Ausgabesprache: ${outputLanguageName}. Gewählter Länder-/Rechtsraum-Kontext: ${countryContextName}. Sprache und Land sind getrennte Parameter. Das Land bestimmt nur den Kontext, in dem landesspezifische Begriffe, Behörden, Fristen oder organisatorische Besonderheiten vorsichtig eingeordnet werden sollen. Behaupte keine landesspezifische Rechtslage, wenn sie aus dem Dokument oder gesicherten Kenntnissen nicht belastbar folgt. Im Zweifel kennzeichne die Unsicherheit ausdrücklich.

Lies das Original vollständig und sachlich. Erfinde keine Tatsachen, Namen, Aktenzeichen, Fristen, Beträge oder Rechtspositionen. Wenn Angaben für ein Antwortschreiben fehlen, verwende neutrale Platzhalter in eckigen Klammern statt zu raten.

Erzeuge GENAU diese getrennten Ergebnisse:
0. source_language: erkannte Originalsprache des Dokuments als kurzer Sprachcode, bevorzugt ISO-639-1 wie de, pl, en, tr, ru, ar, fa, fr, ro, bg, vi. Wenn das Dokument mehrsprachig ist, nenne die dominante Sprache.
1. extracted_text: möglichst originalgetreue Transkription in der Sprache des Dokuments.
2. document_translation: vollständige, gut lesbare Übersetzung des wesentlichen Dokumentinhalts auf ${outputLanguageName}. Eigennamen, Aktenzeichen, Beträge und Datumsangaben unverändert lassen.
3. summary: verständliche Erklärung auf ${outputLanguageName}. Beziehe den gewählten Kontext ${countryContextName} nur dort ein, wo er für das Verständnis relevant und belastbar ist.
4. next_step: konkrete organisatorische nächste Schritte auf ${outputLanguageName}, priorisiert und kurz. Bei landesspezifischer Unsicherheit darauf hinweisen, dass eine Prüfung für ${countryContextName} erforderlich ist.
5. response_letter_de: ein sachliches, professionelles, versandfertiges Antwortschreiben auf DEUTSCH. Es muss zum Dokument passen, darf keine nicht belegten Rechtsbehauptungen oder Anerkenntnisse erfinden und soll vorhandene Referenzen/Aktenzeichen korrekt übernehmen. Wenn noch eine zwingende Angabe fehlt, verwende [PLATZHALTER]. Kein Kommentar vor oder nach dem Schreiben.
6. customer_copy: inhaltlich möglichst genaue Übersetzung genau dieses deutschen Antwortschreibens auf ${outputLanguageName}, damit der Kunde versteht, was versendet werden soll. Keine neuen Inhalte hinzufügen.
7. response_recipient: der aus dem Dokument belastbar erkennbare Empfänger des Antwortschreibens, regelmäßig der Absender des eingegangenen Dokuments. Bei Unklarheit null, niemals raten.
8. response_subject: kurzer deutscher Betreff für das Antwortschreiben mit vorhandener Referenz oder Aktenzeichen.
9. traffic_light: green nur bei geklärter, unkritischer Lage; yellow bei offenen Angaben oder normalem Prüfbedarf; red bei erkennbarer akuter Frist, Vollstreckungs-/Kündigungs-/Zahlungsgefahr; white wenn ohne verifizierte Grundlage keine fachliche Einstufung möglich ist.
10. assessment_reasoning: kurze, konkrete Begründung der Ampel auf ${outputLanguageName}, einschließlich der entscheidenden Dokumentstelle und offener Prüflücken. Keine unbestätigte Rechtsbehauptung.

Fristen nur nennen, wenn sie ausdrücklich im Dokument stehen oder unmittelbar aus einem ausdrücklich genannten Datum und Zeitraum folgen. Das Ergebnis bleibt ein prüfbarer Entwurf vor Freigabe.${spokenContextInstruction}`;

  log('info','provider_request_started',{file_mime:fileMime,file_bytes:bytes.byteLength,output_language:requestedOutputLanguage,target_country:requestedCountry});
  const provider=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(90000),headers:{Authorization:`Bearer ${providerKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-luna',store:false,reasoning:{effort:'low'},instructions,input:[{role:'user',content:[{type:'input_text',text:`Verarbeite dieses Dokument vollständig. Ausgabesprache: ${outputLanguageName}. Länder-/Rechtsraum-Kontext: ${countryContextName}. Gib ausschließlich das strukturierte Ergebnis zurück.`},filePart]}],text:{format:{type:'json_schema',name:'as_workspace_gold_document_workflow_v98',strict:true,schema}},max_output_tokens:12000})}).catch(()=>null);
  if(!provider){log('error','provider_unreachable');return reply(req,{error:'KI-Dienst ist derzeit nicht erreichbar',attempt_id:attemptId},502);}
  const raw=await provider.json().catch(()=>({}));
  if(!provider.ok){log('error','provider_rejected',{provider_status:provider.status});return reply(req,{error:'KI-Dienst konnte das Dokument nicht verarbeiten',provider_status:provider.status,attempt_id:attemptId},502);}
  const output=raw?.output_text??raw?.output?.flatMap((item:any)=>item?.content||[]).find((item:any)=>item?.type==='output_text')?.text;
  if(!output){log('error','provider_output_missing');return reply(req,{error:'KI-Dienst hat kein auswertbares Ergebnis geliefert',attempt_id:attemptId},502);}
  let parsed;try{parsed=JSON.parse(output);}catch{log('error','provider_output_invalid');return reply(req,{error:'KI-Ergebnis hatte ein ungültiges Format',attempt_id:attemptId},502);}

  const processedAt=new Date().toISOString();
  const detectedSourceLanguage=typeof parsed?.source_language==='string'&&parsed.source_language.trim()?parsed.source_language.trim().toLowerCase().slice(0,16):(document.source_language||null);
  const {data:consumed,error:consumeError}=await client.from('documents').update({ai_processing_allowed:false,ai_last_processed_at:processedAt,ai_notice_version:PRIVACY_NOTICE_VERSION,ai_provider:'openai',source_language:detectedSourceLanguage,updated_at:processedAt}).eq('id',documentId).eq('owner_id',user.id).eq('ai_processing_allowed',true).select('id').maybeSingle();
  if(consumeError) return reply(req,{error:'Analyse war erfolgreich, konnte aber nicht sicher abgeschlossen werden'},503);
  if(!consumed) return reply(req,{error:'Die Analysefreigabe wurde zwischenzeitlich bereits verwendet. Bitte erneut bestätigen.'},409);

  log('info','completed',{output_language:requestedOutputLanguage,target_country:requestedCountry});
  return reply(req,{status:'completed',message:'Dokument wurde mit erkannter Originalsprache, Ausgabesprache, Ampel und Länder-/Rechtsraum-Kontext verarbeitet. Bitte alles prüfen und bewusst freigeben.',release:'V115',attempt_id:attemptId,output_language:requestedOutputLanguage,target_country:requestedCountry,target_country_label:countryContextName,suggested_case_id:null,case_match_reason:null,...parsed,source_language:detectedSourceLanguage});
});
