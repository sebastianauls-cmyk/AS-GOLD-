'use client'

import { useEffect } from 'react'

const copy={
  de:{title:'AS Gold – Klarheit, wenn Vorgänge komplex werden.',lead:'Dokumente und E-Mails bündeln, Risiken und Fristen erkennen, Ampelanalysen und Antwortschreiben erstellen – mit klaren nächsten Schritten.'},
  en:{title:'AS Gold – clarity when matters get complex.',lead:'Bring documents and emails together, identify risks and deadlines, create traffic-light analyses and reply letters – with clear next steps.'},
  fr:{title:'AS Gold – de la clarté quand les dossiers deviennent complexes.',lead:'Regroupez documents et e-mails, repérez risques et délais, créez des analyses par feu et des réponses – avec des prochaines étapes claires.'},
  tr:{title:'AS Gold – işlemler karmaşıklaştığında netlik.',lead:'Belgeleri ve e-postaları birleştirin, riskleri ve süreleri görün, analizler ve cevap yazıları oluşturun – sonraki adımlar net olsun.'},
  pl:{title:'AS Gold – jasność, gdy sprawy stają się złożone.',lead:'Połącz dokumenty i e-maile, wykrywaj ryzyka i terminy, twórz analizy i pisma odpowiedzi – z jasnymi kolejnymi krokami.'},
  ru:{title:'AS Gold – ясность, когда дела становятся сложными.',lead:'Объединяйте документы и почту, выявляйте риски и сроки, создавайте анализы и ответные письма – с понятными следующими шагами.'},
  ar:{title:'AS Gold – وضوح عندما تصبح المعاملات معقدة.',lead:'اجمع المستندات والبريد، واكتشف المخاطر والمواعيد، وأنشئ التحليلات وخطابات الرد – مع خطوات تالية واضحة.'},
  fa:{title:'AS Gold – شفافیت وقتی پرونده‌ها پیچیده می‌شوند.',lead:'اسناد و ایمیل‌ها را یکجا کنید، ریسک‌ها و مهلت‌ها را ببینید، تحلیل و پاسخ‌نامه بسازید – با گام‌های بعدی روشن.'},
  ro:{title:'AS Gold – claritate când situațiile devin complexe.',lead:'Reuniți documente și e-mailuri, identificați riscuri și termene, creați evaluări tip semafor și scrisori de răspuns – cu pași următori clari.'},
  bg:{title:'AS Gold – яснота, когато случаите станат сложни.',lead:'Съберете документи и имейли, открийте рискове и срокове, създавайте светофарни оценки и писма за отговор – с ясни следващи стъпки.'}
}

export function HeroTitleStabilizer(){
  useEffect(()=>{
    if(location.pathname!=='/') return
    let scheduled=false
    const apply=()=>{
      scheduled=false
      const language=(document.documentElement.lang||'de').split('-')[0]
      const c=copy[language]||copy.de
      const title=document.querySelector('.hero h1')
      const lead=document.querySelector('.hero .lead')
      if(title&&title.textContent!==c.title) title.textContent=c.title
      if(lead&&lead.textContent!==c.lead) lead.textContent=c.lead
    }
    const schedule=()=>{
      if(scheduled) return
      scheduled=true
      requestAnimationFrame(apply)
    }
    apply()
    const observer=new MutationObserver(schedule)
    observer.observe(document.body,{subtree:true,childList:true})
    const langObserver=new MutationObserver(schedule)
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    const timer=setTimeout(apply,250)
    return()=>{observer.disconnect();langObserver.disconnect();clearTimeout(timer)}
  },[])
  return null
}
