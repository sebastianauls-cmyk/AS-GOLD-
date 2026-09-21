'use client'
// Copied into an ignored app route only by the isolated CI build. All identities,
// documents, responses and Supabase calls are simulated. No network or AI cost.
import {useMemo,useRef,useState} from 'react'
import {SimpleCaseStart} from '../modules/cases/SimpleCaseStart'
import {CaseDetail,getV24Copy} from '../modules/cases/CaseWorkspace'
import {getV26AnalysisCopy} from '../modules/documents/DocumentAnalysis'
import {emptyCase} from '../modules/workspace/stateConfig'
import {roadmapTestCase,roadmapTestDocuments,roadmapTestRecord} from '../modules/testing/customerRoadmapFixture.mjs'
import {roadmapFingerprint,roadmapSource} from '../../supabase/functions/_shared/customerRoadmap.mjs'
import {workflowErrorMessage} from '../modules/services/workflowError.mjs'

export default function Fixture(){
  const [draft,setDraft]=useState({...emptyCase}),[started,setStarted]=useState(false),[language,setLanguage]=useState('de')
  const [documents,setDocuments]=useState(()=>roadmapTestDocuments.map((doc,i)=>({...doc,title:`${i+1}.pdf`,file_path:`fixture/${i+1}.pdf`,extracted_text:null})))
  const [stats,setStats]=useState({read:0,saved:0,generated:0,sent:0})
  const [opened,setOpened]=useState('')
  const current=useRef({}),cache=useRef(new Map()),fail=useRef(false)
  const item={...roadmapTestCase,title:draft.title||'Ich verstehe meine Briefe nicht.',goal:draft.goal||roadmapTestCase.goal}
  current.current={item,documents}
  const supabase=useMemo(()=>({
    from(){const query={select(){return this},eq(){return this},order(){return this},update(){return this},limit:async()=>({data:[],error:null}),single:async()=>({data:{},error:null}),then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return query},
    functions:{invoke:async(name,{body})=>{
      if(name!=='gold-case-roadmap')return {data:null,error:null}
      if(body.action!=='generate')throw new Error('Unexpected action')
      if(current.current.documents.some(doc=>!doc.extracted_text))throw new Error('Generation started before all originals were stored')
      setStats(value=>({...value,generated:value.generated+1}))
      const roadmap={...roadmapTestRecord(),source_fingerprint:await roadmapFingerprint(roadmapSource(current.current.item,current.current.documents,[]))}
      return {data:{status:'completed',roadmap},error:null}
    }}
  }),[])
  async function analyze(document,{onFailure}={}){
    setStats(value=>({...value,read:value.read+1}))
    await new Promise(resolve=>setTimeout(resolve,120))
    if(fail.current==='quota'){fail.current=false;onFailure?.({message:workflowErrorMessage({code:'provider_quota'},'Fallback',language)});return false}
    if(fail.current&&document.id===roadmapTestDocuments[1].id){fail.current=false;return false}
    const fresh={...document,updated_at:'2026-09-21T01:00:00Z'}
    const generated={fields:{extracted_text:roadmapTestDocuments.find(doc=>doc.id===document.id).extracted_text,analysis_summary:'Erfundene Testantwort.',analysis_next_step:'Fehlende Angaben klären.',analysis_reasoning:'Vorläufig.',customer_copy_language:document.customer_copy_language,reference_copy_language:document.reference_copy_language}}
    cache.current.set(document.id,{document:fresh,generated})
    return generated
  }
  async function save(id,review,options){
    if(options.expectedUpdatedAt!==cache.current.get(id)?.document.updated_at)throw new Error('Version guard missing')
    const updated={...documents.find(doc=>doc.id===id),...review,updated_at:'2026-09-21T01:01:00Z'}
    current.current.documents=current.current.documents.map(doc=>doc.id===id?updated:doc)
    setDocuments(previous=>previous.map(doc=>doc.id===id?updated:doc))
    setStats(value=>({...value,saved:value.saved+1}))
    return updated
  }
  return <main style={{maxWidth:880,margin:'0 auto',padding:16}}>
    <p>Prüfansicht · erfundene Daten · simulierte Antworten</p>
    <label>Test language<select aria-label="Test language" value={language} onChange={event=>setLanguage(event.target.value)}>{['de','en','fa'].map(key=><option key={key}>{key}</option>)}</select></label>
    <button onClick={()=>{fail.current=true}}>Simulate one failed read</button>
    <button onClick={()=>{fail.current='quota'}}>Simulate exhausted provider credits</button>
    {!started?<SimpleCaseStart language={language} copy={getV24Copy(language)} draft={draft} setDraft={setDraft} onSubmit={async(_,value)=>{setDraft(value);setStarted(true)}}/>:<CaseDetail copy={getV24Copy(language)} analysis={getV26AnalysisCopy(language)} language={language} outputLanguage="de" supabase={supabase} ownerId={item.owner_id} item={item} clients={[]} documents={documents} assessments={[]} onBack={()=>setStarted(false)} onSave={async()=>true} onAddAssessment={async()=>true} onAddDocument={()=>setOpened('upload')} onOpenDocument={doc=>setOpened(doc.title)} onPrivacyUpdate={()=>{}} onAnalyzeDocument={analyze} onRecoverDocument={async doc=>cache.current.get(doc.id)||false} onSaveDocument={save} continuation={{canContinue:true}}/>}
    <output data-testid="stats">{JSON.stringify(stats)}</output><output>{opened}</output>
  </main>
}
