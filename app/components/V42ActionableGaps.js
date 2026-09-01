'use client'

import { useEffect } from 'react'

const labels={
 de:{title:'Jetzt erledigen',lead:'AS Gold macht aus offenen Punkten konkrete Aufgaben.',edit:'Fall bearbeiten',upload:'Dokument hinzufügen',reviewDoc:'Dokument prüfen',assess:'Bewertung ergänzen',followup:'Folgeaktion festlegen',deviation:'Abweichung prüfen',done:'Kein unmittelbarer Handlungsbedarf aus den erkannten Lücken.'},
 en:{title:'Do next',lead:'AS Gold turns open items into concrete tasks.',edit:'Edit case',upload:'Add document',reviewDoc:'Review document',assess:'Add assessment',followup:'Set follow-up action',deviation:'Review deviation',done:'No immediate action is required from the detected gaps.'},
 fr:{title:'À faire maintenant',lead:'AS Gold transforme les points ouverts en tâches concrètes.',edit:'Modifier le dossier',upload:'Ajouter un document',reviewDoc:'Vérifier le document',assess:'Ajouter une évaluation',followup:'Définir l’action suivante',deviation:'Vérifier l’écart',done:'Aucune action immédiate issue des lacunes détectées.'},
 tr:{title:'Şimdi yapılacak',lead:'AS Gold açık noktaları somut görevlere dönüştürür.',edit:'Dosyayı düzenle',upload:'Belge ekle',reviewDoc:'Belgeyi kontrol et',assess:'Değerlendirme ekle',followup:'Sonraki işlemi belirle',deviation:'Farkı kontrol et',done:'Algılanan eksiklerden kaynaklanan acil bir işlem yok.'},
 pl:{title:'Co zrobić teraz',lead:'AS Gold zamienia otwarte punkty w konkretne zadania.',edit:'Edytuj sprawę',upload:'Dodaj dokument',reviewDoc:'Sprawdź dokument',assess:'Dodaj ocenę',followup:'Ustal następne działanie',deviation:'Sprawdź różnicę',done:'Brak pilnych działań wynikających z wykrytych braków.'},
 ru:{title:'Что сделать сейчас',lead:'AS Gold превращает открытые пункты в конкретные задачи.',edit:'Редактировать дело',upload:'Добавить документ',reviewDoc:'Проверить документ',assess:'Добавить оценку',followup:'Указать следующее действие',deviation:'Проверить расхождение',done:'По выявленным пробелам срочных действий нет.'},
 ar:{title:'ما يجب فعله الآن',lead:'يحوّل AS Gold النقاط المفتوحة إلى مهام واضحة.',edit:'تعديل الحالة',upload:'إضافة مستند',reviewDoc:'مراجعة المستند',assess:'إضافة تقييم',followup:'تحديد الإجراء التالي',deviation:'مراجعة الاختلاف',done:'لا يوجد إجراء فوري مطلوب من النواقص المكتشفة.'},
 fa:{title:'اقدام بعدی',lead:'AS Gold موارد باز را به کارهای مشخص تبدیل می‌کند.',edit:'ویرایش پرونده',upload:'افزودن سند',reviewDoc:'بررسی سند',assess:'افزودن ارزیابی',followup:'تعیین اقدام بعدی',deviation:'بررسی اختلاف',done:'از نواقص شناسایی‌شده اقدام فوری لازم نیست.'},
 ro:{title:'Ce faceți acum',lead:'AS Gold transformă punctele deschise în sarcini concrete.',edit:'Editați cazul',upload:'Adăugați document',reviewDoc:'Verificați documentul',assess:'Adăugați evaluare',followup:'Stabiliți următoarea acțiune',deviation:'Verificați diferența',done:'Nu există acțiuni imediate rezultate din lipsurile detectate.'},
 bg:{title:'Какво да направите сега',lead:'AS Gold превръща отворените точки в конкретни задачи.',edit:'Редактирайте случая',upload:'Добавете документ',reviewDoc:'Проверете документа',assess:'Добавете оценка',followup:'Задайте следващо действие',deviation:'Проверете разликата',done:'Няма непосредствено действие по откритите липси.'},
 vi:{title:'Việc cần làm ngay',lead:'AS Gold biến các điểm còn mở thành nhiệm vụ cụ thể.',edit:'Chỉnh sửa hồ sơ',upload:'Thêm tài liệu',reviewDoc:'Kiểm tra tài liệu',assess:'Thêm đánh giá',followup:'Xác định hành động tiếp theo',deviation:'Kiểm tra khác biệt',done:'Không có hành động tức thời từ các thiếu sót đã nhận diện.'}
}

function lang(){const v=(document.documentElement.lang||'de').toLowerCase().slice(0,2);return labels[v]?v:'de'}
function clickButton(text){const buttons=[...document.querySelectorAll('button')];const b=buttons.find(x=>(x.textContent||'').includes(text));if(b){b.click();return true}return false}
function focusSelector(selector){const el=document.querySelector(selector);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.focus?.();return true}return false}

function taskFromGap(text,t){
 const lower=text.toLowerCase()
 if(/ziel|goal|objectif|hedef|cel|цель|هدف|obiectiv|цел|mục tiêu/.test(lower))return {label:text,action:t.edit,run:()=>clickButton(t.edit)||focusSelector('.caseTitleRow button.secondary')}
 if(/sachstand|summary|résumé|özet|opis|опис|ملخص|وضعیت|situația|описание|tình trạng/.test(lower))return {label:text,action:t.edit,run:()=>clickButton(t.edit)||focusSelector('.caseTitleRow button.secondary')}
 if(/frist|deadline|délai|süre|termin|срок|مهلة|termen|срок|thời hạn/.test(lower))return {label:text,action:t.edit,run:()=>clickButton(t.edit)||focusSelector('.caseTitleRow button.secondary')}
 if(/nächster schritt|next action|étape suivante|sonraki adım|następ|следующ|الخطوة التالية|گام بعدی|pasul următor|следваща|bước tiếp theo/.test(lower))return {label:text,action:t.edit,run:()=>clickButton(t.edit)||focusSelector('.caseTitleRow button.secondary')}
 if(/keine dokument|no documents|aucun document|belge yok|brak dokument|документ|مستند|سند|documente|документ|chưa có tài liệu/.test(lower)&&!/ohne|without|sans|metni|bez odczyt|извлеч|بلا نص|بدون متن|fără text|без извлеч|văn bản trích xuất/.test(lower))return {label:text,action:t.upload,run:()=>clickButton(t.upload)||focusSelector('.detailCardHead button.secondary')}
 if(/ohne ausgelesenen|without extracted|sans texte extrait|metni çıkarılmamış|bez odczytanej|без извлечённого|بلا نص|بدون متن|fără text extras|без извлечен|chưa có văn bản trích xuất/.test(lower))return {label:text,action:t.reviewDoc,run:()=>focusSelector('.sourceList button')}
 if(/bewertung|assessment|évaluation|değerlendirme|ocen|оцен|تقييم|ارزیابی|evaluare|оценка|đánh giá/.test(lower))return {label:text,action:t.assess,run:()=>focusSelector('.inlineAssessment')}
 return {label:text,action:t.followup,run:()=>focusSelector('.inlineAssessment')}
}

export function V42ActionableGaps(){
 useEffect(()=>{
  function render(){
   const source=document.querySelector('[data-v41-consistency]')
   if(!source){document.querySelector('[data-v42-actions]')?.remove();return}
   const t=labels[lang()]
   const headings=[...source.querySelectorAll('h4')]
   const gapHeading=headings[0]
   const gapList=gapHeading?.nextElementSibling?.tagName==='UL'?gapHeading.nextElementSibling:null
   const devHeading=headings[1]
   const devList=devHeading?.nextElementSibling?.tagName==='UL'?devHeading.nextElementSibling:null
   const tasks=(gapList?[...gapList.querySelectorAll('li')].map(li=>taskFromGap(li.textContent.trim(),t)):[])
   if(devList?.children.length)tasks.push({label:devList.children[0].textContent.trim(),action:t.deviation,run:()=>devList.scrollIntoView({behavior:'smooth',block:'center'})})
   let box=document.querySelector('[data-v42-actions]')
   if(!box){box=document.createElement('section');box.dataset.v42Actions='true';box.className='detailCard v42Actions';source.insertAdjacentElement('afterend',box)}
   box.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V42</span><h3>${t.title}</h3><p>${t.lead}</p></div></div>${tasks.length?`<div class="v42TaskList">${tasks.map((x,i)=>`<button type="button" class="itemRow buttonRow" data-v42-task="${i}"><span>${x.label}</span><b>${x.action} ›</b></button>`).join('')}`:`<p>✓ ${t.done}</p>`}</div>`
   tasks.forEach((task,i)=>box.querySelector(`[data-v42-task="${i}"]`)?.addEventListener('click',task.run,{once:false}))
  }
  render();const observer=new MutationObserver(render);observer.observe(document.body,{childList:true,subtree:true,characterData:true});const timer=setInterval(render,1500)
  return()=>{observer.disconnect();clearInterval(timer);document.querySelector('[data-v42-actions]')?.remove()}
 },[])
 return null
}
