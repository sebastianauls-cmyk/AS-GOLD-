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
import freeFixture from '../../scripts/fixtures/freeAnalysisSarah.json'

export default function Fixture(){
  const [draft,setDraft]=useState({...emptyCase}),[started,setStarted]=useState(false),[language,setLanguage]=useState('de')
  const [documents,setDocuments]=useState(()=>roadmapTestDocuments.map((doc,i)=>({...doc,title:`${i+1}.pdf`,file_path:`fixture/${i+1}.pdf`,extracted_text:null})))
  const [stats,setStats]=useState({read:0,saved:0,generated:0,sent:0})
  const [opened,setOpened]=useState(''),[caseVisible,setCaseVisible]=useState(true)
  const [internal,setInternal]=useState(false)
  const [invocations,setInvocations]=useState(0)
  const current=useRef({}),cache=useRef(new Map()),fail=useRef(false),reviewFailure=useRef(false),savedJob=useRef(null),savedRoadmap=useRef(null),holdJob=useRef(false)
  const item={...roadmapTestCase,title:draft.title||'Ich verstehe meine Briefe nicht.',goal:draft.goal||roadmapTestCase.goal}
  current.current={item,documents}
  async function finishBackground(){
    if(!savedJob.current||!['queued','running'].includes(savedJob.current.status))return
    if(reviewFailure.current){savedJob.current={...savedJob.current,status:'failed',error_code:'review_unresolved',issues:[{code:'source',location:'analysis.calculations',reason:'Die Berechnung passt nicht zum angegebenen Original.'},{code:'sender_role',location:'letters',reason:'Das Schreiben setzt eine unbelegte Vollmacht voraus.'}]};return}
      const roadmap={...roadmapTestRecord(),source_fingerprint:await roadmapFingerprint(roadmapSource(current.current.item,current.current.documents,[]))}
      roadmap.result.analysis={topics:[{id:'difference',title:'Zusammensetzung der Abzüge',status:'open',conclusion:'Die Differenz ist berechnet. Wofür sie abgezogen wurde, ist noch offen.',conditions:'Die Abrechnung muss den Abzug erklären.',sources:[],step_ids:['anfragen']}],calculations:[{id:'net',title:'Brutto minus netto',inputs:[{label:'Brutto',value:'18000',kind:'document',quote:'Die einmalige Kapitalzahlung beträgt 18.000 EUR brutto und 17.000 EUR netto.'},{label:'Netto',value:'17000',kind:'document',quote:''}],expression:'gross-net',result:'1000.00',unit:'EUR',conditions:'Die Art der Abzüge ist ungeklärt.',explanation:'18.000 EUR abzüglich 17.000 EUR ergibt 1.000 EUR.'}],limitations:['Die Berechnungsanlage fehlt.'],research_sources:[]}
    savedRoadmap.current=roadmap
    savedJob.current={...savedJob.current,status:'completed',roadmap_id:roadmap.id}
  }
  const supabase=useMemo(()=>({
    from(table){const query={select(){return this},eq(){return this},order(){return this},update(){return this},limit:async()=>({data:structuredClone(table==='case_analysis_jobs'&&savedJob.current?[savedJob.current]:table==='case_roadmaps'&&savedRoadmap.current?[savedRoadmap.current]:[]),error:null}),single:async()=>({data:{},error:null}),then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return query},
    functions:{invoke:async(name,{body})=>{
      setInvocations(value=>value+1)
      if(name!=='gold-case-roadmap')return {data:null,error:null}
      if(body.action==='cancel'){savedJob.current={...savedJob.current,status:'cancelled'};return {data:{job:structuredClone(savedJob.current)},error:null}}
      if(body.action!=='enqueue'||body.analysis_mode!=='complete')throw new Error('Durable complete analysis was not requested')
      if(current.current.documents.some(doc=>!doc.extracted_text))throw new Error('Generation started before all originals were stored')
      if(savedJob.current&&['queued','running'].includes(savedJob.current.status))return {data:{job:structuredClone(savedJob.current)},error:null}
      setStats(value=>({...value,generated:value.generated+1}))
      savedJob.current={id:crypto.randomUUID(),case_id:current.current.item.id,status:'queued',stage:'planning',created_at:new Date().toISOString()}
      if(!holdJob.current)setTimeout(()=>finishBackground(),120)
      return {data:{status:'queued',job:structuredClone(savedJob.current)},error:null}
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
    <button onClick={()=>{reviewFailure.current=true}}>Simulate unresolved content review</button>
    <button onClick={()=>{holdJob.current=true}}>Hold background job</button>
    <button onClick={()=>setCaseVisible(value=>!value)}>{caseVisible?'Leave case page':'Return to case page'}</button>
    <button onClick={finishBackground}>Finish background job</button>
    <button onClick={()=>{setInternal(true);setDocuments(freeFixture.documents.map(doc=>({...doc,case_id:item.id,owner_id:item.owner_id})))}}>Use internal free mode</button>
    <button onClick={()=>setDocuments(previous=>previous.map((doc,index)=>index?doc:{...doc,extracted_text:doc.extracted_text.replace('27.930,00 EUR','27.830,00 EUR')}))}>Change a saved amount</button>
    {caseVisible&&(!started?<SimpleCaseStart language={language} copy={getV24Copy(language)} draft={draft} setDraft={setDraft} onSubmit={async(_,value)=>{setDraft(value);setStarted(true)}}/>:<CaseDetail access={internal?{active:true,status:'approved',app_role:'owner'}:null} copy={getV24Copy(language)} analysis={getV26AnalysisCopy(language)} language={language} outputLanguage="de" supabase={supabase} ownerId={item.owner_id} item={item} clients={[]} documents={documents} assessments={[]} onBack={()=>setStarted(false)} onSave={async()=>true} onAddAssessment={async()=>true} onAddDocument={()=>setOpened('upload')} onOpenDocument={doc=>setOpened(doc.title)} onPrivacyUpdate={()=>{}} onAnalyzeDocument={analyze} onRecoverDocument={async doc=>cache.current.get(doc.id)||false} onSaveDocument={save} continuation={{canContinue:true}}/>)}
    <output data-testid="stats">{JSON.stringify(stats)}</output><output data-testid="invocations">{invocations}</output><output>{opened}</output>
  </main>
}
