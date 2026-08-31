'use client'

import { useEffect } from 'react'

const heroCopy={
  de:{title:'AS Gold – Klarheit, wenn Vorgänge komplex werden.',lead:'AS Gold bündelt Dokumente, E-Mails und Informationen, erkennt Fristen, Lücken, Widersprüche und Risiken und erstellt daraus Sachstand, Ampelanalysen, nächste Schritte, Antwortschreiben und Exporte. E-Mail-Konten, Cloud-Speicher und eigene Ablageorte auf PC oder Gerät können angebunden werden. Sie prüfen und entscheiden, bevor etwas gespeichert, versendet oder freigegeben wird.'},
  en:{title:'AS Gold – clarity when matters get complex.',lead:'AS Gold brings documents, emails and information together, identifies deadlines, gaps, contradictions and risks, and prepares case status, traffic-light analyses, next steps, reply letters and exports. Email accounts, cloud storage and your own storage locations can be connected. You review and decide before anything is saved, sent or approved.'},
  fr:{title:'AS Gold – de la clarté quand les dossiers deviennent complexes.',lead:'AS Gold rassemble documents, e-mails et informations, repère délais, lacunes, contradictions et risques, puis prépare l’état du dossier, des analyses par feu, les prochaines étapes, des réponses écrites et des exports. Des comptes e-mail, stockages cloud et emplacements personnels peuvent être connectés. Vous gardez la décision avant tout enregistrement, envoi ou validation.'},
  tr:{title:'AS Gold – işlemler karmaşıklaştığında netlik.',lead:'AS Gold belgeleri, e-postaları ve bilgileri bir araya getirir; süreleri, eksikleri, çelişkileri ve riskleri belirler. Ardından dosya durumu, trafik ışığı analizleri, sonraki adımlar, cevap yazıları ve dışa aktarımlar hazırlar. E-posta hesapları, bulut depolama ve kendi kayıt yerleriniz bağlanabilir. Kaydetme, gönderme veya onaylama öncesinde karar sizindir.'},
  pl:{title:'AS Gold – jasność, gdy sprawy stają się złożone.',lead:'AS Gold łączy dokumenty, e-maile i informacje, wykrywa terminy, braki, sprzeczności i ryzyka, a następnie przygotowuje stan sprawy, analizy sygnalizacyjne, kolejne kroki, pisma odpowiedzi i eksporty. Można podłączyć konta e-mail, chmurę i własne lokalizacje zapisu. Przed zapisaniem, wysłaniem lub zatwierdzeniem decyzja należy do użytkownika.'},
  ru:{title:'AS Gold – ясность, когда дела становятся сложными.',lead:'AS Gold объединяет документы, почту и информацию, выявляет сроки, пробелы, противоречия и риски и готовит состояние дела, светофорные анализы, следующие шаги, ответные письма и экспорт. Можно подключить почтовые аккаунты, облако и собственные места хранения. Перед сохранением, отправкой или утверждением решение остаётся за вами.'},
  ar:{title:'AS Gold – وضوح عندما تصبح المعاملات معقدة.',lead:'يجمع AS Gold المستندات والبريد والمعلومات، ويحدد المواعيد والنواقص والتناقضات والمخاطر، ثم يجهز ملخص الحالة وتحليلات الإشارة والخطوات التالية وخطابات الرد وملفات التصدير. ويمكن ربط البريد والتخزين السحابي ومواقع التخزين الخاصة. أنت تقرر قبل الحفظ أو الإرسال أو الاعتماد.'},
  fa:{title:'AS Gold – شفافیت وقتی پرونده‌ها پیچیده می‌شوند.',lead:'AS Gold اسناد، ایمیل‌ها و اطلاعات را یکجا جمع می‌کند، مهلت‌ها، کاستی‌ها، تناقض‌ها و ریسک‌ها را شناسایی می‌کند و وضعیت پرونده، تحلیل چراغی، گام‌های بعدی، پاسخ‌نامه‌ها و خروجی‌ها را آماده می‌کند. ایمیل، فضای ابری و محل ذخیره‌سازی شخصی نیز قابل اتصال است. پیش از ذخیره، ارسال یا تأیید، تصمیم با شماست.'}
}

const audienceCopy={
  de:{title:'Für wen AS Gold besonders nützlich ist',lead:'Sie müssen keinen bestimmten „Falltyp“ kennen. Wählen Sie zuerst, wie Sie AS Gold nutzen möchten.',items:[['Privatpersonen','Briefe, Verträge, Behördenpost, Streitfälle, Reisen, Fahrzeuge oder andere dokumentenreiche Vorgänge verständlich ordnen und bearbeiten.'],['Selbstständige & kleine Unternehmen','Kundenfälle, Forderungen, Verträge, Rechnungen, Versicherungen, Mitarbeiter- und Behördenvorgänge strukturiert bearbeiten.'],['Büro, Verwaltung & Assistenz','E-Mails, Fristen, Unterlagen, Antworten und Wiedervorlagen zentral zusammenführen und nachvollziehbar weiterbearbeiten.'],['Teams mit Kundenfällen','Mehrere Kunden und Vorgänge, Dokumente, Freigaben, Ampelstände und vorbereitete Schreiben gemeinsam steuern.']]},
  en:{title:'Who AS Gold is especially useful for',lead:'You do not need to know a specific case category first. Start with how you want to use AS Gold.',items:[['Private individuals','Organize and handle letters, contracts, authority correspondence, disputes, travel, vehicles and other document-heavy matters.'],['Self-employed & small businesses','Structure client matters, claims, contracts, invoices, insurance, staff and authority processes.'],['Office, administration & assistance','Bring emails, deadlines, documents, replies and follow-ups together in one traceable workflow.'],['Teams handling client matters','Coordinate multiple clients and cases, documents, approvals, traffic-light status and prepared letters.']]},
  fr:{title:'À qui AS Gold est particulièrement utile',lead:'Vous n’avez pas besoin de connaître d’abord une catégorie de dossier. Commencez par votre manière d’utiliser AS Gold.',items:[['Particuliers','Organiser lettres, contrats, courriers administratifs, litiges, voyages, véhicules et autres dossiers riches en documents.'],['Indépendants & petites entreprises','Structurer dossiers clients, créances, contrats, factures, assurances, personnel et démarches administratives.'],['Bureau, administration & assistance','Centraliser e-mails, délais, documents, réponses et relances dans un flux traçable.'],['Équipes avec dossiers clients','Piloter plusieurs clients et dossiers, documents, validations, statuts et courriers préparés.']]},
  tr:{title:'AS Gold özellikle kimler için yararlı',lead:'Önceden belirli bir dosya türünü bilmeniz gerekmez. Önce AS Gold’u nasıl kullanacağınızı seçin.',items:[['Bireyler','Mektup, sözleşme, resmi yazışma, uyuşmazlık, seyahat, araç ve belge yoğun diğer işlemleri düzenlemek için.'],['Serbest çalışanlar & küçük işletmeler','Müşteri dosyaları, alacaklar, sözleşmeler, faturalar, sigorta, çalışan ve resmi işlemler için.'],['Ofis, yönetim & asistanlık','E-posta, süre, belge, cevap ve takipleri tek yerde yönetmek için.'],['Müşteri dosyalarıyla çalışan ekipler','Birden çok müşteri ve dosyayı, belgeleri, onayları, durumları ve yazıları birlikte yönetmek için.']]},
  pl:{title:'Dla kogo AS Gold jest szczególnie przydatny',lead:'Nie trzeba najpierw znać konkretnego typu sprawy. Zacznij od sposobu, w jaki chcesz używać AS Gold.',items:[['Osoby prywatne','Porządkowanie pism, umów, korespondencji urzędowej, sporów, podróży, pojazdów i innych spraw z dużą liczbą dokumentów.'],['Samozatrudnieni & małe firmy','Obsługa spraw klientów, należności, umów, faktur, ubezpieczeń, pracowników i urzędów.'],['Biuro, administracja & asysta','Łączenie e-maili, terminów, dokumentów, odpowiedzi i dalszych działań w jednym procesie.'],['Zespoły z obsługą klientów','Wspólne prowadzenie wielu klientów i spraw, dokumentów, akceptacji, statusów i pism.']]},
  ru:{title:'Кому AS Gold особенно полезен',lead:'Не нужно заранее знать тип дела. Сначала выберите, как вы хотите использовать AS Gold.',items:[['Частные лица','Упорядочивать письма, договоры, официальную переписку, споры, поездки, транспорт и другие документные дела.'],['Самозанятые & малый бизнес','Вести клиентские дела, требования, договоры, счета, страхование, персонал и взаимодействие с ведомствами.'],['Офис, администрация & ассистенты','Объединять почту, сроки, документы, ответы и последующие действия в одном процессе.'],['Команды с клиентскими делами','Совместно вести клиентов и дела, документы, согласования, статусы и подготовленные письма.']]},
  ar:{title:'لمن يفيد AS Gold بشكل خاص',lead:'لا تحتاج إلى معرفة نوع الحالة مسبقاً. ابدأ بالطريقة التي تريد استخدام AS Gold بها.',items:[['الأفراد','تنظيم الرسائل والعقود والمراسلات الرسمية والنزاعات والسفر والمركبات وغيرها من الحالات كثيرة المستندات.'],['المستقلون & الشركات الصغيرة','إدارة حالات العملاء والمطالبات والعقود والفواتير والتأمين والموظفين والإجراءات الرسمية.'],['المكتب والإدارة والمساعدة','جمع البريد والمواعيد والمستندات والردود والمتابعات في مسار واحد واضح.'],['الفرق التي تدير حالات عملاء','إدارة عدة عملاء وحالات ومستندات وموافقات وتقييمات وخطابات معاً.']]},
  fa:{title:'AS Gold برای چه کسانی بیشترین کاربرد را دارد',lead:'لازم نیست از ابتدا نوع پرونده را بدانید. ابتدا نحوه استفاده خود از AS Gold را انتخاب کنید.',items:[['افراد','مرتب‌سازی نامه‌ها، قراردادها، مکاتبات اداری، اختلاف‌ها، سفر، خودرو و سایر موضوعات پرمدرک.'],['خوداشتغال‌ها & کسب‌وکارهای کوچک','مدیریت پرونده مشتری، مطالبات، قرارداد، فاکتور، بیمه، کارکنان و امور اداری.'],['دفتر، مدیریت & دستیاران','یکپارچه‌سازی ایمیل‌ها، مهلت‌ها، اسناد، پاسخ‌ها و پیگیری‌ها در یک روند روشن.'],['تیم‌های دارای پرونده مشتری','مدیریت مشترک چند مشتری و پرونده، اسناد، تأییدها، وضعیت‌ها و نامه‌های آماده.']]}
}

function ensureAudienceBlock(language){
  const section=document.querySelector('#fallarten .wrap')
  if(!section) return
  const copy=audienceCopy[language]||audienceCopy.de
  let block=document.getElementById('asgold-user-audience')
  if(!block){
    block=document.createElement('section')
    block.id='asgold-user-audience'
    block.style.cssText='margin:0 0 34px;padding:24px;border:1px solid #e2d6b7;border-radius:20px;background:linear-gradient(135deg,#fffaf0,#fff)'
    section.prepend(block)
  }
  block.innerHTML=`<div class="eyebrow">${copy.title}</div><h2 style="margin:8px 0 8px;font-size:clamp(1.7rem,5vw,2.5rem)">${copy.title}</h2><p style="margin:0 0 18px;color:#5f6976;line-height:1.5">${copy.lead}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">${copy.items.map(([title,text])=>`<article style="background:#fff;border:1px solid #e3e5e9;border-radius:14px;padding:16px"><b style="display:block;margin-bottom:7px;color:#5e4818">${title}</b><span style="color:#626c78;line-height:1.45">${text}</span></article>`).join('')}</div>`
}

function applyHeroCopy(){
  if(location.pathname!=='/') return
  const language=(document.documentElement.lang||'de').split('-')[0]
  const copy=heroCopy[language]||heroCopy.de
  const title=document.querySelector('.hero h1')
  const lead=document.querySelector('.hero .lead')
  if(title) title.textContent=copy.title
  if(lead) lead.textContent=copy.lead
  ensureAudienceBlock(language)
}

export function HeroCopyEnhancer(){
  useEffect(()=>{
    applyHeroCopy()
    const observer=new MutationObserver(applyHeroCopy)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    return ()=>observer.disconnect()
  },[])
  return null
}
