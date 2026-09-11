'use client'

import { useState } from 'react'

const installPath='/installieren?neu=1'
const shareText='Hallo, hier können Sie AS Workspace direkt installieren:'
const shareButtonLabel='Installationslink weiterleiten'

export function InstallShareButton({compact=false}){
  const [status,setStatus]=useState('')

  async function shareInstallLink(){
    const url=new URL(installPath,window.location.origin).toString()
    const shareData={title:'AS Workspace installieren',text:shareText,url}

    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare(shareData))){
        await navigator.share(shareData)
        setStatus('Das Teilen-Menü wurde geöffnet.')
        return
      }
    }catch(error){
      if(error?.name==='AbortError')return
    }

    const content=`${shareText}\n\n${url}`
    try{
      await navigator.clipboard.writeText(content)
      setStatus('Der Installationslink wurde kopiert und kann jetzt eingefügt werden.')
      return
    }catch{}

    const helper=document.createElement('textarea')
    helper.value=content
    helper.setAttribute('readonly','')
    helper.style.position='fixed'
    helper.style.opacity='0'
    document.body.appendChild(helper)
    helper.select()
    const copied=document.execCommand('copy')
    helper.remove()
    setStatus(copied
      ?'Der Installationslink wurde kopiert und kann jetzt eingefügt werden.'
      :'Der Link konnte nicht automatisch kopiert werden. Bitte verwenden Sie den Installationslink aus der Adresszeile.'
    )
  }

  return <div className={`installShareBox${compact?' installShareBox--compact':''}`}>
    <button type="button" className={`installShareButton${compact?' installShareButton--compact':''}`} aria-label="AS Workspace-Installationslink weiterleiten" onClick={shareInstallLink}>{compact?<><span className="installShareButtonIcon" aria-hidden="true">📤</span><span className="installShareButtonLabel">{shareButtonLabel}</span></>:`📤 ${shareButtonLabel}`}</button>
    {status&&<p className="installShareStatus" role="status" aria-live="polite">✓ {status}</p>}
  </div>
}
