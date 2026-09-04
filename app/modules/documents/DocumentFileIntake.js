'use client'

import { useState } from 'react'
import { documentIntakeLanguages } from './documentIntakeLanguages.mjs'

const copy={
  de:{file:'Dokument',sourceLanguage:'Dokumentsprache',auto:'Automatisch bei Analyse erkennen',quality:'Vorprüfung',ready:'Datei technisch verwendbar',imageGood:'Bildauflösung ausreichend',imageWeak:'Bildauflösung niedrig – besser neu fotografieren',size:'Dateigröße',type:'Format'},
  en:{file:'Document',sourceLanguage:'Document language',auto:'Detect automatically during analysis',quality:'Pre-check',ready:'File technically usable',imageGood:'Image resolution looks sufficient',imageWeak:'Low image resolution – retake the photo if possible',size:'File size',type:'Format'}
}

function formatBytes(value){if(value<1024*1024)return `${Math.max(1,Math.round(value/1024))} KB`;return `${(value/1024/1024).toFixed(1)} MB`}

export default function DocumentFileIntake({language='de',documentMode='upload',allowedUploadAccept}){
  const c=copy[language]||copy.en
  const [fileInfo,setFileInfo]=useState(null)
  const [quality,setQuality]=useState({state:'empty'})
  const [sourceLanguage,setSourceLanguage]=useState('')

  function inspect(event){
    const file=event.target.files?.[0]
    if(!file){setFileInfo(null);setQuality({state:'empty'});return}
    const info={name:file.name,size:file.size,type:file.type||'unknown'}
    setFileInfo(info)
    if(file.type.startsWith('image/')){
      const url=URL.createObjectURL(file)
      const image=new Image()
      image.onload=()=>{
        const longEdge=Math.max(image.naturalWidth,image.naturalHeight)
        const shortEdge=Math.min(image.naturalWidth,image.naturalHeight)
        const good=longEdge>=1200&&shortEdge>=800
        setQuality({state:good?'good':'weak',kind:'image',width:image.naturalWidth,height:image.naturalHeight})
        URL.revokeObjectURL(url)
      }
      image.onerror=()=>{setQuality({state:'weak',kind:'image'});URL.revokeObjectURL(url)}
      image.src=url
    }else setQuality({state:'good',kind:'file'})
  }

  const serialized=JSON.stringify({...(fileInfo||{}),...quality,checked_at:fileInfo?new Date().toISOString():null})
  return <section className="detailCard">
    <label htmlFor="document-file">{c.file}<input key={documentMode} id="document-file" name="file" type="file" accept={documentMode==='scan'?'image/*':allowedUploadAccept} capture={documentMode==='scan'?'environment':undefined} onChange={inspect} required/></label>
    <label>{c.sourceLanguage}<select value={sourceLanguage} onChange={e=>setSourceLanguage(e.target.value)}><option value="">{c.auto}</option>{documentIntakeLanguages.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    {fileInfo&&<div className="analysisFacts"><b>{c.quality}</b><div><span><small>{c.size}</small><strong>{formatBytes(fileInfo.size)}</strong></span><span><small>{c.type}</small><strong>{fileInfo.type}</strong></span><span><small>Status</small><strong>{quality.state==='weak'?'🟡':'🟢'} {quality.state==='weak'?c.imageWeak:(quality.kind==='image'?c.imageGood:c.ready)}</strong></span></div></div>}
    <input type="hidden" name="source_language" value={sourceLanguage}/>
    <input type="hidden" name="intake_quality" value={serialized}/>
  </section>
}
