const footerCopy = {
  de:{nav:'Rechtliche Informationen',hub:'Rechtliches',imprint:'Impressum',privacy:'Datenschutz',controls:'Datenschutz-Steuerung',terms:'Nutzungsbedingungen',cookies:'Cookies & Speicher',ai:'KI-Transparenz',contact:'Kontakt',binding:'Verbindlich sind die deutschen Rechtstexte.'},
  en:{nav:'Legal information',hub:'Legal',imprint:'Legal notice',privacy:'Privacy',controls:'Privacy controls',terms:'Terms of use',cookies:'Cookies & storage',ai:'AI transparency',contact:'Contact',binding:'The German legal texts are authoritative.'},
  tr:{nav:'Yasal bilgiler',hub:'Yasal',imprint:'Künye',privacy:'Gizlilik',controls:'Gizlilik kontrolü',terms:'Kullanım koşulları',cookies:'Çerezler ve depolama',ai:'Yapay zekâ şeffaflığı',contact:'İletişim',binding:'Almanca hukuki metinler bağlayıcıdır.'},
  pl:{nav:'Informacje prawne',hub:'Informacje prawne',imprint:'Impressum',privacy:'Prywatność',controls:'Kontrola prywatności',terms:'Warunki korzystania',cookies:'Pliki cookie i pamięć',ai:'Przejrzystość AI',contact:'Kontakt',binding:'Wiążące są niemieckie teksty prawne.'},
  uk:{nav:'Правова інформація',hub:'Правова інформація',imprint:'Вихідні дані',privacy:'Конфіденційність',controls:'Керування приватністю',terms:'Умови користування',cookies:'Cookie та сховище',ai:'Прозорість ШІ',contact:'Контакт',binding:'Обов’язковими є німецькі юридичні тексти.'},
  ru:{nav:'Правовая информация',hub:'Правовая информация',imprint:'Выходные данные',privacy:'Конфиденциальность',controls:'Управление приватностью',terms:'Условия использования',cookies:'Cookie и хранилище',ai:'Прозрачность ИИ',contact:'Контакты',binding:'Юридически обязательны тексты на немецком языке.'},
  ar:{nav:'المعلومات القانونية',hub:'الشؤون القانونية',imprint:'بيانات الناشر',privacy:'الخصوصية',controls:'التحكم في الخصوصية',terms:'شروط الاستخدام',cookies:'ملفات الارتباط والتخزين',ai:'شفافية الذكاء الاصطناعي',contact:'التواصل',binding:'النصوص القانونية الألمانية هي الملزمة.'}
}

export function LegalFooter({language='de'}){
  const on=footerCopy[language]||footerCopy.de
  return <footer className="legalFooter">
    <div className="wrap legalFooterInner">
      <div className="legalFooterBrand"><b>AS Gold</b><span>© 2026 Sebastian Auls – Unternehmens- und Konzeptberatung</span></div>
      <nav aria-label={on.nav}>
        <a className="withdrawalAction" href="/widerruf">Vertrag widerrufen</a>
        <a href="/rechtliches">{on.hub}</a>
        <a href="/impressum">{on.imprint}</a>
        <a href="/datenschutz">{on.privacy}</a>
        <a href="/datenschutzsteuerung">{on.controls}</a>
        <a href="/nutzungsbedingungen">{on.terms}</a>
        <a href="/cookies">{on.cookies}</a>
        <a href="/ki-transparenz">{on.ai}</a>
        <a href="/kontakt">{on.contact}</a>
      </nav>
      <small>{on.binding} · Stand 30.08.2026</small>
    </div>
  </footer>
}
