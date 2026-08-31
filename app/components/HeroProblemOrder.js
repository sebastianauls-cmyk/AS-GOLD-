'use client'

import { useEffect } from 'react'

export function HeroProblemOrder(){
  useEffect(()=>{
    if(location.pathname!=='/') return
    const place=()=>{
      const navigator=document.getElementById('asgold-problem-navigator-react')
      const heroMain=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      const actions=heroMain?.querySelector('.actions')
      if(navigator&&heroMain&&actions&&navigator.parentElement===heroMain&&navigator.nextElementSibling!==actions){
        heroMain.insertBefore(navigator,actions)
      }
    }
    place()
    const observer=new MutationObserver(place)
    observer.observe(document.body,{subtree:true,childList:true})
    const onHash=()=>place()
    window.addEventListener('hashchange',onHash)
    return ()=>{observer.disconnect();window.removeEventListener('hashchange',onHash)}
  },[])
  return null
}
