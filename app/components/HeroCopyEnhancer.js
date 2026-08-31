'use client'

import { useEffect } from 'react'

const heroCopy={
  de:{title:'Aus Unterlagen wird ein klarer, bearbeitbarer Vorgang.',lead:'AS Gold liest und ordnet Dokumente, führt sie zu einem Fall zusammen, erkennt wichtige Angaben, Fristen, Lücken, Widersprüche und Risiken und erstellt daraus Sachstand, Ampelanalyse, nächste Schritte sowie auf Wunsch Antwortschreiben und Exporte. Zusätzlich können E-Mail-Konten, Cloud-Speicher und eigene Ablageorte auf PC oder Gerät angebunden werden. Sie prüfen und entscheiden, bevor Ergebnisse gespeichert, versendet oder freigegeben werden.'},
  en:{title:'Turn documents into a clear, manageable case.',lead:'AS Gold reads and organizes documents, brings them together in one case, identifies key facts, deadlines, gaps, contradictions and risks, and prepares a case status, traffic-light analysis, next steps, reply letters and exports when needed. Email accounts, cloud storage and your own storage locations on a PC or device can also be connected. You review and decide before results are saved, sent or approved.'},
  fr:{title:'Transformez vos documents en dossier clair et exploitable.',lead:'AS Gold lit et classe les documents, les réunit dans un dossier, repère les informations importantes, délais, lacunes, contradictions et risques, puis prépare l’état du dossier, une analyse par feu, les prochaines étapes, des réponses écrites et des exports si nécessaire. Il est aussi possible de connecter des comptes e-mail, un stockage cloud et vos propres emplacements sur ordinateur ou appareil. Vous contrôlez et décidez avant tout enregistrement, envoi ou validation.'},
  tr:{title:'Belgelerden açık ve yönetilebilir bir dosya oluşturun.',lead:'AS Gold belgeleri okur ve düzenler, tek bir dosyada birleştirir; önemli bilgileri, süreleri, eksikleri, çelişkileri ve riskleri belirler. Ardından dosya durumunu, trafik ışığı analizini, sonraki adımları, gerektiğinde cevap yazılarını ve dışa aktarımları hazırlar. E-posta hesapları, bulut depolama ve PC ya da cihazdaki kendi kayıt yerleriniz de bağlanabilir. Sonuçlar kaydedilmeden, gönderilmeden veya onaylanmadan önce siz kontrol eder ve karar verirsiniz.'},
  pl:{title:'Z dokumentów powstaje jasna, uporządkowana sprawa.',lead:'AS Gold odczytuje i porządkuje dokumenty, łączy je w jedną sprawę, wykrywa ważne informacje, terminy, braki, sprzeczności i ryzyka, a następnie przygotowuje stan sprawy, analizę w systemie świateł, kolejne kroki oraz w razie potrzeby pisma odpowiedzi i eksporty. Można również podłączyć konta e-mail, pamięć w chmurze oraz własne lokalizacje zapisu na komputerze lub urządzeniu. To użytkownik sprawdza i decyduje przed zapisaniem, wysłaniem lub zatwierdzeniem wyniku.'},
  ru:{title:'Из документов — в понятное и управляемое дело.',lead:'AS Gold читает и упорядочивает документы, объединяет их в одно дело, выявляет важные сведения, сроки, пробелы, противоречия и риски, а затем готовит состояние дела, светофорный анализ, следующие шаги, при необходимости ответные письма и экспорт. Также можно подключить почтовые аккаунты, облачные хранилища и собственные места хранения на компьютере или устройстве. Перед сохранением, отправкой или утверждением результата решение остаётся за вами.'},
  ar:{title:'حوّل المستندات إلى ملف واضح وقابل للإدارة.',lead:'يقرأ AS Gold المستندات وينظمها ويجمعها في ملف واحد، ويحدد المعلومات المهمة والمواعيد والنواقص والتناقضات والمخاطر، ثم يجهز ملخص الحالة وتحليل إشارة المرور والخطوات التالية، وعند الحاجة خطابات الرد وملفات التصدير. ويمكن أيضاً ربط حسابات البريد الإلكتروني والتخزين السحابي ومواقع التخزين الخاصة على الكمبيوتر أو الجهاز. أنت تراجع وتقرر قبل حفظ النتائج أو إرسالها أو اعتمادها.'},
  fa:{title:'اسناد را به یک پرونده روشن و قابل مدیریت تبدیل کنید.',lead:'AS Gold اسناد را می‌خواند و مرتب می‌کند، آن‌ها را در یک پرونده کنار هم می‌گذارد، اطلاعات مهم، مهلت‌ها، کاستی‌ها، تناقض‌ها و ریسک‌ها را شناسایی می‌کند و سپس وضعیت پرونده، تحلیل چراغی، گام‌های بعدی و در صورت نیاز پاسخ‌نامه‌ها و خروجی‌ها را آماده می‌کند. همچنین می‌توان حساب‌های ایمیل، فضای ابری و محل‌های ذخیره‌سازی شخصی روی رایانه یا دستگاه را متصل کرد. پیش از ذخیره، ارسال یا تأیید نتیجه، شما بررسی و تصمیم‌گیری می‌کنید.'}
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
