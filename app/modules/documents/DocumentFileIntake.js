'use client'

import { useRef, useState } from 'react'
import { documentIntakeLanguages } from './documentIntakeLanguages.mjs'
import { intakeCopy } from './documentIntakeCopy.mjs'
import DocumentImageQualityCheck from './DocumentImageQualityCheck'
import { isImageDocument } from './documentUploadReadiness.mjs'

function formatBytes(value){if(value<1024*1024)return `${Math.max(1,Math.round(value/1024))} KB`;return `${(value/1024/1024).toFixed(1)} MB`}

const sampleFileName='AS_Gold_Synthetischer_Testfall_V29.pdf'
const sampleLabels={
  de:'Synthetische Musterdatei auswählen',en:'Select synthetic sample file',pl:'Wybierz syntetyczny plik przykładowy',tr:'Sentetik örnek dosyayı seç',ru:'Выбрать синтетический пример',ar:'اختيار ملف نموذجي اصطناعي',fa:'انتخاب فایل نمونه ساختگی',fr:'Choisir le fichier exemple synthétique',ro:'Selectați fișierul exemplu sintetic',bg:'Изберете синтетичния примерен файл',vi:'Chọn tệp mẫu tổng hợp'
}

export default function DocumentFileIntake({language='de',documentMode='upload',allowedUploadAccept}){
  const c=intakeCopy(language)
  const [file,setFile]=useState(null)
  const [fileInfo,setFileInfo]=useState(null)
  const [quality,setQuality]=useState({state:'empty'})
  const [sourceLanguage,setSourceLanguage]=useState('')
  const [sampleSelected,setSampleSelected]=useState(false)
  const inputRef=useRef(null)

  function inspectFile(selected){
    setFile(selected)
    if(!selected){setFileInfo(null);setQuality({state:'empty'});return}
    setFileInfo({name:selected.name,size:selected.size,type:selected.type||'unknown'})
    const extension=selected.name.includes('.')?selected.name.split('.').pop().toLowerCase():''
    if(isImageDocument({fileType:selected.type,extension,source:documentMode}))setQuality({state:'checking',kind:'image'})
    else setQuality({state:'good',kind:'file'})
  }

  function inspect(event){
    setSampleSelected(false)
    inspectFile(event.target.files?.[0]||null)
  }

  function selectSample(){
    if(inputRef.current)inputRef.current.value=''
    setSampleSelected(true)
    inspectFile(new File([],sampleFileName,{type:'application/pdf'}))
    setFileInfo({name:sampleFileName,size:45470,type:'application/pdf'})
  }

  function onQualityResult(result){
    if(!result)return
    if(result.status==='good')setQuality({state:'good',kind:'image',...result})
    else if(result.status==='warn')setQuality({state:'weak',kind:'image',...result})
    else if(result.status==='bad')setQuality({state:'bad',kind:'image',...result})
  }

  const serialized=JSON.stringify({...(fileInfo||{}),...quality,checked_at:fileInfo?new Date().toISOString():null})
  return <section className="detailCard">
    <label htmlFor="document-file">{c.file}<input ref={inputRef} key={documentMode} id="document-file" name="file" type="file" accept={documentMode==='scan'?'image/*':allowedUploadAccept} capture={documentMode==='scan'?'environment':undefined} onChange={inspect} required={!sampleSelected}/></label>
    {documentMode==='upload'?<button type="button" className="secondary" onClick={selectSample}>{sampleLabels[language]||sampleLabels.de}</button>:null}
    <label>{c.sourceLanguage}<select value={sourceLanguage} onChange={e=>setSourceLanguage(e.target.value)}><option value="">{c.auto}</option>{documentIntakeLanguages.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    {fileInfo&&<div className="analysisFacts"><b>{c.quality}</b><div><span><small>{c.size}</small><strong>{formatBytes(fileInfo.size)}</strong></span><span><small>{c.type}</small><strong>{fileInfo.type}</strong></span></div></div>}
    <DocumentImageQualityCheck file={file} language={language} onResult={onQualityResult}/>
    <input type="hidden" name="sample_document" value={sampleSelected?'synthetic-v29':''}/>
    <input type="hidden" name="source_language" value={sourceLanguage}/>
    <input type="hidden" name="intake_quality" value={serialized}/>
  </section>
}
