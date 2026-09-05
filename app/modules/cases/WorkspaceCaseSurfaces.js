'use client'

import { useState } from 'react'
import { CaseSection } from './V24Workspace'

export function CasesSurface({a,core,clients,cases,newCase,setNewCase,showCaseForm,setShowCaseForm,createCase,setSelectedCase,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.cases}</h2></div><CaseSection copy={core} clients={clients} cases={cases} newCase={newCase} setNewCase={setNewCase} showForm={showCaseForm} setShowForm={setShowCaseForm} onSubmit={createCase} onSelect={setSelectedCase}/></>
}

export function ClientDetailSurface({a,core,selectedClient,cases,documents,onSave,onOpenCase,onOpenDocument,onBack}){
  const [editing,setEditing]=useState(false)
  const [draft,setDraft]=useState({name:selectedClient.name||'',email:selectedClient.email||'',phone:selectedClient.phone||'',notes:selectedClient.notes||''})
  return <>
    <button className="backBtn" type="button" onClick={onBack}>{a.backClients}</button>
    <div className="caseTitleRow"><div><span className="modeBadge">{a.sections.clients}</span><h2>{selectedClient.name}</h2></div><button className="secondary" type="button" onClick={()=>setEditing(value=>!value)}>{editing?core.cancel:core.editCase}</button></div>
    {editing&&<form className="actionCard coreForm" onSubmit={event=>{event.preventDefault();onSave(selectedClient.id,draft).then(saved=>{if(saved)setEditing(false)})}}><label>{a.name}<input value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} required/></label><label>{a.email}<input type="email" value={draft.email} onChange={event=>setDraft({...draft,email:event.target.value})}/></label><label>{a.phone}<input value={draft.phone} onChange={event=>setDraft({...draft,phone:event.target.value})}/></label><label>{a.note}<textarea value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})}/></label><button className="primary full">{core.saveChanges}</button></form>}
    <div className="detailCard"><p><b>{a.email}:</b> {selectedClient.email||'—'}</p><p><b>{a.phone}:</b> {selectedClient.phone||'—'}</p><p><b>{a.note}:</b> {selectedClient.notes||'—'}</p></div>
    <section className="detailCard"><h3>{a.sections.cases}</h3>{cases.length?<div className="itemList">{cases.map(item=><button className="itemRow buttonRow" type="button" onClick={()=>onOpenCase(item)} key={item.id}><div><b>{item.title}</b><span className={`pill ${item.traffic_light||'yellow'}`}>{item.traffic_light==='red'?`🔴 ${core.red}`:item.traffic_light==='green'?`🟢 ${core.green}`:`🟡 ${core.yellow}`}</span></div><span className="chev">›</span></button>)}</div>:<p>{a.noneYet.replace('{section}',a.sections.cases.toLowerCase())}</p>}</section>
    <section className="detailCard"><h3>{a.relatedDocs}</h3>{documents.length?<div className="itemList">{documents.map(item=><button className="itemRow buttonRow" type="button" onClick={()=>onOpenDocument(item)} key={item.id}><div><b>{item.title}</b><p>{item.document_type||core.documentType}</p></div><span className="chev">›</span></button>)}</div>:<p>{a.noAssignedDocs}</p>}</section>
  </>
}

export function ClientsSurface({a,showClientForm,setShowClientForm,createClient,newClient,setNewClient,clients,setSelectedClient,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.clients}</h2></div><button className="primary actionBtn" onClick={()=>setShowClientForm(v=>!v)}>{showClientForm?a.cancel:a.addClient}</button>{showClientForm&&<form className="actionCard" onSubmit={createClient}><label>{a.name}<input value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} required/></label><label>{a.email}<input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/></label><label>{a.phone}<input value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})}/></label><label>{a.note}<textarea value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})}/></label><button className="primary full">{a.saveClient}</button></form>}{clients.length?<div className="itemList">{clients.map((item,i)=><button className="itemRow buttonRow" onClick={()=>setSelectedClient(item)} key={item.id||i}><div><b>{item.name}</b>{item.email&&<p>{item.email}</p>}</div><span className="chev">›</span></button>)}</div>:<div className="emptyState"><b>{a.noneYet.replace('{section}',a.sections.clients.toLowerCase())}</b><p>{a.firstClient}</p></div>}</>
}
