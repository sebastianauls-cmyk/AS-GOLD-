import { caseDeadlineEntries } from './caseDeadlineEvidence.mjs'

// Original-text candidates remain separate from manually entered deadlines.
// Neither a detected date nor an upload timestamp silently changes the case.
export function documentDeadlineCandidates(item,documents=[]) {
  const seen=new Set()
  return caseDeadlineEntries(item,documents).filter(entry=>{const key=entry.document_id+'|'+entry.date.toISOString()+'|'+entry.context;if(seen.has(key))return false;seen.add(key);return true}).map(entry=>({...entry,date:entry.date.toISOString().slice(0,10),quote:entry.context,case_id:item.id,confirmed:false})).sort((a,b)=>a.date.localeCompare(b.date)||String(a.document_id).localeCompare(String(b.document_id)))
}

const copy={
 de:['Erkannte Datumsangaben - Prüfung offen','Diese Daten stammen aus Unterlagen. Prüfe Bedeutung, Aktualität und mögliche Ersetzung, bevor du eine Fallfrist einträgst.','Datumsangaben','Original öffnen','Fallfrist bearbeiten'],
 en:['Detected dates - review pending','These dates come from documents. Check their meaning, currency and possible replacement before entering a case deadline.','detected dates','Open original','Edit case deadline'],
 fr:['Dates détectées - à vérifier','Vérifiez le sens, l’actualité et le remplacement éventuel de ces dates avant de saisir un délai.','dates détectées','Ouvrir l’original','Modifier le délai'],
 tr:['Algılanan tarihler - inceleme bekliyor','Dosya süresi girmeden önce bu tarihlerin anlamını, güncelliğini ve değiştirilip değiştirilmediğini kontrol edin.','algılanan tarih','Aslını aç','Dosya süresini düzenle'],
 pl:['Wykryte daty - do sprawdzenia','Przed wpisaniem terminu sprawdź znaczenie, aktualność i ewentualną zmianę tych dat.','wykryte daty','Otwórz oryginał','Edytuj termin sprawy'],
 ru:['Найденные даты - требуется проверка','Перед вводом срока дела проверьте значение, актуальность и возможную замену этих дат.','найденные даты','Открыть оригинал','Изменить срок дела'],
 ar:['تواريخ مكتشفة - بانتظار المراجعة','تحقق من معنى التواريخ وحداثتها واحتمال استبدالها قبل إدخال موعد للحالة.','تواريخ مكتشفة','فتح الأصل','تعديل موعد الحالة'],
 fa:['تاریخ‌های شناسایی‌شده - نیازمند بررسی','پیش از ثبت مهلت پرونده، معنا، اعتبار زمانی و جایگزینی احتمالی این تاریخ‌ها را بررسی کنید.','تاریخ شناسایی‌شده','باز کردن اصل','ویرایش مهلت پرونده'],
 ro:['Date detectate - de verificat','Verificați sensul, actualitatea și eventuala înlocuire a datelor înainte de a introduce un termen.','date detectate','Deschide originalul','Modifică termenul'],
 bg:['Открити дати - предстои проверка','Проверете значението, актуалността и евентуалната замяна на датите, преди да въведете срок.','открити дати','Отвори оригинала','Промени срока'],
 vi:['Ngày được phát hiện - cần kiểm tra','Kiểm tra ý nghĩa, tính hiện hành và khả năng thay thế của các ngày trước khi nhập thời hạn hồ sơ.','ngày được phát hiện','Mở bản gốc','Sửa thời hạn hồ sơ']
}
const states={
 de:['Aktuell vorgeschlagen · unbestätigt','Laut Unterlage ersetzt','Ursprüngliche Rechnungsfälligkeit · Verlauf'],
 en:['Current proposal · unconfirmed','Replaced according to document','Original invoice due date · history'],
 fr:['Proposition actuelle · non confirmée','Remplacée selon le document','Échéance initiale de facture · historique'],
 tr:['Güncel öneri · onaylanmadı','Belgeye göre değiştirildi','İlk fatura vadesi · geçmiş'],
 pl:['Aktualna propozycja · niepotwierdzona','Zastąpiony według dokumentu','Pierwotna płatność faktury · historia'],
 ru:['Текущее предложение · не подтверждено','Заменено согласно документу','Первоначальный срок счета · история'],
 ar:['اقتراح حالي · غير مؤكد','استُبدل وفق المستند','موعد الفاتورة الأصلي · السجل'],
 fa:['پیشنهاد فعلی · تأیید نشده','طبق سند جایگزین شده','سررسید اولیه فاکتور · سابقه'],
 ro:['Propunere actuală · neconfirmată','Înlocuit conform documentului','Scadența inițială a facturii · istoric'],
 bg:['Текущо предложение · непотвърдено','Заменено според документа','Първоначален падеж на фактура · история'],
 vi:['Đề xuất hiện tại · chưa xác nhận','Đã thay thế theo tài liệu','Hạn hóa đơn ban đầu · lịch sử']
}
export function deadlineCandidateCopy(language='de') {const [title,note,short,open,edit]=copy[language]||copy.de;const [active,superseded,historical]=states[language]||states.de;return {title,note,short,open,edit,active,superseded,historical}}
