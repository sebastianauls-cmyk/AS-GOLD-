import {documentTimelineEntry} from './caseIntelligence.mjs'

const copy={
  de:{document:'Dokumentdatum',upload:'Hochgeladen',unknown:'Dokumentdatum unbekannt',note:'Das Uploaddatum ist kein Ereignis- oder Zugangsdatum.'},
  en:{document:'Document date',upload:'Uploaded',unknown:'Document date unknown',note:'The upload date is not an event or receipt date.'},
  fr:{document:'Date du document',upload:'Téléversé',unknown:'Date du document inconnue',note:'La date de téléversement ne prouve pas la date d’un événement ou de réception.'},
  tr:{document:'Belge tarihi',upload:'Yüklendi',unknown:'Belge tarihi bilinmiyor',note:'Yükleme tarihi, olay veya teslim alma tarihi değildir.'},
  pl:{document:'Data dokumentu',upload:'Przesłano',unknown:'Data dokumentu nieznana',note:'Data przesłania nie jest datą zdarzenia ani doręczenia.'},
  ru:{document:'Дата документа',upload:'Загружено',unknown:'Дата документа неизвестна',note:'Дата загрузки не является датой события или получения.'},
  ar:{document:'تاريخ المستند',upload:'تم الرفع',unknown:'تاريخ المستند غير معروف',note:'تاريخ الرفع ليس تاريخ الواقعة أو الاستلام.'},
  fa:{document:'تاریخ سند',upload:'بارگذاری شده',unknown:'تاریخ سند نامشخص است',note:'تاریخ بارگذاری، تاریخ رویداد یا دریافت نیست.'},
  ro:{document:'Data documentului',upload:'Încărcat',unknown:'Data documentului necunoscută',note:'Data încărcării nu este data unui eveniment sau a primirii.'},
  bg:{document:'Дата на документа',upload:'Качено',unknown:'Датата на документа е неизвестна',note:'Датата на качване не е дата на събитие или получаване.'},
  vi:{document:'Ngày tài liệu',upload:'Đã tải lên',unknown:'Chưa rõ ngày tài liệu',note:'Ngày tải lên không phải ngày xảy ra sự việc hoặc ngày nhận.'}
}
export function timelineDateCopy(language='de'){return copy[language]||copy.de}

export function documentDateLabel(document,language='de'){
  const entry=documentTimelineEntry(document),labels=timelineDateCopy(language)
  if(entry.dateBasis==='document_date')return `${labels.document}: ${entry.date}`
  if(entry.dateBasis==='created_at')return `${labels.upload}: ${entry.date} · ${labels.unknown}`
  return labels.unknown
}
