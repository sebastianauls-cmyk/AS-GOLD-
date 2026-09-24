import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'next/dist/build/swc/index.js'
import {PGlite} from '@electric-sql/pglite'
import * as recovery from '../app/modules/documents/documentAnalysisRecovery.mjs'
import {documentAnalysisRecoveryCopy} from '../app/modules/documents/documentAnalysisRecoveryCopy.mjs'
import {mapDocumentLanguageWorkflowResult} from '../app/modules/language/documentLanguageWorkflow.mjs'
import {updateDocumentRecord} from '../app/modules/services/documentRepository.js'
import {readDocumentAnalysisError,recordDocumentAnalysisFailure} from '../app/modules/documents/documentAnalysisError.mjs'
import {authorizeDocumentAnalysis} from '../app/modules/services/complianceRepository.js'
import {recordCommittedAction} from '../app/modules/workspace/committedAction.mjs'

const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222'
const at='2026-09-20T17:40:00.000Z'
const result={status:'completed',extracted_text:'Synthetischer Prüftext mit 20,12 EUR.',summary:'Ein Beitrag ist festgesetzt.',next_step:'Zugang prüfen.',assessment_reasoning:'Der Zugang ist offen.',output_language:'de',reference_language:'de',target_country:'DE',traffic_light:'yellow'}
const item={id,owner_id:owner,title:'Synthetischer Test.pdf',file_path:owner+'/test.pdf',data_classification:'synthetic',updated_at:at,ai_last_processed_at:at,extracted_text:null}
const retained={...item,analysis_draft:{document_id:id,file_path:item.file_path,data_classification:'synthetic',completed_at:at,result}}

// Execute the actual UI workflow with failed HTTP delivery after server completion.
// The recovery route is only a scoped SELECT; it never authorizes or invokes AI.
function workflow({delivery='lost',stored=retained,audit='ok',localFailure=false,completedBeforeRequest=false}={}){
  const state={authorizations:0,invocations:0,reads:0,messages:[],filters:[]}
  const query={select(){return this},eq(k,v){state.filters.push([k,v]);return this},async maybeSingle(){state.reads++;return {data:completedBeforeRequest||state.invocations?stored:item,error:null}}}
  const context={...recovery,recordCommittedAction,mapDocumentLanguageWorkflowResult,normalizeOutputLanguage:key=>key||'de',readCountryContext:()=> 'DE',
    PRIVACY_NOTICE_VERSION:'test',TERMS_VERSION:'test',
    authorizeDocumentAnalysis:async()=>{state.authorizations++;return {privacy:{},document:item}},
    invokeDocumentAnalysis:async()=>{state.invocations++;return delivery==='lost'?{error:{name:'FunctionsFetchError'}}:{data:delivery==='empty'?{}:result}},
    readDocumentAnalysisError,recordDocumentAnalysisFailure,console:{warn(){}}
  }
  vm.createContext(context)
  const source=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
  vm.runInContext(source+'\nthis.create=createDocumentWorkflowActions',context)
  const actions=context.create({supabase:{from:table=>{assert.equal(table,'documents');return query}},ownerId:owner,data:{cases:[]},language:'de',privacyCurrent:true,outputLanguage:'de',analysisCopy:{...documentAnalysisRecoveryCopy('de'),failed:'failed'},serverCopy:{auditFailed:'audit unavailable'},setPrivacySettings(){},setMessage:value=>state.messages.push(value),recordLocalAction(){if(localFailure)throw new Error('device storage unavailable')},recordServerAudit:async type=>{if(type==='document_analysis_generated'&&audit==='pending'||type==='document_ai_transfer_authorized'&&audit==='authorization-pending')return new Promise(()=>{});if(type==='document_analysis_generated'&&audit==='failed'||type==='document_ai_transfer_authorized'&&audit==='authorization-failed')throw new Error('audit unavailable');return true}})
  return {actions,state}
}
{
  const {actions,state}=workflow()
  const generated=await actions.analyzeDocument(item)
  assert.equal(generated.fields.extracted_text,result.extracted_text)
  assert.equal(state.invocations,1,'lost delivery must not trigger a second model request')
  assert.equal(state.authorizations,1)
  assert.deepEqual(state.filters,[['id',id],['owner_id',owner],['id',id],['owner_id',owner]])
}
{
  const {actions,state}=workflow({completedBeforeRequest:true})
  assert.equal((await actions.recoverDocumentAnalysis(item)).fields.analysis_summary,result.summary)
  assert.equal(state.authorizations,0)
  assert.equal(state.invocations,0,'manual recovery never transmits anything to AI')
}
{
  const {actions,state}=workflow({completedBeforeRequest:true})
  assert.equal((await actions.analyzeDocument(item)).fields.extracted_text,result.extracted_text)
  assert.equal(state.authorizations,0,'a repeated start restores the existing matching draft before changing authorization')
  assert.equal(state.invocations,0,'a repeated start cannot spend another model call on a completed matching result')
}
for(const changed of [{owner_id:'foreign'},{file_path:owner+'/changed.pdf'},{case_id:'moved'},{data_classification:'anonymized'}]){
  const {actions}=workflow({completedBeforeRequest:true,stored:{...retained,...changed}})
  assert.equal(await actions.recoverDocumentAnalysis(item),false,'recovery cannot cross an owner, source or case change')
}
for(const audit of ['pending','failed','authorization-pending','authorization-failed']){
  const {actions,state}=workflow({delivery:'normal',audit,localFailure:true})
  const generated=await Promise.race([actions.analyzeDocument(item),new Promise(resolve=>setTimeout(()=>resolve(null),100))])
  assert.equal(generated?.fields.extracted_text,result.extracted_text,'optional device/audit storage cannot swallow the completed result')
  assert.equal(state.authorizations,1,'the actual persisted authorization remains mandatory')
  assert.equal(state.invocations,1)
}
for(const stored of [null,item,{...retained,updated_at:'2026-09-20T18:00:00Z'}]){
  const {actions,state}=workflow({stored})
  assert.equal(await actions.analyzeDocument(item),false)
  assert.match(state.messages.at(-1),/Verbindung wurde unterbrochen/)
}
assert.equal(await workflow({delivery:'empty',stored:null}).actions.analyzeDocument(item),false,'empty success responses cannot become a blank successful editor')
assert.equal((await workflow({delivery:'empty'}).actions.analyzeDocument(item)).fields.extracted_text,result.extracted_text,'a malformed HTTP reply can still recover the exact reviewed server draft')

// Real additive migration, existing ownership RLS, and deliberate save lifecycle.
const db=await PGlite.create()
try{
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    create table documents(id uuid primary key,owner_id uuid not null,extracted_text text,
      file_path text,data_classification text,updated_at timestamptz,ai_last_processed_at timestamptz,
      ai_processing_allowed boolean default false,privacy_notice_version text,ai_notice_version text);
    alter table documents enable row level security;
    create policy owner_documents on documents to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    grant select,insert,update,delete on documents to authenticated;`)
  await db.exec(fs.readFileSync('supabase/migrations/20260920174000_v146_recoverable_document_draft.sql','utf8'))
  await db.query('insert into documents(id,owner_id,analysis_draft) values($1,$2,$3)',[id,owner,JSON.stringify(retained.analysis_draft)])
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner])
  await db.exec('set role authenticated')
  const row=(await db.query('select * from documents')).rows[0]
  assert.deepEqual(row.analysis_draft.result,result)
  assert.equal(row.extracted_text,null,'retained AI text is not a saved source')
  await db.query('update documents set file_path=$1,data_classification=$2,updated_at=$3,ai_last_processed_at=$3 where id=$4',[item.file_path,'synthetic',at,id])
  // Exercise the actual authorization repository against Postgres and owner RLS.
  // A failed second model attempt must leave the previous completed draft usable.
  function authorizationClient(beforeWrite){
    return {from(table){
      if(table==='account_privacy_settings')return {update(){return this},eq(){return this},select(){return this},single(){return {data:{ai_processing_enabled:true},error:null}}}
      assert.equal(table,'documents')
      const filters=[],values=[];let changes
      const bind=value=>{values.push(value);return '$'+values.length}
      return {select(){return this},eq(key,value){filters.push(`${key}=${bind(value)}`);return this},in(key,value){filters.push(`${key}=any(${bind(value)})`);return this},update(value){changes=value;return this},async single(){
        if(changes&&beforeWrite){await beforeWrite();beforeWrite=null}
        const assignments=changes?Object.entries(changes).map(([key,value])=>`${key}=${bind(key==='analysis_draft'?JSON.stringify(value):value)}`).join(','):''
        const sql=changes?`update documents set ${assignments} where ${filters.join(' and ')} returning *`:`select * from documents where ${filters.join(' and ')}`
        const rows=(await db.query(sql,values)).rows
        return rows.length===1?{data:JSON.parse(JSON.stringify(rows[0])),error:null}:{data:null,error:new Error('Row changed or inaccessible')}
      }}
    }}
  }
  const authorize=client=>authorizeDocumentAnalysis(client,{ownerId:owner,documentId:id,privacyNoticeVersion:'test',termsVersion:'test'})
  const authorized=await authorize(authorizationClient())
  assert.equal(authorized.error,null)
  assert.equal(authorized.document.ai_processing_allowed,true)
  assert.notEqual(authorized.document.updated_at,at)
  assert.equal(authorized.document.ai_last_processed_at,at,'authorization never changes the completion time')
  assert.deepEqual(authorized.document.analysis_draft.result,result,'authorization cannot erase or modify the completed response')
  assert.equal(recovery.restoreDocumentAnalysis(authorized.document).fields.extracted_text,result.extracted_text)
  assert.equal(recovery.restoreDocumentAnalysis(authorized.document,{outputLanguage:'en'}),null,'a retained German draft cannot satisfy a new English request')
  assert.equal(recovery.restoreDocumentAnalysis(authorized.document,{country:'FR'}),null)
  const twice=await authorize(authorizationClient())
  assert.equal(twice.error,null)
  assert.equal(recovery.restoreDocumentAnalysis(twice.document).fields.extracted_text,result.extracted_text,'multiple failed attempts retain the same completed draft')
  const changedAt=new Date(Date.parse(twice.document.updated_at)+1000).toISOString()
  const race=await authorize(authorizationClient(()=>db.query('update documents set updated_at=$1,extracted_text=$2,ai_processing_allowed=false where id=$3',[changedAt,'Manually edited original',id])))
  assert.ok(race.error,'a concurrent source edit must reject authorization instead of rebinding the old draft')
  const changed=(await db.query('select * from documents')).rows[0]
  assert.equal(changed.ai_processing_allowed,false)
  assert.equal(changed.extracted_text,'Manually edited original')
  assert.equal(recovery.restoreDocumentAnalysis(changed),null)
  const stale=await authorize(authorizationClient())
  assert.equal(stale.error,null)
  assert.equal(recovery.restoreDocumentAnalysis(stale.document),null,'later authorization never revives a stale draft')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",['33333333-3333-4333-8333-333333333333'])
  assert.equal((await db.query('select * from documents')).rows.length,0)
  assert.equal((await db.query('update documents set analysis_draft=null returning id')).rows.length,0)
  await db.exec('reset role; set role anon')
  await assert.rejects(db.query('select * from documents'),/permission denied/)
  await db.exec('reset role')
  await assert.rejects(db.query('update documents set analysis_draft=$1',[JSON.stringify(['invalid'])]),/check constraint/)
  await db.query('delete from documents where id=$1',[id])
  assert.equal((await db.query('select * from documents')).rows.length,0,'document deletion removes the draft too')
}finally{await db.close()}
let payload
const saveQuery={update(value){payload=value;return this},eq(){return this},select(){return this},single(){return {data:payload}}}
updateDocumentRecord({from:()=>saveQuery},{ownerId:owner,documentId:id,draft:recovery.initializeDocumentReview(retained).draft})
assert.equal(payload.analysis_draft,null)
assert.equal(payload.extracted_text,result.extracted_text,'only deliberate saving transfers draft text into the source')

// Render actual React editors. This is a component check, not browser acceptance.
const require=createRequire(import.meta.url),cache=new Map()
function load(file){
  file=path.resolve(file)
  if(cache.has(file))return cache.get(file).exports
  if(file.endsWith('.css'))return {}
  const mod={exports:{}};cache.set(file,mod)
  const code=transformSync(fs.readFileSync(file,'utf8'),{filename:file,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code
  const localRequire=specifier=>{
    if(!specifier.startsWith('.'))return require(specifier)
    const target=path.resolve(path.dirname(file),specifier)
    return load([target,target+'.js',target+'.mjs',target+'/index.js'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile()))
  }
  new Function('require','module','exports',code)(localRequire,mod,mod.exports)
  return mod.exports
}
const {DocumentDetail,getV24Copy}=load('app/modules/cases/CaseWorkspace.js')
const {getV26AnalysisCopy,ControlledDocumentAnalysis}=load('app/modules/documents/DocumentAnalysis.js')
const noop=()=>{}
const html=renderToStaticMarkup(React.createElement(DocumentDetail,{item:retained,copy:getV24Copy('de'),analysis:getV26AnalysisCopy('de'),cases:[],onAnalyze:noop,onRecover:noop,onSave:noop,onOpen:noop,onBack:noop}))
assert.ok(html.includes(result.extracted_text))
assert.match(html,/KI-Entwurf gesichert/)
assert.match(html,/<button[^>]*type="submit"[^>]*form="[^"]*review-form"[^>]*>Geprüfte Angaben bewusst speichern/)
for(const language of ['de','en','pl','tr','ru','ar','fr','fa','ro','bg','vi']){
  const copy=getV26AnalysisCopy(language)
  const rendered=renderToStaticMarkup(React.createElement(ControlledDocumentAnalysis,{copy,item,draft:{},onAnalyze:noop,onRecover:noop,phase:'failed'}))
  assert.ok(rendered.includes(copy.restore))
  assert.ok(rendered.includes(copy.analysisFailed))
  const stored=renderToStaticMarkup(React.createElement(ControlledDocumentAnalysis,{copy,item,draft:{},onAnalyze:noop,phase:'saved'}))
  assert.ok(stored.includes(copy.saved),'stored extraction never claims a completed professional review')
}
console.log('Document recovery passed: repeated starts reuse completed results without AI, failed retries preserve prior drafts, real Postgres authorization compare-and-swap and stale-draft rejection, lost-response recovery, owner/source/case/language isolation, RLS/deletion, deliberate saving and React rendering in 11 languages. No live model acceptance claimed.')
