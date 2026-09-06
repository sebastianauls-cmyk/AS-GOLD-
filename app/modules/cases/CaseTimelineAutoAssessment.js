'use client'

import { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'
import { autoDocumentAssessment,sortTimelineEntries } from '../lib/v39CaseIntelligence.mjs'

export const caseIntelligenceLabels={
  de:{auto:'Automatische Dokument-Ampel',provisional:'Vorläufig – Original prüfen',basis:'Erkannte Grundlage',next:'Nächster Schritt',timeline:'Fall-Timeline',document:'Dokument',deadline:'Frist',caseStart:'Fallstand',noTimeline:'Noch keine datierten Ereignisse erkannt.',green:'Grün',yellow:'Gelb',red:'Rot'},
  en:{auto:'Automatic document traffic light',provisional:'Provisional – verify original',basis:'Detected basis',next:'Next step',timeline:'Case timeline',document:'Document',deadline:'Deadline',caseStart:'Case status',noTimeline:'No dated events detected yet.',green:'Green',yellow:'Yellow',red:'Red'},
  fr:{auto:'Feu automatique du document',provisional:'Provisoire – vérifier l’original',basis:'Base détectée',next:'Étape suivante',timeline:'Chronologie du dossier',document:'Document',deadline:'Délai',caseStart:'État du dossier',noTimeline:'Aucun événement daté détecté.',green:'Vert',yellow:'Jaune',red:'Rouge'},
  tr:{auto:'Otomatik belge trafik ışığı',provisional:'Geçici – orijinali kontrol edin',basis:'Algılanan dayanak',next:'Sonraki adım',timeline:'Dosya zaman çizelgesi',document:'Belge',deadline:'Süre',caseStart:'Dosya durumu',noTimeline:'Henüz tarihli olay algılanmadı.',green:'Yeşil',yellow:'Sarı',red:'Kırmızı'},
  pl:{auto:'Automatyczna sygnalizacja dokumentu',provisional:'Wstępna – sprawdź oryginał',basis:'Rozpoznana podstawa',next:'Następny krok',timeline:'Oś czasu sprawy',document:'Dokument',deadline:'Termin',caseStart:'Stan sprawy',noTimeline:'Nie wykryto jeszcze datowanych zdarzeń.',green:'Zielony',yellow:'Żółty',red:'Czerwony'},
  ru:{auto:'Автоматический светофор документа',provisional:'Предварительно – проверьте оригинал',basis:'Выявленная основа',next:'Следующий шаг',timeline:'Хронология дела',document:'Документ',deadline:'Срок',caseStart:'Состояние дела',noTimeline:'События с датами пока не обнаружены.',green:'Зелёный',yellow:'Жёлтый',red:'Красный'},
  ar:{auto:'إشارة تلقائية للمستند',provisional:'أولي – تحقق من الأصل',basis:'الأساس المكتشف',next:'الخطوة التالية',timeline:'الخط الزمني للحالة',document:'مستند',deadline:'مهلة',caseStart:'حالة الملف',noTimeline:'لم يتم اكتشاف أحداث مؤرخة بعد.',green:'أخضر',yellow:'أصفر',red:'أحمر'},
  fa:{auto:'چراغ خودکار سند',provisional:'موقت – اصل سند بررسی شود',basis:'مبنای شناسایی‌شده',next:'گام بعدی',timeline:'خط زمانی پرونده',document:'سند',deadline:'مهلت',caseStart:'وضعیت پرونده',noTimeline:'هنوز رویداد تاریخ‌دار شناسایی نشده است.',green:'سبز',yellow:'زرد',red:'قرمز'},
  ro:{auto:'Semafor automat al documentului',provisional:'Provizoriu – verificați originalul',basis:'Bază detectată',next:'Pasul următor',timeline:'Cronologia cazului',document:'Document',deadline:'Termen',caseStart:'Starea cazului',noTimeline:'Nu au fost detectate încă evenimente datate.',green:'Verde',yellow:'Galben',red:'Roșu'},
  bg:{auto:'Автоматична оценка на документа',provisional:'Предварително – проверете оригинала',basis:'Разпозната основа',next:'Следваща стъпка',timeline:'Хронология на случая',document:'Документ',deadline:'Срок',caseStart:'Състояние на случая',noTimeline:'Все още няма разпознати събития с дата.',green:'Зелено',yellow:'Жълто',red:'Червено'}
}

function copyFor(language='de'){
  return caseIntelligenceLabels[language]||caseIntelligenceLabels.de
}

function isoDate(value=''){
  const raw=String(value||'').trim()
  if(!raw) return ''
  const iso=raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if(iso) return iso[1]
  const local=raw.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/)
  if(local){const [,d,m,y]=local;return [y,m.padStart(2,'0'),d.padStart(2,'0')].join('-')}
  const date=new Date(raw)
  return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)
}

export function DocumentAutoAssessment({language='de',text=''}){
  const t=copyFor(language)
  const deadline=analyzeDeadlines({text})
  const result=autoDocumentAssessment(text,deadline)
  const icon=result.trafficLight==='red'?'🔴':result.trafficLight==='green'?'🟢':'🟡'
  return <section className="detailCard v39AutoAssessment" data-v39-auto-assessment="true">
    <div className="detailCardHead"><div><h3>{t.auto}</h3></div><strong>{icon} {t[result.trafficLight]}</strong></div>
    <p><b>{result.title}</b></p>
    <small>{t.provisional}</small>
    <p><b>{t.basis}:</b> {result.reason}</p>
    <p><b>{t.next}:</b> {result.nextStep}</p>
  </section>
}

export function CaseTimeline({language='de',caseDeadline='',documents=[]}){
  const t=copyFor(language)
  const entries=[]
  const deadlineDate=isoDate(caseDeadline)
  if(deadlineDate) entries.push({date:deadlineDate,type:'deadline',title:t.deadline,detail:''})
  for(const document of documents){
    const rawDate=document?.document_date||document?.created_at||''
    const date=isoDate(rawDate)
    if(date) entries.push({date,type:'document',title:document?.title||t.document,detail:document?.document_type||''})
  }
  const sorted=sortTimelineEntries(entries)
  return <section className="detailCard v39Timeline" data-v39-timeline="true">
    <div className="detailCardHead"><div><h3>{t.timeline}</h3></div></div>
    <ol className="v39TimelineList">
      {sorted.length?sorted.map((entry,index)=><li key={`${entry.type}-${entry.date}-${index}`}><time dateTime={entry.date}>{entry.date}</time><div><b>{entry.type==='deadline'?t.deadline:t.document} · {entry.title}</b>{entry.detail?<small>{entry.detail}</small>:null}</div></li>):<li className="emptyState">{t.noTimeline}</li>}
    </ol>
  </section>
}

export function V39CaseTimelineAutoAssessment(){ return null }
