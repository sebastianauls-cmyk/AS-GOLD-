'use client'

import { useEffect, useState } from 'react'
import { APP_VERSION } from '../release/appRelease.mjs'
import DocumentFileIntake from './DocumentFileIntake'
import VoiceContextInput from './VoiceContextInput'

function useActiveInterfaceLanguage(fallback='de'){
  const [current,setCurrent]=useState(fallback)
  useEffect(()=>{
    const sync=()=>setCurrent(document.documentElement.lang||fallback)
    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    return ()=>observer.disconnect()
  },[fallback])
  return current
}

export function DocumentsSurface({a,access,documents,core,cases,documentMode,setDocumentMode,uploadCaseId,uploadDocument,uploading,allowedUploadAccept,setSelectedDocument,onBack,language='de'}){
  const interfaceLanguage=useActiveInterfaceLanguage(language)
  return <>
    <div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.sections.documents}</h2></div>
    {access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',documents.length).replace('{limit}',access.permissions.document_limit)}</p>}
    <form className="actionCard coreForm" onSubmit={uploadDocument}>
      <div className="formIntro"><span className="modeBadge">{APP_VERSION} · Dokument-Eingang</span><h3>{core.documentUpload}</h3><div className="modeSwitch"><button type="button" className={documentMode==='upload'?'active':''} onClick={()=>setDocumentMode('upload')}>{core.uploadMode}</button><button type="button" className={documentMode==='scan'?'active':''} onClick={()=>setDocumentMode('scan')}>{core.scanMode}</button></div><p>{documentMode==='scan'?core.scanHelp:core.uploadHelp}</p></div>
      <DocumentFileIntake language={interfaceLanguage} documentMode={documentMode} allowedUploadAccept={allowedUploadAccept}/>
      <VoiceContextInput language={interfaceLanguage}/>
      <label htmlFor="document-case">{core.selectCase}<select id="document-case" name="case_id" defaultValue={uploadCaseId||''}><option value="">{core.withoutCase}</option>{cases.map(item=><option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <label htmlFor="document-type">{core.documentType}<input id="document-type" name="document_type"/></label>
      <label htmlFor="document-date">{core.documentDate}<input id="document-date" name="document_date" type="date"/></label>
      <input type="hidden" name="data_classification" value="personal"/>
      <input type="hidden" name="source" value={documentMode}/>
      <button className="primary full" disabled={uploading}>{uploading?core.uploading:core.upload}</button>
    </form>
    {documents.length?<div className="itemList">{documents.map(item=><button className="itemRow buttonRow" type="button" onClick={()=>setSelectedDocument(item)} key={item.id}><div><b>{item.title}</b><p>{item.document_type||core.documentType}{item.document_date?` · ${item.document_date}`:''}{item.source_language?` · ${item.source_language.toUpperCase()}`:''}{item.voice_context?' · 🎤':''}</p></div><span className="chev">›</span></button>)}</div>:null}
  </>
}
