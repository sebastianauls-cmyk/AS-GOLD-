'use client'

const footerCopy={
  de:{nav:'Rechtliche Informationen',withdrawal:'Vertrag widerrufen',test:'Sicher testen',integrations:'E-Mail & Speicher',hub:'Rechtliches',imprint:'Impressum',privacy:'Datenschutz',controls:'Datenschutz-Steuerung',terms:'Nutzungsbedingungen',cookies:'Cookies & Speicher',ai:'KI-Transparenz',contact:'Kontakt',binding:'Verbindlich sind die deutschen Rechtstexte.',updated:'Stand'},
  en:{nav:'Legal information',withdrawal:'Withdraw from contract',test:'Safe testing',integrations:'Email & storage',hub:'Legal',imprint:'Legal notice',privacy:'Privacy',controls:'Privacy controls',terms:'Terms of use',cookies:'Cookies & storage',ai:'AI transparency',contact:'Contact',binding:'The German legal texts are authoritative.',updated:'Updated'},
  fr:{nav:'Informations juridiques',withdrawal:'Se rétracter du contrat',test:'Test sécurisé',integrations:'E-mail et stockage',hub:'Mentions légales',imprint:'Mentions légales',privacy:'Confidentialité',controls:'Contrôles de confidentialité',terms:'Conditions d’utilisation',cookies:'Cookies et stockage',ai:'Transparence IA',contact:'Contact',binding:'Les textes juridiques allemands font foi.',updated:'Mise à jour'},
  tr:{nav:'Yasal bilgiler',withdrawal:'Sözleşmeden cayma',test:'Güvenli test',integrations:'E-posta ve depolama',hub:'Yasal',imprint:'Künye',privacy:'Gizlilik',controls:'Gizlilik kontrolü',terms:'Kullanım koşulları',cookies:'Çerezler ve depolama',ai:'Yapay zekâ şeffaflığı',contact:'İletişim',binding:'Almanca hukuki metinler bağlayıcıdır.',updated:'Güncelleme'},
  pl:{nav:'Informacje prawne',withdrawal:'Odstąp od umowy',test:'Bezpieczny test',integrations:'E-mail i pamięć',hub:'Informacje prawne',imprint:'Impressum',privacy:'Prywatność',controls:'Kontrola prywatności',terms:'Warunki korzystania',cookies:'Pliki cookie i pamięć',ai:'Przejrzystość AI',contact:'Kontakt',binding:'Wiążące są niemieckie teksty prawne.',updated:'Aktualizacja'},
  ru:{nav:'Правовая информация',withdrawal:'Отказаться от договора',test:'Безопасный тест',integrations:'Почта и хранилище',hub:'Правовая информация',imprint:'Выходные данные',privacy:'Конфиденциальность',controls:'Управление приватностью',terms:'Условия использования',cookies:'Cookie и хранилище',ai:'Прозрачность ИИ',contact:'Контакты',binding:'Юридически обязательны тексты на немецком языке.',updated:'Обновлено'},
  ar:{nav:'المعلومات القانونية',withdrawal:'الانسحاب من العقد',test:'اختبار آمن',integrations:'البريد والتخزين',hub:'الشؤون القانونية',imprint:'بيانات الناشر',privacy:'الخصوصية',controls:'التحكم في الخصوصية',terms:'شروط الاستخدام',cookies:'ملفات الارتباط والتخزين',ai:'شفافية الذكاء الاصطناعي',contact:'التواصل',binding:'النصوص القانونية الألمانية هي الملزمة.',updated:'آخر تحديث'},
  fa:{nav:'اطلاعات حقوقی',withdrawal:'انصراف از قرارداد',test:'آزمایش امن',integrations:'ایمیل و ذخیره‌سازی',hub:'اطلاعات حقوقی',imprint:'اطلاعات ناشر',privacy:'حریم خصوصی',controls:'کنترل حریم خصوصی',terms:'شرایط استفاده',cookies:'کوکی‌ها و ذخیره‌سازی',ai:'شفافیت هوش مصنوعی',contact:'تماس',binding:'متون حقوقی آلمانی لازم‌الاجرا هستند.',updated:'به‌روزرسانی'},
  ro:{nav:'Informații juridice',withdrawal:'Retragere din contract',test:'Testare sigură',integrations:'E-mail și stocare',hub:'Informații juridice',imprint:'Date editoriale',privacy:'Protecția datelor',controls:'Controlul confidențialității',terms:'Condiții de utilizare',cookies:'Cookie-uri și stocare',ai:'Transparență IA',contact:'Contact',binding:'Textele juridice în limba germană sunt obligatorii.',updated:'Actualizat'},
  bg:{nav:'Правна информация',withdrawal:'Отказ от договора',test:'Безопасно тестване',integrations:'Имейл и съхранение',hub:'Правна информация',imprint:'Данни за издателя',privacy:'Защита на данните',controls:'Настройки за поверителност',terms:'Условия за ползване',cookies:'Бисквитки и съхранение',ai:'Прозрачност на ИИ',contact:'Контакт',binding:'Правно обвързващи са текстовете на немски език.',updated:'Актуализирано'},
  vi:{nav:'Thông tin pháp lý',withdrawal:'Rút khỏi hợp đồng',test:'Thử nghiệm an toàn',integrations:'Email và lưu trữ',hub:'Pháp lý',imprint:'Thông tin nhà cung cấp',privacy:'Quyền riêng tư',controls:'Kiểm soát quyền riêng tư',terms:'Điều khoản sử dụng',cookies:'Cookie và lưu trữ',ai:'Minh bạch AI',contact:'Liên hệ',binding:'Văn bản tiếng Đức có giá trị pháp lý ràng buộc.',updated:'Cập nhật'}
}

function href(path,language){ return language==='de'?path:`${path}?lang=${language}` }

export function LegalFooter({language='de'}){
  const on=footerCopy[language]||footerCopy.de
  return <footer className="legalFooter"><div className="wrap legalFooterInner">
    <div className="legalFooterBrand"><b>AS Gold</b><span>© 2026 Sebastian Auls – Unternehmens- und Konzeptberatung</span></div>
    <nav aria-label={on.nav}>
      <a className="withdrawalAction" href={href('/widerruf',language)}>{on.withdrawal}</a><a href={href('/testen',language)}>{on.test}</a><a href={href('/integrationen',language)}>{on.integrations}</a><a href={href('/rechtliches',language)}>{on.hub}</a><a href={href('/impressum',language)}>{on.imprint}</a><a href={href('/datenschutz',language)}>{on.privacy}</a><a href={href('/datenschutzsteuerung',language)}>{on.controls}</a><a href={href('/nutzungsbedingungen',language)}>{on.terms}</a><a href={href('/cookies',language)}>{on.cookies}</a><a href={href('/ki-transparenz',language)}>{on.ai}</a><a href={href('/kontakt',language)}>{on.contact}</a>
    </nav>
    <small>{on.binding} · {on.updated} 31.08.2026</small>
  </div></footer>
}
