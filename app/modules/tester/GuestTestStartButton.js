'use client'

import { useState } from 'react'
import { RegistrationLegalFields, getV28PrivacyCopy } from '../compliance/PrivacyControls'
import { useLegalLanguage } from '../language/LegalLanguageContext'
import { APP_VERSION } from '../release/appRelease.mjs'

const copy={
  de:{title:'Ohne E-Mail und Passwort testen',lead:'Startet einen getrennten, zeitlich begrenzten Testarbeitsbereich. Es werden keine Kontaktdaten verlangt.',button:'Sicheren Test jetzt starten',limit:'2 Stunden · höchstens 2 Dokumente · voller Testablauf · keine Zahlung'},
  en:{title:'Test without email or password',lead:'Starts a separate, time-limited test workspace. No contact details are required.',button:'Start the secure test now',limit:'2 hours · up to 2 documents · full test flow · no payment'},
  tr:{title:'E-posta ve parola olmadan test edin',lead:'Ayrı ve süreli bir test çalışma alanı açar. İletişim bilgisi istenmez.',button:'Güvenli testi şimdi başlat',limit:'2 saat · en fazla 2 belge · tam test akışı · ödeme yok'},
  pl:{title:'Test bez e-maila i hasła',lead:'Uruchamia oddzielny, ograniczony czasowo obszar testowy. Dane kontaktowe nie są wymagane.',button:'Rozpocznij bezpieczny test',limit:'2 godziny · maks. 2 dokumenty · pełny test · bez płatności'},
  ru:{title:'Тест без e-mail и пароля',lead:'Открывает отдельную временную тестовую рабочую область. Контактные данные не требуются.',button:'Начать безопасный тест',limit:'2 часа · до 2 документов · полный тест · без оплаты'},
  ar:{title:'اختبار بلا بريد أو كلمة مرور',lead:'يفتح مساحة اختبار منفصلة ومحدودة المدة من دون طلب بيانات اتصال.',button:'ابدأ الاختبار الآمن الآن',limit:'ساعتان · مستندان كحد أقصى · مسار اختبار كامل · بلا دفع'},
  fa:{title:'آزمایش بدون ایمیل و گذرواژه',lead:'یک فضای آزمایشی جدا و زمان‌دار بدون نیاز به اطلاعات تماس باز می‌کند.',button:'آزمایش امن را آغاز کنید',limit:'۲ ساعت · حداکثر ۲ سند · مسیر کامل آزمایش · بدون پرداخت'},
  fr:{title:'Tester sans e-mail ni mot de passe',lead:'Ouvre un espace de test séparé et limité dans le temps. Aucune coordonnée n’est demandée.',button:'Démarrer le test sécurisé',limit:'2 heures · 2 documents maximum · parcours complet · aucun paiement'},
  ro:{title:'Test fără e-mail sau parolă',lead:'Deschide un spațiu de test separat și limitat în timp. Nu sunt cerute date de contact.',button:'Pornește testul sigur',limit:'2 ore · maximum 2 documente · flux complet · fără plată'},
  bg:{title:'Тест без имейл и парола',lead:'Отваря отделно тестово пространство с ограничено време. Не се изискват данни за контакт.',button:'Стартиране на безопасния тест',limit:'2 часа · до 2 документа · пълен тест · без плащане'},
  vi:{title:'Thử không cần email hoặc mật khẩu',lead:'Mở không gian thử nghiệm riêng, có giới hạn thời gian và không yêu cầu thông tin liên hệ.',button:'Bắt đầu thử nghiệm an toàn',limit:'2 giờ · tối đa 2 tài liệu · luồng thử đầy đủ · không thanh toán'}
}

export function GuestTestStartButton(){
  const language=useLegalLanguage()
  const text=copy[language]||copy.de
  const legal=getV28PrivacyCopy(language)
  const [acceptedLegal,setAcceptedLegal]=useState(false)
  const [confirmedTestData,setConfirmedTestData]=useState(false)
  const ready=acceptedLegal&&confirmedTestData

  function start(){
    if(!ready)return
    const query=new URLSearchParams({start:'guest-test'})
    if(language!=='de')query.set('lang',language)
    window.location.assign(`/?${query}`)
  }

  return <section className="guestTestStart" aria-labelledby="guest-test-title">
    <span className="modeBadge">{APP_VERSION} · Testmodus</span>
    <h3 id="guest-test-title">{text.title}</h3>
    <p>{text.lead}</p>
    <RegistrationLegalFields copy={legal} accepted={acceptedLegal} onAccepted={setAcceptedLegal} testOnly={confirmedTestData} onTestOnly={setConfirmedTestData}/>
    <button className="primary full" type="button" disabled={!ready} onClick={start}>{text.button}</button>
    <small>{text.limit}</small>
  </section>
}
