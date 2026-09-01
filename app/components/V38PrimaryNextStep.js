'use client'

import { useEffect } from 'react'
import { prioritizeNextStep } from '../lib/v38NextStepEngine.mjs'

const labels={
  de:{title:'Ihr nächster Schritt',why:'Warum jetzt?',when:'Wann?',action:'Jetzt tun'},
  en:{title:'Your next step',why:'Why now?',when:'When?',action:'Do now'},
  fr:{title:'Votre prochaine étape',why:'Pourquoi maintenant ?',when:'Quand ?',action:'À faire maintenant'},
  tr:{title:'Sonraki adımınız',why:'Neden şimdi?',when:'Ne zaman?',action:'Şimdi yapılacak'},
  pl:{title:'Twój następny krok',why:'Dlaczego teraz?',when:'Kiedy?',action:'Co zrobić teraz'},
  ru:{title:'Ваш следующий шаг',why:'Почему сейчас?',when:'Когда?',action:'Что сделать сейчас'},
  ar:{title:'خطوتك التالية',why:'لماذا الآن؟',when:'متى؟',action:'ما يجب فعله الآن'},
  fa:{title:'گام بعدی شما',why:'چرا اکنون؟',when:'چه زمانی؟',action:'اقدام فعلی'},
  ro:{title:'Următorul pas',why:'De ce acum?',when:'Când?',action:'Ce trebuie făcut acum'},
  bg:{title:'Следващата ви стъпка',why:'Защо сега?',when:'Кога?',action:'Какво да направите сега'},
  vi:{title:'Bước tiếp theo của bạn',why:'Tại sao lúc này?',when:'Khi nào?',action:'Việc cần làm ngay'}
}
const languageByName={Deutsch:'de',English:'en','Français':'fr','Türkçe':'tr',Polski:'pl','Русский':'ru','العربية':'ar','فارسی':'fa','Română':'ro','Български':'bg'}
function language(){return languageByName[document.querySelector('.flagLanguageTrigger strong')?.textContent?.trim()]||'de'}
function text(el){return el?.textContent?.trim()||''}

function deadlineData(lang){
  const card=document.querySelector('[data-v38-deadline-card="true"]')
  if(!card) return {status:'uncertain',action:''}
  const strong=text(card.querySelector('.detailCardHead strong')).toLowerCase()
  const t=labels[lang]||labels.de
  const actionRow=[...card.querySelectorAll('p')].find(p=>text(p.querySelector('b')).includes(t.action))
  const action=text(actionRow).replace(/^.*?:\s*/,'')
  if(/sofort|act now|immédiatement|hemen|natychmiast|немедленно|فور|imediat|веднага/i.test(strong)) return {status:'immediate',action}
  if(/abgelaufen|passed|dépassé|geçmiş|upł|ист|انقض|گذشته|depășit|изтек/i.test(strong)) return {status:'overdue',action}
  if(/hohe|high|élevée|yüksek|wysoki|высок|عالية|بالا|ridicată|висок/i.test(strong)) return {status:'high',action}
  return {status:'normal',action}
}

function collectAssessments(){
  return [...document.querySelectorAll('.assessment')].map(a=>{
    const small=text(a.querySelector('small'))
    const next=small.includes(':')?small.slice(small.indexOf(':')+1).trim():small
    return {traffic:a.classList.contains('red')?'red':a.classList.contains('yellow')?'yellow':'green',next:next&&next!=='—'?next:''}
  })
}

function choose(lang){
  const readiness=document.querySelector('.readinessCard')
  const deadline=deadlineData(lang)
  const grid=document.querySelector('.caseCoreGrid')
  const caseNext=text(grid?.querySelectorAll(':scope > article')[3]?.querySelector('p'))
  return prioritizeNextStep({
    language:lang,
    missing:Boolean(readiness?.classList.contains('attentionBox')),
    deadlineStatus:deadline.status,
    deadlineAction:deadline.action,
    assessments:collectAssessments(),
    caseNext
  })
}
function card(result,lang){
  const t=labels[lang]||labels.de
  const el=document.createElement('section')
  el.className='detailCard v38PrimaryNextStep'
  el.dataset.v38PrimaryNextStep='true'
  el.style.border='2px solid #b89242'
  el.style.background='linear-gradient(135deg,#fffaf0,#fff)'
  el.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V38</span><h3 style="margin:.55rem 0 .2rem">${t.title}</h3></div><strong>1</strong></div><p style="font-size:1.16rem;font-weight:900;line-height:1.45;margin:.8rem 0">${result.action}</p><p><b>${t.when}</b> ${result.when}</p><p><b>${t.why}</b> ${result.why}</p>`
  return el
}
export function V38PrimaryNextStep(){
  useEffect(()=>{
    let signature=''
    function render(){
      const grid=document.querySelector('.caseCoreGrid')
      if(!grid){document.querySelector('[data-v38-primary-next-step="true"]')?.remove();signature='';return}
      const lang=language();const result=choose(lang);const nextSig=`${lang}|${result.kind}|${result.action}|${result.when}`
      if(nextSig===signature&&document.querySelector('[data-v38-primary-next-step="true"]')) return
      document.querySelector('[data-v38-primary-next-step="true"]')?.remove()
      const deadline=document.querySelector('[data-v38-deadline-card="true"]')
      const anchor=deadline||grid
      anchor.insertAdjacentElement('afterend',card(result,lang));signature=nextSig
    }
    render();const observer=new MutationObserver(render);observer.observe(document.body,{subtree:true,childList:true,characterData:true});return()=>observer.disconnect()
  },[])
  return null
}
