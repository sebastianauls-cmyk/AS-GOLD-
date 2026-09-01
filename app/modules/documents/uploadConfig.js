// Temporary V26 test ceiling. The final product limit is defined only after the
// complete document workflow and tariff model have been approved. Supabase Free
// currently allows at most 50 MB per file globally.
export const maxUploadBytes = 50 * 1024 * 1024
export const allowedUploadExtensions = new Set(['pdf','txt','csv','rtf','eml','msg','jpg','jpeg','png','webp','heic','heif','tif','tiff','doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp'])
export const allowedUploadAccept = [...allowedUploadExtensions].map(extension=>`.${extension}`).join(',')
export const uploadUi = {
  de:{tooLarge:'Die Datei ist größer als 50 MB.',unsupported:'Dieses Dateiformat wird nicht unterstützt.',testLimit:'Testphase: vorläufig maximal 50 MB pro Datei. Die endgültige Grenze wird erst nach der vollständigen App-Definition festgelegt.'},
  en:{tooLarge:'The file is larger than 50 MB.',unsupported:'This file format is not supported.',testLimit:'Test phase: temporary maximum of 50 MB per file. The final limit will be set only after the complete app definition.'},
  tr:{tooLarge:'Dosya 50 MB’den büyük.',unsupported:'Bu dosya biçimi desteklenmiyor.',testLimit:'Test aşaması: dosya başına geçici olarak en fazla 50 MB. Nihai sınır, uygulama tamamen tanımlandıktan sonra belirlenecektir.'},
  pl:{tooLarge:'Plik jest większy niż 50 MB.',unsupported:'Ten format pliku nie jest obsługiwany.',testLimit:'Faza testowa: tymczasowo maksymalnie 50 MB na plik. Ostateczny limit zostanie ustalony dopiero po pełnym zdefiniowaniu aplikacji.'},
  ru:{tooLarge:'Размер файла превышает 50 МБ.',unsupported:'Этот формат файла не поддерживается.',testLimit:'Тестовый этап: временно не более 50 МБ на файл. Окончательный лимит будет установлен только после полного определения приложения.'},
  ar:{tooLarge:'حجم الملف أكبر من 50 ميغابايت.',unsupported:'تنسيق الملف هذا غير مدعوم.',testLimit:'مرحلة الاختبار: الحد المؤقت 50 ميغابايت لكل ملف. لن يُحدد الحد النهائي إلا بعد اكتمال تعريف التطبيق.'}
}
