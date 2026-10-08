'use client'

import { useRef } from 'react'
import { allowedUploadAccept as defaultAccept } from './uploadConfig'
import { documentPickerCopy } from './documentPickerCopy.mjs'

// Keep both inputs mounted. Open the native chooser directly in the user's
// click, before any navigation, so mobile browsers retain user activation.
export default function DocumentPickerActions({language='de',allowedUploadAccept=defaultAccept,onSelect,disabled=false}){
  const camera=useRef(null),files=useRef(null)
  const c=documentPickerCopy(language)
  function select(event,mode){
    const file=event.currentTarget.files?.[0]
    if(!file)return // Cancelling must keep the previous file and its context.
    event.currentTarget.value=''
    onSelect(file,mode)
  }
  return <div className="documentPickerActions">
    <input className="documentPickerInput" hidden ref={camera} type="file" accept="image/*" capture="environment" aria-label={c.photo} disabled={disabled} onChange={event=>select(event,'scan')}/>
    <input className="documentPickerInput" hidden ref={files} type="file" accept={allowedUploadAccept} aria-label={c.file} disabled={disabled} onChange={event=>select(event,'upload')}/>
    <button type="button" className="primary" disabled={disabled} onClick={()=>camera.current?.click()}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h4l2-3h4l2 3h4v15H4z"/><circle cx="12" cy="13" r="4"/></svg>{c.photo}</button>
    <button type="button" className="secondary" disabled={disabled} onClick={()=>files.current?.click()}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h9l5 5v13H5zM14 3v6h5M12 18v-6m-3 3 3-3 3 3"/></svg>{c.file}</button>
  </div>
}
