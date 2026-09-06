const imageExtensions=new Set(['jpg','jpeg','png','webp','heic','heif','tif','tiff'])

const messages={
  de:{quality_pending:'Bitte warten Sie, bis die Bildqualität vollständig geprüft wurde.',quality_bad:'Dieses Bild ist nicht zuverlässig lesbar. Bitte nehmen Sie das Dokument erneut und schärfer auf.',upload_failed:'Das Dokument konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.',upload_network:'Die Verbindung zum sicheren Dokumentenspeicher wurde unterbrochen. Die App hat den Upload sicher geprüft und einmal wiederholt. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'},
  en:{quality_pending:'Please wait until the image quality check is complete.',quality_bad:'This image is not reliably readable. Please capture the document again more clearly.',upload_failed:'The document could not be uploaded. Please try again.',upload_network:'The connection to secure document storage was interrupted. The app safely checked the upload and retried once. Check your internet connection and try again.'},
  tr:{quality_pending:'Lütfen görüntü kalitesi kontrolü tamamlanana kadar bekleyin.',quality_bad:'Bu görüntü güvenilir biçimde okunamıyor. Lütfen belgeyi daha net yeniden çekin.',upload_failed:'Belge yüklenemedi. Lütfen yeniden deneyin.',upload_network:'Güvenli belge deposuna bağlantı kesildi. Uygulama yüklemeyi güvenli biçimde kontrol edip bir kez yineledi. İnternet bağlantınızı kontrol edip yeniden deneyin.'},
  pl:{quality_pending:'Poczekaj, aż kontrola jakości obrazu zostanie zakończona.',quality_bad:'Obraz nie jest wystarczająco czytelny. Zrób wyraźniejsze zdjęcie dokumentu.',upload_failed:'Nie udało się przesłać dokumentu. Spróbuj ponownie.',upload_network:'Połączenie z bezpiecznym magazynem dokumentów zostało przerwane. Aplikacja bezpiecznie sprawdziła przesyłanie i ponowiła je raz. Sprawdź internet i spróbuj ponownie.'},
  ru:{quality_pending:'Дождитесь завершения проверки качества изображения.',quality_bad:'Изображение недостаточно читаемо. Сфотографируйте документ ещё раз более чётко.',upload_failed:'Не удалось загрузить документ. Повторите попытку.',upload_network:'Соединение с защищённым хранилищем документов было прервано. Приложение безопасно проверило загрузку и повторило её один раз. Проверьте интернет и повторите попытку.'},
  ar:{quality_pending:'يرجى الانتظار حتى يكتمل فحص جودة الصورة.',quality_bad:'الصورة غير مقروءة بشكل موثوق. يرجى تصوير المستند مرة أخرى بوضوح أكبر.',upload_failed:'تعذر رفع المستند. يرجى المحاولة مرة أخرى.',upload_network:'انقطع الاتصال بمخزن المستندات الآمن. تحقّق التطبيق من الرفع بأمان وأعاد المحاولة مرة واحدة. افحص اتصال الإنترنت ثم حاول مجدداً.'},
  fa:{quality_pending:'لطفاً تا پایان بررسی کیفیت تصویر صبر کنید.',quality_bad:'این تصویر به‌طور قابل اعتماد خوانا نیست. لطفاً دوباره و واضح‌تر از سند عکس بگیرید.',upload_failed:'بارگذاری سند انجام نشد. لطفاً دوباره تلاش کنید.',upload_network:'اتصال به فضای امن اسناد قطع شد. برنامه بارگذاری را به‌صورت امن بررسی و یک بار تکرار کرد. اتصال اینترنت را بررسی و دوباره تلاش کنید.'},
  fr:{quality_pending:"Veuillez attendre la fin du contrôle de qualité de l’image.",quality_bad:"Cette image n’est pas suffisamment lisible. Reprenez le document plus nettement.",upload_failed:"Le document n’a pas pu être téléversé. Veuillez réessayer.",upload_network:"La connexion au stockage sécurisé des documents a été interrompue. L’application a vérifié le téléversement et l’a réessayé une fois en toute sécurité. Vérifiez votre connexion internet et réessayez."},
  ro:{quality_pending:'Așteptați finalizarea verificării calității imaginii.',quality_bad:'Imaginea nu este suficient de lizibilă. Fotografiați din nou documentul mai clar.',upload_failed:'Documentul nu a putut fi încărcat. Încercați din nou.',upload_network:'Conexiunea la stocarea securizată a documentelor a fost întreruptă. Aplicația a verificat în siguranță încărcarea și a reîncercat o dată. Verificați conexiunea la internet și încercați din nou.'},
  bg:{quality_pending:'Изчакайте проверката на качеството на изображението да завърши.',quality_bad:'Изображението не е достатъчно четливо. Заснемете документа отново по-ясно.',upload_failed:'Документът не можа да бъде качен. Опитайте отново.',upload_network:'Връзката със защитеното хранилище за документи беше прекъсната. Приложението провери качването безопасно и опита още веднъж. Проверете интернет връзката и опитайте отново.'},
  vi:{quality_pending:'Vui lòng chờ đến khi kiểm tra chất lượng hình ảnh hoàn tất.',quality_bad:'Hình ảnh này chưa đủ rõ để đọc tin cậy. Vui lòng chụp lại tài liệu rõ hơn.',upload_failed:'Không thể tải tài liệu lên. Vui lòng thử lại.',upload_network:'Kết nối tới kho tài liệu bảo mật đã bị gián đoạn. Ứng dụng đã kiểm tra an toàn và thử tải lên lại một lần. Hãy kiểm tra kết nối internet rồi thử lại.'}
}

export function parseIntakeQuality(value){
  if(!value)return {state:'unknown'}
  try{
    const parsed=JSON.parse(value)
    return parsed&&typeof parsed==='object'?parsed:{state:'unknown'}
  }catch{return {state:'unknown'}}
}

export function isImageDocument({fileType='',extension='',source='upload'}={}){
  return source==='scan'||String(fileType).startsWith('image/')||imageExtensions.has(String(extension).toLowerCase())
}

export function validateDocumentUploadReadiness({fileType='',extension='',source='upload',intakeQuality={}}={}){
  const isImage=isImageDocument({fileType,extension,source})
  if(!isImage)return {ok:true,code:'ready'}
  if(intakeQuality?.state==='bad')return {ok:false,code:'quality_bad'}
  if(['good','weak'].includes(intakeQuality?.state))return {ok:true,code:'ready'}
  return {ok:false,code:'quality_pending'}
}

export function documentUploadReadinessMessage(language,code){
  const selected=messages[language]||messages.de
  return selected[code]||messages.de[code]||messages.de.upload_failed
}
