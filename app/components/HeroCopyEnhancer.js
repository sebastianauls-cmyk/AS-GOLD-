'use client'

import { useEffect } from 'react'

const heroCopy={
  de:{title:'Aus Unterlagen wird ein klarer, bearbeitbarer Vorgang.',lead:'AS Gold liest und ordnet Dokumente, führt sie zu einem Fall zusammen, erkennt wichtige Angaben, Fristen, Lücken, Widersprüche und Risiken und bereitet daraus Sachstand, Ampelbewertung, nächste Schritte sowie auf Wunsch Schreiben und Exporte vor. Sie prüfen und entscheiden, bevor Ergebnisse gespeichert oder freigegeben werden.'},
  en:{title:'Turn documents into a clear, manageable case.',lead:'AS Gold reads and organizes documents, brings them together in one case, identifies key facts, deadlines, gaps, contradictions and risks, and prepares a case status, traffic-light assessment, next steps and, when needed, draft letters and exports. You review and decide before results are saved or approved.'},
  fr:{title:'Transformez vos documents en dossier clair et exploitable.',lead:'AS Gold lit et classe les documents, les réunit dans un dossier, repère les informations importantes, délais, lacunes, contradictions et risques, puis prépare l’état du dossier, une évaluation par feu, les prochaines étapes et, si nécessaire, des projets de courriers et des exports. Vous contrôlez et décidez avant tout enregistrement ou validation.'},
  tr:{title:'Belgelerden açık ve yönetilebilir bir dosya oluşturun.',lead:'AS Gold belgeleri okur ve düzenler, tek bir dosyada birleştirir; önemli bilgileri, süreleri, eksikleri, çelişkileri ve riskleri belirler. Ardından dosya durumunu, trafik ışığı değerlendirmesini, sonraki adımları ve gerektiğinde yazı taslakları ile dışa aktarımları hazırlar. Sonuçlar kaydedilmeden veya onaylanmadan önce siz kontrol eder ve karar verirsiniz.'},
  pl:{title:'Z dokumentów powstaje jasna, uporządkowana sprawa.',lead:'AS Gold odczytuje i porządkuje dokumenty, łączy je w jedną sprawę, wykrywa ważne informacje, terminy, braki, sprzeczności i ryzyka, a następnie przygotowuje stan sprawy, ocenę w systemie świateł, kolejne kroki oraz w razie potrzeby projekty pism i eksporty. To użytkownik sprawdza i decyduje przed zapisaniem lub zatwierdzeniem wyniku.'},
  ru:{title:'Из документов — в понятное и управляемое дело.',lead:'AS Gold читает и упорядочивает документы, объединяет их в одно дело, выявляет важные сведения, сроки, пробелы, противоречия и риски, а затем готовит состояние дела, оценку по принципу светофора, следующие шаги и при необходимости проекты писем и экспорт. Перед сохранением или утверждением результата решение остаётся за вами.'},
  ar:{title:'حوّل المستندات إلى ملف واضح وقابل للإدارة.',lead:'يقرأ AS Gold المستندات وينظمها ويجمعها في ملف واحد، ويحدد المعلومات المهمة والمواعيد والنواقص والتناقضات والمخاطر، ثم يجهز ملخص الحالة وتقييم إشارة المرور والخطوات التالية، وعند الحاجة مسودات الخطابات وملفات التصدير. أنت تراجع وتقرر قبل حفظ النتائج أو اعتمادها.'},
  fa:{title:'اسناد را به یک پرونده روشن و قابل مدیریت تبدیل کنید.',lead:'AS Gold اسناد را می‌خواند و مرتب می‌کند، آن‌ها را در یک پرونده کنار هم می‌گذارد، اطلاعات مهم، مهلت‌ها، کاستی‌ها، تناقض‌ها و ریسک‌ها را شناسایی می‌کند و سپس وضعیت پرونده، ارزیابی چراغی، گام‌های بعدی و در صورت نیاز پیش‌نویس نامه‌ها و خروجی‌ها را آماده می‌کند. پیش از ذخیره یا تأیید نتیجه، شما بررسی و تصمیم‌گیری می‌کنید.'}
}

function applyHeroCopy(){
  if(location.pathname!=='/') return
  const language=document.documentElement.lang||'de'
  const copy=heroCopy[language]||heroCopy.de
  const title=document.querySelector('.hero h1')
  const lead=document.querySelector('.hero .lead')
  if(title) title.textContent=copy.title
  if(lead) lead.textContent=copy.lead
}

export function HeroCopyEnhancer(){
  useEffect(()=>{
    applyHeroCopy()
    const observer=new MutationObserver(applyHeroCopy)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    const timer=setInterval(applyHeroCopy,400)
    return ()=>{observer.disconnect();clearInterval(timer)}
  },[])
  return null
}
