'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const intro={
  de:{title:'Was kann AS Gold?',lead:'AS Gold macht aus komplexen Vorgängen einen klaren, bearbeitbaren Fall.',items:['Dokumente, E-Mails und Informationen zusammenführen','Fristen, Lücken, Widersprüche und Risiken erkennen','Ampelanalysen und nächste Schritte erstellen','Antwortschreiben und weitere Entwürfe vorbereiten','Ergebnisse als PDF, Word, Excel, PowerPoint und weitere Formate ausgeben','E-Mail-Konten, Cloud-Speicher und eigene Ablageorte auf PC oder Gerät anbinden'],note:'Sie behalten die Kontrolle: gespeichert, versendet oder freigegeben wird nur nach Ihrer Entscheidung.'},
  en:{title:'What can AS Gold do?',lead:'AS Gold turns complex matters into a clear, workable case.',items:['Bring documents, emails and information together','Identify deadlines, gaps, contradictions and risks','Create traffic-light analyses and next steps','Prepare reply letters and other drafts','Export results as PDF, Word, Excel, PowerPoint and other formats','Connect email accounts, cloud storage and your own device storage'],note:'You stay in control: nothing is saved, sent or approved without your decision.'},
  fr:{title:'Que peut faire AS Gold ?',lead:'AS Gold transforme les dossiers complexes en cas clairs et exploitables.',items:['Regrouper documents, e-mails et informations','Repérer délais, lacunes, contradictions et risques','Créer des analyses par feu et les prochaines étapes','Préparer des lettres de réponse et d’autres projets','Exporter en PDF, Word, Excel, PowerPoint et autres formats','Connecter e-mail, cloud et emplacements de stockage personnels'],note:'Vous gardez le contrôle : rien n’est enregistré, envoyé ou validé sans votre décision.'},
  tr:{title:'AS Gold ne yapabilir?',lead:'AS Gold karmaşık işlemleri açık ve işlenebilir bir dosyaya dönüştürür.',items:['Belgeleri, e-postaları ve bilgileri bir araya getirir','Süreleri, eksikleri, çelişkileri ve riskleri belirler','Trafik ışığı analizleri ve sonraki adımları oluşturur','Cevap yazıları ve diğer taslakları hazırlar','PDF, Word, Excel, PowerPoint ve diğer formatlarda çıktı verir','E-posta, bulut ve cihazınızdaki kayıt yerlerini bağlar'],note:'Kontrol sizdedir: sizin kararınız olmadan hiçbir şey kaydedilmez, gönderilmez veya onaylanmaz.'},
  pl:{title:'Co potrafi AS Gold?',lead:'AS Gold zamienia złożone sprawy w jasne, możliwe do prowadzenia procesy.',items:['Łączy dokumenty, e-maile i informacje','Wykrywa terminy, braki, sprzeczności i ryzyka','Tworzy analizy sygnalizacyjne i kolejne kroki','Przygotowuje pisma odpowiedzi i inne projekty','Eksportuje do PDF, Word, Excel, PowerPoint i innych formatów','Łączy pocztę, chmurę i własne miejsca zapisu'],note:'Zachowujesz kontrolę: nic nie jest zapisywane, wysyłane ani zatwierdzane bez Twojej decyzji.'},
  ru:{title:'Что умеет AS Gold?',lead:'AS Gold превращает сложные дела в понятный и управляемый процесс.',items:['Объединяет документы, почту и информацию','Выявляет сроки, пробелы, противоречия и риски','Создаёт светофорные анализы и следующие шаги','Готовит ответные письма и другие проекты','Экспортирует в PDF, Word, Excel, PowerPoint и другие форматы','Подключает почту, облако и собственные места хранения'],note:'Контроль остаётся у вас: без вашего решения ничего не сохраняется, не отправляется и не утверждается.'},
  ar:{title:'ماذا يستطيع AS Gold أن يفعل؟',lead:'يحوّل AS Gold المعاملات المعقدة إلى حالة واضحة وقابلة للمعالجة.',items:['جمع المستندات والبريد والمعلومات','اكتشاف المواعيد والنواقص والتناقضات والمخاطر','إنشاء تحليلات الإشارة والخطوات التالية','إعداد خطابات الرد والمسودات الأخرى','التصدير إلى PDF وWord وExcel وPowerPoint وغيرها','ربط البريد والتخزين السحابي ومواقع التخزين الخاصة'],note:'تبقى السيطرة بيدك: لا يتم الحفظ أو الإرسال أو الاعتماد دون قرارك.'},
  fa:{title:'AS Gold چه کارهایی می‌تواند انجام دهد؟',lead:'AS Gold موضوعات پیچیده را به پرونده‌ای روشن و قابل مدیریت تبدیل می‌کند.',items:['یکپارچه‌سازی اسناد، ایمیل‌ها و اطلاعات','شناسایی مهلت‌ها، کمبودها، تناقض‌ها و ریسک‌ها','ایجاد تحلیل چراغی و گام‌های بعدی','آماده‌سازی پاسخ‌نامه‌ها و پیش‌نویس‌های دیگر','خروجی PDF، Word، Excel، PowerPoint و قالب‌های دیگر','اتصال ایمیل، فضای ابری و محل ذخیره‌سازی شخصی'],note:'کنترل در اختیار شماست: بدون تصمیم شما چیزی ذخیره، ارسال یا تأیید نمی‌شود.'}
}

export function ProductIntro(){
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
      let slot=document.getElementById('asgold-product-intro-slot')
      if(!slot){
        slot=document.createElement('div')
        slot.id='asgold-product-intro-slot'
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
  const c=intro[language]||intro.en
  const rtl=language==='ar'||language==='fa'
  return createPortal(<section dir={rtl?'rtl':'ltr'} style={{margin:'20px 0 10px',padding:18,border:'1px solid #dccb9f',borderRadius:18,background:'linear-gradient(135deg,#fffaf0,#fff)',boxShadow:'0 10px 28px rgba(72,55,18,.06)'}}>
    <b style={{display:'block',fontSize:'1.35rem',color:'#4d3b14'}}>{c.title}</b>
    <p style={{margin:'7px 0 12px',color:'#596472',lineHeight:1.5}}>{c.lead}</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>{c.items.map(item=><div key={item} style={{padding:'9px 10px',borderRadius:10,background:'#fff',border:'1px solid #ece4cf',color:'#4f5966',lineHeight:1.35}}>✓ {item}</div>)}</div>
    <small style={{display:'block',marginTop:11,color:'#5d684f',fontWeight:700,lineHeight:1.4}}>{c.note}</small>
  </section>,host)
}
