'use client'

import { useEffect } from 'react'

export function CaseChoiceJumpEnhancer(){
  useEffect(()=>{
    if(location.pathname!=='/') return

    const onClick=(event)=>{
      const button=event.target.closest?.('.caseChooser .caseChoice')
      if(!button) return

      // React first updates the selected case; then move the viewport to the
      // corresponding result card. Using two animation frames keeps this
      // reliable on mobile browsers as well.
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          const result=document.querySelector('#fallarten .caseResult')
          if(!result) return
          result.scrollIntoView({behavior:'smooth',block:'start'})
        })
      })
    }

    document.addEventListener('click',onClick,true)
    return ()=>document.removeEventListener('click',onClick,true)
  },[])

  return null
}
