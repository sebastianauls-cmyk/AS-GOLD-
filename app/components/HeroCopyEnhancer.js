'use client'

import { useEffect } from 'react'

const heroCopy={
  de:{title:'AS Gold – Klarheit, wenn Vorgänge komplex werden.',lead:'AS Gold bündelt Dokumente, E-Mails und Informationen, erkennt Fristen, Lücken, Widersprüche und Risiken und erstellt daraus Sachstand, Ampelanalysen, nächste Schritte, Antwortschreiben und Exporte. E-Mail-Konten, Cloud-Speicher und eigene Ablageorte auf PC oder Gerät können angebunden werden. Sie prüfen und entscheiden, bevor etwas gespeichert, versendet oder freigegeben wird.'},
  en:{title:'AS Gold – clarity when matters get complex.',lead:'AS Gold brings documents, emails and information together, identifies deadlines, gaps, contradictions and risks, and prepares case status, traffic-light analyses, next steps, reply letters and exports. Email accounts, cloud storage and your own storage locations can be connected. You review and decide before anything is saved, sent or approved.'},
  fr:{title:'AS Gold – de la clarté quand les dossiers deviennent complexes.',lead:'AS Gold rassemble documents, e-mails et informations, repère délais, lacunes, contradictions et risques, puis prépare l’état du dossier, des analyses par feu, les prochaines étapes, des réponses écrites et des exports. Des comptes e-mail, stockages cloud et emplacements personnels peuvent être connectés. Vous gardez la décision avant tout enregistrement, envoi ou validation.'},
  tr:{title:'AS Gold – işlemler karmaşıklaştığında netlik.',lead:'AS Gold belgeleri, e-postaları ve bilgileri bir araya getirir; süreleri, eksikleri, çelişkileri ve riskleri belirler. Ardından dosya durumu, trafik ışığı analizleri, sonraki adımlar, cevap yazıları ve dışa aktarımlar hazırlar. E-posta hesapları, bulut depolama ve kendi kayıt yerleriniz bağlanabilir. Kaydetme, gönderme veya onaylama öncesinde karar sizindir.'},
  pl:{title:'AS Gold – jasność, gdy sprawy stają się złożone.',lead:'AS Gold łączy dokumenty, e-maile i informacje, wykrywa terminy, braki, sprzeczności i ryzyka, a następnie przygotowuje stan sprawy, analizy sygnalizacyjne, kolejne kroki, pisma odpowiedzi i eksporty. Można podłączyć konta e-mail, chmurę i własne lokalizacje zapisu. Przed zapisaniem, wysłaniem lub zatwierdzeniem decyzja należy do użytkownika.'},
  ru:{title:'AS Gold – ясность, когда дела становятся сложными.',lead:'AS Gold объединяет документы, почту и информацию, выявляет сроки, пробелы, противоречия и риски и готовит состояние дела, светофорные анализы, следующие шаги, ответные письма и экспорт. Можно подключить почтовые аккаунты, облако и собственные места хранения. Перед сохранением, отправкой или утверждением решение остаётся за вами.'},
  ar:{title:'AS Gold – وضوح عندما تصبح المعاملات معقدة.',lead:'يجمع AS Gold المستندات والبريد والمعلومات، ويحدد المواعيد والنواقص والتناقضات والمخاطر، ثم يجهز ملخص الحالة وتحليلات الإشارة والخطوات التالية وخطابات الرد وملفات التصدير. ويمكن ربط البريد والتخزين السحابي ومواقع التخزين الخاصة. أنت تقرر قبل الحفظ أو الإرسال أو الاعتماد.'},
  fa:{title:'AS Gold – شفافیت وقتی پرونده‌ها پیچیده می‌شوند.',lead:'AS Gold اسناد، ایمیل‌ها و اطلاعات را یکجا جمع می‌کند، مهلت‌ها، کاستی‌ها، تناقض‌ها و ریسک‌ها را شناسایی می‌کند و وضعیت پرونده، تحلیل چراغی، گام‌های بعدی، پاسخ‌نامه‌ها و خروجی‌ها را آماده می‌کند. ایمیل، فضای ابری و محل ذخیره‌سازی شخصی نیز قابل اتصال است. پیش از ذخیره، ارسال یا تأیید، تصمیم با شماست.'}
}

const audienceCopy={
  de:{title:'Für wen AS Gold besonders nützlich ist',lead:'Sie müssen keinen bestimmten „Falltyp“ kennen. Wählen Sie zuerst, wie Sie AS Gold nutzen möchten.',items:[['Privatpersonen','Briefe, Verträge, Behördenpost, Streitfälle, Reisen, Fahrzeuge oder andere dokumentenreiche Vorgänge verständlich ordnen und bearbeiten.'],['Selbstständige & kleine Unternehmen','Kundenfälle, Forderungen, Verträge, Rechnungen, Versicherungen, Mitarbeiter- und Behördenvorgänge strukturiert bearbeiten.'],['Büro, Verwaltung & Assistenz','E-Mails, Fristen, Unterlagen, Antworten und Wiedervorlagen zentral zusammenführen und nachvollziehbar weiterbearbeiten.'],['Teams mit Kundenfällen','Mehrere Kunden und Vorgänge, Dokumente, Freigaben, Ampelstände und vorbereitete Schreiben gemeinsam steuern.']]},
  en:{title:'Who AS Gold is especially useful for',lead:'You do not need to know a specific case category first. Start with how you want to use AS Gold.',items:[['Private individuals','Organize and handle letters, contracts, authority correspondence, disputes, travel, vehicles and other document-heavy matters.'],['Self-employed & small businesses','Structure client matters, claims, contracts, invoices, insurance, staff and authority processes.'],['Office, administration & assistance','Bring emails, deadlines, documents, replies and follow-ups together in one traceable workflow.'],['Teams handling client matters','Coordinate multiple clients and cases, documents, approvals, traffic-light status and prepared letters.']]},
  fr:{title:'À qui AS Gold est particulièrement utile',lead:'Vous n’avez pas besoin de connaître d’abord une catégorie de dossier. Commencez par votre manière d’utiliser AS Gold.',items:[['Particuliers','Organiser lettres, contrats, courriers administratifs, litiges, voyages, véhicules et autres dossiers riches en documents.'],['Indépendants & petites entreprises','Structurer dossiers clients, créances, contrats, factures, assurances, personnel et démarches administratives.'],['Bureau, administration & assistance','Centraliser e-mails, délais, documents, réponses et relances dans un flux traçable.'],['Équipes avec dossiers clients','Piloter plusieurs clients et dossiers, documents, validations, statuts et courriers préparés.']]},
  tr:{title:'AS Gold özellikle kimler için yararlı',lead:'Önceden belirli bir dosya türünü bilmeniz gerekmez. Önce AS Gold’u nasıl kullanacağınızı seçin.',items:[['Bireyler','Mektup, sözleşme, resmi yazışma, uyuşmazlık, seyahat, araç ve belge yoğun diğer işlemleri düzenlemek için.'],['Serbest çalışanlar & küçük işletmeler','Müşteri dosyaları, alacaklar, sözleşmeler, faturalar, sigorta, çalışan ve resmi işlemler için.'],['Ofis, yönetim & asistanlık','E-posta, süre, belge, cevap ve takipleri tek yerde yönetmek için.'],['Müşteri dosyalarıyla çalışan ekipler','Birden çok müşteri ve dosyayı, belgeleri, onayları, durumları ve yazıları birlikte yönetmek için.']]},
  pl:{title:'Dla kogo AS Gold jest szczególnie przydatny',lead:'Nie trzeba najpierw znać konkretnego typu sprawy. Zacznij od sposobu, w jaki chcesz używać AS Gold.',items:[['Osoby prywatne','Porządkowanie pism, umów, korespondencji urzędowej, sporów, podróży, pojazdów i innych spraw z dużą liczbą dokumentów.'],['Samozatrudnieni & małe firmy','Obsługa spraw klientów, należności, umów, faktur, ubezpieczeń, pracowników i urzędów.'],['Biuro, administracja & asysta','Łączenie e-maili, terminów, dokumentów, odpowiedzi i dalszych działań w jednym procesie.'],['Zespoły z obsługą klientów','Wspólne prowadzenie wielu klientów i spraw, dokumentów, akceptacji, statusów i pism.']]},
  ru:{title:'Кому AS Gold особенно полезен',lead:'Не нужно заранее знать тип дела. Сначала выберите, как вы хотите использовать AS Gold.',items:[['Частные лица','Упорядочивать письма, договоры, официальную переписку, споры, поездки, транспорт и другие документные дела.'],['Самозанятые & малый бизнес','Вести клиентские дела, требования, договоры, счета, страхование, персонал и взаимодействие с ведомствами.'],['Офис, администрация & ассистенты','Объединять почту, сроки, документы, ответы и последующие действия в одном процессе.'],['Команды с клиентскими делами','Совместно вести клиентов и дела, документы, согласования, статусы и подготовленные письма.']]},
  ar:{title:'لمن يفيد AS Gold بشكل خاص',lead:'لا تحتاج إلى معرفة نوع الحالة مسبقاً. ابدأ بالطريقة التي تريد استخدام AS Gold بها.',items:[['الأفراد','تنظيم الرسائل والعقود والمراسلات الرسمية والنزاعات والسفر والمركبات وغيرها من الحالات كثيرة المستندات.'],['المستقلون & الشركات الصغيرة','إدارة حالات العملاء والمطالبات والعقود والفواتير والتأمين والموظفين والإجراءات الرسمية.'],['المكتب والإدارة والمساعدة','جمع البريد والمواعيد والمستندات والردود والمتابعات في مسار واحد واضح.'],['الفرق التي تدير حالات عملاء','إدارة عدة عملاء وحالات ومستندات وموافقات وتقييمات وخطابات معاً.']]},
  fa:{title:'AS Gold برای چه کسانی بیشترین کاربرد را دارد',lead:'لازم نیست از ابتدا نوع پرونده را بدانید. ابتدا نحوه استفاده خود از AS Gold را انتخاب کنید.',items:[['افراد','مرتب‌سازی نامه‌ها، قراردادها، مکاتبات اداری، اختلاف‌ها، سفر، خودرو و سایر موضوعات پرمدرک.'],['خوداشتغال‌ها & کسب‌وکارهای کوچک','مدیریت پرونده مشتری، مطالبات، قرارداد، فاکتور، بیمه، کارکنان و امور اداری.'],['دفتر، مدیریت & دستیاران','یکپارچه‌سازی ایمیل‌ها، مهلت‌ها، اسناد، پاسخ‌ها و پیگیری‌ها در یک روند روشن.'],['تیم‌های دارای پرونده مشتری','مدیریت مشترک چند مشتری و پرونده، اسناد، تأییدها، وضعیت‌ها و نامه‌های آماده.']]}
}

const problemCopy={
  de:{title:'Was ist Ihr Problem?',lead:'Schreiben Sie kurz, was passiert ist – oder sprechen Sie es ein. AS Gold schlägt Ihnen unverbindlich die passende Fallart und Produktstufe vor.',placeholder:'Zum Beispiel: Ich habe eine Rechnung bekommen, die nicht stimmt, und weiß nicht, wie ich antworten soll.',voice:'Problem einsprechen',stop:'Aufnahme stoppen',analyse:'Passende Lösung finden',empty:'Bitte beschreiben Sie Ihr Problem kurz.',unsupported:'Spracheingabe wird von diesem Browser nicht unterstützt. Sie können Ihr Problem einfach eintippen.',listening:'Ich höre zu …',recommendation:'Unverbindliche Empfehlung',caseLabel:'Passende Fallart',planLabel:'Empfohlene Stufe',why:'Warum?',showCase:'Passende Fallart ansehen',showPlans:'Produktstufen vergleichen',change:'Sie können die Empfehlung jederzeit ändern oder eine andere Fallart wählen.'},
  en:{title:'What is your problem?',lead:'Briefly describe what happened – or say it out loud. AS Gold will suggest a suitable case type and product level.',placeholder:'For example: I received an invoice that seems wrong and I do not know how to respond.',voice:'Speak problem',stop:'Stop recording',analyse:'Find suitable solution',empty:'Please briefly describe your problem.',unsupported:'Voice input is not supported by this browser. You can simply type your problem.',listening:'Listening …',recommendation:'Non-binding recommendation',caseLabel:'Suggested case type',planLabel:'Suggested level',why:'Why?',showCase:'View suggested case type',showPlans:'Compare product levels',change:'You can change the recommendation or choose another case type at any time.'},
  fr:{title:'Quel est votre problème ?',lead:'Décrivez brièvement ce qui s’est passé – ou dictez-le. AS Gold propose un type de dossier et un niveau adaptés.',placeholder:'Exemple : j’ai reçu une facture erronée et je ne sais pas comment répondre.',voice:'Dicter le problème',stop:'Arrêter',analyse:'Trouver la solution',empty:'Décrivez brièvement votre problème.',unsupported:'La saisie vocale n’est pas prise en charge par ce navigateur. Vous pouvez écrire votre problème.',listening:'Je vous écoute …',recommendation:'Recommandation indicative',caseLabel:'Type de dossier',planLabel:'Niveau recommandé',why:'Pourquoi ?',showCase:'Voir le dossier proposé',showPlans:'Comparer les niveaux',change:'Vous pouvez modifier la recommandation ou choisir un autre type de dossier.'},
  tr:{title:'Sorununuz nedir?',lead:'Kısaca ne olduğunu yazın veya söyleyin. AS Gold uygun dosya türünü ve ürün seviyesini önerir.',placeholder:'Örnek: Yanlış olduğunu düşündüğüm bir fatura aldım ve nasıl cevap vereceğimi bilmiyorum.',voice:'Sorunu söyle',stop:'Kaydı durdur',analyse:'Uygun çözümü bul',empty:'Lütfen sorununuzu kısaca açıklayın.',unsupported:'Bu tarayıcı sesli girişi desteklemiyor. Sorununuzu yazabilirsiniz.',listening:'Dinliyorum …',recommendation:'Bağlayıcı olmayan öneri',caseLabel:'Uygun dosya türü',planLabel:'Önerilen seviye',why:'Neden?',showCase:'Dosya türünü göster',showPlans:'Ürün seviyelerini karşılaştır',change:'Öneriyi değiştirebilir veya başka bir dosya türü seçebilirsiniz.'},
  pl:{title:'Jaki masz problem?',lead:'Napisz krótko, co się stało, albo powiedz to. AS Gold zaproponuje odpowiedni rodzaj sprawy i poziom produktu.',placeholder:'Przykład: Otrzymałem błędną fakturę i nie wiem, jak odpowiedzieć.',voice:'Powiedz problem',stop:'Zatrzymaj nagranie',analyse:'Znajdź rozwiązanie',empty:'Krótko opisz swój problem.',unsupported:'Ta przeglądarka nie obsługuje wprowadzania głosowego. Możesz wpisać problem.',listening:'Słucham …',recommendation:'Niewiążąca rekomendacja',caseLabel:'Rodzaj sprawy',planLabel:'Zalecany poziom',why:'Dlaczego?',showCase:'Pokaż sprawę',showPlans:'Porównaj poziomy',change:'Możesz zmienić rekomendację lub wybrać inną sprawę.'},
  ru:{title:'В чём ваша проблема?',lead:'Кратко напишите, что произошло, или продиктуйте. AS Gold предложит подходящий тип дела и уровень продукта.',placeholder:'Например: Я получил неверный счёт и не знаю, как ответить.',voice:'Продиктовать',stop:'Остановить запись',analyse:'Найти решение',empty:'Кратко опишите проблему.',unsupported:'Этот браузер не поддерживает голосовой ввод. Вы можете просто написать проблему.',listening:'Слушаю …',recommendation:'Предварительная рекомендация',caseLabel:'Тип дела',planLabel:'Рекомендуемый уровень',why:'Почему?',showCase:'Показать тип дела',showPlans:'Сравнить уровни',change:'Вы можете изменить рекомендацию или выбрать другой тип дела.'},
  ar:{title:'ما المشكلة التي تواجهها؟',lead:'اكتب باختصار ما حدث أو قل ذلك بصوتك. يقترح AS Gold نوع الحالة ومستوى المنتج المناسبين.',placeholder:'مثال: وصلتني فاتورة أعتقد أنها غير صحيحة ولا أعرف كيف أرد.',voice:'تحدث عن المشكلة',stop:'إيقاف التسجيل',analyse:'العثور على الحل',empty:'يرجى وصف المشكلة باختصار.',unsupported:'هذا المتصفح لا يدعم الإدخال الصوتي. يمكنك كتابة المشكلة.',listening:'أستمع الآن …',recommendation:'اقتراح غير ملزم',caseLabel:'نوع الحالة المناسب',planLabel:'المستوى المقترح',why:'لماذا؟',showCase:'عرض نوع الحالة',showPlans:'مقارنة المستويات',change:'يمكنك تغيير الاقتراح أو اختيار نوع حالة آخر في أي وقت.'},
  fa:{title:'مشکل شما چیست؟',lead:'کوتاه بنویسید چه اتفاقی افتاده یا آن را بگویید. AS Gold نوع پرونده و سطح مناسب محصول را پیشنهاد می‌کند.',placeholder:'مثال: صورتحساب اشتباهی دریافت کرده‌ام و نمی‌دانم چگونه پاسخ بدهم.',voice:'بیان مشکل',stop:'توقف ضبط',analyse:'یافتن راه‌حل مناسب',empty:'لطفاً مشکل خود را کوتاه توضیح دهید.',unsupported:'این مرورگر ورودی صوتی را پشتیبانی نمی‌کند. می‌توانید مشکل را تایپ کنید.',listening:'در حال گوش دادن …',recommendation:'پیشنهاد غیرالزام‌آور',caseLabel:'نوع پرونده مناسب',planLabel:'سطح پیشنهادی',why:'چرا؟',showCase:'نمایش نوع پرونده',showPlans:'مقایسه سطوح',change:'هر زمان می‌توانید پیشنهاد را تغییر دهید یا نوع دیگری انتخاب کنید.'}
}

const caseLabels={
  de:{insurance:'Versicherung & Schaden',property:'Miete, Pacht & Immobilie',contract:'Vertrag & Forderung',authority:'Behörde & Sozialversicherung',work:'Arbeit & Abrechnung',business:'Unternehmen & Kunden',dispute:'Streit & Beweise',private:'Komplexer privater Vorgang'},
  en:{insurance:'Insurance & claims',property:'Rent, lease & property',contract:'Contracts & claims',authority:'Authorities & social insurance',work:'Employment & payroll',business:'Business & clients',dispute:'Disputes & evidence',private:'Complex private matter'},
  fr:{insurance:'Assurance & sinistre',property:'Location, bail & immobilier',contract:'Contrat & créance',authority:'Administration & assurance sociale',work:'Emploi & paie',business:'Entreprise & clients',dispute:'Litige & preuves',private:'Situation personnelle complexe'},
  tr:{insurance:'Sigorta & hasar',property:'Kira & gayrimenkul',contract:'Sözleşme & alacak',authority:'Kurum & sosyal güvenlik',work:'İş & ücret',business:'İşletme & müşteriler',dispute:'Uyuşmazlık & deliller',private:'Karmaşık özel konu'},
  pl:{insurance:'Ubezpieczenie & szkoda',property:'Najem & nieruchomość',contract:'Umowa & roszczenie',authority:'Urząd & ubezpieczenia społeczne',work:'Praca & wynagrodzenie',business:'Firma & klienci',dispute:'Spór & dowody',private:'Złożona sprawa prywatna'},
  ru:{insurance:'Страхование & ущерб',property:'Аренда & недвижимость',contract:'Договор & требование',authority:'Ведомство & соцстрахование',work:'Работа & расчёт',business:'Бизнес & клиенты',dispute:'Спор & доказательства',private:'Сложное личное дело'},
  ar:{insurance:'التأمين & الضرر',property:'الإيجار & العقار',contract:'العقد & المطالبة',authority:'الجهة الرسمية & الضمان',work:'العمل & الحساب',business:'الأعمال & العملاء',dispute:'النزاع & الأدلة',private:'حالة شخصية معقدة'},
  fa:{insurance:'بیمه و خسارت',property:'اجاره و ملک',contract:'قرارداد و مطالبه',authority:'اداره و بیمه اجتماعی',work:'کار و حقوق',business:'کسب‌وکار و مشتریان',dispute:'اختلاف و مدارک',private:'موضوع شخصی پیچیده'}
}

const planLabels={free:'AS Gold Kostenlos',start:'AS Gold Start',klar:'AS Gold Klar',analyse:'AS Gold Analyse',komplett:'AS Gold Komplett',business:'AS Gold Business'}
const caseOrder=['insurance','property','contract','authority','work','business','dispute','private']
const keywordGroups={
  insurance:['versicherung','schaden','unfall','kasko','haftpflicht','claim','insurance','damage','assurance','sinistre','sigorta','hasar','ubezpiec','szkod','страх','ущерб','تأمين','ضرر','بیمه','خسارت'],
  property:['miete','mieter','vermieter','pacht','wohnung','haus','immobil','nebenkosten','kündigung wohn','rent','tenant','landlord','lease','property','location','bail','loyer','kira','kiracı','najem','czynsz','аренд','квартир','إيجار','عقار','اجاره','ملک'],
  contract:['vertrag','rechnung','forderung','zahlung','kündigung','leistung','lieferung','kauf','contract','invoice','claim','payment','agreement','contrat','facture','créance','sözleşme','fatura','alacak','umowa','faktura','roszczen','договор','счет','требован','عقد','فاتورة','مطالبة','قرارداد','فاکتور','مطالبه'],
  authority:['behörde','amt','bescheid','krankenkasse','rente','zoll','führerschein','antrag','authority','office','benefit','decision','administration','autorité','administration','urząd','decyzj','ведом','решени','وزارة','قرار','اداره','بیمه اجتماعی'],
  work:['arbeitgeber','lohn','gehalt','arbeitszeit','krankengeld','kündigung arbeit','employee','employer','salary','payroll','work','emploi','salaire','işveren','maaş','praca','wynagrod','работ','зарплат','عمل','راتب','کار','حقوق'],
  business:['kunde','kunden','unternehmen','firma','lieferant','projekt','team','business','client','company','supplier','project','entreprise','müşteri','şirket','firma','klient','компан','клиент','شركة','عميل','شرکت','مشتری'],
  dispute:['streit','beweis','anwalt','gericht','klage','widerspruch','fristsetzung','dispute','evidence','lawyer','court','lawsuit','litige','preuve','mahkeme','spór','dowód','суд','иск','نزاع','دليل','دادگاه','اختلاف'],
  private:['reise','flug','auto','fahrzeug','reiseveranstalter','privat','travel','flight','car','vehicle','voyage','voiture','seyahat','araç','podróż','samochód','поездк','автомоб','سفر','سيارة','سفر','خودرو']
}
const planDepthKeywords={
  business:['mehrere kunden','team','wiederkehrend','laufend viele','business','multiple clients','workflow','équipe','müşteri','zespół','команд','فريق','تیم'],
  komplett:['komplex','viele dokument','komplett','gesamter fall','mehrere schreiben','umfangreich','complex','many documents','comprehensive','complet','karmaşık','wiele dokument','сложн','много документ','معقد','مستندات كثيرة','پیچیده','اسناد زیاد'],
  analyse:['risiko','bewerten','strategie','anwalt','gericht','klage','widerspruch','frist','analyse','risk','assess','strategy','court','analyse','risque','mahkeme','ryzyko','суд','риск','خطر','محكمة','ریسک','دادگاه'],
  klar:['fehlt','widerspruch','frist','unklar','prüfen','kontrollieren','missing','deadline','unclear','check','manque','délai','eksik','termin','brak','termin','неяс','срок','ناقص','موعد','ابهام','مهلت'],
  start:['ordnen','sortieren','überblick','zusammenfassen','organize','overview','summary','classer','aperçu','düzen','özet','porządk','przegląd','упорядоч','обзор','تنظيم','نظرة','مرتب','نمای کلی']
}

function normalize(value){return String(value||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function score(text,words){return words.reduce((sum,word)=>sum+(text.includes(normalize(word))?1:0),0)}
function recommendProblem(value,language){
  const text=normalize(value)
  const caseScores=Object.fromEntries(Object.entries(keywordGroups).map(([key,words])=>[key,score(text,words)]))
  let caseKey=Object.entries(caseScores).sort((a,b)=>b[1]-a[1])[0]?.[0]||'private'
  if(Math.max(...Object.values(caseScores))===0) caseKey=text.length>180?'dispute':'private'
  let planKey='start'
  if(score(text,planDepthKeywords.business)>0) planKey='business'
  else if(score(text,planDepthKeywords.komplett)>0||text.length>420) planKey='komplett'
  else if(score(text,planDepthKeywords.analyse)>0||text.length>260) planKey='analyse'
  else if(score(text,planDepthKeywords.klar)>0||text.length>130) planKey='klar'
  const reasons={
    de:{start:'Sie möchten zunächst Ordnung und einen verständlichen Überblick.',klar:'Es geht wahrscheinlich um offene Punkte, Fristen oder Widersprüche, die sichtbar gemacht werden sollten.',analyse:'Ihr Problem deutet auf Risiken, Fristen oder eine inhaltliche Bewertung mit konkreten nächsten Schritten hin.',komplett:'Der Vorgang wirkt umfangreich oder komplex und sollte als Ganzes strukturiert und bearbeitet werden.',business:'Die Beschreibung deutet auf mehrere Kunden, Vorgänge oder wiederkehrende Arbeitsabläufe hin.'},
    en:{start:'You appear to need organization and a clear overview first.',klar:'There are likely gaps, deadlines or contradictions that should be made visible.',analyse:'Your matter appears to require risk assessment and concrete next steps.',komplett:'The matter appears extensive or complex and should be handled as a whole.',business:'The description suggests multiple clients, matters or recurring workflows.'}
  }
  const reason=(reasons[language]||reasons.en)[planKey]||reasons.en.start
  return {caseKey,planKey,reason}
}

function ensureAudienceBlock(language){
  const section=document.querySelector('#fallarten .wrap')
  if(!section) return
  const copy=audienceCopy[language]||audienceCopy.de
  let block=document.getElementById('asgold-user-audience')
  if(!block){
    block=document.createElement('section')
    block.id='asgold-user-audience'
    block.style.cssText='margin:0 0 34px;padding:24px;border:1px solid #e2d6b7;border-radius:20px;background:linear-gradient(135deg,#fffaf0,#fff)'
    section.prepend(block)
  }
  block.innerHTML=`<div class="eyebrow">${copy.title}</div><h2 style="margin:8px 0 8px;font-size:clamp(1.7rem,5vw,2.5rem)">${copy.title}</h2><p style="margin:0 0 18px;color:#5f6976;line-height:1.5">${copy.lead}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">${copy.items.map(([title,text])=>`<article style="background:#fff;border:1px solid #e3e5e9;border-radius:14px;padding:16px"><b style="display:block;margin-bottom:7px;color:#5e4818">${title}</b><span style="color:#626c78;line-height:1.45">${text}</span></article>`).join('')}</div>`
}

function ensureProblemNavigator(language){
  const heroMain=document.querySelector('.heroLayout > div:first-child')||document.querySelector('.hero .wrap > div:first-child')
  if(!heroMain) return
  const copy=problemCopy[language]||problemCopy.de
  let block=document.getElementById('asgold-problem-navigator')
  if(!block){
    block=document.createElement('section')
    block.id='asgold-problem-navigator'
    block.style.cssText='margin:26px 0 10px;padding:18px;border:1px solid #dccb9f;border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(72,55,18,.08)'
    const actions=heroMain.querySelector('.actions')
    if(actions) heroMain.insertBefore(block,actions)
    else heroMain.appendChild(block)
  }
  const previousValue=block.querySelector('textarea')?.value||''
  block.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap"><div><b style="display:block;font-size:1.1rem;color:#4d3b14">${copy.title}</b><p style="margin:5px 0 12px;color:#626c78;line-height:1.45;max-width:720px">${copy.lead}</p></div><span style="font-size:.75rem;font-weight:800;color:#70551b;background:#fff5d8;border:1px solid #ead69e;border-radius:999px;padding:6px 9px">Text + Sprache</span></div><textarea data-problem-input rows="3" placeholder="${copy.placeholder}" style="width:100%;resize:vertical;min-height:82px;padding:12px;border:1px solid #d8dbe1;border-radius:12px;background:#fff;color:#27303b"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button type="button" data-problem-voice style="padding:10px 13px;border:1px solid #d5c38f;border-radius:11px;background:#fffaf0;color:#5b4618;font-weight:800">🎙 ${copy.voice}</button><button type="button" data-problem-analyse style="padding:10px 14px;border:0;border-radius:11px;background:#8f6e25;color:#fff;font-weight:800">${copy.analyse}</button></div><small data-problem-status style="display:block;margin-top:8px;color:#6d7682"></small><div data-problem-result aria-live="polite"></div>`
  const textarea=block.querySelector('[data-problem-input]')
  textarea.value=previousValue
  const voiceButton=block.querySelector('[data-problem-voice]')
  const analyseButton=block.querySelector('[data-problem-analyse]')
  const status=block.querySelector('[data-problem-status]')
  const result=block.querySelector('[data-problem-result]')
  let recognition=null
  let listening=false
  voiceButton.onclick=()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SpeechRecognition){status.textContent=copy.unsupported;return}
    if(listening&&recognition){recognition.stop();return}
    recognition=new SpeechRecognition()
    recognition.lang={de:'de-DE',en:'en-GB',fr:'fr-FR',tr:'tr-TR',pl:'pl-PL',ru:'ru-RU',ar:'ar-SA',fa:'fa-IR'}[language]||'de-DE'
    recognition.interimResults=true
    recognition.continuous=false
    const base=textarea.value.trim()
    recognition.onstart=()=>{listening=true;status.textContent=copy.listening;voiceButton.textContent=`⏹ ${copy.stop}`}
    recognition.onresult=event=>{const spoken=Array.from(event.results).map(item=>item[0]?.transcript||'').join(' ');textarea.value=[base,spoken].filter(Boolean).join(base?' ':'')}
    recognition.onerror=()=>{status.textContent=copy.unsupported}
    recognition.onend=()=>{listening=false;voiceButton.textContent=`🎙 ${copy.voice}`;if(status.textContent===copy.listening)status.textContent=''}
    recognition.start()
  }
  analyseButton.onclick=()=>{
    const value=textarea.value.trim()
    if(!value){status.textContent=copy.empty;result.innerHTML='';return}
    status.textContent=''
    const recommendation=recommendProblem(value,language)
    const labels=caseLabels[language]||caseLabels.de
    result.innerHTML=`<article style="margin-top:14px;padding:15px;border:1px solid #d8c78f;border-radius:14px;background:linear-gradient(135deg,#fffaf0,#fff)"><small style="font-weight:850;color:#79601f">${copy.recommendation}</small><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:9px 0"><div><span style="display:block;font-size:.78rem;color:#707986">${copy.caseLabel}</span><b>${labels[recommendation.caseKey]}</b></div><div><span style="display:block;font-size:.78rem;color:#707986">${copy.planLabel}</span><b>${planLabels[recommendation.planKey]}</b></div></div><p style="margin:7px 0;color:#596472;line-height:1.45"><b>${copy.why}</b> ${recommendation.reason}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" data-show-case style="padding:9px 12px;border:0;border-radius:10px;background:#8f6e25;color:#fff;font-weight:800">${copy.showCase}</button><button type="button" data-show-plans style="padding:9px 12px;border:1px solid #d5c38f;border-radius:10px;background:#fff;color:#5b4618;font-weight:800">${copy.showPlans}</button></div><small style="display:block;margin-top:9px;color:#6d7682">${copy.change}</small></article>`
    result.querySelector('[data-show-case]').onclick=()=>{
      const buttons=[...document.querySelectorAll('.caseChooser .caseChoice')]
      const index=caseOrder.indexOf(recommendation.caseKey)
      if(index>=0&&buttons[index])buttons[index].click()
      document.getElementById('fallarten')?.scrollIntoView({behavior:'smooth',block:'start'})
    }
    result.querySelector('[data-show-plans]').onclick=()=>{
      const prices=document.querySelector('.prices')
      ;(prices?.closest('section')||prices)?.scrollIntoView({behavior:'smooth',block:'start'})
    }
  }
}

function applyHeroCopy(){
  if(location.pathname!=='/') return
  const language=document.documentElement.lang||'de'
  const copy=heroCopy[language]||heroCopy.de
  const title=document.querySelector('.hero h1')
  const lead=document.querySelector('.hero .lead')
  if(title) title.textContent=copy.title
  if(lead) lead.textContent=copy.lead
  ensureProblemNavigator(language)
  ensureAudienceBlock(language)
}

export function HeroCopyEnhancer(){
  useEffect(()=>{
    applyHeroCopy()
    const observer=new MutationObserver(applyHeroCopy)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']})
    const timer=setInterval(applyHeroCopy,500)
    return ()=>{observer.disconnect();clearInterval(timer)}
  },[])
  return null
}
