const texts={
  de:['Dokument wird ausgelesen …','Angaben werden gegengeprüft …','Beanstandete Angaben werden korrigiert …','Korrektur wird gegengeprüft …','Analyse nicht abgeschlossen','Noch offene Prüfbereiche','Originaltext / Übersetzung','Zusammenfassung','Nächster Schritt','Anschreiben / Absenderrolle','Ampel / Begründung','Ausgabe'],
  en:['Reading the document …','Checking the findings …','Correcting flagged findings …','Checking the correction …','Analysis incomplete','Areas still requiring review','Original text / translation','Summary','Next step','Letter / sender role','Status / reasoning','Output'],
  pl:['Odczytywanie dokumentu …','Sprawdzanie ustaleń …','Poprawianie zakwestionowanych danych …','Sprawdzanie poprawek …','Analiza niezakończona','Obszary wymagające sprawdzenia','Tekst oryginalny / tłumaczenie','Podsumowanie','Następny krok','Pismo / rola nadawcy','Status / uzasadnienie','Wynik'],
  tr:['Belge okunuyor …','Bulgular kontrol ediliyor …','İşaretlenen bilgiler düzeltiliyor …','Düzeltme kontrol ediliyor …','Analiz tamamlanmadı','Kontrol edilmesi gereken alanlar','Özgün metin / çeviri','Özet','Sonraki adım','Yazı / gönderenin rolü','Durum / gerekçe','Çıktı'],
  ru:['Чтение документа …','Проверка сведений …','Исправление отмеченных сведений …','Проверка исправления …','Анализ не завершён','Разделы для дополнительной проверки','Оригинал / перевод','Резюме','Следующий шаг','Письмо / роль отправителя','Статус / обоснование','Результат'],
  ar:['تجري قراءة المستند …','تجري مراجعة المعلومات …','يجري تصحيح المعلومات المحددة …','تجري مراجعة التصحيح …','لم يكتمل التحليل','مجالات لا تزال بحاجة للمراجعة','النص الأصلي / الترجمة','الملخص','الخطوة التالية','الخطاب / صفة المرسل','الحالة / التعليل','النتيجة'],
  fr:['Lecture du document …','Vérification des informations …','Correction des informations signalées …','Vérification de la correction …','Analyse inachevée','Éléments restant à vérifier','Texte original / traduction','Résumé','Prochaine étape','Courrier / rôle de l’expéditeur','Statut / justification','Résultat'],
  fa:['در حال خواندن سند …','در حال بررسی اطلاعات …','در حال اصلاح اطلاعات مشخص‌شده …','در حال بررسی اصلاحات …','تحلیل تکمیل نشده است','بخش‌های نیازمند بررسی','متن اصلی / ترجمه','خلاصه','گام بعدی','نامه / نقش فرستنده','وضعیت / دلیل','نتیجه'],
  ro:['Se citește documentul …','Se verifică informațiile …','Se corectează informațiile semnalate …','Se verifică corectura …','Analiză nefinalizată','Aspecte care mai necesită verificare','Text original / traducere','Rezumat','Pasul următor','Scrisoare / rolul expeditorului','Stare / justificare','Rezultat'],
  bg:['Документът се прочита …','Информацията се проверява …','Отбелязаните данни се коригират …','Корекцията се проверява …','Анализът не е завършен','Области за допълнителна проверка','Оригинален текст / превод','Обобщение','Следваща стъпка','Писмо / роля на подателя','Статус / обосновка','Резултат'],
  vi:['Đang đọc tài liệu …','Đang đối chiếu thông tin …','Đang sửa thông tin được đánh dấu …','Đang kiểm tra bản sửa …','Phân tích chưa hoàn tất','Các phần cần kiểm tra thêm','Văn bản gốc / bản dịch','Tóm tắt','Bước tiếp theo','Thư / vai trò người gửi','Trạng thái / lý do','Kết quả']
}
export function documentAnalysisProgressCopy(language='de') {
  const [reading,reviewing,correcting,reviewingCorrection,analysisFailed,reviewAreas,...areas]=texts[language]||texts.de
  return {reading,reviewing,correcting,reviewingCorrection,analysisFailed,reviewAreas,areas}
}
export function documentAnalysisProgressLabel(copy,progress) {
  if(progress?.stage==='correction')return copy.correcting
  if(progress?.stage==='review')return progress.attempt===2?copy.reviewingCorrection:copy.reviewing
  return copy.reading
}
export function documentReviewAreas(issues,areas) {
  // Model prose is diagnostic data, not user instructions or a translated UI.
  // Show only known field categories; keep precise reasons in the server response.
  const groups=[/extracted_text|document_translation|source_language|transcription/u,/summary/u,/next_step/u,/reference_copy|customer_copy|response_|sender|recipient/u,/traffic_light|assessment_reasoning/u]
  return [...new Set((Array.isArray(issues)?issues:[]).slice(0,8).map(issue=>{
    const index=groups.findIndex(pattern=>pattern.test(String(issue?.location||'').slice(0,120)))
    return areas[index<0?5:index]
  }))]
}
