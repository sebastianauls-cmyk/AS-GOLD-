import { extractDeadlineDates } from './deadlineIntelligence.mjs'

// Original-text candidates remain separate from manually entered deadlines.
// Neither a detected date nor an upload timestamp silently changes the case.
export function documentDeadlineCandidates(item,documents=[]) {
  const candidates=[]
  for(const document of documents) {
    if(document.case_id!==item?.id||(item?.owner_id&&document.owner_id!==item.owner_id))continue
    const seen=new Set()
    for(const entry of extractDeadlineDates(document.extracted_text||'')) {
      const date=entry.date.toISOString().slice(0,10),key=date+'|'+entry.context
      if(seen.has(key))continue
      seen.add(key)
      candidates.push({date,quote:entry.context,document_id:document.id,document_title:document.title||'',case_id:item.id,confirmed:false})
    }
  }
  return candidates.sort((a,b)=>a.date.localeCompare(b.date)||String(a.document_id).localeCompare(String(b.document_id)))
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
export function deadlineCandidateCopy(language='de') {const [title,note,short,open,edit]=copy[language]||copy.de;return {title,note,short,open,edit}}
