'use client'

import { useEffect } from 'react'
import { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'

const labels={
  de:{title:'Fristen-Warnung',none:'Keine sichere Frist',basis:'Grundlage',consequence:'Mögliche Folge',action:'Jetzt tun',verify:'Fristgrundlage und Originaldokument prüfen.',immediate:'Sofort handeln',high:'Hohe Priorität',normal:'Vormerken',overdue:'Frist möglicherweise abgelaufen',uncertain:'Nicht sicher ableitbar'},
  en:{title:'Deadline warning',none:'No reliable deadline',basis:'Basis',consequence:'Possible consequence',action:'Do now',verify:'Verify the deadline basis and original document.',immediate:'Act now',high:'High priority',normal:'Schedule',overdue:'Deadline may have passed',uncertain:'Not reliably derivable'},
  fr:{title:'Alerte de délai',none:'Aucun délai fiable',basis:'Base',consequence:'Conséquence possible',action:'À faire maintenant',verify:'Vérifier la base du délai et le document original.',immediate:'Agir immédiatement',high:'Priorité élevée',normal:'À planifier',overdue:'Délai peut-être dépassé',uncertain:'Non déterminable avec certitude'},
  tr:{title:'Süre uyarısı',none:'Güvenilir süre yok',basis:'Dayanak',consequence:'Olası sonuç',action:'Şimdi yapılacak',verify:'Süre dayanağını ve orijinal belgeyi kontrol edin.',immediate:'Hemen harekete geçin',high:'Yüksek öncelik',normal:'Planlayın',overdue:'Süre geçmiş olabilir',uncertain:'Güvenilir şekilde çıkarılamıyor'},
  pl:{title:'Ostrzeżenie o terminie',none:'Brak pewnego terminu',basis:'Podstawa',consequence:'Możliwy skutek',action:'Co zrobić teraz',verify:'Sprawdź podstawę terminu i dokument źródłowy.',immediate:'Działaj natychmiast',high:'Wysoki priorytet',normal:'Zaplanuj',overdue:'Termin mógł upłynąć',uncertain:'Nie można ustalić pewnie'},
  ru:{title:'Предупреждение о сроке',none:'Надёжный срок не установлен',basis:'Основание',consequence:'Возможное последствие',action:'Что сделать сейчас',verify:'Проверьте основание срока и оригинал документа.',immediate:'Действовать немедленно',high:'Высокий приоритет',normal:'Запланировать',overdue:'Срок мог истечь',uncertain:'Нельзя определить надёжно'},
  ar:{title:'تنبيه الموعد النهائي',none:'لا يوجد موعد موثوق',basis:'الأساس',consequence:'النتيجة المحتملة',action:'ما يجب فعله الآن',verify:'تحقق من أساس الموعد والمستند الأصلي.',immediate:'تصرف فورًا',high:'أولوية عالية',normal:'جدولة',overdue:'قد يكون الموعد قد انقضى',uncertain:'لا يمكن تحديده بثقة'},
  fa:{title:'هشدار مهلت',none:'مهلت قابل اتکایی یافت نشد',basis:'مبنای تشخیص',consequence:'پیامد احتمالی',action:'اقدام فعلی',verify:'مبنای مهلت و سند اصلی را بررسی کنید.',immediate:'فوراً اقدام کنید',high:'اولویت بالا',normal:'برنامه‌ریزی کنید',overdue:'ممکن است مهلت گذشته باشد',uncertain:'با اطمینان قابل تشخیص نیست'},
  ro:{title:'Avertizare termen',none:'Niciun termen sigur',basis:'Bază',consequence:'Consecință posibilă',action:'Ce trebuie făcut acum',verify:'Verificați baza termenului și documentul original.',immediate:'Acționați imediat',high:'Prioritate ridicată',normal:'Planificați',overdue:'Termenul poate fi depășit',uncertain:'Nu poate fi stabilit sigur'},
  bg:{title:'Предупреждение за срок',none:'Няма сигурен срок',basis:'Основание',consequence:'Възможна последица',action:'Какво да направите сега',verify:'Проверете основанието за срока и оригиналния документ.',immediate:'Действайте веднага',high:'Висок приоритет',normal:'Планирайте',overdue:'Срокът може да е изтекъл',uncertain:'Не може да се установи надеждно'}
}

const languageByName={Deutsch:'de',English:'en','Français':'fr','Türkçe':'tr',Polski:'pl','Русский':'ru','العربية':'ar','فارسی':'fa','Română':'ro','Български':'bg'}

function detectLanguage(){
  const active=document.querySelector('.flagLanguageTrigger strong')?.textContent?.trim()
  return languageByName[active]||'de'
}

function readCaseDeadline(){
  const grid=document.querySelector('.caseCoreGrid')
  if(!grid) return null
  const cards=[...grid.querySelectorAll(':scope > article')]
  return cards[2]?.querySelector('p')?.textContent?.trim()||''
}

function buildCard(result,lang){
  const t=labels[lang]||labels.de
  const card=document.createElement('section')
  card.className='detailCard v38DeadlineWarningCard'
  card.setAttribute('data-v38-deadline-card','true')
  card.style.borderWidth='2px'
  card.style.marginTop='14px'
  const status=t[result.status]||t.uncertain
  const primary=result.primary
  const deadlineText=primary?new Date(`${primary.date}T12:00:00Z`).toLocaleDateString(lang==='de'?'de-DE':undefined,{timeZone:'UTC'}):t.none
  const basis=primary?.basis||t.none
  card.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V38</span><h3 style="margin:.55rem 0 .2rem">${t.title}</h3></div><strong>${status}</strong></div><p style="font-size:1.1rem;font-weight:800;margin:.65rem 0">${deadlineText}</p><p><b>${t.basis}:</b> ${basis}</p><p><b>${t.consequence}:</b> ${result.consequence}</p><p><b>${t.action}:</b> ${t.verify}</p>`
  return card
}

export function V38DeadlineCardEnhancer(){
  useEffect(()=>{
    let lastSignature=''
    function render(){
      const grid=document.querySelector('.caseCoreGrid')
      if(!grid){document.querySelector('[data-v38-deadline-card="true"]')?.remove();lastSignature='';return}
      const raw=readCaseDeadline()
      const lang=detectLanguage()
      const signature=`${raw}|${lang}`
      if(signature===lastSignature&&document.querySelector('[data-v38-deadline-card="true"]')) return
      document.querySelector('[data-v38-deadline-card="true"]')?.remove()
      const result=analyzeDeadlines({caseDeadline:raw&&raw!=='—'?raw:''})
      const card=buildCard(result,lang)
      grid.insertAdjacentElement('afterend',card)
      lastSignature=signature
    }
    render()
    const observer=new MutationObserver(()=>render())
    observer.observe(document.body,{subtree:true,childList:true,characterData:true})
    return ()=>observer.disconnect()
  },[])
  return null
}
