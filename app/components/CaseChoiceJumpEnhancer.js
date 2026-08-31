'use client'

import { useEffect } from 'react'

export function CaseChoiceJumpEnhancer(){
  useEffect(()=>{
    if(location.pathname!=='/') return

    const jumpToResult=()=>{
      const result=document.querySelector('#fallarten .caseResult')
      if(!result) return
      const sticky=document.querySelector('.publicTop')
      const offset=(sticky?.getBoundingClientRect().height||0)+12
      const top=Math.max(0,window.scrollY+result.getBoundingClientRect().top-offset)
      window.scrollTo({top,behavior:'auto'})
    }

    const onClick=(event)=>{
      const button=event.target.closest?.('.caseChooser .caseChoice')
      if(!button) return

      // Let React switch the selected case first. Then jump directly to the
      // result. A short fallback repeats the jump after any hash navigation
      // triggered by another control (for example the recommendation button).
      requestAnimationFrame(()=>requestAnimationFrame(jumpToResult))
      window.setTimeout(jumpToResult,80)
    }

    document.addEventListener('click',onClick,true)
    return ()=>document.removeEventListener('click',onClick,true)
  },[])

  return null
}
