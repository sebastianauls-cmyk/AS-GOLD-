'use client'

import { useContext, useMemo, useState } from 'react'
import { LegalLanguageContext } from '../language/LegalLanguageContext'

const testerUrl='https://app-gold-workspace.vercel.app/testen'
const copy={
  de:{button:'An Tester weiterleiten',whatsapp:'Per WhatsApp senden',open:'AS Workspace Gold öffnen',text:'Hallo, bitte teste AS Workspace Gold einmal auf deinem Handy. Prüfe besonders die Verständlichkeit, Sprachwahl, Mikrofonfunktion und Zurück-Buttons. Bitte verwende nur Testdaten.',shared:'Das Teilen-Menü wurde geöffnet.',copied:'Der Tester-Link wurde kopiert und kann jetzt eingefügt werden.',manual:'Bitte kopieren Sie den unten angezeigten Tester-Link.'},
  en:{button:'Share with testers',whatsapp:'Send via WhatsApp',open:'Open AS Workspace Gold',text:'Hello, please test AS Workspace Gold on your phone. Focus on clarity, language selection, microphone input and back buttons. Please use test data only.',shared:'The sharing menu was opened.',copied:'The tester link was copied and is ready to paste.',manual:'Please copy the tester link shown below.'},
  fr:{button:'Partager avec des testeurs',whatsapp:'Envoyer par WhatsApp',open:'Ouvrir AS Workspace Gold',text:'Bonjour, merci de tester AS Workspace Gold sur votre téléphone. Vérifiez surtout la clarté, le choix de la langue, le microphone et les boutons de retour. Utilisez uniquement des données de test.',shared:'Le menu de partage a été ouvert.',copied:'Le lien de test a été copié.',manual:'Veuillez copier le lien de test ci-dessous.'},
  tr:{button:'Test kullanıcılarına ilet',whatsapp:'WhatsApp ile gönder',open:'AS Workspace Gold’u aç',text:'Merhaba, lütfen AS Workspace Gold’u telefonunuzda test edin. Özellikle anlaşılırlığı, dil seçimini, mikrofonu ve geri düğmelerini kontrol edin. Yalnızca test verileri kullanın.',shared:'Paylaşım menüsü açıldı.',copied:'Test bağlantısı kopyalandı.',manual:'Lütfen aşağıdaki test bağlantısını kopyalayın.'},
  pl:{button:'Udostępnij testerom',whatsapp:'Wyślij przez WhatsApp',open:'Otwórz AS Workspace Gold',text:'Cześć, proszę przetestuj AS Workspace Gold na telefonie. Sprawdź zwłaszcza czytelność, wybór języka, mikrofon i przyciski powrotu. Używaj wyłącznie danych testowych.',shared:'Otwarto menu udostępniania.',copied:'Link testowy został skopiowany.',manual:'Skopiuj poniższy link testowy.'},
  ru:{button:'Отправить тестировщикам',whatsapp:'Отправить через WhatsApp',open:'Открыть AS Workspace Gold',text:'Здравствуйте! Пожалуйста, протестируйте AS Workspace Gold на телефоне. Обратите внимание на понятность, выбор языка, микрофон и кнопки возврата. Используйте только тестовые данные.',shared:'Меню отправки открыто.',copied:'Ссылка для тестирования скопирована.',manual:'Скопируйте ссылку для тестирования ниже.'},
  ar:{button:'مشاركة الرابط مع المختبرين',whatsapp:'إرسال عبر واتساب',open:'فتح AS Workspace Gold',text:'مرحباً، يرجى اختبار AS Workspace Gold على هاتفك، وخاصة وضوح الاستخدام واختيار اللغة والميكروفون وأزرار الرجوع. استخدم بيانات اختبار فقط.',shared:'تم فتح قائمة المشاركة.',copied:'تم نسخ رابط الاختبار.',manual:'يرجى نسخ رابط الاختبار أدناه.'},
  fa:{button:'ارسال برای آزمایش‌کنندگان',whatsapp:'ارسال با واتساپ',open:'باز کردن AS Workspace Gold',text:'سلام، لطفاً AS Workspace Gold را روی تلفن خود آزمایش کنید. به وضوح، انتخاب زبان، میکروفون و دکمه‌های بازگشت توجه کنید. فقط از داده‌های آزمایشی استفاده کنید.',shared:'منوی اشتراک‌گذاری باز شد.',copied:'پیوند آزمایش کپی شد.',manual:'لطفاً پیوند آزمایش زیر را کپی کنید.'},
  ro:{button:'Trimite testerilor',whatsapp:'Trimite prin WhatsApp',open:'Deschide AS Workspace Gold',text:'Bună, te rog testează AS Workspace Gold pe telefon. Verifică mai ales claritatea, alegerea limbii, microfonul și butoanele de întoarcere. Folosește numai date de test.',shared:'Meniul de partajare a fost deschis.',copied:'Linkul de test a fost copiat.',manual:'Copiați linkul de test de mai jos.'},
  bg:{button:'Изпрати на тестери',whatsapp:'Изпрати чрез WhatsApp',open:'Отвори AS Workspace Gold',text:'Здравейте, моля тествайте AS Workspace Gold на телефона си. Проверете най-вече яснотата, избора на език, микрофона и бутоните за връщане. Използвайте само тестови данни.',shared:'Менюто за споделяне е отворено.',copied:'Тестовият линк е копиран.',manual:'Моля, копирайте тестовия линк по-долу.'},
  vi:{button:'Gửi cho người thử nghiệm',whatsapp:'Gửi qua WhatsApp',open:'Mở AS Workspace Gold',text:'Xin chào, vui lòng thử AS Workspace Gold trên điện thoại. Hãy đặc biệt kiểm tra độ rõ ràng, lựa chọn ngôn ngữ, micrô và các nút quay lại. Chỉ sử dụng dữ liệu thử nghiệm.',shared:'Đã mở menu chia sẻ.',copied:'Đã sao chép liên kết thử nghiệm.',manual:'Vui lòng sao chép liên kết thử nghiệm bên dưới.'}
}

export function TesterShareButton(){
  const language=useContext(LegalLanguageContext)||'de'
  const c=copy[language]||copy.de
  const [status,setStatus]=useState('')
  const whatsappHref=useMemo(()=>`https://wa.me/?text=${encodeURIComponent(`${c.text}\n\n${testerUrl}`)}`,[c.text])

  async function share(){
    const shareData={title:'AS Workspace Gold testen',text:c.text,url:testerUrl}
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare(shareData))){
        await navigator.share(shareData)
        setStatus(c.shared)
        return
      }
    }catch(error){if(error?.name==='AbortError')return}
    try{
      await navigator.clipboard.writeText(`${c.text}\n\n${testerUrl}`)
      setStatus(c.copied)
      return
    }catch{}
    const helper=document.createElement('textarea')
    helper.value=`${c.text}\n\n${testerUrl}`
    helper.setAttribute('readonly','')
    helper.style.position='fixed'
    helper.style.opacity='0'
    document.body.appendChild(helper)
    helper.select()
    const copied=document.execCommand('copy')
    helper.remove()
    setStatus(copied?c.copied:c.manual)
  }

  return <div className="testerShareBox">
    <div className="testerShareActions">
      <button type="button" className="primary btn" onClick={share}>📤 {c.button}</button>
      <a className="secondary btn" href={whatsappHref} target="_blank" rel="noreferrer">💬 {c.whatsapp}</a>
      <a className="secondary btn" href="/">↗ {c.open}</a>
    </div>
    <code className="testerShareUrl">{testerUrl}</code>
    {status&&<p className="testerShareStatus" role="status" aria-live="polite">✓ {status}</p>}
  </div>
}
