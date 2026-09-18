'use client'
import {useState} from 'react'
import {CustomerRoadmapView} from '../../modules/cases/CustomerRoadmapPanel'
import {roadmapTestRecord,roadmapTestDocuments} from '../../modules/testing/customerRoadmapFixture.mjs'
import {updateRoadmapProgress} from '../../../supabase/functions/_shared/customerRoadmap.mjs'
import {createRoadmapExport} from '../../modules/services/customerRoadmapExport.mjs'
import {downloadExportArtifact} from '../../modules/services/exportService'
import {plans} from '../../modules/pricing/catalog'
export function RoadmapPreview({framed}) {
  const [record,setRecord]=useState(roadmapTestRecord),[full,setFull]=useState(false),[stale,setStale]=useState(false),[message,setMessage]=useState(''),[width,setWidth]=useState('100%'),[tier,setTier]=useState('business')
  async function progress(step_id,done,note){try{setRecord(previous=>({...previous,...updateRoadmapProgress(previous,{step_id,done,note})}));return true}catch(error){setMessage(error.message);return false}}
  const content=<main style={{maxWidth:960,margin:'0 auto',padding:16}}>
    <h2>V136 · Synthetische Funktionsvorschau</h2><p>Frei erfundene Daten. In dieser Vorschau wird nichts an Kunden versandt, bestellt oder dauerhaft gespeichert. Die KI-Erstellung wird separat im angemeldeten Testzugang geprüft.</p>
    <div className="roadmapActions"><button className="secondary" onClick={()=>setStale(value=>!value)}>{stale?'Aktuelle Grundlage':'Neue Unterlage simulieren'}</button><label>Zugang simulieren <select value={tier} onChange={event=>setTier(event.target.value)}>{plans.map(plan=><option key={plan.key} value={plan.key}>{plan.name}</option>)}</select></label></div>
    {stale&&<p role="status">Grundlage geändert – neu erstellen.</p>}{message&&<p role="status">{message}</p>}
    <section className="customerRoadmapPanel"><CustomerRoadmapView record={record} stale={stale} documents={roadmapTestDocuments} full={full} onFull={()=>setFull(true)} onProgress={progress} onExport={async(type,letterId)=>downloadExportArtifact(await createRoadmapExport(record,type,{letterId}))} continuation={{canContinue:['analyse','komplett','business'].includes(tier),currentTier:tier,upgradeOptions:plans.map(plan=>({...plan,plan_key:plan.key,plan_name:plan.name,price_eur:plan.price})),onPlans:()=>setMessage('In der App öffnet sich jetzt die bestehende Kostenübersicht mit Laufzeit, Gesamtbetrag und Promo-Code. Diese Vorschau löst keine Bestellung aus.')}}/></section>
  </main>
  if(framed)return content
  return <main style={{padding:16,maxWidth:1250,margin:'0 auto'}}><h1>Kundenfahrplan und nächste Schritte</h1><div className="roadmapActions"><button className="secondary" onClick={()=>setWidth('390px')}>Handyansicht</button><button className="secondary" onClick={()=>setWidth('100%')}>Große Ansicht</button></div><iframe title="V136 Funktionsvorschau" src="/vorschau/v136?frame=1" style={{display:'block',width,maxWidth:'100%',height:'82vh',margin:'0 auto',border:'1px solid #c8d8ea',borderRadius:16,background:'white'}}/></main>
}
