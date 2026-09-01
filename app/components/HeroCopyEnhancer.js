'use client'

import { useEffect } from 'react'
import { whatIsAsGoldCopy } from '../lib/asGoldIntroCopy.mjs'

const heroCopy={
  de:{title:'Was ist AS Gold?',lead:'AS Gold ist eine digitale Anwendung, die Dokumente, E-Mails und Ihre eigene Schilderung zu einem verständlichen Fall zusammenführt. Sie erkennt wichtige Informationen, Fristen und Risiken und zeigt den nächsten sinnvollen Schritt.'},
  en:{title:'What is AS Gold?',lead:'AS Gold is a digital application that brings documents, emails and your own description together in one understandable case. It identifies important information, deadlines and risks and shows the next sensible step.'},
  fr:{title:'Qu’est-ce qu’AS Gold ?',lead:'AS Gold est une application numérique qui réunit documents, e-mails et votre propre description dans un dossier compréhensible. Elle repère les informations importantes, les délais et les risques et indique la prochaine étape utile.'},
  tr:{title:'AS Gold nedir?',lead:'AS Gold; belgeleri, e-postaları ve kendi anlatımınızı anlaşılır bir dosyada birleştiren dijital bir uygulamadır. Önemli bilgileri, süreleri ve riskleri belirler ve sonraki mantıklı adımı gösterir.'},
  pl:{title:'Czym jest AS Gold?',lead:'AS Gold to aplikacja cyfrowa, która łączy dokumenty, e-maile i własny opis w jedną zrozumiałą sprawę. Rozpoznaje ważne informacje, terminy i ryzyka oraz wskazuje kolejny rozsądny krok.'},
  ru:{title:'Что такое AS Gold?',lead:'AS Gold — это цифровое приложение, которое объединяет документы, электронные письма и ваше описание в одно понятное дело. Оно выявляет важную информацию, сроки и риски и показывает следующий разумный шаг.'},
  ar:{title:'ما هو AS Gold؟',lead:'AS Gold تطبيق رقمي يجمع المستندات والبريد الإلكتروني ووصفك الشخصي في حالة واحدة واضحة. يحدد المعلومات المهمة والمواعيد والمخاطر ويعرض الخطوة المنطقية التالية.'},
  fa:{title:'AS Gold چیست؟',lead:'AS Gold یک برنامه دیجیتال است که اسناد، ایمیل‌ها و توضیحات شما را در یک پرونده روشن کنار هم قرار می‌دهد. اطلاعات مهم، مهلت‌ها و ریسک‌ها را شناسایی می‌کند و گام منطقی بعدی را نشان می‌دهد.'},
  ro:{title:'Ce este AS Gold?',lead:'AS Gold este o aplicație digitală ce reunește documentele, e-mailurile și descrierea dvs. într-un caz ușor de înțeles. Identifică informațiile importante, termenele și riscurile și arată următorul pas potrivit.'},
  bg:{title:'Какво е AS Gold?',lead:'AS Gold е цифрово приложение, което обединява документи, имейли и вашето описание в един разбираем случай. То открива важната информация, сроковете и рисковете и показва следващата разумна стъпка.'}
}

const audienceCopy={
  de:{title:'Für wen AS Gold besonders nützlich ist',lead:'Sie müssen keinen bestimmten „Falltyp“ kennen. Wählen Sie zuerst, wie Sie AS Gold nutzen möchten.',items:[['Privatpersonen','Briefe, Verträge, Behördenpost, Streitfälle, Reisen, Fahrzeuge oder andere dokumentenreiche Vorgänge verständlich ordnen und bearbeiten.'],['Selbstständige & kleine Unternehmen','Kundenfälle, Forderungen, Verträge, Rechnungen, Versicherungen, Mitarbeiter- und Behördenvorgänge strukturiert bearbeiten.'],['Büro, Verwaltung & Assistenz','E-Mails, Fristen, Unterlagen, Antworten und Wiedervorlagen zentral zusammenführen und nachvollziehbar weiterbearbeiten.'],['Teams mit Kundenfällen','Mehrere Kunden und Vorgänge, Dokumente, Freigaben, Ampelstände und vorbereitete Schreiben gemeinsam steuern.']]},
  en:{title:'Who AS Gold is especially useful for',lead:'You do not need to know a specific case category first. Start with how you want to use AS Gold.',items:[['Private individuals','Organize and handle letters, contracts, authority correspondence, disputes, travel, vehicles and other document-heavy matters.'],['Self-employed & small businesses','Structure client matters, claims, contracts, invoices, insurance, staff and authority processes.'],['Office, administration & assistance','Bring emails, deadlines, documents, replies and follow-ups together in one traceable workflow.'],['Teams handling client matters','Coordinate multiple clients and cases, documents, approvals, traffic-light status and prepared letters.']]},
  fr:{title:'À qui AS Gold est particulièrement utile',lead:'Vous n’avez pas besoin de connaître d’abord une catégorie de dossier. Commencez par votre manière d’utiliser AS Gold.',items:[['Particuliers','Organiser lettres, contrats, courriers administratifs, litiges, voyages, véhicules et autres dossiers riches en documents.'],['Indépendants & petites entreprises','Structurer dossiers clients, créances, contrats, factures, assurances, personnel et démarches administratives.'],['Bureau, administration & assistance','Centraliser e-mails, délais, documents, réponses et relances dans un flux traçable.'],['Équipes avec dossiers clients','Piloter plusieurs clients et dossiers, documents, validations, statuts et courriers préparés.']]},
  tr:{title:'AS Gold özellikle kimler için yararlı',lead:'Önceden belirli bir dosya türünü bilmeniz gerekmez. Önce AS Gold’u nasıl kullanacağınızı seçin.',items:[['Bireyler','Mektup, sözleşme, resmi yazışma, uyuşmazlık, seyahat, araç ve belge yoğun diğer işlemleri düzenlemek için.'],['Serbest çalışanlar & küçük işletmeler','Müşteri dosyaları, alacaklar, sözleşmeler, faturalar, sigorta, çalışan ve resmi işlemler için.'],['Ofis, yönetim & asistanlık','E-posta, süre, belge, cevap ve takipleri tek yerde yönetmek için.'],['Müşteri dosyalarıyla çalışan ekipler','Birden çok müşteri ve dosyayı, belgeleri, onayları, durumları ve yazıları birlikte yönetmek için.']]},
  pl:{title:'Dla kogo AS Gold jest szczególnie przydatny',lead:'Nie trzeba najpierw znać konkretnego typu sprawy. Zacznij od sposobu, w jaki chcesz używać AS Gold.',items:[['Osoby prywatne','Porządkowanie pism, umów, korespondencji urzędowej, sporów, podróży, pojazdów i innych spraw z dużą liczbą dokumentów.'],['Samozatrudnieni & małe firmy','Obsługa spraw klientów, należności, umów, faktur, ubezpieczeń, pracowników i urzędów.'],['Biuro, administracja & asysta','Łączenie e-maili, terminów, dokumentów, odpowiedzi i dalszych działań w jednym procesie.'],['Zespoły z obsługą klientów','Wspólne prowadzenie wielu klientów i spraw, dokumentów, akceptacji, statusów i pism.']]},
  ru:{title:'Кому AS Gold особенно полезен',lead:'Не нужно заранее знать тип дела. Сначала выберите, как вы хотите использовать AS Gold.',items:[['Частные лица','Упорядочивать письма, договоры, официальную переписку, споры, поездки, транспорт и другие документные дела.'],['Самозанятые & малый бизнес','Вести клиентские дела, требования, договоры, счета, страхование, персонал и взаимодействие с ведомствами.'],['Офис, администрация & ассистенты','Объединять почту, сроки, документы, ответы и последующие действия в одном процессе.'],['Команды с клиентскими делами','Совместно вести клиентов и дела, документы, согласования, статусы и подготовленные письма.']]},
  ar:{title:'لمن يفيد AS Gold بشكل خاص',lead:'لا تحتاج إلى معرفة نوع الحالة مسبقاً. ابدأ بالطريقة التي تريد استخدام AS Gold بها.',items:[['الأفراد','تنظيم الرسائل والعقود والمراسلات الرسمية والنزاعات والسفر والمركبات وغيرها من الحالات كثيرة المستندات.'],['المستقلون & الشركات الصغيرة','إدارة حالات العملاء والمطالبات والعقود والفواتير والتأمين والموظفين والإجراءات الرسمية.'],['المكتب والإدارة والمساعدة','جمع البريد والمواعيد والمستندات والردود والمتابعات في مسار واحد واضح.'],['الفرق التي تدير حالات عملاء','إدارة عدة عملاء وحالات ومستندات وموافقات وتقييمات وخطابات معاً.']]},
  fa:{title:'AS Gold برای چه کسانی بیشترین کاربرد را دارد',lead:'لازم نیست از ابتدا نوع پرونده را بدانید. ابتدا نحوه استفاده خود از AS Gold را انتخاب کنید.',items:[['افراد','مرتب‌سازی نامه‌ها، قراردادها، مکاتبات اداری، اختلاف‌ها، سفر، خودرو و سایر موضوعات پرمدرک.'],['خوداشتغال‌ها & کسب‌وکارهای کوچک','مدیریت پرونده مشتری، مطالبات، قرارداد، فاکتور، بیمه، کارکنان و امور اداری.'],['دفتر، مدیریت & دستیاران','یکپارچه‌سازی ایمیل‌ها، مهلت‌ها، اسناد، پاسخ‌ها و پیگیری‌ها در یک روند روشن.'],['تیم‌های دارای پرونده مشتری','مدیریت مشترک چند مشتری و پرونده، اسناد، تأییدها، وضعیت‌ها و نامه‌های آماده.']]},
  ro:{title:'Pentru cine este deosebit de util AS Gold',lead:'Nu trebuie să cunoașteți dinainte un anumit „tip de caz”. Alegeți mai întâi cum doriți să utilizați AS Gold.',items:[['Persoane fizice','Organizați și procesați clar scrisori, contracte, corespondență oficială, litigii, călătorii, vehicule și alte situații cu multe documente.'],['Lucrători independenți și întreprinderi mici','Procesați structurat cazuri de clienți, creanțe, contracte, facturi, asigurări, angajați și relația cu autoritățile.'],['Birou, administrație și asistență','Reuniți central e-mailuri, termene, documente, răspunsuri și urmăriri într-un flux trasabil.'],['Echipe cu cazuri de clienți','Coordonați împreună mai mulți clienți și cazuri, documente, aprobări, stări și scrisori pregătite.']]},
  bg:{title:'За кого AS Gold е особено полезен',lead:'Не е нужно предварително да знаете конкретен „вид случай“. Първо изберете как искате да използвате AS Gold.',items:[['Частни лица','Подреждайте и обработвайте разбираемо писма, договори, официална кореспонденция, спорове, пътувания, автомобили и други случаи с много документи.'],['Самонаети и малки предприятия','Обработвайте структурирано клиентски случаи, вземания, договори, фактури, застраховки, служители и административни процедури.'],['Офис, администрация и асистенти','Събирайте централно имейли, срокове, документи, отговори и последващи действия в проследим процес.'],['Екипи с клиентски случаи','Управлявайте съвместно няколко клиента и случая, документи, одобрения, статуси и подготвени писма.']]}
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
  const copy=whatIsAsGoldCopy[language]||whatIsAsGoldCopy.de
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
