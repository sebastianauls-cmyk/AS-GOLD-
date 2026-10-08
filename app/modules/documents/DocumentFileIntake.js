'use client'

import { useEffect, useState } from 'react'
import { documentIntakeLanguages } from './documentIntakeLanguages.mjs'
import { intakeCopy } from './documentIntakeCopy.mjs'
import DocumentImageQualityCheck from './DocumentImageQualityCheck'
import { isImageDocument } from './documentUploadReadiness.mjs'
import { simpleCaseCopy } from '../cases/lib/simpleCaseCopy.mjs'
import DocumentPickerActions from './DocumentPickerActions'
import { documentPickerCopy } from './documentPickerCopy.mjs'

function formatBytes(value){if(value<1024*1024)return `${Math.max(1,Math.round(value/1024))} KB`;return `${(value/1024/1024).toFixed(1)} MB`}

const sampleFileName='ASH_Workspace_Gold_Synthetischer_Testfall_V29.pdf'
const sampleLabels={
  de:'Synthetische Musterdatei auswählen',en:'Select synthetic sample file',pl:'Wybierz syntetyczny plik przykładowy',tr:'Sentetik örnek dosyayı seç',ru:'Выбрать синтетический пример',ar:'اختيار ملف نموذجي اصطناعي',fa:'انتخاب فایل نمونه ساختگی',fr:'Choisir le fichier exemple synthétique',ro:'Selectați fișierul exemplu sintetic',bg:'Изберете синтетичния примерен файл',vi:'Chọn tệp mẫu tổng hợp'
}

function fileMetadata(file){return file?{name:file.name,size:file.size,type:file.type||'unknown'}:null}
function initialQuality(file){
  if(!file)return {state:'empty'}
  const extension=file.name.split('.').pop().toLowerCase()
  return isImageDocument({fileType:file.type,extension})?{state:'checking',kind:'image'}:{state:'good',kind:'file'}
}

export default function DocumentFileIntake({language='de',documentMode='upload',allowedUploadAccept,initialFile=null,onFileChange,onModeChange,disabled=false}){
  const c=intakeCopy(language)
  const picker=documentPickerCopy(language)
  const [file,setFile]=useState(initialFile)
  const [fileInfo,setFileInfo]=useState(()=>fileMetadata(initialFile))
  const [quality,setQuality]=useState(()=>initialQuality(initialFile))
  const [preview,setPreview]=useState(null)
  const [sourceLanguage,setSourceLanguage]=useState('')
  const [sampleSelected,setSampleSelected]=useState(false)

  useEffect(()=>{
    if(!file||!isImageDocument({fileType:file.type,extension:file.name.split('.').pop().toLowerCase()})){setPreview(null);return}
    const url=URL.createObjectURL(file)
    setPreview(url)
    return()=>URL.revokeObjectURL(url)
  },[file])

  function inspectFile(selected){
    setFile(selected)
    if(!selected){setFileInfo(null);setQuality({state:'empty'});return}
    setFileInfo(fileMetadata(selected))
    setQuality(initialQuality(selected))
  }

  function inspect(selected,mode){
    setSampleSelected(false)
    inspectFile(selected)
    onFileChange?.(selected)
    onModeChange?.(mode)
  }

  function selectSample(){
    setSampleSelected(true)
    inspectFile(new File([],sampleFileName,{type:'application/pdf'}))
    setFileInfo({name:sampleFileName,size:45470,type:'application/pdf'})
    onFileChange?.(null)
    onModeChange?.('upload')
  }

  function onQualityResult(result){
    if(!result)return
    if(result.status==='good')setQuality({state:'good',kind:'image',...result})
    else if(result.status==='warn')setQuality({state:'weak',kind:'image',...result})
    else if(result.status==='bad')setQuality({state:'bad',kind:'image',...result})
  }

  const serialized=JSON.stringify({...(fileInfo||{}),...quality,checked_at:fileInfo?new Date().toISOString():null})
  return <section className="detailCard documentFileIntake">
    <DocumentPickerActions language={language} allowedUploadAccept={allowedUploadAccept} onSelect={inspect} disabled={disabled}/>
    <div className="documentSelection" role="status">{fileInfo?<><strong>{picker.selected}</strong><span>{fileInfo.name}</span></>:<p>{picker.empty}</p>}</div>
    {preview&&<img className="documentPhotoPreview" src={preview} alt={picker.preview}/>}
    <details><summary>{simpleCaseCopy(language).options}</summary><label>{c.sourceLanguage}<select value={sourceLanguage} onChange={e=>setSourceLanguage(e.target.value)}><option value="">{c.auto}</option>{documentIntakeLanguages.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    {fileInfo&&<div className="analysisFacts"><b>{c.quality}</b><div><span><small>{c.size}</small><strong>{formatBytes(fileInfo.size)}</strong></span><span><small>{c.type}</small><strong>{fileInfo.type}</strong></span></div></div>}
    {documentMode==='upload'?<button type="button" className="secondary" disabled={disabled} onClick={selectSample}>{sampleLabels[language]||sampleLabels.de}</button>:null}
    </details>
    <DocumentImageQualityCheck file={file} language={language} onResult={onQualityResult}/>
    <input type="hidden" name="sample_document" value={sampleSelected?'synthetic-v29':''}/>
    <input type="hidden" name="source_language" value={sourceLanguage}/>
    <input type="hidden" name="intake_quality" value={serialized}/>
  </section>
}
