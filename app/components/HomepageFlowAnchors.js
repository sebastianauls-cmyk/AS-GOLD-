'use client'

import { useEffect } from 'react'

export function HomepageFlowAnchors(){
  useEffect(()=>{
    if(location.pathname!=='/') return
    let observer
    const mount=()=>{
      const heroMain=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      const actions=heroMain?.querySelector('.actions')
      const capabilities=heroMain?.querySelector('.heroCapabilities')
      if(!heroMain||!actions) return false
      let flow=document.getElementById('asgold-homepage-flow')
      if(!flow){
        flow=document.createElement('div')
        flow.id='asgold-homepage-flow'
        flow.className='homepageFlow'
        for(const id of ['asgold-product-intro-compact-slot','asgold-v37-first-action-slot','asgold-problem-slot']){
          const slot=document.createElement('div')
          slot.id=id
          flow.appendChild(slot)
        }
        heroMain.insertBefore(flow,capabilities||actions)
      }
      return true
    }
    if(!mount()){
      observer=new MutationObserver(()=>{if(mount())observer?.disconnect()})
      observer.observe(document.body,{subtree:true,childList:true})
    }
    return()=>observer?.disconnect()
  },[])
  return null
}
