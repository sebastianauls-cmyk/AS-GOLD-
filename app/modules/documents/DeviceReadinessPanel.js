'use client'

import { useState } from 'react'

const copy={
  de:{title:'Geräte-Check',help:'Prüfen Sie Kamera und Mikrofon nur bei Bedarf. Die Abfrage startet erst nach Ihrem Klick.',mic:'Mikrofon prüfen',cam:'Kamera prüfen',idle:'Noch nicht geprüft',checking:'Wird geprüft …',ok:'Verfügbar und freigegeben',denied:'Zugriff abgelehnt. Bitte Browser-/App-Berechtigung erlauben.',missing:'Auf diesem Gerät oder Browser nicht verfügbar.',manual:'Sie können den erkannten Text jederzeit auch manuell eingeben und Dokumente als Datei hochladen.'},
  en:{title:'Device check',help:'Check camera and microphone only when needed. Permission is requested only after you click.',mic:'Check microphone',cam:'Check camera',idle:'Not checked yet',checking:'Checking …',ok:'Available and permitted',denied:'Access denied. Please allow the browser/app permission.',missing:'Not available on this device or browser.',manual:'You can always type the text manually and upload documents as files.'},
  pl:{title:'Sprawdzenie urządzenia',help:'Sprawdź kamerę i mikrofon tylko w razie potrzeby. Uprawnienie jest wymagane dopiero po kliknięciu.',mic:'Sprawdź mikrofon',cam:'Sprawdź kamerę',idle:'Jeszcze nie sprawdzono',checking:'Sprawdzanie …',ok:'Dostępne i dozwolone',denied:'Dostęp odrzucony. Zezwól na uprawnienie w przeglądarce/aplikacji.',missing:'Niedostępne na tym urządzeniu lub w tej przeglądarce.',manual:'Tekst można zawsze wpisać ręcznie, a dokument przesłać jako plik.'},
  tr:{title:'Cihaz kontrolü',help:'Kamera ve mikrofonu yalnızca gerektiğinde kontrol edin. İzin yalnızca tıkladığınızda istenir.',mic:'Mikrofonu kontrol et',cam:'Kamerayı kontrol et',idle:'Henüz kontrol edilmedi',checking:'Kontrol ediliyor …',ok:'Kullanılabilir ve izinli',denied:'Erişim reddedildi. Tarayıcı/uygulama iznini açın.',missing:'Bu cihazda veya tarayıcıda kullanılamıyor.',manual:'Metni her zaman elle girebilir ve belgeyi dosya olarak yükleyebilirsiniz.'},
  ru:{title:'Проверка устройства',help:'Проверяйте камеру и микрофон только при необходимости. Разрешение запрашивается только после нажатия.',mic:'Проверить микрофон',cam:'Проверить камеру',idle:'Еще не проверено',checking:'Проверка …',ok:'Доступно и разрешено',denied:'Доступ запрещен. Разрешите доступ в браузере/приложении.',missing:'Недоступно на этом устройстве или в браузере.',manual:'Текст всегда можно ввести вручную, а документ загрузить как файл.'},
  ar:{title:'فحص الجهاز',help:'افحص الكاميرا والميكروفون عند الحاجة فقط. لن يُطلب الإذن إلا بعد الضغط.',mic:'فحص الميكروفون',cam:'فحص الكاميرا',idle:'لم يتم الفحص بعد',checking:'جارٍ الفحص …',ok:'متاح ومسموح',denied:'تم رفض الوصول. يرجى السماح بالإذن في المتصفح أو التطبيق.',missing:'غير متاح على هذا الجهاز أو المتصفح.',manual:'يمكنك دائمًا كتابة النص يدويًا ورفع المستند كملف.'},
  fr:{title:'Vérification de l’appareil',help:'Vérifiez caméra et micro uniquement si nécessaire. L’autorisation n’est demandée qu’après votre clic.',mic:'Vérifier le micro',cam:'Vérifier la caméra',idle:'Pas encore vérifié',checking:'Vérification …',ok:'Disponible et autorisé',denied:'Accès refusé. Autorisez la permission du navigateur/de l’application.',missing:'Non disponible sur cet appareil ou navigateur.',manual:'Vous pouvez toujours saisir le texte manuellement et téléverser le document comme fichier.'},
  fa:{title:'بررسی دستگاه',help:'دوربین و میکروفون فقط در صورت نیاز بررسی می‌شوند. اجازه فقط پس از کلیک شما درخواست می‌شود.',mic:'بررسی میکروفون',cam:'بررسی دوربین',idle:'هنوز بررسی نشده',checking:'در حال بررسی …',ok:'در دسترس و مجاز',denied:'دسترسی رد شد. اجازه مرورگر/برنامه را فعال کنید.',missing:'در این دستگاه یا مرورگر در دسترس نیست.',manual:'همیشه می‌توانید متن را دستی وارد و سند را به‌صورت فایل بارگذاری کنید.'},
  ro:{title:'Verificare dispozitiv',help:'Verificați camera și microfonul doar când este necesar. Permisiunea este cerută numai după clic.',mic:'Verifică microfonul',cam:'Verifică camera',idle:'Neverificat',checking:'Se verifică …',ok:'Disponibil și permis',denied:'Acces refuzat. Permiteți accesul în browser/aplicație.',missing:'Indisponibil pe acest dispozitiv sau browser.',manual:'Puteți introduce textul manual și încărca documentul ca fișier în orice moment.'},
  bg:{title:'Проверка на устройството',help:'Проверявайте камерата и микрофона само при нужда. Разрешението се иска едва след натискане.',mic:'Провери микрофона',cam:'Провери камерата',idle:'Още не е проверено',checking:'Проверява се …',ok:'Налично и разрешено',denied:'Достъпът е отказан. Разрешете достъпа в браузъра/приложението.',missing:'Не е налично на това устройство или браузър.',manual:'Винаги можете да въведете текста ръчно и да качите документа като файл.'},
  vi:{title:'Kiểm tra thiết bị',help:'Chỉ kiểm tra camera và micro khi cần. Quyền truy cập chỉ được yêu cầu sau khi bạn bấm.',mic:'Kiểm tra micro',cam:'Kiểm tra camera',idle:'Chưa kiểm tra',checking:'Đang kiểm tra …',ok:'Có sẵn và đã cho phép',denied:'Quyền truy cập bị từ chối. Hãy cho phép trong trình duyệt/ứng dụng.',missing:'Không có trên thiết bị hoặc trình duyệt này.',manual:'Bạn luôn có thể nhập văn bản thủ công và tải tài liệu lên dưới dạng tệp.'}
}

function statusView(value,c){
  if(value==='checking') return `🟡 ${c.checking}`
  if(value==='ok') return `🟢 ${c.ok}`
  if(value==='denied') return `🔴 ${c.denied}`
  if(value==='missing') return `🔴 ${c.missing}`
  return `⚪ ${c.idle}`
}

export default function DeviceReadinessPanel({language='de'}){
  const c=copy[language]||copy.de
  const [mic,setMic]=useState('idle')
  const [cam,setCam]=useState('idle')

  async function check(kind){
    const setter=kind==='audio'?setMic:setCam
    setter('checking')
    if(typeof navigator==='undefined'||!navigator.mediaDevices?.getUserMedia){setter('missing');return}
    try{
      const stream=await navigator.mediaDevices.getUserMedia(kind==='audio'?{audio:true}:{video:true})
      stream.getTracks().forEach(track=>track.stop())
      setter('ok')
    }catch(error){
      const name=String(error?.name||'')
      setter(['NotAllowedError','SecurityError','PermissionDeniedError'].includes(name)?'denied':'missing')
    }
  }

  return <section className="detailCard" aria-live="polite">
    <div className="detailCardHead"><div><b>📱 {c.title}</b><p className="muted">{c.help}</p></div></div>
    <div className="modeSwitch"><button type="button" onClick={()=>check('audio')}>{c.mic}</button><button type="button" onClick={()=>check('video')}>{c.cam}</button></div>
    <div className="analysisFacts"><div><span><small>{c.mic}</small><strong>{statusView(mic,c)}</strong></span><span><small>{c.cam}</small><strong>{statusView(cam,c)}</strong></span></div></div>
    <p className="muted">{c.manual}</p>
  </section>
}
