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

const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222'
const at='2026-09-20T17:40:00.000Z'
const result={status:'completed',extracted_text:'Synthetischer Prüftext mit 20,12 EUR.',summary:'Ein Beitrag ist festgesetzt.',next_step:'Zugang prüfen.',assessment_reasoning:'Der Zugang ist offen.',output_language:'de',reference_language:'de',target_country:'DE',traffic_light:'yellow'}
const item={id,owner_id:owner,title:'Synthetischer Test.pdf',file_path:owner+'/test.pdf',data_classification:'synthetic',updated_at:at,ai_last_processed_at:at,extracted_text:null}
const retained={...item,analysis_draft:{document_id:id,file_path:item.file_path,data_classification:'synthetic',completed_at:at,result}}

// Execute the actual UI workflow with failed HTTP delivery after server completion.
// The recovery route is only a scoped SELECT; it never authorizes or invokes AI.
function workflow({delivery='lost',stored=retained,audit='ok',localFailure=false}={}){
  const state={authorizations:0,invocations:0,reads:0,messages:[],filters:[]}
  const query={select(){return this},eq(k,v){state.filters.push([k,v]);return this},async maybeSingle(){state.reads++;return {data:stored,error:null}}}
  const context={...recovery,mapDocumentLanguageWorkflowResult,normalizeOutputLanguage:key=>key||'de',readCountryContext:()=> 'DE',
    PRIVACY_NOTICE_VERSION:'test',TERMS_VERSION:'test',
    authorizeDocumentAnalysis:async()=>{state.authorizations++;return {privacy:{},document:item}},
    invokeDocumentAnalysis:async()=>{state.invocations++;return delivery==='lost'?{error:{name:'FunctionsFetchError'}}:{data:delivery==='empty'?{}:result}},
    workflowErrorMessage:()=> 'Delivery failed',console:{warn(){}}
  }
  vm.createContext(context)
  const source=fs.readFileSync('app/modules/documents/documentWorkflow.js','utf8').replace(/^import .*$/gm,'').replace('export function ','function ')
  vm.runInContext(source+'\nthis.create=createDocumentWorkflowActions',context)
  const actions=context.create({supabase:{from:table=>{assert.equal(table,'documents');return query}},ownerId:owner,data:{cases:[]},language:'de',privacyCurrent:true,outputLanguage:'de',analysisCopy:{...documentAnalysisRecoveryCopy('de'),failed:'failed'},serverCopy:{auditFailed:'audit unavailable'},setPrivacySettings(){},setMessage:value=>state.messages.push(value),recordLocalAction(){if(localFailure)throw new Error('device storage unavailable')},recordServerAudit:async type=>{if(type==='document_analysis_generated'&&audit==='pending')return new Promise(()=>{});if(type==='document_analysis_generated'&&audit==='failed')throw new Error('audit unavailable');return true}})
  return {actions,state}
}
{
  const {actions,state}=workflow()
  const generated=await actions.analyzeDocument(item)
  assert.equal(generated.fields.extracted_text,result.extracted_text)
  assert.equal(state.invocations,1,'lost delivery must not trigger a second model request')
  assert.equal(state.authorizations,1)
  assert.deepEqual(state.filters,[['id',id],['owner_id',owner]])
}
{
  const {actions,state}=workflow()
  assert.equal((await actions.recoverDocumentAnalysis(item)).fields.analysis_summary,result.summary)
  assert.equal(state.authorizations,0)
  assert.equal(state.invocations,0,'manual recovery never transmits anything to AI')
}
for(const audit of ['pending','failed']){
  const {actions}=workflow({delivery:'normal',audit,localFailure:true})
  const generated=await Promise.race([actions.analyzeDocument(item),new Promise(resolve=>setTimeout(()=>resolve(null),100))])
  assert.equal(generated?.fields.extracted_text,result.extracted_text,'optional device/audit storage cannot swallow the completed result')
}
for(const stored of [null,item,{...retained,updated_at:'2026-09-20T18:00:00Z'}]){
  const {actions,state}=workflow({stored})
  assert.equal(await actions.analyzeDocument(item),false)
  assert.equal(state.messages.at(-1),'Delivery failed')
}
assert.equal(await workflow({delivery:'empty'}).actions.analyzeDocument(item),false,'empty success responses cannot become a blank successful editor')

// Real additive migration, existing ownership RLS, and deliberate save lifecycle.
const db=await PGlite.create()
try{
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    create table documents(id uuid primary key,owner_id uuid not null,extracted_text text);
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
}
console.log('Document recovery passed: lost-response recovery without another AI request, ownership-scoped reads, source/language binding, non-blocking audit failures, real database RLS/deletion, deliberate saving, and actual React editor rendering in 11 languages. No browser acceptance claimed.')
