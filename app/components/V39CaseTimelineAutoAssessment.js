'use client'

import { useEffect } from 'react'
import { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'
import { autoDocumentAssessment,sortTimelineEntries } from '../lib/v39CaseIntelligence.mjs'

const labels={
  de:{auto:'Automatische Dokument-Ampel',provisional:'Vorläufig – Original prüfen',basis:'Erkannte Grundlage',next:'Nächster Schritt',timeline:'Fall-Timeline',document:'Dokument',deadline:'Frist',caseStart:'Fallstand',noTimeline:'Noch keine datierten Ereignisse erkannt.',green:'Grün',yellow:'Gelb',red:'Rot'},
  en:{auto:'Automatic document traffic light',provisional:'Provisional – verify original',basis:'Detected basis',next:'Next step',timeline:'Case timeline',document:'Document',deadline:'Deadline',caseStart:'Case status',noTimeline:'No dated events detected yet.',green:'Green',yellow:'Yellow',red:'Red'},
  fr:{auto:'Feu automatique du document',provisional:'Provisoire – vérifier l’original',basis:'Base détectée',next:'Étape suivante',timeline:'Chronologie du dossier',document:'Document',deadline:'Délai',caseStart:'État du dossier',noTimeline:'Aucun événement daté détecté.',green:'Vert',yellow:'Jaune',red:'Rouge'},
  tr:{auto:'Otomatik belge trafik ışığı',provisional:'Geçici – orijinali kontrol edin',basis:'Algılanan dayanak',next:'Sonraki adım',timeline:'Dosya zaman çizelgesi',document:'Belge',deadline:'Süre',caseStart:'Dosya durumu',noTimeline:'Henüz tarihli olay algılanmadı.',green:'Yeşil',yellow:'Sarı',red:'Kırmızı'},
  pl:{auto:'Automatyczna sygnalizacja dokumentu',provisional:'Wstępna – sprawdź oryginał',basis:'Rozpoznana podstawa',next:'Następny krok',timeline:'Oś czasu sprawy',document:'Dokument',deadline:'Termin',caseStart:'Stan sprawy',noTimeline:'Nie wykryto jeszcze datowanych zdarzeń.',green:'Zielony',yellow:'Żółty',red:'Czerwony'},
  ru:{auto:'Автоматический светофор документа',provisional:'Предварительно – проверьте оригинал',basis:'Выявленная основа',next:'Следующий шаг',timeline:'Хронология дела',document:'Документ',deadline:'Срок',caseStart:'Состояние дела',noTimeline:'События с датами пока не обнаружены.',green:'Зелёный',yellow:'Жёлтый',red:'Красный'},
  ar:{auto:'إشارة تلقائية للمستند',provisional:'أولي – تحقق من الأصل',basis:'الأساس المكتشف',next:'الخطوة التالية',timeline:'الخط الزمني للحالة',document:'مستند',deadline:'مهلة',caseStart:'حالة الملف',noTimeline:'لم يتم اكتشاف أحداث مؤرخة بعد.',green:'أخضر',yellow:'أصفر',red:'أحمر'},
  fa:{auto:'چراغ خودکار سند',provisional:'موقت – اصل سند بررسی شود',basis:'مبنای شناسایی‌شده',next:'گام بعدی',timeline:'خط زمانی پرونده',document:'سند',deadline:'مهلت',caseStart:'وضعیت پرونده',noTimeline:'هنوز رویداد تاریخ‌دار شناسایی نشده است.',green:'سبز',yellow:'زرد',red:'قرمز'},
  ro:{auto:'Semafor automat al documentului',provisional:'Provizoriu – verificați originalul',basis:'Bază detectată',next:'Pasul următor',timeline:'Cronologia cazului',document:'Document',deadline:'Termen',caseStart:'Starea cazului',noTimeline:'Nu au fost detectate încă evenimente datate.',green:'Verde',yellow:'Galben',red:'Roșu'},
  bg:{auto:'Автоматична оценка на документа',provisional:'Предварително – проверете оригинала',basis:'Разпозната основа',next:'Следваща стъпка',timeline:'Хронология на случая',document:'Документ',deadline:'Срок',caseStart:'Състояние на случая',noTimeline:'Все още няма разпознати събития с дата.',green:'Зелено',yellow:'Жълто',red:'Червено'},
  vi:{auto:'Đánh giá tài liệu tự động',provisional:'Tạm thời – hãy kiểm tra bản gốc',basis:'Cơ sở đã nhận diện',next:'Bước tiếp theo',timeline:'Dòng thời gian hồ sơ',document:'Tài liệu',deadline:'Thời hạn',caseStart:'Tình trạng hồ sơ',noTimeline:'Chưa nhận diện được sự kiện có ngày.',green:'Xanh',yellow:'Vàng',red:'Đỏ'}
}

function lang(){const value=(document.documentElement.lang||'de').toLowerCase().slice(0,2);return labels[value]?value:'de'}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function parsedDate(value=''){const match=String(value).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);if(!match)return null;const [,d,m,y]=match;return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`}

function renderDocumentAssessment(){
  const head=document.querySelector('.documentReviewHead')
  if(!head){document.querySelector('[data-v39-auto-assessment]')?.remove();return}
  const text=document.querySelector('.documentReviewForm textarea[id$="-extracted"],textarea[id*="extracted"]')?.value?.trim()||''
  const deadline=analyzeDeadlines({text})
  const result=autoDocumentAssessment(text,deadline)
  const t=labels[lang()]
  let card=document.querySelector('[data-v39-auto-assessment]')
  if(!card){card=document.createElement('section');card.dataset.v39AutoAssessment='true';card.className='detailCard v39AutoAssessment';head.insertAdjacentElement('afterend',card)}
  const icon=result.trafficLight==='red'?'🔴':result.trafficLight==='green'?'🟢':'🟡'
  const light=t[result.trafficLight]
  card.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V39</span><h3>${escapeHtml(t.auto)}</h3></div><strong>${icon} ${escapeHtml(light)}</strong></div><p><b>${escapeHtml(result.title)}</b></p><small>${escapeHtml(t.provisional)}</small><p><b>${escapeHtml(t.basis)}:</b> ${escapeHtml(result.reason)}</p><p><b>${escapeHtml(t.next)}:</b> ${escapeHtml(result.nextStep)}</p>`
}

function renderTimeline(){
  const grid=document.querySelector('.caseCoreGrid')
  if(!grid){document.querySelector('[data-v39-timeline]')?.remove();return}
  const t=labels[lang()]
  const entries=[]
  const cards=[...grid.querySelectorAll(':scope > article')]
  const deadlineText=cards[2]?.querySelector('p')?.textContent?.trim()||''
  const deadlineDate=parsedDate(deadlineText)
  if(deadlineDate) entries.push({date:deadlineDate,type:'deadline',title:t.deadline,detail:deadlineText})
  document.querySelectorAll('.sourceList button').forEach(button=>{
    const rawDate=button.querySelector('span')?.textContent?.trim()||''
    const date=parsedDate(rawDate)
    const title=button.querySelector('b')?.textContent?.trim()||t.document
    if(date) entries.push({date,type:'document',title,detail:rawDate})
  })
  const sorted=sortTimelineEntries(entries)
  let section=document.querySelector('[data-v39-timeline]')
  if(!section){section=document.createElement('section');section.dataset.v39Timeline='true';section.className='detailCard v39Timeline';grid.insertAdjacentElement('afterend',section)}
  const rows=sorted.length?sorted.map(entry=>`<li><time>${escapeHtml(entry.date)}</time><div><b>${escapeHtml(entry.type==='deadline'?t.deadline:t.document)} · ${escapeHtml(entry.title)}</b><small>${escapeHtml(entry.detail||'')}</small></div></li>`).join(''):`<li class="emptyState">${escapeHtml(t.noTimeline)}</li>`
  section.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V39</span><h3>${escapeHtml(t.timeline)}</h3></div></div><ol class="v39TimelineList">${rows}</ol>`
}

export function V39CaseTimelineAutoAssessment(){
  useEffect(()=>{
    const render=()=>{renderDocumentAssessment();renderTimeline()}
    render()
    const observer=new MutationObserver(render)
    observer.observe(document.body,{childList:true,subtree:true,characterData:true})
    document.addEventListener('input',render,true)
    const timer=setInterval(render,1000)
    return()=>{observer.disconnect();document.removeEventListener('input',render,true);clearInterval(timer);document.querySelector('[data-v39-auto-assessment]')?.remove();document.querySelector('[data-v39-timeline]')?.remove()}
  },[])
  return null
}
