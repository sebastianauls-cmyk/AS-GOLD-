export function jumpToPublicCaseResult(){
  if(typeof window==='undefined') return
  const jump=()=>{
    const result=document.getElementById('asgold-public-case-result')
    if(!result) return
    const sticky=document.querySelector('.publicTop')
    const offset=(sticky?.getBoundingClientRect().height||0)+12
    const top=Math.max(0,window.scrollY+result.getBoundingClientRect().top-offset)
    window.scrollTo({top,behavior:'auto'})
  }
  requestAnimationFrame(()=>requestAnimationFrame(jump))
  window.setTimeout(jump,80)
}
