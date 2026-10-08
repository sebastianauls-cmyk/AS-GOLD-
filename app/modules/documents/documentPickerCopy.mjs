const copy={
  de:{photo:'Foto aufnehmen',file:'Datei auswählen',selected:'Ausgewählt – noch nicht hochgeladen',empty:'Foto aufnehmen oder eine vorhandene Datei auswählen.',save:'Dokument hochladen',preview:'Vorschau des ausgewählten Fotos'},
  en:{photo:'Take a photo',file:'Choose a file',selected:'Selected – not uploaded yet',empty:'Take a photo or choose an existing file.',save:'Upload document',preview:'Preview of the selected photo'},
  pl:{photo:'Zrób zdjęcie',file:'Wybierz plik',selected:'Wybrano – jeszcze nie przesłano',empty:'Zrób zdjęcie lub wybierz istniejący plik.',save:'Prześlij dokument',preview:'Podgląd wybranego zdjęcia'},
  tr:{photo:'Fotoğraf çek',file:'Dosya seç',selected:'Seçildi – henüz yüklenmedi',empty:'Fotoğraf çekin veya mevcut bir dosya seçin.',save:'Belgeyi yükle',preview:'Seçilen fotoğrafın önizlemesi'},
  ru:{photo:'Сделать фото',file:'Выбрать файл',selected:'Выбрано — ещё не загружено',empty:'Сделайте фото или выберите существующий файл.',save:'Загрузить документ',preview:'Предпросмотр выбранного фото'},
  ar:{photo:'التقاط صورة',file:'اختيار ملف',selected:'تم الاختيار — لم يُرفع بعد',empty:'التقط صورة أو اختر ملفاً موجوداً.',save:'رفع المستند',preview:'معاينة الصورة المختارة'},
  fa:{photo:'عکس بگیرید',file:'انتخاب فایل',selected:'انتخاب شد — هنوز بارگذاری نشده',empty:'عکس بگیرید یا یک فایل موجود انتخاب کنید.',save:'بارگذاری سند',preview:'پیش‌نمایش عکس انتخاب‌شده'},
  fr:{photo:'Prendre une photo',file:'Choisir un fichier',selected:'Sélectionné — pas encore envoyé',empty:'Prenez une photo ou choisissez un fichier existant.',save:'Envoyer le document',preview:'Aperçu de la photo sélectionnée'},
  ro:{photo:'Fă o fotografie',file:'Alege un fișier',selected:'Selectat – încă neîncărcat',empty:'Faceți o fotografie sau alegeți un fișier existent.',save:'Încarcă documentul',preview:'Previzualizarea fotografiei selectate'},
  bg:{photo:'Направи снимка',file:'Избери файл',selected:'Избрано – все още не е качено',empty:'Направете снимка или изберете съществуващ файл.',save:'Качи документа',preview:'Преглед на избраната снимка'},
  vi:{photo:'Chụp ảnh',file:'Chọn tệp',selected:'Đã chọn – chưa tải lên',empty:'Chụp ảnh hoặc chọn một tệp có sẵn.',save:'Tải tài liệu lên',preview:'Xem trước ảnh đã chọn'}
}

export function documentPickerCopy(language='de'){return copy[language]||copy.de}
