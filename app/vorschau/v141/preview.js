'use client'
import {useEffect,useState} from 'react'
import {CaseDetail,getV24Copy} from '../../modules/cases/CaseWorkspace'
import {CustomerRoadmapView} from '../../modules/cases/CustomerRoadmapPanel'
import {DeadlinesSurface} from '../../modules/cases/WorkspaceCaseSurfaces'
import {buildDeadlineOverview} from '../../modules/cases/deadlineCases.mjs'
import {getDeadlineUi} from '../../modules/cases/deadlineUi.mjs'
import {normalizeCasePayload} from '../../modules/cases/casePayload.mjs'
import {updateRoadmapProgress} from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import {createRoadmapExport} from '../../modules/services/customerRoadmapExport.mjs'
import {downloadExportArtifact} from '../../modules/services/exportService'
import fixture from '../../modules/testing/completionCaseFixture.json'
import initialRecord from '../../modules/testing/completionRoadmapFixture.json'
const key='ash-v141-synthetic-completion'
const initial=()=>({item:structuredClone(fixture.item),record:structuredClone(initialRecord),stale:false,view:'case'})
export function CompletionPreview(){
  const [state,setState]=useState(initial),[ready,setReady]=useState(false),[message,setMessage]=useState('')
  useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(key));if(saved?.item?.id===fixture.item.id&&saved.record?.id===initialRecord.id)setState(saved)}catch{}setReady(true)},[])
  useEffect(()=>{if(ready)sessionStorage.setItem(key,JSON.stringify(state))},[state,ready])
  if(!ready)return <p>Testansicht wird geladen …</p>
  const on=getV24Copy('de'),overview=buildDeadlineOverview([state.item],fixture.documents)
  const show=view=>setState(previous=>({...previous,view}))
  async function progress(step_id,done,note){try{setState(previous=>({...previous,record:{...previous.record,...updateRoadmapProgress(previous.record,{step_id,done,note})}}));return true}catch(error){setMessage(error.message);return false}}
  return <main style={{maxWidth:1000,margin:'0 auto',padding:20}}>
    <h1>V141 · Abschluss und Fallfrist prüfen</h1>
    <p>Vollständig erfundener Test. Die echten Anzeige-, Eingabe- und Exportkomponenten speichern hier nur in diesem Browser-Tab. Neuladen stellt diesen Teststand wieder her. Diese Ansicht prüft weder Anmeldung noch Speicherung in der Kundendatenbank.</p>
    <div className="roadmapActions">{[['case','Fall und Frist'],['calendar','Fristenübersicht'],['roadmap','Kundenfahrplan']].map(([view,label])=><button className="secondary" key={view} onClick={()=>show(view)}>{label}</button>)}<button className="secondary" onClick={()=>{setState(initial());setMessage('Test zurückgesetzt.')}}>Test zurücksetzen</button></div>
    {message&&<p role="status">{message}</p>}
    {state.view==='case'&&<CaseDetail copy={on} language="de" item={state.item} clients={[]} documents={fixture.documents} assessments={[]} onBack={()=>show('calendar')} onSave={async(id,draft)=>{setState(previous=>({...previous,item:{...previous.item,...normalizeCasePayload(draft),updated_at:new Date().toISOString()},stale:true}));setMessage('Fall im Browser-Test gespeichert. Die bisherige Fahrplanfassung ist nun veraltet.');return true}} onAddAssessment={async()=>false} onOpenDocument={document=>setMessage(document.extracted_text)}/>}
    {state.view==='calendar'&&<DeadlinesSurface a={{backOverview:'Zurück zum Fall',appearsHere:'Bestätigte Testfristen erscheinen hier.'}} core={on} copy={getDeadlineUi('de')} datedCases={overview.dated} unresolvedCases={overview.unresolved} detectedCases={overview.detected} language="de" setSelectedCase={()=>show('case')} onBack={()=>show('case')}/>}
    {state.view==='roadmap'&&<>
      {state.stale&&<div className="detailCard"><p>Der Testfall wurde geändert. Für die Prüfung des weiteren Ablaufs kann die vorbereitete künstliche Fahrplanfassung neu geladen werden. Dies simuliert die Neuerstellung und ruft keine KI auf.</p><button className="secondary" onClick={()=>setState(previous=>({...previous,record:structuredClone(initialRecord),stale:false}))}>Vorbereitete Testfassung laden</button></div>}
      <section className="customerRoadmapPanel"><CustomerRoadmapView record={state.record} documents={fixture.documents} stale={state.stale} full onFull={()=>{}} onProgress={progress} onExport={async(type,letterId)=>downloadExportArtifact(await createRoadmapExport(state.record,type,{letterId}))} continuation={{canContinue:true,currentTier:'business',upgradeOptions:[]}}/></section>
    </>}
  </main>
}
