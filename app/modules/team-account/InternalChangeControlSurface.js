'use client'

import { useCallback, useEffect, useState } from 'react'

import { createInternalChangeRequest, decideInternalChangeRequest, listInternalChangeRequests } from './changeRequestRepository.js'
import { changeAreas, getInternalChangeCopy } from './internalChangeCopy.mjs'

const emptyDraft={requesterName:'',productArea:changeAreas[0],title:'',requestedChange:'',reason:'',preparationNotes:'',priority:'normal'}

const surfaceStyles=`
.changeControl{display:grid;gap:18px}.changeHero{padding:clamp(18px,4vw,28px);border:1px solid #d6b85d;border-radius:20px;background:linear-gradient(135deg,#fff9df,#fff);box-shadow:0 14px 36px rgba(80,62,19,.08)}.changeHero h1{margin:8px 0;font-size:clamp(1.7rem,5vw,2.6rem);line-height:1.08}.changeHero p{max-width:800px;margin:0;color:#525d69;line-height:1.6}.changePasswordRule{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.changePasswordRule>div{padding:15px;border:1px solid #dfd7bd;border-radius:14px;background:#fff}.changePasswordRule b{display:block;color:#5f4a1b}.changePasswordRule small{display:block;margin-top:5px;color:#586474;line-height:1.45}.changePasswordRule .masterRule{border-color:#bd8531;background:#fff7e7}.changeNoEffect{display:block;margin-top:14px;font-weight:900;color:#7b4d00}.changeGrid{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(0,1.35fr);gap:18px;align-items:start}.changePanel{padding:20px;border:1px solid #e1d6b9;border-radius:18px;background:#fff}.changePanel h2{margin:0 0 6px}.changeForm{display:grid;gap:12px;margin-top:16px}.changeForm label{display:grid;gap:6px;font-weight:800}.changeForm input,.changeForm select,.changeForm textarea,.masterDecision input{width:100%;padding:11px 12px;border:1px solid #cbd2da;border-radius:10px;background:#fff;color:#172131;font:inherit}.changeForm textarea{min-height:104px;resize:vertical}.changeForm .preparationField textarea{min-height:130px}.changeFormActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.changeRequestList{display:grid;gap:13px;margin-top:16px}.changeRequestCard{padding:17px;border:1px solid #dfe3e8;border-radius:16px;background:#fbfcfd}.changeRequestHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.changeRequestHead h3{margin:5px 0 0}.changeMeta{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.changeStatus,.changePriority{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:.76rem;font-weight:900}.changeStatus{background:#eef2f6;color:#344153}.changeStatus--released{background:#fff1bf;color:#745400}.changeStatus--published{background:#dff4e5;color:#1f6533}.changeStatus--rejected{background:#fde6e3;color:#8a2f24}.changePriority{border:1px solid #d5dbe2;background:#fff}.changeRequestBody{display:grid;gap:10px;margin-top:13px}.changeRequestBody p{margin:0;color:#465362;line-height:1.5;white-space:pre-wrap}.changeRequestBody strong{color:#253245}.changeRequestBody details{padding:10px 12px;border:1px solid #e1e5e9;border-radius:10px;background:#fff}.changeRequestBody summary{cursor:pointer;font-weight:800}.decisionTrail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:15px 0}.decisionTrail span{padding:8px;border-radius:9px;background:#eceff3;color:#697483;text-align:center;font-size:.78rem;font-weight:800}.decisionTrail .done{background:#dff4e5;color:#1f6533}.decisionTrail .current{outline:2px solid #d6a52c;background:#fff6d5;color:#6d5000}.masterDecision{display:grid;gap:9px;padding:14px;border:1px solid #d29b3b;border-radius:13px;background:#fff8e8}.masterDecision h4{margin:0;color:#684a05}.masterDecision p{margin:0;color:#665b43}.masterDecisionActions{display:flex;gap:8px;flex-wrap:wrap}.masterDecisionActions button{flex:1;min-width:190px}.masterConfirmCheck{display:flex!important;grid-template-columns:auto 1fr!important;align-items:flex-start;gap:9px!important;font-weight:700!important}.masterConfirmCheck input{width:18px;height:18px;margin-top:2px}.releasedChangeNote{padding:12px;border-radius:11px;background:#fff1bf;color:#705300;font-weight:800}.publishedChangeNote{padding:12px;border-radius:11px;background:#e7f6eb;color:#205f31;font-weight:800}.changeMessage{padding:11px 13px;border-radius:11px;background:#edf3fa;color:#294b71}.changeMessage.error{background:#fde9e6;color:#842f25}.changeEmpty{padding:20px;border:1px dashed #cbd3dc;border-radius:13px;color:#677483;text-align:center}.changeQueueHead{display:flex;justify-content:space-between;gap:10px;align-items:center}.changeQueueHead button{white-space:nowrap}
.masterDecision{gap:11px}.masterDecisionActions{justify-content:flex-end}.masterDecisionActions button{flex:0 1 auto}.publicationButtonBar{display:grid;gap:7px;margin:4px -14px -14px;padding:14px;border-top:1px solid #d29b3b;border-radius:0 0 13px 13px;background:#fff}.publicationButtonBar .publicationButton{width:100%;min-height:56px;font-size:1.05rem;font-weight:950;box-shadow:0 10px 24px rgba(130,91,7,.18)}.publicationButtonBar small{color:#5e6772;line-height:1.4;text-align:center}
@media(max-width:880px){.changeGrid{grid-template-columns:1fr}.changePasswordRule{grid-template-columns:1fr}}
@media(max-width:560px){.changeHero,.changePanel{padding:15px}.changeRequestHead{display:grid}.decisionTrail{grid-template-columns:1fr}.masterDecisionActions button{min-width:100%}}
@media print{.changeForm,.masterDecision,.changeQueueHead button,[data-persistent-back]{display:none!important}.changeGrid{grid-template-columns:1fr}}
`

function updateById(rows,row){
  return rows.map(item=>item.id===row.id?row:item)
}

function decisionError(copy,code){
  if(code==='master_invalid')return copy.wrongMaster
  if(code==='master_locked'||code==='too_many_requests')return copy.locked
  if(code==='master_not_configured'||code==='change_control_unavailable')return copy.notConfigured
  return copy.decisionError
}

function statusStep(status){
  if(status==='released')return 2
  if(status==='published')return 3
  return status==='requested'?1:0
}

export function InternalChangeControlSurface({supabase,ownerId,language,onBack}){
  const copy=getInternalChangeCopy(language)
  const [draft,setDraft]=useState(emptyDraft)
  const [requests,setRequests]=useState([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState('')
  const [isError,setIsError]=useState(false)
  const [decisionBusy,setDecisionBusy]=useState('')
  const [masterValues,setMasterValues]=useState({})
  const [confirmChecks,setConfirmChecks]=useState({})

  const loadRequests=useCallback(async()=>{
    if(!ownerId)return
    setLoading(true)
    const {data,error}=await listInternalChangeRequests(supabase,ownerId)
    setLoading(false)
    if(error){setIsError(true);setMessage(copy.loadError);return}
    setRequests(data||[])
  },[supabase,ownerId,copy.loadError])

  useEffect(()=>{loadRequests()},[loadRequests])

  const ready=draft.requesterName.trim().length>=2&&draft.title.trim().length>=4&&draft.requestedChange.trim().length>=10&&draft.reason.trim().length>=4

  function setField(field,value){setDraft(current=>({...current,[field]:value}))}

  async function submitRequest(event){
    event.preventDefault()
    if(!ready){setIsError(true);setMessage(copy.required);return}
    setSaving(true);setMessage('');setIsError(false)
    const {data,error}=await createInternalChangeRequest(supabase,{ownerId,draft})
    setSaving(false)
    if(error){setIsError(true);setMessage(copy.saveError);return}
    setRequests(current=>[data,...current])
    setDraft(current=>({...emptyDraft,requesterName:current.requesterName}))
    setMessage(copy.submitted)
  }

  async function decide(requestId,action){
    const masterPassword=masterValues[requestId]||''
    if(!masterPassword){setIsError(true);setMessage(copy.wrongMaster);return}
    setDecisionBusy(`${requestId}:${action}`);setMessage('');setIsError(false)
    const {data,error}=await decideInternalChangeRequest(supabase,{requestId,action,masterPassword})
    setDecisionBusy('')
    setMasterValues(current=>({...current,[requestId]:''}))
    setConfirmChecks(current=>({...current,[requestId]:false}))
    if(error){setIsError(true);setMessage(decisionError(copy,error.code));return}
    setRequests(current=>updateById(current,data))
  }

  return <>
    <style>{surfaceStyles}</style>
    <div className="sectionHead"><button className="backBtn" data-persistent-back type="button" onClick={onBack}>{copy.back}</button></div>
    <section className="changeControl" aria-labelledby="change-control-title">
      <header className="changeHero">
        <span className="modeBadge">{copy.badge}</span>
        <h1 id="change-control-title">{copy.title}</h1>
        <p>{copy.lead}</p>
        <div className="changePasswordRule" aria-label={copy.passwordRule}>
          <div><b>{copy.accessPassword}</b><small>{copy.accessHelp}</small></div>
          <div className="masterRule"><b>{copy.masterPassword}</b><small>{copy.masterHelp}</small></div>
        </div>
        <strong className="changeNoEffect">{copy.noEffect}</strong>
      </header>

      {message&&<div className={isError?'changeMessage error':'changeMessage'} role="status">{message}</div>}

      <div className="changeGrid">
        <section className="changePanel" aria-labelledby="new-change-title">
          <h2 id="new-change-title">{copy.newRequest}</h2>
          <form className="changeForm" onSubmit={submitRequest}>
            <label>{copy.requester}<input value={draft.requesterName} onChange={event=>setField('requesterName',event.target.value)} maxLength={120} autoComplete="name" required/></label>
            <label>{copy.area}<select value={draft.productArea} onChange={event=>setField('productArea',event.target.value)}>{changeAreas.map(area=><option value={area} key={area}>{area}</option>)}</select></label>
            <label>{copy.requestTitle}<input value={draft.title} onChange={event=>setField('title',event.target.value)} minLength={4} maxLength={180} required/></label>
            <label>{copy.change}<textarea value={draft.requestedChange} onChange={event=>setField('requestedChange',event.target.value)} minLength={10} maxLength={5000} required/></label>
            <label>{copy.reason}<textarea value={draft.reason} onChange={event=>setField('reason',event.target.value)} minLength={4} maxLength={3000} required/></label>
            <label className="preparationField">{copy.notes}<textarea value={draft.preparationNotes} onChange={event=>setField('preparationNotes',event.target.value)} maxLength={5000}/></label>
            <label>{copy.priority}<select value={draft.priority} onChange={event=>setField('priority',event.target.value)}>{Object.entries(copy.priorities).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
            <div className="changeFormActions"><button className="primary" disabled={saving||!ready}>{saving?'…':copy.submit}</button></div>
          </form>
        </section>

        <section className="changePanel" aria-labelledby="change-queue-title">
          <div className="changeQueueHead"><div><h2 id="change-queue-title">{copy.queue}</h2></div><button type="button" className="secondary" onClick={loadRequests} disabled={loading}>{copy.reload}</button></div>
          {loading?<div className="changeEmpty">{copy.loading}</div>:!requests.length?<div className="changeEmpty">{copy.empty}</div>:<div className="changeRequestList">
            {requests.map(item=>{
              const step=statusStep(item.status)
              const busy=decisionBusy.startsWith(`${item.id}:`)
              return <article className="changeRequestCard" key={item.id}>
                <div className="changeRequestHead">
                  <div><div className="changeMeta"><span className={`changeStatus changeStatus--${item.status}`}>{copy.status[item.status]||item.status}</span><span className="changePriority">{copy.priorities[item.priority]||item.priority}</span></div><h3>{item.title}</h3></div>
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </div>
                <div className="changeRequestBody">
                  <p><strong>{copy.requester}:</strong> {item.requester_name}</p>
                  <p><strong>{copy.area}:</strong> {item.product_area}</p>
                  <p><strong>{copy.change}</strong><br/>{item.requested_change}</p>
                  <p><strong>{copy.reason}</strong><br/>{item.reason}</p>
                  {item.preparation_notes&&<details><summary>{copy.notes}</summary><p>{item.preparation_notes}</p></details>}
                </div>
                {item.status!=='rejected'&&<div className="decisionTrail" aria-label={copy.releaseState}><span className={step>1?'done':step===1?'current':''}>1 · {copy.status.requested}</span><span className={step>2?'done':step===2?'current':''}>2 · {copy.status.released}</span><span className={step===3?'done':''}>3 · {copy.status.published}</span></div>}
                {item.status==='requested'&&<section className="masterDecision">
                  <h4>{copy.releaseStep}</h4>
                  <p>{copy.releaseHelp}</p>
                  <input type="password" value={masterValues[item.id]||''} onChange={event=>setMasterValues(current=>({...current,[item.id]:event.target.value}))} placeholder={copy.masterPlaceholder} autoComplete="off" maxLength={256} aria-label={copy.masterPassword}/>
                  <label className="masterConfirmCheck"><input type="checkbox" checked={!!confirmChecks[item.id]} onChange={event=>setConfirmChecks(current=>({...current,[item.id]:event.target.checked}))}/><span>{copy.confirmCheck}</span></label>
                  <div className="masterDecisionActions"><button type="button" className="secondary" disabled={busy} onClick={()=>decide(item.id,'reject')}>{copy.reject}</button></div>
                  <div className="publicationButtonBar">
                    <button type="button" className="primary publicationButton" data-publication-button disabled={busy||!confirmChecks[item.id]||!(masterValues[item.id]||'').trim()} onClick={()=>decide(item.id,'release')}>{busy?'…':copy.release}</button>
                    <small>{copy.releaseButtonHelp}</small>
                  </div>
                </section>}
                {item.status==='released'&&<div className="releasedChangeNote">✓ {copy.releasedNote}</div>}
                {item.status==='published'&&<div className="publishedChangeNote">✓ {copy.publishedNote}</div>}
              </article>
            })}
          </div>}
        </section>
      </div>
    </section>
  </>
}
