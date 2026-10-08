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

const guidance={
  de:{start:'Brief oder Foto hinzufügen',startHelp:'Wählen Sie Ihren Brief aus. Anschließend können Sie die Datei prüfen und im Fall speichern.',change:'Andere Datei auswählen'},
  en:{start:'Add a letter or photo',startHelp:'Choose your letter. You can then check the file and save it to this case.',change:'Choose another file'},
  pl:{start:'Dodaj pismo lub zdjęcie',startHelp:'Wybierz pismo. Następnie możesz sprawdzić plik i zapisać go w tej sprawie.',change:'Wybierz inny plik'},
  tr:{start:'Mektup veya fotoğraf ekle',startHelp:'Mektubunuzu seçin. Ardından dosyayı kontrol edip bu vakaya kaydedebilirsiniz.',change:'Başka dosya seç'},
  ru:{start:'Добавить письмо или фото',startHelp:'Выберите письмо. Затем можно проверить файл и сохранить его в этом деле.',change:'Выбрать другой файл'},
  ar:{start:'إضافة خطاب أو صورة',startHelp:'اختر خطابك. يمكنك بعدها مراجعة الملف وحفظه في هذه الحالة.',change:'اختيار ملف آخر'},
  fa:{start:'افزودن نامه یا عکس',startHelp:'نامه خود را انتخاب کنید. سپس می‌توانید فایل را بررسی و در این پرونده ذخیره کنید.',change:'انتخاب فایل دیگر'},
  fr:{start:'Ajouter un courrier ou une photo',startHelp:'Choisissez votre courrier. Vous pourrez ensuite vérifier le fichier et l’enregistrer dans ce dossier.',change:'Choisir un autre fichier'},
  ro:{start:'Adaugă o scrisoare sau o fotografie',startHelp:'Alegeți scrisoarea. Apoi puteți verifica fișierul și îl puteți salva în acest caz.',change:'Alege alt fișier'},
  bg:{start:'Добавете писмо или снимка',startHelp:'Изберете писмото си. След това можете да проверите файла и да го запазите към този случай.',change:'Изберете друг файл'},
  vi:{start:'Thêm thư hoặc ảnh',startHelp:'Chọn thư của bạn. Sau đó, bạn có thể kiểm tra tệp và lưu vào hồ sơ này.',change:'Chọn tệp khác'}
}

export function documentPickerCopy(language='de'){return {...(copy[language]||copy.de),...(guidance[language]||guidance.de)}}
