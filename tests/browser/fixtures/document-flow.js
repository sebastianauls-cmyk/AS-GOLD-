'use client'
// Isolated CI route: real intake, editor and persistence workflow; synthetic
// identity and in-memory transport. Invoking an AI endpoint is a test failure.
import {useMemo,useRef,useState} from 'react'
import {DocumentsSurface} from '../modules/documents/DocumentsSurface'
import {DocumentDetail,getV24Copy} from '../modules/cases/CaseWorkspace'
import {getV26AnalysisCopy} from '../modules/documents/DocumentAnalysis'
import {getV28PrivacyCopy} from '../modules/compliance/PrivacyControls'
import {allowedUploadAccept,uploadUi} from '../modules/documents/uploadConfig'
import {createDocumentWorkflowActions} from '../modules/documents/documentWorkflow'

const owner='11111111-1111-4111-8111-111111111111'
const fixtureCase={id:'22222222-2222-4222-8222-222222222222',owner_id:owner,title:'Erfundene Werkstattrechnung',target_country:'DE'}
export default function Fixture(){
  const [data,setData]=useState({cases:[fixtureCase],documents:[],assessments:[],sourceStatus:[]})
  const [selected,setSelected]=useState(null),[message,setMessage]=useState(''),[uploading,setUploading]=useState(false),[documentMode,setDocumentMode]=useState('upload')
  const [counts,setCounts]=useState({uploads:0,inserts:0,updates:0,removals:0,rows:0})
  const store=useRef({rows:new Map(),objects:new Map(),delivery:'ok',read:true,audit:'pending',counts:{uploads:0,inserts:0,updates:0,removals:0}})
  const uploadInFlight=useRef(false),uploadAttempt=useRef(null)
  const supabase=useMemo(()=>{
    const state=store.current
    const report=()=>setCounts({...state.counts,rows:state.rows.size})
    return {functions:{invoke:async()=>{throw new Error('This fixture must never invoke an AI endpoint')}},
      storage:{from:()=>({
        upload:async(path,file)=>{state.counts.uploads++;state.objects.set(path,file);report();return {data:{path},error:null}},
        createSignedUrl:async path=>({data:state.objects.has(path)?{signedUrl:URL.createObjectURL(state.objects.get(path))}:null,error:null}),
        remove:async paths=>{state.counts.removals++;paths.forEach(path=>state.objects.delete(path));report();return {error:null}}
      })},
      from(table){
        const filters=[];let insert,changes
        const read=()=>[...state.rows.values()].find(row=>filters.every(([key,value])=>row[key]===value))
        return {select(){return this},eq(key,value){filters.push([key,value]);return this},insert(payload){insert=payload;return this},update(payload){changes=payload;return this},async single(){
          if(table==='source_status')return {data:{id:'source'},error:null}
          if(insert){
            state.counts.inserts++
            if(state.rows.has(insert.id))return {data:null,error:{code:'23505'}}
            const row={...insert,updated_at:'2026-09-24T12:00:00Z'}
            if(state.delivery!=='lost-request')state.rows.set(row.id,row)
            report()
            return state.delivery==='ok'?{data:structuredClone(row),error:null}:{data:null,error:{code:'',message:'TypeError: Failed to fetch'}}
          }
          const row=read()
          if(!row)return {data:null,error:{message:'Document unavailable'}}
          if(changes){Object.assign(row,changes);state.counts.updates++;report()}
          return {data:structuredClone(row),error:null}
        },async maybeSingle(){return state.read?{data:structuredClone(read()||null),error:null}:{data:null,error:{message:'Read unavailable'}}}}
      },rpc:async()=>({data:{assessment:{id:'assessment',case_id:fixtureCase.id},case:fixtureCase},error:null})}
  },[])
  const core=getV24Copy('de'),analysis=getV26AnalysisCopy('de'),privacy=getV28PrivacyCopy('de')
  const actions=createDocumentWorkflowActions({supabase,ownerId:owner,data,access:{app_role:'owner'},language:'de',privacyCurrent:true,outputLanguage:'de',privacyCopy:privacy,notices:{chooseFile:'Datei auswählen'},uploadCopy:uploadUi.de,analysisCopy:analysis,caseCopy:core,serverCopy:{auditFailed:'Protokollierung nicht verfügbar'},setData,setMessage,setPrivacySettings(){},setUploading,setSection(){},setSelectedDocument:setSelected,uploadInFlight,uploadAttempt,
    recordLocalAction(){throw new Error('Simulated device storage failure')},recordServerAudit(){return store.current.audit==='pending'?new Promise(()=>{}):Promise.reject(new Error('Simulated audit failure'))}})
  return <main style={{maxWidth:880,margin:'0 auto',padding:16,overflowWrap:'anywhere'}}>
    <p>Prüfansicht Dokumente · erfundene Daten · simulierte Speicherung</p>
    <div style={{display:'grid',gap:4}}>
      <button onClick={()=>{store.current.audit='rejected'}}>Reject optional audit</button>
      <button onClick={()=>{store.current.delivery='lost-response';store.current.read=false}}>Lose save confirmation</button>
      <button onClick={()=>{store.current.delivery='lost-request'}}>Lose first save request</button>
      <button onClick={()=>{store.current.delivery='ok';store.current.read=true}}>Restore connection</button>
      <output data-testid="document-counts">{JSON.stringify(counts)}</output>
      <output data-testid="saved-document">{JSON.stringify(data.documents.map(doc=>({title:doc.title,text:doc.extracted_text})))}</output>
      <p role="status" data-testid="document-message">{message}</p>
    </div>
    {selected?<DocumentDetail key={selected.id} copy={core} analysis={analysis} privacy={privacy} item={selected} cases={data.cases} documents={data.documents} language="de" outputLanguage="de" onBack={()=>setSelected(null)} onSave={actions.updateDocument} onAnalyze={actions.analyzeDocument} onRecover={actions.recoverDocumentAnalysis} onOpen={actions.openDocument}/>:<DocumentsSurface a={{backOverview:'Zurück',sections:{documents:'Dokumente'}}} access={{app_role:'owner'}} documents={data.documents} core={core} v28={privacy} cases={data.cases} documentMode={documentMode} setDocumentMode={setDocumentMode} uploadCaseId={fixtureCase.id} uploadDocument={actions.uploadDocument} uploading={uploading} allowedUploadAccept={allowedUploadAccept} setSelectedDocument={setSelected} onBack={()=>{}}/>}
  </main>
}
