import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import {spawnSync} from 'node:child_process'
import JSZip from 'jszip'
import {loadCaseExportData,loadAccountExportData} from '../app/modules/services/workspaceExportData.mjs'
import {buildWorkspaceExportRows,createWorkspaceExportArtifact,createAccountDataArtifact} from '../app/modules/services/exportService.js'
import {createPptxBlob,createXlsxBlob} from '../app/modules/services/officeExportsUnicode.js'
import {roadmapFingerprint,roadmapSource} from '../supabase/functions/_shared/customerRoadmap.mjs'
import {recordCommittedAction} from '../app/modules/workspace/committedAction.mjs'
import {normalizeCasePayload} from '../app/modules/cases/casePayload.mjs'

const owner='synthetic-owner',foreign='another-owner'
const labels=new Proxy({},{get:(_,key)=>String(key)})
const copy={ex:labels,core:labels,approvalUi:labels}
const unzip=async blob=>JSZip.loadAsync(await blob.arrayBuffer())
const decode=text=>text.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')
const xmlText=text=>decode([...text.matchAll(/<(?:a:|w:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:a:|w:)?t>/g)].map(match=>match[1]).join(''))
const compact=text=>text.replace(/\s/g,'')

// A scoped, paginated database adapter. Model responses are never invoked.
function database(tables,{failTable}={}){
  const reads=[]
  return {reads,from(table){
    const filters=[],sorts=[];let first=0,last=Infinity,single=false
    const query={select(){return this},eq(key,value){filters.push([key,value]);return this},order(key,options={}){sorts.push([key,options.ascending!==false]);return this},range(a,b){first=a;last=b;return this},limit(n){last=n-1;return this},maybeSingle(){single=true;return this},then(resolve,reject){
      reads.push({table,filters:[...filters],first,last})
      const rows=structuredClone(tables[table]||[]).filter(row=>filters.every(([key,value])=>row[key]===value))
      rows.sort((a,b)=>{for(const [key,ascending] of sorts){const diff=String(a[key]??'').localeCompare(String(b[key]??''));if(diff)return ascending?diff:-diff}return 0})
      return Promise.resolve({data:single?rows[0]||null:rows.slice(first,last+1),error:table===failTable?new Error('Read unavailable'):null}).then(resolve,reject)
    }}
    return query
  }}
}

// Hand-authored saved results test DELIVERY, not the quality of AI generation.
// These cases are independent of the pension/Sarah example.
async function scenario(id,title,amount,paid,question){
  const item={id,owner_id:owner,title,summary:question,home_country:'DE',target_country:'DE'}
  const doc={id:id+'-original',case_id:id,owner_id:owner,title:title+'.txt',extracted_text:`Synthetisch: Betrag ${amount} EUR; bezahlt ${paid} EUR. ${question}`,updated_at:'2026-09-24T10:00:00Z'}
  const record={id:id+'-result',owner_id:owner,case_id:id,output_language:'de',reference_language:'de',created_at:'2026-09-24T11:00:00Z',style:{sender_name:'Synthetische Testberatung',salutation:'Guten Tag'},progress:{},events:[],source_documents:[doc],result:{
    title:'Auswertung '+title,opening:question,key_points:[question],meaning:'Zahlungsstand mit dem Original abgleichen.',facts:[{text:question,evidence:[{document_id:doc.id,quote:doc.extracted_text}]}],open_questions:[],
    steps:[{id:'clarify',title:'Belege zur Differenz anfordern',phase:'now',light:'yellow',owner:'Kunde',reason:question,action:'Aufstellung mit Zahlungsbelegen abgleichen.',done_when:'Die Differenz ist mit Belegen erklärt.',follow_up:'Bei fehlender Antwort erneut nachfragen.',depends_on:[],evidence:[],deadline:null}],letters:[],closing:'ENDE-'+id,
    analysis:{topics:[{id:'balance',title:'Zahlungsstand',status:'open',conclusion:question,conditions:'Zahlungen müssen vollständig belegt sein.',sources:[],step_ids:['clarify']}],calculations:[{id:'difference',title:'Rechnerische Differenz',topic_ids:['balance'],result:String(amount-paid),unit:'EUR',expression:'amount-paid',explanation:`${amount} minus ${paid} ergibt ${amount-paid}.`,inputs:[{name:'amount',label:'Betrag',value:String(amount),kind:'document',document_id:doc.id,quote:doc.extracted_text},{name:'paid',label:'Bezahlt',value:String(paid),kind:'document',document_id:doc.id,quote:doc.extracted_text}]}],limitations:['Rechnerische Differenz ist keine bestätigte Zahlungspflicht.'],research_sources:[]}
  }}
  record.source_fingerprint=await roadmapFingerprint(roadmapSource(item,[doc],[]))
  return {item,doc,record,tables:{cases:[item],documents:[doc],assessments:[],source_status:[],approvals:[],case_roadmaps:[record]}}
}
const scenarios=await Promise.all([
  scenario('repair','Werkstattrechnung',1200,300,'Der Reparaturauftrag fehlt.'),
  scenario('rent','Mietkaution',1500,250,'Einbehaltene Beträge sind noch nicht erklärt.'),
  scenario('insurance','Versicherungsabrechnung',2500,1800,'Die Kürzung ist nicht aufgeschlüsselt.')
])
scenarios[0].record.result.analysis.calculations.push({id:'scenario',title:'Erfundenes Rechenbeispiel',topic_ids:['balance'],result:'180.00',unit:'EUR',expression:'previous*percent(rate)*periods',conditions:'Nur ein erfundenes bedingtes Rechenbeispiel.',explanation:'Dieses Szenario ist kein tatsächlicher Anspruch.',inputs:[
  {name:'previous',label:'Offener Betrag',value:'900',kind:'calculation',calculation_id:'difference'},
  {name:'rate',label:'Beispielsatz',value:'10',kind:'source',url:'https://fixtures.invalid/numeric-input-only',quote:'ERFUNDENE QUELLE: Satz 10 Prozent.'},
  {name:'periods',label:'Zeiträume',value:'2',kind:'assumption',explanation:'Zwei Zeiträume nur als Beispiel.'}
]})
const originalFetch=globalThis.fetch
globalThis.fetch=async url=>{
  assert.match(String(url),/^\/fonts\/DejaVuSans(?:-Bold)?\.ttf$/,'export tests may only load local fonts')
  return new Response(fs.readFileSync('public'+url))
}
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ash-deliverables-'))
const poppler=spawnSync('pdftotext',['-v'],{encoding:'utf8'}).status===0
try{
  for(const fixture of scenarios){
    const db=database(fixture.tables)
    const saved=await loadCaseExportData(db,{ownerId:owner,caseId:fixture.item.id,language:'en'})
    assert.equal(saved.outputLanguage,'de','export labels must describe the saved language; switching a selector is not translation')
    assert.ok(db.reads.every(read=>read.filters.some(([key,value])=>key==='owner_id'&&value===owner)))
    const rows=buildWorkspaceExportRows({...saved,copy})
    const expected=[fixture.item.summary,'Bei fehlender Antwort erneut nachfragen.','Rechnerische Differenz ist keine bestätigte Zahlungspflicht.','ENDE-'+fixture.item.id,'Originalunterlage: '+fixture.doc.title,'Zugehöriger Schritt: 1. Belege zur Differenz anfordern','Fallfragen: Zahlungsstand']
    if(fixture===scenarios[0])expected.push('Aus Berechnung: Rechnerische Differenz','https://fixtures.invalid/numeric-input-only','Angenommen: Zwei Zeiträume nur als Beispiel.','ERFUNDENE QUELLE: Satz 10 Prozent.')
    for(const text of expected)assert.ok(rows.flat().join('\n').includes(text),'general case export includes '+text)
    for(const type of ['docx','pdf','xlsx','pptx','csv','txt']){
      const {blob}=await createWorkspaceExportArtifact({...saved,copy,type})
      let text
      if(type==='pdf'){
        const file=path.join(directory,fixture.item.id+'.pdf');fs.writeFileSync(file,Buffer.from(await blob.arrayBuffer()))
        if(!poppler)continue
        const result=spawnSync('pdftotext',['-raw',file,'-'],{encoding:'utf8'});assert.equal(result.status,0);text=result.stdout
      }else if(['docx','xlsx','pptx'].includes(type)){
        const zip=await unzip(blob),pattern=type==='docx'?/^word\/document.xml$/:type==='xlsx'?/^xl\/worksheets\/sheet1.xml$/:/^ppt\/slides\/slide\d+\.xml$/
        text=(await Promise.all(zip.file(pattern).map(async file=>xmlText(await file.async('string'))))).join('')
      }else text=await blob.text()
      for(const value of expected)assert.ok(compact(text).includes(compact(value)),`${fixture.item.id} ${type} lost ${value}`)
    }
  }
}finally{globalThis.fetch=originalFetch}

const fixture=scenarios[0]
for(const change of [
  tables=>{tables.documents[0].extracted_text+=' Neue Zahlung eingegangen.'},
  tables=>{tables.documents.push({...tables.documents[0],id:'new-document'})},
  tables=>{tables.cases[0].goal='Anderes Ziel'},
  tables=>{tables.case_roadmaps[0].source_fingerprint='outdated'}
]){
  const tables=structuredClone(fixture.tables);change(tables)
  await assert.rejects(loadCaseExportData(database(tables),{ownerId:owner,caseId:fixture.item.id}),/geändert/)
}
await assert.rejects(loadCaseExportData(database(fixture.tables,{failTable:'case_roadmaps'}),{ownerId:owner,caseId:fixture.item.id}),/Read unavailable/,'read failure must never produce a partial success')
await assert.rejects(loadCaseExportData(database(fixture.tables),{ownerId:foreign,caseId:fixture.item.id}))
const withoutReport=structuredClone(fixture.tables);withoutReport.case_roadmaps=[]
assert.equal((await loadCaseExportData(database(withoutReport),{ownerId:owner,caseId:fixture.item.id})).roadmap,null,'cases with no generated report can still export their saved case data')
const archive=structuredClone(fixture.tables)
archive.case_roadmaps=Array.from({length:1007},(_,index)=>({...fixture.record,id:String(index).padStart(5,'0')}))
archive.case_roadmaps.push({...fixture.record,id:'foreign',owner_id:foreign})
archive.legal_comparisons=[{id:'comparison',owner_id:owner,result:{finding:'Saved country comparison'}},{id:'foreign-comparison',owner_id:foreign}]
const exported=await loadAccountExportData(database(archive),owner)
assert.equal(exported.case_roadmaps.length,1007,'account export includes every saved version beyond API page limits')
assert.equal(exported.legal_comparisons.length,1)
assert.equal(JSON.parse(await createAccountDataArtifact({data:exported}).blob.text()).data.legal_comparisons[0].result.finding,'Saved country comparison')
await assert.rejects(loadAccountExportData(database(archive,{failTable:'legal_comparisons'}),owner),/Read unavailable/)

// Long contracts and multiline evidence must survive the actual file writers.
const longText=Array.from({length:1200},(_,i)=>`Abschnitt ${i}: Übergabe und Rückgabe prüfen.\n`).join('')+'ENDE-DES-VERTRAGS'
const sheet=await unzip(await createXlsxBlob([['Vertragsauszug',''],['Original',longText]]))
const sheetXml=await sheet.file('xl/worksheets/sheet1.xml').async('string')
const cells=[...sheetXml.matchAll(/<c r="B\d+"[^>]*>([\s\S]*?)<\/c>/g)].map(match=>xmlText(match[1]))
assert.equal(cells.join(''),longText,'Excel must preserve every character across continuation rows')
assert.ok(cells.every(cell=>cell.length<=32767))
const deck=await unzip(await createPptxBlob([['Vertragsauszug',''],['Original',longText]]))
const slideFiles=deck.file(/^ppt\/slides\/slide\d+\.xml$/).sort((a,b)=>Number(a.name.match(/slide(\d+)/)[1])-Number(b.name.match(/slide(\d+)/)[1]))
const bodies=[]
for(const file of slideFiles){
  const xml=await file.async('string')
  const body=[...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(match=>match[0]).find(shape=>shape.includes('name="Value"'))
  bodies.push(xmlText(body))
  assert.ok((body.match(/<a:br\/>/g)||[]).length<=11,'each slide has a bounded readable body')
  assert.doesNotMatch(xml,/�|__AS_TRAFFIC_/)
}
assert.equal(compact(bodies.join('')),compact(longText),'PowerPoint must preserve every section in order')
for(const create of [createPptxBlob,createXlsxBlob]){
  const zip=await unzip(await create([['Unicode',''],['Status','x'.repeat(32766)+'🟢 Ende 🟡 offen 🔴 Frist ⚪ prüfen']]))
  const xml=(await Promise.all(zip.file(/(?:sheet1|slide\d+)\.xml$/).map(file=>file.async('string')))).join('')
  for(const color of ['2F855A','D69E2E','C53030','94A3B8'])assert.ok(xml.includes(color))
  assert.doesNotMatch(xml,/�|__AS_TRAFFIC_/,'pagination cannot split Unicode markers or expose placeholder tokens')
}

function workflow(file,name,context){
  const source=fs.readFileSync(file,'utf8').replace(/^import .*$/gm,'').replace(/^export \{.*$/gm,'').replace(/export function /g,'function ')
  vm.createContext(context);vm.runInContext(source+`\nthis.create=${name}`,context);return context.create
}
const timeout=promise=>Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve('TIMEOUT'),80))])
const draftCase={title:'Test',reference_no:'',goal:'',summary:'',next_action:''}
const warnings=[],originalWarn=console.warn
console.warn=(...args)=>warnings.push(args[0])
try{
for(const audit of ['pending','rejected']){
  const record={id:'saved',name:'Synthetischer Mandant',title:'Gespeicherter Fall',preview_revision:2,approved_revision:2}
  const response=async()=>({data:record,assessment:record,updatedCase:record,error:null,invalidated:true})
  for(const [file,name,methods] of [
    ['app/modules/cases/caseWorkflow.js','createCaseWorkflowActions',['createClient','createCase','updateClient','updateCase','createAssessment']],
    ['app/modules/cases/approvalWorkflow.js','createApprovalWorkflowActions',['createApproval','updateApproval','approveApproval','rejectApproval']]
  ]){
    for(const method of methods){
      const state={cases:[record],clients:[record],assessments:[],approvals:[record],documents:[]},updates=[]
      const context={recordCommittedAction,normalizeCasePayload,emptyCase:{},createClientRecord:response,createCaseRecord:response,updateCaseRecord:response,updateClientRecord:response,createAssessmentRecord:response,createApprovalRecord:response,updateApprovalRecord:response,approveApprovalRecord:response,rejectApprovalRecord:response}
      const create=workflow(file,name,context)
      const options=new Proxy({ownerId:owner,data:state,newClient:{name:'Test'},newCase:draftCase,approvalUi:labels,setData:update=>updates.push(update(state)),recordLocalAction(){throw new Error('Device storage unavailable')},recordServerAudit:()=>audit==='pending'?new Promise(()=>{}):Promise.reject(new Error('Audit unavailable'))},{get:(target,key)=>target[key]??(()=>{})})
      const actions=create(options),draft={...draftCase,name:'Updated',subject:'Test letter',body:'Saved letter body',case_id:'saved',recipient:'Test recipient'}
      const args=method.startsWith('create')&&['createCase','createClient'].includes(method)?[{preventDefault(){}}]:method==='createApproval'?[draft]:method.startsWith('approve')||method.startsWith('reject')?[record]:['saved',draft]
      assert.notEqual(await timeout(actions[method](...args)),'TIMEOUT',method+' cannot wait for audit delivery')
      assert.equal(updates.length,1,method+' must present the committed state')
    }
  }
}
await Promise.resolve()
}finally{console.warn=originalWarn}
assert.equal(warnings.filter(value=>value==='Local activity unavailable').length,18,'local storage failures exercise the real helper')

for(const logging of ['pending','rejected']){
  const downloads=[],state={message:''},logged=[]
  const db=database(fixture.tables)
  const context={loadAccountExportData,loadCaseExportData,createWorkspaceExportArtifact,createAccountDataArtifact,
    downloadExportArtifact:artifact=>downloads.push(artifact),exportUi:{de:labels,en:labels},getV24Copy:()=>labels,getV25ApprovalCopy:()=>labels,outputLanguageLabels:{de:'Deutsch',en:'English'},
    recordExportEntry:async()=>logging==='pending'?new Promise(()=>{}):{error:new Error('Log unavailable')}}
  const create=workflow('app/modules/documents/exportWorkflow.js','createExportWorkflowActions',context)
  const options={supabase:db,user:{id:owner},access:{app_role:'owner'},data:{},outputLanguage:'en',appCopy:{export:'Export'},notices:{exportLocked:'Locked'},serverCopy:{auditFailed:'Audit unavailable'},trustCopy:{dataExport:'Data export'},currentPlan:{name:'Test'},
    setMessage:value=>{state.message=typeof value==='function'?value(state.message):value},recordLocalAction(){throw new Error('Device unavailable')},recordServerAudit:event=>{logged.push(event);return logging==='pending'?new Promise(()=>{}):Promise.reject(new Error('Audit unavailable'))}}
  const actions=create(options)
  assert.equal(await timeout(actions.doExport({kind:'case',item:fixture.item},'txt')),true,'actual export action resolves after download independently of logging')
  assert.match(await downloads[0].blob.text(),/ENDE-repair/,'actual button workflow passes the persisted report to its writer')
  assert.match(state.message,/Deutsch.*✓/)
  assert.ok(logged.includes('export_created'))
  assert.equal(await timeout(actions.exportMyData()),true)
  assert.equal(JSON.parse(await downloads[1].blob.text()).data.case_roadmaps[0].id,fixture.record.id)
  const count=downloads.length,reads=db.reads.length
  await create({...options,access:{permissions:{}}}).doExport({kind:'case',item:fixture.item},'txt')
  assert.equal(downloads.length,count);assert.equal(db.reads.length,reads,'locked format cannot start a database export')
  await create({...options,supabase:database(fixture.tables,{failTable:'case_roadmaps'})}).doExport({kind:'case',item:fixture.item},'txt')
  assert.equal(downloads.length,count,'an incomplete read must not download a partial result')
  assert.match(state.message,/Read unavailable/)
  await Promise.resolve();await Promise.resolve()
  assert.match(state.message,/Read unavailable/,'late audit failures cannot replace a newer user-facing result')
}
console.log('Product delivery: three independent saved case reports in six formats; stale/foreign/read-failure guards; complete paginated account archive; long Excel/PowerPoint content; nine committed workflows with pending/rejected audit passed. AI generation and live backend acceptance remain separate.')
