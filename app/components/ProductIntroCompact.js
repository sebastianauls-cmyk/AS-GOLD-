'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const copy={
  de:{title:'Was kann AS Gold?',lead:'AS Gold macht komplexe Vorgänge verständlich und bearbeitbar.',items:['Dokumente, E-Mails und Informationen zusammenführen','Fristen, Lücken, Widersprüche und Risiken erkennen','Ampelanalysen, nächste Schritte und Antwortschreiben erstellen','Ergebnisse exportieren und E-Mail, Cloud oder eigene Speicherorte anbinden']},
  en:{title:'What can AS Gold do?',lead:'AS Gold makes complex matters clear and workable.',items:['Bring documents, emails and information together','Identify deadlines, gaps, contradictions and risks','Create traffic-light analyses, next steps and reply letters','Export results and connect email, cloud or your own storage']},
  fr:{title:'Que peut faire AS Gold ?',lead:'AS Gold rend les dossiers complexes clairs et exploitables.',items:['Regrouper documents, e-mails et informations','Repérer délais, lacunes, contradictions et risques','Créer des analyses, prochaines étapes et lettres de réponse','Exporter les résultats et connecter e-mail, cloud ou stockage personnel']},
  tr:{title:'AS Gold ne yapabilir?',lead:'AS Gold karmaşık işlemleri açık ve yönetilebilir hale getirir.',items:['Belgeleri, e-postaları ve bilgileri bir araya getirir','Süreleri, eksikleri, çelişkileri ve riskleri belirler','Analizler, sonraki adımlar ve cevap yazıları oluşturur','Sonuçları dışa aktarır; e-posta, bulut veya kendi depolamanızı bağlar']},
  pl:{title:'Co potrafi AS Gold?',lead:'AS Gold upraszcza złożone sprawy i ułatwia ich prowadzenie.',items:['Łączy dokumenty, e-maile i informacje','Wykrywa terminy, braki, sprzeczności i ryzyka','Tworzy analizy, kolejne kroki i pisma odpowiedzi','Eksportuje wyniki i łączy pocztę, chmurę lub własny zapis']},
  ru:{title:'Что умеет AS Gold?',lead:'AS Gold делает сложные дела понятными и управляемыми.',items:['Объединяет документы, почту и информацию','Выявляет сроки, пробелы, противоречия и риски','Создаёт анализы, следующие шаги и ответные письма','Экспортирует результаты и подключает почту, облако или ваше хранилище']},
  ar:{title:'ماذا يستطيع AS Gold أن يفعل؟',lead:'يجعل AS Gold المعاملات المعقدة واضحة وقابلة للمعالجة.',items:['جمع المستندات والبريد والمعلومات','اكتشاف المواعيد والنواقص والتناقضات والمخاطر','إنشاء التحليلات والخطوات التالية وخطابات الرد','تصدير النتائج وربط البريد أو السحابة أو مساحة التخزين الخاصة']},
  fa:{title:'AS Gold چه کارهایی می‌تواند انجام دهد؟',lead:'AS Gold موضوعات پیچیده را روشن و قابل مدیریت می‌کند.',items:['یکپارچه‌سازی اسناد، ایمیل‌ها و اطلاعات','شناسایی مهلت‌ها، کمبودها، تناقض‌ها و ریسک‌ها','ایجاد تحلیل، گام‌های بعدی و پاسخ‌نامه','خروجی گرفتن و اتصال ایمیل، فضای ابری یا محل ذخیره شخصی']}
}

export function ProductIntroCompact(){
  const [host,setHost]=useState(null)
  const [language,setLanguage]=useState('de')
  useEffect(()=>{
    if(location.pathname!=='/') return
    let bodyObserver
    const mount=()=>{
      const heroMain=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
      const problemSlot=document.getElementById('asgold-problem-slot')
      const actions=heroMain?.querySelector('.actions')
      if(!heroMain||(!problemSlot&&!actions)) return false
      let slot=document.getElementById('asgold-product-intro-compact-slot')
      if(!slot){
        slot=document.createElement('div')
        slot.id='asgold-product-intro-compact-slot'
        heroMain.insertBefore(slot,problemSlot||actions)
      }
      setHost(slot)
      return true
    }
    if(!mount()){
      bodyObserver=new MutationObserver(()=>{if(mount())bodyObserver?.disconnect()})
      bodyObserver.observe(document.body,{subtree:true,childList:true})
    }
    const sync=()=>setLanguage((document.documentElement.lang||'de').split('-')[0])
    sync()
    const langObserver=new MutationObserver(sync)
    langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    return()=>{bodyObserver?.disconnect();langObserver.disconnect()}
  },[])
  if(!host)return null
  const c=copy[language]||copy.de
  const rtl=language==='ar'||language==='fa'
  return createPortal(<section dir={rtl?'rtl':'ltr'} style={{margin:'18px 0 8px',padding:16,border:'1px solid #dccb9f',borderRadius:18,background:'linear-gradient(135deg,#fffaf0,#fff)',boxShadow:'0 8px 24px rgba(72,55,18,.05)'}}>
    <b style={{display:'block',fontSize:'1.3rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'6px 0 10px',color:'#596472',lineHeight:1.4}}>{c.lead}</p>
    <div style={{display:'grid',gap:7}}>{c.items.map(item=><div key={item} style={{padding:'8px 10px',borderRadius:10,background:'#fff',border:'1px solid #ece4cf',color:'#4f5966',lineHeight:1.3}}>✓ {item}</div>)}</div>
  </section>,host)
}
