'use client'

import { useEffect, useRef, useState } from 'react'

const copy={
  de:{install:'AS Workspace installieren',title:'AS Workspace direkt öffnen',lead:'Einmal installieren und danach wie eine App vom Startbildschirm öffnen.',continue:'Ohne Installation weiter',guideTitle:'Installation auf diesem Gerät',ios:'Tippen Sie unten im Browser auf „Teilen“ und danach auf „Zum Home-Bildschirm“.',android:'Öffnen Sie das Browser-Menü (⋮) und wählen Sie „App installieren“ oder „Zum Startbildschirm hinzufügen“.',inApp:'Diese Seite ist in einer Vorschau geöffnet. Wählen Sie im Menü „In Chrome öffnen“ oder „In Safari öffnen“ und tippen Sie dort auf „AS Workspace installieren“.',desktop:'Nutzen Sie das Installationssymbol in der Adresszeile oder öffnen Sie das Browser-Menü und wählen Sie „App installieren“.',cancelled:'Die Installation wurde abgebrochen. Sie können sie jederzeit erneut starten.',close:'Verstanden'},
  en:{install:'Install AS Workspace',title:'Open AS Workspace directly',lead:'Install it once, then open it like an app from your home screen.',continue:'Continue without installing',guideTitle:'Install on this device',ios:'Tap “Share” in the browser, then choose “Add to Home Screen”.',android:'Open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.',inApp:'This page is open in an in-app preview. Choose “Open in Chrome” or “Open in Safari”, then tap “Install AS Workspace”.',desktop:'Use the install icon in the address bar or open the browser menu and choose “Install app”.',cancelled:'Installation was cancelled. You can start it again at any time.',close:'Got it'},
  fr:{install:'Installer AS Workspace',title:'Ouvrir AS Workspace directement',lead:'Installez-le une fois, puis ouvrez-le comme une application depuis l’écran d’accueil.',continue:'Continuer sans installer',guideTitle:'Installation sur cet appareil',ios:'Touchez « Partager » dans le navigateur, puis « Sur l’écran d’accueil ».',android:'Ouvrez le menu du navigateur (⋮), puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',inApp:'Cette page est ouverte dans un aperçu intégré. Choisissez « Ouvrir dans Chrome » ou « Ouvrir dans Safari », puis « Installer AS Workspace ».',desktop:'Utilisez l’icône d’installation dans la barre d’adresse ou choisissez « Installer l’application » dans le menu.',cancelled:'L’installation a été annulée. Vous pouvez la relancer à tout moment.',close:'Compris'},
  tr:{install:'AS Workspace’i yükle',title:'AS Workspace’i doğrudan açın',lead:'Bir kez yükleyin ve daha sonra ana ekrandan bir uygulama gibi açın.',continue:'Yüklemeden devam et',guideTitle:'Bu cihaza yükleme',ios:'Tarayıcıda “Paylaş”a, ardından “Ana Ekrana Ekle”ye dokunun.',android:'Tarayıcı menüsünü (⋮) açın ve “Uygulamayı yükle” veya “Ana ekrana ekle”yi seçin.',inApp:'Bu sayfa uygulama içi önizlemede açık. Menüden “Chrome’da aç” veya “Safari’de aç”ı seçin ve ardından “AS Workspace’i yükle”ye dokunun.',desktop:'Adres çubuğundaki yükleme simgesini kullanın veya tarayıcı menüsünden “Uygulamayı yükle”yi seçin.',cancelled:'Yükleme iptal edildi. İstediğiniz zaman yeniden başlatabilirsiniz.',close:'Anladım'},
  pl:{install:'Zainstaluj AS Workspace',title:'Otwieraj AS Workspace bezpośrednio',lead:'Zainstaluj raz, a potem otwieraj jak aplikację z ekranu głównego.',continue:'Kontynuuj bez instalacji',guideTitle:'Instalacja na tym urządzeniu',ios:'W przeglądarce stuknij „Udostępnij”, a następnie „Dodaj do ekranu początkowego”.',android:'Otwórz menu przeglądarki (⋮) i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.',inApp:'Strona jest otwarta w podglądzie aplikacji. Wybierz „Otwórz w Chrome” lub „Otwórz w Safari”, a następnie „Zainstaluj AS Workspace”.',desktop:'Użyj ikony instalacji w pasku adresu albo wybierz „Zainstaluj aplikację” w menu przeglądarki.',cancelled:'Instalowanie anulowano. Możesz rozpocząć je ponownie w dowolnej chwili.',close:'Rozumiem'},
  ru:{install:'Установить AS Workspace',title:'Открывайте AS Workspace напрямую',lead:'Установите один раз и запускайте с главного экрана как приложение.',continue:'Продолжить без установки',guideTitle:'Установка на это устройство',ios:'Нажмите «Поделиться» в браузере, затем «На экран Домой».',android:'Откройте меню браузера (⋮) и выберите «Установить приложение» или «Добавить на главный экран».',inApp:'Страница открыта во встроенном просмотре. Выберите «Открыть в Chrome» или «Открыть в Safari», затем нажмите «Установить AS Workspace».',desktop:'Нажмите значок установки в адресной строке или выберите «Установить приложение» в меню браузера.',cancelled:'Установка отменена. Её можно запустить снова в любое время.',close:'Понятно'},
  ar:{install:'تثبيت AS Workspace',title:'افتح AS Workspace مباشرة',lead:'ثبّته مرة واحدة ثم افتحه كتطبيق من الشاشة الرئيسية.',continue:'المتابعة بدون تثبيت',guideTitle:'التثبيت على هذا الجهاز',ios:'اضغط «مشاركة» في المتصفح، ثم اختر «إضافة إلى الشاشة الرئيسية».',android:'افتح قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',inApp:'الصفحة مفتوحة في معاينة داخلية. اختر «فتح في Chrome» أو «فتح في Safari»، ثم اضغط «تثبيت AS Workspace».',desktop:'استخدم رمز التثبيت في شريط العنوان أو اختر «تثبيت التطبيق» من قائمة المتصفح.',cancelled:'تم إلغاء التثبيت. يمكنك بدءه مجدداً في أي وقت.',close:'فهمت'},
  fa:{install:'نصب AS Workspace',title:'AS Workspace را مستقیم باز کنید',lead:'یک‌بار نصب کنید و سپس مانند برنامه از صفحه اصلی باز کنید.',continue:'ادامه بدون نصب',guideTitle:'نصب روی این دستگاه',ios:'در مرورگر روی «اشتراک‌گذاری» و سپس «افزودن به صفحه اصلی» بزنید.',android:'منوی مرورگر (⋮) را باز کنید و «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید.',inApp:'صفحه در پیش‌نمایش داخلی باز است. «باز کردن در Chrome» یا «باز کردن در Safari» را انتخاب کنید و سپس «نصب AS Workspace» را بزنید.',desktop:'از نماد نصب در نوار نشانی استفاده کنید یا در منوی مرورگر «نصب برنامه» را انتخاب کنید.',cancelled:'نصب لغو شد. هر زمان می‌توانید دوباره آن را آغاز کنید.',close:'متوجه شدم'},
  ro:{install:'Instalați AS Workspace',title:'Deschideți direct AS Workspace',lead:'Instalați o singură dată, apoi deschideți aplicația de pe ecranul principal.',continue:'Continuați fără instalare',guideTitle:'Instalare pe acest dispozitiv',ios:'Atingeți „Partajați” în browser, apoi „Adăugați la ecranul principal”.',android:'Deschideți meniul browserului (⋮) și alegeți „Instalați aplicația” sau „Adăugați pe ecranul principal”.',inApp:'Pagina este deschisă într-o previzualizare internă. Alegeți „Deschideți în Chrome” sau „Deschideți în Safari”, apoi „Instalați AS Workspace”.',desktop:'Folosiți pictograma de instalare din bara de adrese sau alegeți „Instalați aplicația” din meniul browserului.',cancelled:'Instalarea a fost anulată. O puteți porni din nou oricând.',close:'Am înțeles'},
  bg:{install:'Инсталирайте AS Workspace',title:'Отваряйте AS Workspace директно',lead:'Инсталирайте веднъж и след това отваряйте като приложение от началния екран.',continue:'Продължете без инсталиране',guideTitle:'Инсталиране на това устройство',ios:'Докоснете „Споделяне“ в браузъра, после „Добавяне към началния екран“.',android:'Отворете менюто на браузъра (⋮) и изберете „Инсталиране на приложението“ или „Добавяне към началния екран“.',inApp:'Страницата е отворена във вграден преглед. Изберете „Отваряне в Chrome” или „Отваряне в Safari”, после „Инсталирайте AS Workspace”.',desktop:'Използвайте иконата за инсталиране в адресната лента или изберете „Инсталиране на приложението“ от менюто.',cancelled:'Инсталирането е отменено. Можете да го стартирате отново по всяко време.',close:'Разбрах'},
  vi:{install:'Cài đặt AS Workspace',title:'Mở AS Workspace trực tiếp',lead:'Chỉ cần cài đặt một lần, sau đó mở như ứng dụng từ màn hình chính.',continue:'Tiếp tục mà không cài đặt',guideTitle:'Cài đặt trên thiết bị này',ios:'Nhấn “Chia sẻ” trong trình duyệt, sau đó chọn “Thêm vào Màn hình chính”.',android:'Mở trình đơn trình duyệt (⋮) và chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.',inApp:'Trang đang mở trong bản xem trước của ứng dụng. Chọn “Mở bằng Chrome” hoặc “Mở bằng Safari”, sau đó nhấn “Cài đặt AS Workspace”.',desktop:'Dùng biểu tượng cài đặt trên thanh địa chỉ hoặc chọn “Cài đặt ứng dụng” trong trình đơn trình duyệt.',cancelled:'Đã hủy cài đặt. Bạn có thể bắt đầu lại bất cứ lúc nào.',close:'Đã hiểu'}
}

const installedCopy={
  de:{title:'AS Workspace ist bereits installiert',lead:'Öffnen Sie die App über das AS-Workspace-Symbol auf Ihrem Startbildschirm.'},
  en:{title:'AS Workspace is already installed',lead:'Open the app from the AS Workspace icon on your home screen.'},
  fr:{title:'AS Workspace est déjà installé',lead:'Ouvrez l’application avec l’icône AS Workspace sur votre écran d’accueil.'},
  tr:{title:'AS Workspace zaten yüklü',lead:'Uygulamayı ana ekranınızdaki AS Workspace simgesinden açın.'},
  pl:{title:'AS Workspace jest już zainstalowany',lead:'Otwórz aplikację ikoną AS Workspace na ekranie głównym.'},
  ru:{title:'AS Workspace уже установлен',lead:'Откройте приложение с помощью значка AS Workspace на главном экране.'},
  ar:{title:'تم تثبيت AS Workspace بالفعل',lead:'افتح التطبيق من رمز AS Workspace على شاشتك الرئيسية.'},
  fa:{title:'AS Workspace از قبل نصب شده است',lead:'برنامه را از نماد AS Workspace در صفحه اصلی باز کنید.'},
  ro:{title:'AS Workspace este deja instalat',lead:'Deschideți aplicația din pictograma AS Workspace de pe ecranul principal.'},
  bg:{title:'AS Workspace вече е инсталиран',lead:'Отворете приложението от иконата AS Workspace на началния екран.'},
  vi:{title:'AS Workspace đã được cài đặt',lead:'Mở ứng dụng từ biểu tượng AS Workspace trên màn hình chính.'}
}

let rememberedInstallPrompt=null
let installationAccepted=false

function installEnvironment(){
  const ua=window.navigator.userAgent||''
  const ios=/iPad|iPhone|iPod/.test(ua)||(window.navigator.platform==='MacIntel'&&window.navigator.maxTouchPoints>1)
  const inApp=/ChatGPT|FBAN|FBAV|Instagram|WhatsApp|; wv\)|\bwv\b/i.test(ua)
  if(inApp)return 'inApp'
  if(ios)return 'ios'
  if(/Android/i.test(ua))return 'android'
  return 'desktop'
}

export function InstallAppButton({language='de',surface='public',forceIntro=false,previewOnly=false}){
  const [installPrompt,setInstallPrompt]=useState(rememberedInstallPrompt)
  const [installed,setInstalled]=useState(installationAccepted)
  const [message,setMessage]=useState('')
  const [environment,setEnvironment]=useState('desktop')
  const [showInstallIntro,setShowInstallIntro]=useState(false)
  const closeButtonRef=useRef(null)
  const introInstallButtonRef=useRef(null)
  const c=copy[language]||copy.de
  const installedText=installedCopy[language]||installedCopy.de

  useEffect(()=>{
    const displayMode=window.matchMedia?.('(display-mode: standalone)')
    const detectedEnvironment=installEnvironment()
    const isInstalled=()=>!previewOnly&&(installationAccepted||(detectedEnvironment!=='inApp'&&(displayMode?.matches||window.navigator.standalone===true)))
    const syncInstalled=()=>{
      const value=isInstalled()
      setInstalled(value)
      if(value)setShowInstallIntro(false)
    }
    const rememberPrompt=event=>{
      event.preventDefault()
      rememberedInstallPrompt=event
      setInstallPrompt(event)
      setMessage('')
    }
    const markInstalled=()=>{
      installationAccepted=true
      rememberedInstallPrompt=null
      setInstalled(true)
      setInstallPrompt(null)
      setMessage('')
    }
    setEnvironment(detectedEnvironment)
    syncInstalled()
    const introTimer=!previewOnly&&!isInstalled()&&(forceIntro||sessionStorage.getItem('asworkspace-install-intro-seen')!=='1')
      ?window.setTimeout(()=>setShowInstallIntro(true),350)
      :null
    window.addEventListener('beforeinstallprompt',rememberPrompt)
    window.addEventListener('appinstalled',markInstalled)
    displayMode?.addEventListener?.('change',syncInstalled)
    document.addEventListener('visibilitychange',syncInstalled)
    return()=>{
      window.removeEventListener('beforeinstallprompt',rememberPrompt)
      window.removeEventListener('appinstalled',markInstalled)
      displayMode?.removeEventListener?.('change',syncInstalled)
      document.removeEventListener('visibilitychange',syncInstalled)
      if(introTimer)window.clearTimeout(introTimer)
    }
  },[forceIntro,previewOnly])

  useEffect(()=>{
    if(!showInstallIntro)return
    const previouslyFocused=document.activeElement
    const closeOnEscape=event=>{if(event.key==='Escape')dismissInstallIntro()}
    document.addEventListener('keydown',closeOnEscape)
    introInstallButtonRef.current?.focus()
    return()=>{
      document.removeEventListener('keydown',closeOnEscape)
      previouslyFocused?.focus?.()
    }
  },[showInstallIntro])

  useEffect(()=>{
    if(!message)return
    const previouslyFocused=document.activeElement
    const closeOnEscape=event=>{if(event.key==='Escape')setMessage('')}
    document.addEventListener('keydown',closeOnEscape)
    closeButtonRef.current?.focus()
    return()=>{
      document.removeEventListener('keydown',closeOnEscape)
      previouslyFocused?.focus?.()
    }
  },[message])

  function dismissInstallIntro(){
    setShowInstallIntro(false)
    sessionStorage.setItem('asworkspace-install-intro-seen','1')
  }

  async function install(){
    dismissInstallIntro()
    if(previewOnly){
      setMessage('Dies ist die geschützte Vorschau für Sie als Chef. Bei einem neuen Nutzer startet dieser gelbe Button die Installation auf dessen Gerät.')
      return
    }
    const prompt=installPrompt||rememberedInstallPrompt
    if(!prompt){setMessage(c[environment]||c.desktop);return}
    try{
      await prompt.prompt()
      const choice=await prompt.userChoice
      if(choice?.outcome==='accepted'){
        installationAccepted=true
        setInstalled(true)
      }else{
        setMessage(c.cancelled)
      }
    }catch{
      setMessage(c[environment]||c.desktop)
    }finally{
      rememberedInstallPrompt=null
      setInstallPrompt(null)
    }
  }

  if(installed&&!previewOnly)return <section className={`installAppControl installAppControl--${surface}`} aria-label={installedText.title}>
    <div className="installAppPanel installAppInstalledPanel">
      <span className="installAppIcon installAppInstalledIcon" aria-hidden="true">✓</span>
      <span className="installAppText"><strong>{installedText.title}</strong><small>{installedText.lead}</small></span>
    </div>
  </section>
  return <section className={`installAppControl installAppControl--${surface}`} aria-label={c.title}>
    <div className="installAppPanel">
      <span className="installAppIcon" aria-hidden="true">📲</span>
      <span className="installAppText"><strong>{c.title}</strong><small>{c.lead}</small></span>
      <button type="button" className="primary installAppButton" onClick={install}>{c.install}</button>
    </div>
    {!previewOnly&&<button type="button" className="installAppFloatingButton" onClick={install}>📲 {c.install}</button>}
    {showInstallIntro&&<div className="installIntroBackdrop" role="presentation">
      <section className="installIntroDialog" role="dialog" aria-modal="true" aria-labelledby="install-intro-title">
        <span className="installIntroBadge">AS WORKSPACE APP</span>
        <span className="installIntroIcon" aria-hidden="true">📲</span>
        <h2 id="install-intro-title">{c.title}</h2>
        <p>{c.lead}</p>
        <button ref={introInstallButtonRef} type="button" className="installIntroPrimary" onClick={install}>{c.install}</button>
        <button type="button" className="installIntroLater" onClick={dismissInstallIntro}>{c.continue}</button>
      </section>
    </div>}
    {message&&<div className="installGuideBackdrop" role="presentation" onClick={()=>setMessage('')}>
      <section className="installGuideDialog" role="dialog" aria-modal="true" aria-labelledby="install-guide-title" onClick={event=>event.stopPropagation()}>
        <span className="installGuideIcon" aria-hidden="true">📲</span>
        <h2 id="install-guide-title">{c.guideTitle}</h2>
        <p>{message}</p>
        <button ref={closeButtonRef} type="button" className="primary" onClick={()=>setMessage('')}>{c.close}</button>
      </section>
    </div>}
  </section>
}
