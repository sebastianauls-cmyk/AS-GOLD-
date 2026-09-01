'use client'

import { useEffect } from 'react'

export function V38IntegrationAvailabilityGuard(){
  useEffect(()=>{
    if(location.pathname!=='/integrationen') return
    let active=true
    fetch('/api/integrations/status',{cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(status=>{
        if(!active||!status?.configured) return
        const rules=[
          {selector:'a[href^="/api/integrations/google/start"]',enabled:!!status.configured.google,label:'Google-Verbindung noch nicht freigeschaltet'},
          {selector:'a[href^="/api/integrations/microsoft/start"]',enabled:!!status.configured.microsoft,label:'Microsoft-Verbindung noch nicht freigeschaltet'},
        ]
        for(const rule of rules){
          document.querySelectorAll(rule.selector).forEach(link=>{
            if(rule.enabled){
              link.removeAttribute('aria-disabled')
              link.removeAttribute('data-v38-integration-unavailable')
              return
            }
            link.setAttribute('aria-disabled','true')
            link.setAttribute('data-v38-integration-unavailable','true')
            link.setAttribute('title',rule.label)
            link.style.opacity='.62'
            link.style.cursor='not-allowed'
            link.addEventListener('click',preventUnavailable)
            const card=link.closest('article')
            const statusLine=card?.querySelector('span')
            if(statusLine) statusLine.textContent=rule.label
            link.textContent=rule.label
          })
        }
      })
      .catch(()=>{})
    return()=>{active=false}
  },[])
  return null
}

function preventUnavailable(event){
  event.preventDefault()
  event.stopPropagation()
}
