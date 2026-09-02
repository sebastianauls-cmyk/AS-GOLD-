'use client'

import { useEffect, useState } from 'react'

const copy={
  de:{install:'App installieren',help:'Öffnen Sie das Browser-Menü (⋮) und wählen Sie „App installieren“ oder „Zum Startbildschirm“.',cancelled:'Installation abgebrochen. Sie können sie jederzeit erneut über das Browser-Menü starten.'},
  en:{install:'Install app',help:'Open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.',cancelled:'Installation was cancelled. You can start it again from the browser menu at any time.'},
  fr:{install:'Installer l’app',help:'Ouvrez le menu du navigateur (⋮), puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',cancelled:'L’installation a été annulée. Vous pouvez la relancer à tout moment depuis le menu du navigateur.'},
  tr:{install:'Uygulamayı yükle',help:'Tarayıcı menüsünü (⋮) açın ve “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini seçin.',cancelled:'Yükleme iptal edildi. Tarayıcı menüsünden istediğiniz zaman yeniden başlatabilirsiniz.'},
  pl:{install:'Zainstaluj aplikację',help:'Otwórz menu przeglądarki (⋮) i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.',cancelled:'Instalowanie anulowano. Możesz je ponownie uruchomić z menu przeglądarki.'},
  ru:{install:'Установить приложение',help:'Откройте меню браузера (⋮) и выберите «Установить приложение» или «Добавить на главный экран».',cancelled:'Установка отменена. Её можно снова запустить через меню браузера.'},
  ar:{install:'تثبيت التطبيق',help:'افتح قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',cancelled:'تم إلغاء التثبيت. يمكنك بدءه مجددًا من قائمة المتصفح في أي وقت.'},
  fa:{install:'نصب برنامه',help:'منوی مرورگر (⋮) را باز کنید و «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید.',cancelled:'نصب لغو شد. هر زمان می‌توانید آن را دوباره از منوی مرورگر آغاز کنید.'},
  ro:{install:'Instalați aplicația',help:'Deschideți meniul browserului (⋮) și alegeți „Instalați aplicația” sau „Adăugați pe ecranul principal”.',cancelled:'Instalarea a fost anulată. O puteți porni din nou oricând din meniul browserului.'},
  bg:{install:'Инсталирайте приложението',help:'Отворете менюто на браузъра (⋮) и изберете „Инсталиране на приложението“ или „Добавяне към началния екран“.',cancelled:'Инсталирането е отменено. Можете да го стартирате отново от менюто на браузъра.'},
  vi:{install:'Cài đặt ứng dụng',help:'Mở trình đơn trình duyệt (⋮) và chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.',cancelled:'Đã hủy cài đặt. Bạn có thể bắt đầu lại bất cứ lúc nào từ trình đơn trình duyệt.'}
}

export function InstallAppButton({language='de'}){
  const [installPrompt,setInstallPrompt]=useState(null)
  const [installed,setInstalled]=useState(false)
  const [message,setMessage]=useState('')
  const c=copy[language]||copy.de

  useEffect(()=>{
    const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true
    setInstalled(standalone)
    const rememberPrompt=event=>{event.preventDefault();setInstallPrompt(event);setMessage('')}
    const markInstalled=()=>{setInstalled(true);setInstallPrompt(null);setMessage('')}
    window.addEventListener('beforeinstallprompt',rememberPrompt)
    window.addEventListener('appinstalled',markInstalled)
    return()=>{
      window.removeEventListener('beforeinstallprompt',rememberPrompt)
      window.removeEventListener('appinstalled',markInstalled)
    }
  },[])

  async function install(){
    if(!installPrompt){setMessage(c.help);return}
    try{
      await installPrompt.prompt()
      const choice=await installPrompt.userChoice
      setMessage(choice?.outcome==='accepted'?'':c.cancelled)
    }catch{
      setMessage(c.help)
    }finally{
      setInstallPrompt(null)
    }
  }

  if(installed)return null
  return <div className="installAppControl">
    <button type="button" className="secondary installAppButton" onClick={install}>📲 {c.install}</button>
    {message&&<span className="installAppHint" role="status">{message}</span>}
  </div>
}
