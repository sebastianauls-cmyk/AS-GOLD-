import { CaseSection } from './V24Workspace'

export function CasesSurface({a,core,clients,cases,newCase,setNewCase,showCaseForm,setShowCaseForm,createCase,setSelectedCase,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.cases}</h2></div><CaseSection copy={core} clients={clients} cases={cases} newCase={newCase} setNewCase={setNewCase} showForm={showCaseForm} setShowForm={setShowCaseForm} onSubmit={createCase} onSelect={setSelectedCase}/></>
}

export function ClientDetailSurface({a,selectedClient,onBack}){
  return <><button className="backBtn" onClick={onBack}>{a.backClients}</button><h2>{selectedClient.name}</h2><div className="detailCard"><p><b>E-Mail:</b> {selectedClient.email||'—'}</p><p><b>{a.phone}:</b> {selectedClient.phone||'—'}</p><p><b>{a.note}:</b> {selectedClient.notes||'—'}</p></div></>
}

export function ClientsSurface({a,showClientForm,setShowClientForm,createClient,newClient,setNewClient,clients,setSelectedClient,onBack}){
  return <><div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.clients}</h2></div><button className="primary actionBtn" onClick={()=>setShowClientForm(v=>!v)}>{showClientForm?a.cancel:a.addClient}</button>{showClientForm&&<form className="actionCard" onSubmit={createClient}><label>{a.name}<input value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} required/></label><label>{a.email}<input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/></label><label>{a.phone}<input value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})}/></label><label>{a.note}<textarea value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})}/></label><button className="primary full">{a.saveClient}</button></form>}{clients.length?<div className="itemList">{clients.map((item,i)=><button className="itemRow buttonRow" onClick={()=>setSelectedClient(item)} key={item.id||i}><div><b>{item.name}</b>{item.email&&<p>{item.email}</p>}</div><span className="chev">›</span></button>)}</div>:<div className="emptyState"><b>{a.noneYet.replace('{section}',a.sections.clients.toLowerCase())}</b><p>{a.firstClient}</p></div>}</>
}
