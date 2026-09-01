'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { CaseDetail, CaseSection, DocumentDetail, DocumentSection, QuickActions, getV24Copy } from './components/V24Workspace'
import { ApprovalDetail, ApprovalSection, getV25ApprovalCopy } from './components/V25ApprovalWorkflow'
import { getV26AnalysisCopy } from './components/V26DocumentAnalysis'
import { LegalFooter } from './components/LegalFooter'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { PublicLanguageModules } from './components/PublicLanguageModules'
import { LegalAcceptance, PRIVACY_NOTICE_VERSION, RegistrationLegalFields, TERMS_VERSION, getV28PrivacyCopy } from './components/V28PrivacyControls'
import { PasswordPolicyChecklist, getV29PasswordCopy, validateV29Password } from './components/V29PasswordPolicy'
import { PromoCodeControl } from './components/PromoCodeControl'
import { localeForLanguage, pageTranslations, rtlLanguages, supportedLanguages } from './lib/v30Languages.mjs'
import { promoTranslations } from './lib/v31PromoTranslations.mjs'
import { getProblemLanguageProfile } from './lib/problemNavigatorLanguagesV36.mjs'
import { orderCasesByResearch } from './lib/casePriorityV56.mjs'

const emptyData = { cases: [], clients: [], documents: [], approvals: [], assessments: [], sourceStatus: [] }
const emptyCase = { title:'', client_id:'', reference_no:'', goal:'', summary:'', deadline_at:'', next_action:'' }
const sectionNames = { cases: 'Fälle', clients: 'Kunden', documents: 'Dokumente', approvals: 'Freigaben' }

const languages = supportedLanguages

const passwordUi = {
  de:{show:'Anzeigen',hide:'Verbergen'},
  en:{show:'Show',hide:'Hide'},
  tr:{show:'Göster',hide:'Gizle'},
  pl:{show:'Pokaż',hide:'Ukryj'},
  ru:{show:'Показать',hide:'Скрыть'},
  ar:{show:'إظهار',hide:'إخفاء'}
}

// Temporary V26 test ceiling. The final product limit is defined only after the
// complete document workflow and tariff model have been approved. Supabase Free
// currently allows at most 50 MB per file globally.
const maxUploadBytes = 50 * 1024 * 1024
const allowedUploadExtensions = new Set(['pdf','txt','csv','rtf','eml','msg','jpg','jpeg','png','webp','heic','heif','tif','tiff','doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp'])
const allowedUploadAccept = [...allowedUploadExtensions].map(extension=>`.${extension}`).join(',')
const uploadUi = {
  de:{tooLarge:'Die Datei ist größer als 50 MB.',unsupported:'Dieses Dateiformat wird nicht unterstützt.',testLimit:'Testphase: vorläufig maximal 50 MB pro Datei. Die endgültige Grenze wird erst nach der vollständigen App-Definition festgelegt.'},
  en:{tooLarge:'The file is larger than 50 MB.',unsupported:'This file format is not supported.',testLimit:'Test phase: temporary maximum of 50 MB per file. The final limit will be set only after the complete app definition.'},
  tr:{tooLarge:'Dosya 50 MB’den büyük.',unsupported:'Bu dosya biçimi desteklenmiyor.',testLimit:'Test aşaması: dosya başına geçici olarak en fazla 50 MB. Nihai sınır, uygulama tamamen tanımlandıktan sonra belirlenecektir.'},
  pl:{tooLarge:'Plik jest większy niż 50 MB.',unsupported:'Ten format pliku nie jest obsługiwany.',testLimit:'Faza testowa: tymczasowo maksymalnie 50 MB na plik. Ostateczny limit zostanie ustalony dopiero po pełnym zdefiniowaniu aplikacji.'},
  ru:{tooLarge:'Размер файла превышает 50 МБ.',unsupported:'Этот формат файла не поддерживается.',testLimit:'Тестовый этап: временно не более 50 МБ на файл. Окончательный лимит будет установлен только после полного определения приложения.'},
  ar:{tooLarge:'حجم الملف أكبر من 50 ميغابايت.',unsupported:'تنسيق الملف هذا غير مدعوم.',testLimit:'مرحلة الاختبار: الحد المؤقت 50 ميغابايت لكل ملف. لن يُحدد الحد النهائي إلا بعد اكتمال تعريف التطبيق.'}
}

const ui = {
  de:{ prices:'Preise', register:'Neu registrieren', login:'Anmelden', hero:'Komplexe Vorgänge. Klar geführt.', lead:'AS Gold ordnet Unterlagen, zeigt Lücken, Risiken, Fristen und nächste Schritte verständlich auf.', freeCta:'3 Dokumente kostenlos kennenlernen', compare:'Preise vergleichen', legal:'Rechtliche Grundlage: Deutschland / deutsches Recht', language:'Sprache', outputLanguage:'Ausgabesprache', germanOutput:'Deutsch', englishOutput:'Englisch', turkishOutput:'Türkisch', polishOutput:'Polnisch', russianOutput:'Russisch', arabicOutput:'Arabisch', marketNote:'AS Gold ist für den deutschen Markt ausgelegt. Die gewählte Sprache ändert nicht die rechtliche Grundlage.' },
  en:{ prices:'Prices', register:'Register', login:'Sign in', hero:'Complex cases. Clearly guided.', lead:'AS Gold organizes documents and highlights gaps, risks, deadlines and next steps in a clear way.', freeCta:'Try 3 documents for free', compare:'Compare prices', legal:'Legal basis: Germany / German law', language:'Language', outputLanguage:'Output language', germanOutput:'German', englishOutput:'English', turkishOutput:'Turkish', polishOutput:'Polish', russianOutput:'Russian', arabicOutput:'Arabic', marketNote:'AS Gold is designed for the German market. Changing the language does not change the legal basis.' },
  tr:{ prices:'Fiyatlar', register:'Kayıt ol', login:'Giriş yap', hero:'Karmaşık işlemler. Net bir şekilde yönlendirilir.', lead:'AS Gold belgeleri düzenler; eksikleri, riskleri, süreleri ve sonraki adımları anlaşılır biçimde gösterir.', freeCta:'3 belgeyi ücretsiz deneyin', compare:'Fiyatları karşılaştır', legal:'Hukuki temel: Almanya / Alman hukuku', language:'Dil', outputLanguage:'Çıktı dili', germanOutput:'Almanca', englishOutput:'İngilizce', turkishOutput:'Türkçe', polishOutput:'Lehçe', russianOutput:'Rusça', arabicOutput:'Arapça', marketNote:'AS Gold Alman pazarı için tasarlanmıştır. Dil seçimi hukuki temeli değiştirmez.' },
  pl:{ prices:'Ceny', register:'Zarejestruj się', login:'Zaloguj się', hero:'Złożone sprawy. Jasne prowadzenie.', lead:'AS Gold porządkuje dokumenty i pokazuje braki, ryzyka, terminy oraz kolejne kroki w zrozumiały sposób.', freeCta:'Wypróbuj 3 dokumenty bezpłatnie', compare:'Porównaj ceny', legal:'Podstawa prawna: Niemcy / prawo niemieckie', language:'Język', outputLanguage:'Język wyniku', germanOutput:'Niemiecki', englishOutput:'Angielski', turkishOutput:'Turecki', polishOutput:'Polski', russianOutput:'Rosyjski', arabicOutput:'Arabski', marketNote:'AS Gold jest przeznaczony na rynek niemiecki. Zmiana języka nie zmienia podstawy prawnej.' },
  ru:{ prices:'Цены', register:'Зарегистрироваться', login:'Войти', hero:'Сложные дела. Понятное сопровождение.', lead:'AS Gold упорядочивает документы и понятно показывает пробелы, риски, сроки и следующие шаги.', freeCta:'Попробовать 3 документа бесплатно', compare:'Сравнить цены', legal:'Правовая основа: Германия / немецкое право', language:'Язык', outputLanguage:'Язык результата', germanOutput:'Немецкий', englishOutput:'Английский', turkishOutput:'Турецкий', polishOutput:'Польский', russianOutput:'Русский', arabicOutput:'Арабский', marketNote:'AS Gold предназначен для немецкого рынка. Выбор языка не меняет правовую основу.' },
  ar:{ prices:'الأسعار', register:'تسجيل جديد', login:'تسجيل الدخول', hero:'قضايا معقدة. توجيه واضح.', lead:'ينظم AS Gold المستندات ويعرض بوضوح النواقص والمخاطر والمواعيد النهائية والخطوات التالية.', freeCta:'جرّب 3 مستندات مجانًا', compare:'مقارنة الأسعار', legal:'الأساس القانوني: ألمانيا / القانون الألماني', language:'اللغة', outputLanguage:'لغة الإخراج', germanOutput:'الألمانية', englishOutput:'الإنجليزية', turkishOutput:'التركية', polishOutput:'البولندية', russianOutput:'الروسية', arabicOutput:'العربية', marketNote:'تم تصميم AS Gold للسوق الألمانية. تغيير اللغة لا يغيّر الأساس القانوني.' }
}

const exportUi = {
  de:{caseTitle:'AS Gold Fallübersicht',documentTitle:'AS Gold Dokumentauswertung',case:'Fall',status:'Status',traffic:'Ampel',summary:'Sachstand',documents:'Dokumente',document:'Dokument',documentType:'Dokumenttyp',documentDate:'Dokumentdatum',analysis:'Analyse',nextStep:'Nächster Schritt',extracted:'Extrahierter Inhalt',none:'Keine',noAnalysis:'Noch keine Analyse hinterlegt.',open:'Offen',closed:'Geschlossen',yellow:'Gelb',green:'Grün',red:'Rot'},
  en:{caseTitle:'AS Gold case overview',documentTitle:'AS Gold document analysis',case:'Case',status:'Status',traffic:'Traffic light',summary:'Summary',documents:'Documents',document:'Document',documentType:'Document type',documentDate:'Document date',analysis:'Analysis',nextStep:'Next step',extracted:'Extracted content',none:'None',noAnalysis:'No analysis available yet.',open:'Open',closed:'Closed',yellow:'Yellow',green:'Green',red:'Red'},
  tr:{caseTitle:'AS Gold dosya özeti',documentTitle:'AS Gold belge analizi',case:'Dosya',status:'Durum',traffic:'Trafik ışığı',summary:'Özet',documents:'Belgeler',document:'Belge',documentType:'Belge türü',documentDate:'Belge tarihi',analysis:'Analiz',nextStep:'Sonraki adım',extracted:'Çıkarılan içerik',none:'Yok',noAnalysis:'Henüz analiz yok.',open:'Açık',closed:'Kapalı',yellow:'Sarı',green:'Yeşil',red:'Kırmızı'},
  pl:{caseTitle:'AS Gold – przegląd sprawy',documentTitle:'AS Gold – analiza dokumentu',case:'Sprawa',status:'Status',traffic:'Sygnalizacja',summary:'Stan sprawy',documents:'Dokumenty',document:'Dokument',documentType:'Typ dokumentu',documentDate:'Data dokumentu',analysis:'Analiza',nextStep:'Następny krok',extracted:'Wyodrębniona treść',none:'Brak',noAnalysis:'Brak analizy.',open:'Otwarte',closed:'Zamknięte',yellow:'Żółty',green:'Zielony',red:'Czerwony'},
  ru:{caseTitle:'AS Gold – обзор дела',documentTitle:'AS Gold – анализ документа',case:'Дело',status:'Статус',traffic:'Светофор',summary:'Состояние дела',documents:'Документы',document:'Документ',documentType:'Тип документа',documentDate:'Дата документа',analysis:'Анализ',nextStep:'Следующий шаг',extracted:'Извлечённое содержимое',none:'Нет',noAnalysis:'Анализа пока нет.',open:'Открыто',closed:'Закрыто',yellow:'Жёлтый',green:'Зелёный',red:'Красный'},
  ar:{caseTitle:'AS Gold - نظرة عامة على الحالة',documentTitle:'AS Gold - تحليل المستند',case:'الحالة',status:'الحالة',traffic:'إشارة التقييم',summary:'ملخص الحالة',documents:'المستندات',document:'المستند',documentType:'نوع المستند',documentDate:'تاريخ المستند',analysis:'التحليل',nextStep:'الخطوة التالية',extracted:'المحتوى المستخرج',none:'لا يوجد',noAnalysis:'لا يوجد تحليل بعد.',open:'مفتوح',closed:'مغلق',yellow:'أصفر',green:'أخضر',red:'أحمر'}
}

const appText = {"de":{"checking":"Sitzung wird geprüft …","registerTitle":"Neu registrieren","protected":"Geschützter Arbeitsbereich","name":"Name","email":"E-Mail","password":"Passwort","passwordAgain":"Passwort wiederholen","registerFree":"Kostenlos registrieren","already":"Bereits registriert? Anmelden","newHere":"Neu hier? Jetzt registrieren","backExplanation":"← Zurück zur Erklärung","logout":"Abmelden","backCases":"← Zurück zu Fälle","backClients":"← Zurück zu Kunden","summary":"Sachstand","noSummary":"Noch keine Zusammenfassung hinterlegt.","exportResult":"Ergebnis exportieren:","export":"Exportieren","relatedDocs":"Zugehörige Dokumente","noAssignedDocs":"Noch keine Dokumente zugeordnet.","phone":"Telefon","note":"Notiz","overview":"Ihre Übersicht","signedInAs":"Angemeldet als","freeActive":"Kostenloser Einstieg aktiv","planActive":"Tarif {plan} aktiv","freePromise":"Bis zu {limit} Dokumente · keine vollständige Fallanalyse · kein Abo","paidPromise":"Keine automatische Verlängerung · Zugang endet ohne aktive Verlängerung automatisch","open":"Öffnen ›","upgrade":"Tarif upgraden","upgradeInfo":"Sie zahlen für den laufenden Zeitraum nur die anteilige Differenz. Danach gilt der gewählte Tarif. Keine automatische Verlängerung.","paymentOff":"Bezahlung noch deaktiviert","discount":"{discount}% Preisvorteil","regular":"regulär","priceCalc":"Preis wird berechnet …","dueNow":"Heute fällig","prorataHelp":"Nur die anteilige Differenz bis zum Ende des laufenden Zeitraums.","months":"{n} Monat{plural}","youSave":"Sie sparen {amount} ({discount} %)","regularAfter":"Regulärer Preis danach","noRenew":"✓ Keine automatische Verlängerung","quoteUnavailable":"Preisvorschau nicht verfügbar.","requestUpgrade":"Upgrade vormerken","testPhase":"Testphase:","testPhaseInfo":"Ein Upgrade wird nur vorgemerkt. Es wird noch keine Zahlung ausgelöst.","backOverview":"← Zur Übersicht","cancel":"Abbrechen","addClient":"＋ Kunde anlegen","saveClient":"Kunde speichern","uploadDoc":"Dokument hochladen","used":"Verwendet: {used} von {limit} Dokumenten.","file":"Datei","case":"Fall","withoutCase":"Ohne Fallzuordnung","uploading":"Wird hochgeladen …","noneYet":"Noch keine {section} vorhanden.","firstClient":"Tippen Sie auf „Kunde anlegen“, um den ersten Kunden zu erfassen.","firstDoc":"Laden Sie oben Ihr erstes Dokument hoch.","appearsHere":"Sobald ein Eintrag vorhanden ist, erscheint er hier.","eyebrow":"Struktur · Prüfung · nächster Schritt","whatDoes":"Was AS Gold für Sie macht","pricingEyebrow":"Preise & Leistungen","pricingTitle":"Vom kostenlosen Einstieg bis Business","pricingLead":"Sie entscheiden vorab, wie tief AS Gold Ihren Vorgang bearbeiten soll. Jede Stufe zeigt transparent, was geprüft wird und welches Ergebnis Sie erhalten.","suitable":"Geeignet für:","whatDone":"Was wird gemacht?","yourResult":"Ihr Ergebnis","notIncluded":"Nicht enthalten","testRegister":"Für Testphase registrieren","longTerms":"Längere Laufzeiten – freiwillig und transparent","noDiscount":"ohne Rabatt","termInfo":"Auch bei 3, 6 oder 12 Monaten gibt es keine automatische Verlängerung. Eine neue Laufzeit beginnt nur, wenn Sie sie ausdrücklich auswählen.","noSubscription":"Kein Abo. Keine automatische Verlängerung.","renewInfo":"Bezahlte Stufen gelten für die gewählte Laufzeit. Nach 20 Tagen erhalten Sie bei einer 30-Tage-Nutzung eine Erinnerung. Zwei Tage vor Ablauf erinnern wir erneut. Ohne aktive Verlängerung endet die kostenpflichtige Nutzung automatisch.","upgradeFair":"Bei einem Upgrade während einer laufenden Periode zahlen Sie nur die anteilige Differenz für die Restzeit. Danach gilt der reguläre Preis des höheren Tarifs beziehungsweise der gewählten Mehrmonatslaufzeit.","pauseInfo":"Danach wird Ihr Zugang pausiert, nicht gelöscht. Ihre vorhandenen Daten bleiben zunächst 3 Monate erhalten und können bei erneuter Aktivierung weiter genutzt werden.","currentTest":"Aktuelle Testphase:","currentTestInfo":"Die Bezahlfunktion ist vorübergehend deaktiviert. Registrierung und Testzugang sind derzeit ohne Zahlung möglich.","sections":{"cases":"Fälle","clients":"Kunden","documents":"Dokumente","approvals":"Freigaben"},"caps":[["Unterlagen lesen & ordnen","Verträge, Briefe, E-Mails und weitere Unterlagen werden dem richtigen Vorgang zugeordnet."],["Fehlendes sichtbar machen","Offene Nachweise, Widersprüche und fehlende Angaben werden erkennbar."],["Fristen erkennen","Wichtige Termine und Fristen werden hervorgehoben."],["Risiken bewerten","Ampeln zeigen geklärte, offene und dringende Punkte."],["Antworten vorbereiten","Passende Schreiben und Antworten werden aus dem Fall vorbereitet."],["Nächste Schritte","Sie sehen verständlich, was jetzt zu tun ist."]]},"en":{"checking":"Checking session …","registerTitle":"Register","protected":"Protected workspace","name":"Name","email":"Email","password":"Password","passwordAgain":"Repeat password","registerFree":"Register for free","already":"Already registered? Sign in","newHere":"New here? Register now","backExplanation":"← Back to explanation","logout":"Sign out","backCases":"← Back to cases","backClients":"← Back to clients","summary":"Summary","noSummary":"No summary available yet.","exportResult":"Export result:","export":"Export","relatedDocs":"Related documents","noAssignedDocs":"No documents assigned yet.","phone":"Phone","note":"Note","overview":"Your overview","signedInAs":"Signed in as","freeActive":"Free access active","planActive":"Plan {plan} active","freePromise":"Up to {limit} documents · no full case analysis · no subscription","paidPromise":"No automatic renewal · access ends automatically without active renewal","open":"Open ›","upgrade":"Upgrade plan","upgradeInfo":"For the current period you only pay the prorated difference. After that, the selected plan applies. No automatic renewal.","paymentOff":"Payment still disabled","discount":"{discount}% discount","regular":"regular","priceCalc":"Calculating price …","dueNow":"Due now","prorataHelp":"Only the prorated difference until the end of the current period.","months":"{n} month{plural}","youSave":"You save {amount} ({discount}%)","regularAfter":"Regular price afterwards","noRenew":"✓ No automatic renewal","quoteUnavailable":"Price preview unavailable.","requestUpgrade":"Request upgrade","testPhase":"Test phase:","testPhaseInfo":"The upgrade is only reserved. No payment is triggered yet.","backOverview":"← Back to overview","cancel":"Cancel","addClient":"＋ Add client","saveClient":"Save client","uploadDoc":"Upload document","used":"Used: {used} of {limit} documents.","file":"File","case":"Case","withoutCase":"Without case assignment","uploading":"Uploading …","noneYet":"No {section} yet.","firstClient":"Tap “Add client” to create the first client.","firstDoc":"Upload your first document above.","appearsHere":"Once an entry exists, it will appear here.","eyebrow":"Structure · Review · next step","whatDoes":"What AS Gold does for you","pricingEyebrow":"Prices & features","pricingTitle":"From free entry to Business","pricingLead":"You decide in advance how deeply AS Gold should process your case. Every level shows transparently what is checked and what result you receive.","suitable":"Suitable for:","whatDone":"What is done?","yourResult":"Your result","notIncluded":"Not included","testRegister":"Register for test phase","longTerms":"Longer terms – voluntary and transparent","noDiscount":"no discount","termInfo":"Even with 3, 6 or 12 months there is no automatic renewal. A new term starts only when you actively choose it.","noSubscription":"No subscription. No automatic renewal.","renewInfo":"Paid levels apply for the selected term. For 30-day use, you receive a reminder after 20 days and again two days before expiry. Without active renewal, paid access ends automatically.","upgradeFair":"If you upgrade during an active period, you only pay the prorated difference for the remaining time. Afterwards, the regular higher-plan or selected multi-month price applies.","pauseInfo":"Afterwards your access is paused, not deleted. Your existing data remains available for three months and can be reused after reactivation.","currentTest":"Current test phase:","currentTestInfo":"Payment is temporarily disabled. Registration and test access are currently possible without payment.","sections":{"cases":"Cases","clients":"Clients","documents":"Documents","approvals":"Approvals"},"caps":[["Read & organize documents","Contracts, letters, emails and other documents are assigned to the correct case."],["Make missing items visible","Missing evidence, contradictions and missing information become visible."],["Recognize deadlines","Important dates and deadlines are highlighted."],["Assess risks","Traffic lights show resolved, open and urgent points."],["Prepare responses","Suitable letters and responses are prepared from the case."],["Next steps","You can clearly see what needs to be done next."]]},"tr":{"checking":"Oturum kontrol ediliyor …","registerTitle":"Kayıt ol","protected":"Korumalı çalışma alanı","name":"Ad","email":"E-posta","password":"Şifre","passwordAgain":"Şifreyi tekrar girin","registerFree":"Ücretsiz kayıt ol","already":"Zaten kayıtlı mısınız? Giriş yapın","newHere":"Yeni misiniz? Şimdi kayıt olun","backExplanation":"← Açıklamaya dön","logout":"Çıkış yap","backCases":"← Dosyalara dön","backClients":"← Müşterilere dön","summary":"Özet","noSummary":"Henüz özet yok.","exportResult":"Sonucu dışa aktar:","export":"Dışa aktar","relatedDocs":"İlgili belgeler","noAssignedDocs":"Henüz atanmış belge yok.","phone":"Telefon","note":"Not","overview":"Genel bakışınız","signedInAs":"Giriş yapılan hesap","freeActive":"Ücretsiz başlangıç aktif","planActive":"{plan} tarifesi aktif","freePromise":"En fazla {limit} belge · tam dosya analizi yok · abonelik yok","paidPromise":"Otomatik yenileme yok · aktif yenileme olmadan erişim otomatik sona erer","open":"Aç ›","upgrade":"Tarifeyi yükselt","upgradeInfo":"Mevcut dönem için yalnızca kalan süreye ait oransal farkı ödersiniz. Sonrasında seçilen tarife geçerlidir. Otomatik yenileme yoktur.","paymentOff":"Ödeme hâlâ devre dışı","discount":"%{discount} avantaj","regular":"normal","priceCalc":"Fiyat hesaplanıyor …","dueNow":"Şimdi ödenecek","prorataHelp":"Yalnızca mevcut dönemin sonuna kadar kalan süre için oransal fark.","months":"{n} ay","youSave":"{amount} tasarruf edersiniz (%{discount})","regularAfter":"Sonraki normal fiyat","noRenew":"✓ Otomatik yenileme yok","quoteUnavailable":"Fiyat önizlemesi mevcut değil.","requestUpgrade":"Yükseltmeyi kaydet","testPhase":"Test aşaması:","testPhaseInfo":"Yükseltme yalnızca kaydedilir. Henüz ödeme alınmaz.","backOverview":"← Genel bakışa dön","cancel":"İptal","addClient":"＋ Müşteri ekle","saveClient":"Müşteriyi kaydet","uploadDoc":"Belge yükle","used":"Kullanılan: {used} / {limit} belge.","file":"Dosya","case":"Dosya","withoutCase":"Dosya ataması olmadan","uploading":"Yükleniyor …","noneYet":"Henüz {section} yok.","firstClient":"İlk müşteriyi oluşturmak için “Müşteri ekle”ye dokunun.","firstDoc":"İlk belgenizi yukarıdan yükleyin.","appearsHere":"Bir kayıt olduğunda burada görünür.","eyebrow":"Yapı · İnceleme · sonraki adım","whatDoes":"AS Gold sizin için ne yapar","pricingEyebrow":"Fiyatlar ve hizmetler","pricingTitle":"Ücretsiz başlangıçtan Business’a","pricingLead":"AS Gold’un dosyanızı ne kadar ayrıntılı işleyeceğini önceden siz seçersiniz. Her seviye neyin incelendiğini ve hangi sonucu alacağınızı açıkça gösterir.","suitable":"Uygun olduğu kişiler:","whatDone":"Ne yapılır?","yourResult":"Sonucunuz","notIncluded":"Dahil değil","testRegister":"Test aşaması için kayıt ol","longTerms":"Daha uzun süreler – isteğe bağlı ve şeffaf","noDiscount":"indirimsiz","termInfo":"3, 6 veya 12 aylık sürelerde de otomatik yenileme yoktur. Yeni süre yalnızca açıkça seçtiğinizde başlar.","noSubscription":"Abonelik yok. Otomatik yenileme yok.","renewInfo":"Ücretli seviyeler seçilen süre için geçerlidir. 30 günlük kullanımda 20. günde ve bitişten iki gün önce hatırlatma yapılır. Aktif yenileme olmadan ücretli erişim otomatik sona erer.","upgradeFair":"Aktif dönem sırasında yükseltmede yalnızca kalan süre için oransal farkı ödersiniz. Sonrasında üst tarifenin veya seçilen çok aylık sürenin normal fiyatı geçerlidir.","pauseInfo":"Sonrasında erişiminiz duraklatılır, silinmez. Mevcut verileriniz üç ay korunur ve yeniden etkinleştirildiğinde kullanılabilir.","currentTest":"Mevcut test aşaması:","currentTestInfo":"Ödeme geçici olarak devre dışıdır. Kayıt ve test erişimi şu anda ödeme olmadan mümkündür.","sections":{"cases":"Dosyalar","clients":"Müşteriler","documents":"Belgeler","approvals":"Onaylar"},"caps":[["Belgeleri oku ve düzenle","Sözleşmeler, mektuplar, e-postalar ve diğer belgeler doğru dosyaya atanır."],["Eksikleri görünür yap","Eksik kanıtlar, çelişkiler ve eksik bilgiler görünür hale gelir."],["Süreleri tanı","Önemli tarihler ve süreler vurgulanır."],["Riskleri değerlendir","Trafik ışıkları çözülmüş, açık ve acil noktaları gösterir."],["Yanıtları hazırla","Dosyaya uygun yazılar ve yanıtlar hazırlanır."],["Sonraki adımlar","Şimdi ne yapılması gerektiğini açıkça görürsünüz."]]},"pl":{"checking":"Sprawdzanie sesji …","registerTitle":"Zarejestruj się","protected":"Chroniony obszar roboczy","name":"Imię i nazwisko","email":"E-mail","password":"Hasło","passwordAgain":"Powtórz hasło","registerFree":"Zarejestruj się bezpłatnie","already":"Masz już konto? Zaloguj się","newHere":"Nowy użytkownik? Zarejestruj się","backExplanation":"← Wróć do objaśnienia","logout":"Wyloguj się","backCases":"← Wróć do spraw","backClients":"← Wróć do klientów","summary":"Stan sprawy","noSummary":"Brak podsumowania.","exportResult":"Eksportuj wynik:","export":"Eksportuj","relatedDocs":"Powiązane dokumenty","noAssignedDocs":"Brak przypisanych dokumentów.","phone":"Telefon","note":"Notatka","overview":"Twój przegląd","signedInAs":"Zalogowano jako","freeActive":"Darmowy dostęp aktywny","planActive":"Plan {plan} aktywny","freePromise":"Do {limit} dokumentów · bez pełnej analizy sprawy · bez abonamentu","paidPromise":"Brak automatycznego przedłużenia · dostęp kończy się bez aktywnego przedłużenia","open":"Otwórz ›","upgrade":"Zmień plan na wyższy","upgradeInfo":"Za bieżący okres płacisz tylko proporcjonalną różnicę. Następnie obowiązuje wybrany plan. Bez automatycznego przedłużenia.","paymentOff":"Płatność nadal wyłączona","discount":"{discount}% korzyści","regular":"standardowo","priceCalc":"Obliczanie ceny …","dueNow":"Do zapłaty teraz","prorataHelp":"Tylko proporcjonalna różnica do końca bieżącego okresu.","months":"{n} mies.","youSave":"Oszczędzasz {amount} ({discount}%)","regularAfter":"Cena regularna później","noRenew":"✓ Bez automatycznego przedłużenia","quoteUnavailable":"Podgląd ceny niedostępny.","requestUpgrade":"Zapisz zmianę planu","testPhase":"Faza testowa:","testPhaseInfo":"Zmiana planu jest tylko zapisywana. Płatność nie jest jeszcze pobierana.","backOverview":"← Wróć do przeglądu","cancel":"Anuluj","addClient":"＋ Dodaj klienta","saveClient":"Zapisz klienta","uploadDoc":"Prześlij dokument","used":"Wykorzystano: {used} z {limit} dokumentów.","file":"Plik","case":"Sprawa","withoutCase":"Bez przypisania do sprawy","uploading":"Przesyłanie …","noneYet":"Brak: {section}.","firstClient":"Kliknij „Dodaj klienta”, aby utworzyć pierwszego klienta.","firstDoc":"Prześlij pierwszy dokument powyżej.","appearsHere":"Gdy pojawi się wpis, będzie widoczny tutaj.","eyebrow":"Struktura · Kontrola · następny krok","whatDoes":"Co AS Gold robi dla Ciebie","pricingEyebrow":"Ceny i zakres","pricingTitle":"Od bezpłatnego startu do Business","pricingLead":"Z góry wybierasz, jak szczegółowo AS Gold ma opracować sprawę. Każdy poziom jasno pokazuje zakres kontroli i wynik.","suitable":"Dla kogo:","whatDone":"Co jest wykonywane?","yourResult":"Twój wynik","notIncluded":"Nie zawiera","testRegister":"Rejestracja do fazy testowej","longTerms":"Dłuższe okresy – dobrowolnie i przejrzyście","noDiscount":"bez rabatu","termInfo":"Także przy 3, 6 lub 12 miesiącach nie ma automatycznego przedłużenia. Nowy okres zaczyna się tylko po wyraźnym wyborze.","noSubscription":"Bez abonamentu. Bez automatycznego przedłużenia.","renewInfo":"Płatne poziomy obowiązują przez wybrany okres. Przy 30 dniach przypomnienie następuje po 20 dniach i ponownie dwa dni przed końcem. Bez aktywnego przedłużenia płatny dostęp kończy się automatycznie.","upgradeFair":"Przy zmianie planu w trakcie okresu płacisz tylko proporcjonalną różnicę za pozostały czas. Następnie obowiązuje zwykła cena wyższego planu lub wybranego okresu wielomiesięcznego.","pauseInfo":"Następnie dostęp jest wstrzymany, a nie usunięty. Dane pozostają przez trzy miesiące i mogą być ponownie użyte po reaktywacji.","currentTest":"Aktualna faza testowa:","currentTestInfo":"Płatności są tymczasowo wyłączone. Rejestracja i dostęp testowy są obecnie możliwe bez płatności.","sections":{"cases":"Sprawy","clients":"Klienci","documents":"Dokumenty","approvals":"Zatwierdzenia"},"caps":[["Czytaj i porządkuj dokumenty","Umowy, pisma, e-maile i inne dokumenty są przypisywane do właściwej sprawy."],["Pokaż braki","Brakujące dowody, sprzeczności i brakujące informacje stają się widoczne."],["Rozpoznaj terminy","Ważne daty i terminy są wyróżniane."],["Oceń ryzyko","Sygnalizacja pokazuje kwestie wyjaśnione, otwarte i pilne."],["Przygotuj odpowiedzi","Na podstawie sprawy przygotowywane są odpowiednie pisma i odpowiedzi."],["Następne kroki","Widzisz jasno, co należy zrobić dalej."]]},"ru":{"checking":"Проверка сеанса …","registerTitle":"Зарегистрироваться","protected":"Защищённая рабочая область","name":"Имя","email":"Эл. почта","password":"Пароль","passwordAgain":"Повторите пароль","registerFree":"Зарегистрироваться бесплатно","already":"Уже зарегистрированы? Войти","newHere":"Впервые здесь? Зарегистрироваться","backExplanation":"← Назад к объяснению","logout":"Выйти","backCases":"← Назад к делам","backClients":"← Назад к клиентам","summary":"Состояние дела","noSummary":"Сводки пока нет.","exportResult":"Экспортировать результат:","export":"Экспорт","relatedDocs":"Связанные документы","noAssignedDocs":"Документы пока не назначены.","phone":"Телефон","note":"Заметка","overview":"Ваш обзор","signedInAs":"Вход выполнен как","freeActive":"Бесплатный доступ активен","planActive":"Тариф {plan} активен","freePromise":"До {limit} документов · без полного анализа дела · без подписки","paidPromise":"Без автоматического продления · доступ завершается без активного продления","open":"Открыть ›","upgrade":"Повысить тариф","upgradeInfo":"За текущий период оплачивается только пропорциональная разница. Затем действует выбранный тариф. Без автоматического продления.","paymentOff":"Оплата пока отключена","discount":"скидка {discount}%","regular":"обычная цена","priceCalc":"Расчёт цены …","dueNow":"К оплате сейчас","prorataHelp":"Только пропорциональная разница до конца текущего периода.","months":"{n} мес.","youSave":"Вы экономите {amount} ({discount}%)","regularAfter":"Обычная цена далее","noRenew":"✓ Без автоматического продления","quoteUnavailable":"Предварительный расчёт недоступен.","requestUpgrade":"Сохранить повышение","testPhase":"Тестовый режим:","testPhaseInfo":"Повышение только регистрируется. Оплата пока не списывается.","backOverview":"← Назад к обзору","cancel":"Отмена","addClient":"＋ Добавить клиента","saveClient":"Сохранить клиента","uploadDoc":"Загрузить документ","used":"Использовано: {used} из {limit} документов.","file":"Файл","case":"Дело","withoutCase":"Без привязки к делу","uploading":"Загрузка …","noneYet":"Пока нет: {section}.","firstClient":"Нажмите «Добавить клиента», чтобы создать первого клиента.","firstDoc":"Загрузите первый документ выше.","appearsHere":"Когда появится запись, она будет показана здесь.","eyebrow":"Структура · Проверка · следующий шаг","whatDoes":"Что AS Gold делает для вас","pricingEyebrow":"Цены и возможности","pricingTitle":"От бесплатного старта до Business","pricingLead":"Вы заранее выбираете глубину обработки дела. Каждый уровень прозрачно показывает, что проверяется и какой результат вы получите.","suitable":"Для кого:","whatDone":"Что выполняется?","yourResult":"Ваш результат","notIncluded":"Не включено","testRegister":"Регистрация для теста","longTerms":"Более длительные сроки – добровольно и прозрачно","noDiscount":"без скидки","termInfo":"Даже при сроке 3, 6 или 12 месяцев автоматического продления нет. Новый срок начинается только после вашего явного выбора.","noSubscription":"Без подписки. Без автоматического продления.","renewInfo":"Платные уровни действуют выбранный срок. При 30-дневном доступе напоминание приходит через 20 дней и ещё раз за два дня до окончания. Без активного продления платный доступ заканчивается автоматически.","upgradeFair":"При повышении тарифа в течение периода оплачивается только пропорциональная разница за оставшееся время. Затем действует обычная цена более высокого тарифа или выбранного многомесячного срока.","pauseInfo":"После этого доступ приостанавливается, а не удаляется. Данные сохраняются три месяца и могут использоваться после повторной активации.","currentTest":"Текущий тестовый режим:","currentTestInfo":"Оплата временно отключена. Регистрация и тестовый доступ сейчас возможны без оплаты.","sections":{"cases":"Дела","clients":"Клиенты","documents":"Документы","approvals":"Согласования"},"caps":[["Читать и упорядочивать документы","Договоры, письма, электронные сообщения и другие документы привязываются к нужному делу."],["Показывать недостающее","Недостающие доказательства, противоречия и нехватка данных становятся видимыми."],["Распознавать сроки","Важные даты и сроки выделяются."],["Оценивать риски","Светофор показывает решённые, открытые и срочные вопросы."],["Готовить ответы","На основе дела подготавливаются подходящие письма и ответы."],["Следующие шаги","Вы ясно видите, что нужно сделать дальше."]]},"ar":{"checking":"جارٍ التحقق من الجلسة …","registerTitle":"تسجيل جديد","protected":"مساحة عمل محمية","name":"الاسم","email":"البريد الإلكتروني","password":"كلمة المرور","passwordAgain":"تكرار كلمة المرور","registerFree":"تسجيل مجاني","already":"مسجل بالفعل؟ تسجيل الدخول","newHere":"مستخدم جديد؟ سجّل الآن","backExplanation":"← العودة إلى الشرح","logout":"تسجيل الخروج","backCases":"← العودة إلى الحالات","backClients":"← العودة إلى العملاء","summary":"ملخص الحالة","noSummary":"لا يوجد ملخص بعد.","exportResult":"تصدير النتيجة:","export":"تصدير","relatedDocs":"المستندات المرتبطة","noAssignedDocs":"لا توجد مستندات مرتبطة بعد.","phone":"الهاتف","note":"ملاحظة","overview":"نظرة عامة","signedInAs":"تم تسجيل الدخول باسم","freeActive":"الدخول المجاني نشط","planActive":"الخطة {plan} نشطة","freePromise":"حتى {limit} مستندات · دون تحليل كامل للحالة · دون اشتراك","paidPromise":"لا تجديد تلقائي · ينتهي الوصول تلقائياً دون تجديد صريح","open":"فتح ›","upgrade":"ترقية الخطة","upgradeInfo":"تدفع للفترة الحالية فقط الفرق النسبي للمدة المتبقية. بعد ذلك تطبق الخطة المختارة. لا يوجد تجديد تلقائي.","paymentOff":"الدفع ما زال معطلاً","discount":"خصم {discount}%","regular":"السعر العادي","priceCalc":"جارٍ حساب السعر …","dueNow":"المستحق الآن","prorataHelp":"فقط الفرق النسبي حتى نهاية الفترة الحالية.","months":"{n} شهر","youSave":"توفر {amount} ({discount}%)","regularAfter":"السعر العادي لاحقاً","noRenew":"✓ لا تجديد تلقائي","quoteUnavailable":"معاينة السعر غير متاحة.","requestUpgrade":"حجز الترقية","testPhase":"مرحلة الاختبار:","testPhaseInfo":"يتم فقط تسجيل الترقية. لا يتم تحصيل أي دفعة بعد.","backOverview":"← العودة إلى النظرة العامة","cancel":"إلغاء","addClient":"＋ إضافة عميل","saveClient":"حفظ العميل","uploadDoc":"رفع مستند","used":"المستخدم: {used} من {limit} مستندات.","file":"الملف","case":"الحالة","withoutCase":"دون ربط بحالة","uploading":"جارٍ الرفع …","noneYet":"لا يوجد {section} بعد.","firstClient":"اضغط «إضافة عميل» لإنشاء أول عميل.","firstDoc":"ارفع مستندك الأول أعلاه.","appearsHere":"عند وجود إدخال سيظهر هنا.","eyebrow":"هيكلة · مراجعة · الخطوة التالية","whatDoes":"ما الذي يفعله AS Gold لك","pricingEyebrow":"الأسعار والمزايا","pricingTitle":"من البداية المجانية إلى Business","pricingLead":"تختار مسبقاً مدى عمق معالجة AS Gold لحالتك. يوضح كل مستوى بشفافية ما تتم مراجعته وما النتيجة التي تحصل عليها.","suitable":"مناسب لـ:","whatDone":"ما الذي يتم؟","yourResult":"نتيجتك","notIncluded":"غير مشمول","testRegister":"التسجيل لمرحلة الاختبار","longTerms":"مدد أطول – اختيارية وشفافة","noDiscount":"دون خصم","termInfo":"حتى مع 3 أو 6 أو 12 شهراً لا يوجد تجديد تلقائي. تبدأ مدة جديدة فقط إذا اخترتها صراحة.","noSubscription":"لا اشتراك. لا تجديد تلقائي.","renewInfo":"تسري المستويات المدفوعة للمدة المختارة. عند استخدام 30 يوماً يصلك تذكير بعد 20 يوماً ومرة أخرى قبل الانتهاء بيومين. دون تجديد صريح ينتهي الوصول المدفوع تلقائياً.","upgradeFair":"عند الترقية أثناء فترة جارية تدفع فقط الفرق النسبي للمدة المتبقية. بعد ذلك يسري السعر العادي للخطة الأعلى أو للمدة متعددة الأشهر المختارة.","pauseInfo":"بعد ذلك يتم إيقاف الوصول مؤقتاً لا حذفه. تبقى بياناتك ثلاثة أشهر ويمكن استخدامها بعد إعادة التفعيل.","currentTest":"مرحلة الاختبار الحالية:","currentTestInfo":"الدفع معطل مؤقتاً. التسجيل والوصول التجريبي متاحان حالياً دون دفع.","sections":{"cases":"الحالات","clients":"العملاء","documents":"المستندات","approvals":"الموافقات"},"caps":[["قراءة المستندات وتنظيمها","تُربط العقود والرسائل والبريد الإلكتروني والمستندات الأخرى بالحالة الصحيحة."],["إظهار النواقص","تظهر الأدلة المفقودة والتناقضات والمعلومات الناقصة بوضوح."],["اكتشاف المواعيد","يتم إبراز التواريخ والمواعيد المهمة."],["تقييم المخاطر","توضح إشارات التقييم النقاط المحسومة والمفتوحة والعاجلة."],["إعداد الردود","يتم إعداد خطابات وردود مناسبة انطلاقاً من الحالة."],["الخطوات التالية","ترى بوضوح ما الذي يجب فعله بعد ذلك."]]}}

const terms = [
  { months: 1, discount: 0, label: '1 Monat' },
  { months: 3, discount: 5, label: '3 Monate' },
  { months: 6, discount: 10, label: '6 Monate' },
  { months: 12, discount: 15, label: '12 Monate' }
]

const plans = [
  { key:'free', name:'Kostenlos', price:0, term:'einmalig', audience:'Zum unverbindlichen Kennenlernen.', checks:'Bis zu 3 Dokumente werden eingelesen, geordnet und übersichtlich dargestellt.', result:'Sie sehen, wie AS Gold Unterlagen strukturiert und Informationen verständlich zusammenführt.', excluded:'Keine vollständige Fallanalyse, keine umfassende Risikobewertung und keine fertigen Schreiben.' },
  { key:'start', name:'Gold Start', price:19.90, term:'/30 Tage', audience:'Für einfache Vorgänge und erste strukturierte Ordnung.', checks:'Dokumente werden geordnet, Inhalte zusammengefasst und dem Vorgang nachvollziehbar zugeordnet.', result:'Eine verständliche Übersicht über Sachstand, Unterlagen und die wichtigsten Informationen.', excluded:'Keine vertiefte Risikoanalyse und keine umfassende Prüfung komplexer Widersprüche.' },
  { key:'klar', name:'Gold Klar', price:39.90, term:'/30 Tage', audience:'Für Nutzer, die wissen möchten, was fehlt oder widersprüchlich ist.', checks:'Zusätzlich werden fehlende Unterlagen, Widersprüche, offene Punkte und wichtige Fristen erkannt.', result:'Eine klare Lücken- und Fristenübersicht mit verständlicher Priorisierung.', excluded:'Keine vollständige strategische Gesamtanalyse komplexer Fälle.' },
  { key:'analyse', name:'Gold Analyse', price:89.90, term:'/30 Tage', audience:'Für Fälle, bei denen Risiken und nächste Schritte bewertet werden sollen.', checks:'Sachverhalt, Risiken, Prioritäten, Widersprüche und Handlungsoptionen werden vertieft geprüft.', result:'Eine strukturierte Risiko- und Prioritätenbewertung mit konkreten nächsten Schritten.', excluded:'Keine vollständige Rundumbearbeitung einschließlich aller Schreiben und Folgeprozesse.' },
  { key:'komplett', name:'Gold Komplett', price:249.90, term:'/30 Tage', audience:'Für komplexe Vorgänge mit umfassendem Bearbeitungsbedarf.', checks:'Der Fall wird umfassend strukturiert, analysiert und auf Lücken, Risiken, Fristen und Handlungsbedarf geprüft.', result:'Detaillierte Fallanalyse, Handlungsempfehlungen und vorbereitete Entwürfe für passende Schreiben.', excluded:'Externe Vertretung, verbindliche Rechtsberatung oder automatische Versendung ohne Freigabe.' },
  { key:'business', name:'Gold Business', price:499.90, term:'/30 Tage', audience:'Für Unternehmen, Teams und mehrere parallel laufende Vorgänge.', checks:'Mehrere Fälle, Dokumente, Kunden, Freigaben und Arbeitsabläufe werden strukturiert verwaltet.', result:'Erweiterte Nutzung für wiederkehrende und umfangreichere Geschäftsprozesse mit Teambezug.', excluded:'Individuelle Sonderintegrationen oder externe Dienstleistungen, sofern nicht separat vereinbart.' }
]



const planJourney = {
  de:{
    free:{stage:'Stufe 1 · Kennenlernen',headline:'Einfach ausprobieren',knowledge:'Sie müssen nichts vorbereiten oder über Analysen wissen.',expectation:'Sie möchten sehen, was AS Gold aus Ihren Unterlagen macht.'},
    start:{stage:'Stufe 2 · Ordnung',headline:'Ich brauche erstmal Überblick',knowledge:'Sie kennen Ihren Vorgang, möchten ihn aber nicht selbst sortieren.',expectation:'Sie erwarten eine verständliche Zusammenfassung und saubere Ordnung.'},
    klar:{stage:'Stufe 3 · Klarheit',headline:'Was fehlt – und was ist wichtig?',knowledge:'Sie haben bereits Unterlagen und wollen Lücken, Widersprüche und Fristen erkennen.',expectation:'Sie erwarten klare Prioritäten statt nur einer Zusammenfassung.'},
    analyse:{stage:'Stufe 4 · Bewertung',headline:'Wie ist meine Lage?',knowledge:'Sie möchten Zusammenhänge, Risiken und Handlungsoptionen verstehen.',expectation:'Sie erwarten eine vertiefte Bewertung mit konkreten nächsten Schritten.'},
    komplett:{stage:'Stufe 5 · Bearbeitung',headline:'Ich möchte den Fall umfassend bearbeiten',knowledge:'Ihr Vorgang ist komplex und soll als Ganzes strukturiert und weiterbearbeitet werden.',expectation:'Sie erwarten Analyse, Empfehlungen und vorbereitete Schreiben in einem zusammenhängenden Arbeitsablauf.'},
    business:{stage:'Stufe 6 · Business',headline:'Ich steuere mehrere Vorgänge und Personen',knowledge:'Sie denken in Kunden, Fällen, Teams, Freigaben, Standards und wiederkehrenden Prozessen.',expectation:'Sie erwarten Kontrolle, Skalierbarkeit, Teamabläufe und professionelle Prozesssteuerung.'}
  },
  en:{
    free:{stage:'Level 1 · Discover',headline:'Just try it',knowledge:'You do not need to prepare anything or understand analysis methods.',expectation:'You want to see what AS Gold can make of your documents.'},
    start:{stage:'Level 2 · Organize',headline:'I need an overview first',knowledge:'You know your matter but do not want to sort everything yourself.',expectation:'You expect a clear summary and well-organized documents.'},
    klar:{stage:'Level 3 · Clarity',headline:'What is missing and what matters?',knowledge:'You already have documents and want to identify gaps, contradictions and deadlines.',expectation:'You expect clear priorities, not only a summary.'},
    analyse:{stage:'Level 4 · Assess',headline:'What is my position?',knowledge:'You want to understand connections, risks and possible actions.',expectation:'You expect a deeper assessment with concrete next steps.'},
    komplett:{stage:'Level 5 · Process',headline:'I want the matter handled comprehensively',knowledge:'Your matter is complex and should be structured and processed as a whole.',expectation:'You expect analysis, recommendations and prepared correspondence in one workflow.'},
    business:{stage:'Level 6 · Business',headline:'I manage several matters and people',knowledge:'You think in clients, cases, teams, approvals, standards and recurring workflows.',expectation:'You expect control, scalability, team workflows and professional process management.'}
  },
  tr:{
    free:{stage:'Seviye 1 · Tanışma',headline:'Sadece deneyin',knowledge:'Hazırlık yapmanız veya analiz yöntemlerini bilmeniz gerekmez.',expectation:'AS Gold’un belgelerinizden ne çıkarabildiğini görmek istiyorsunuz.'},
    start:{stage:'Seviye 2 · Düzen',headline:'Önce genel bir bakışa ihtiyacım var',knowledge:'Konunuzu biliyorsunuz ancak her şeyi kendiniz düzenlemek istemiyorsunuz.',expectation:'Anlaşılır bir özet ve düzenli belge yapısı bekliyorsunuz.'},
    klar:{stage:'Seviye 3 · Netlik',headline:'Ne eksik, ne önemli?',knowledge:'Belgeleriniz var; eksikleri, çelişkileri ve süreleri görmek istiyorsunuz.',expectation:'Sadece özet değil, açık öncelikler bekliyorsunuz.'},
    analyse:{stage:'Seviye 4 · Değerlendirme',headline:'Durumum nedir?',knowledge:'Bağlantıları, riskleri ve seçenekleri anlamak istiyorsunuz.',expectation:'Somut sonraki adımlarla daha derin bir değerlendirme bekliyorsunuz.'},
    komplett:{stage:'Seviye 5 · İşleme',headline:'Dosyam kapsamlı işlensin',knowledge:'Konunuz karmaşık ve bir bütün olarak yapılandırılıp işlenmeli.',expectation:'Tek akışta analiz, öneriler ve hazırlanmış yazılar bekliyorsunuz.'},
    business:{stage:'Seviye 6 · Business',headline:'Birden çok dosya ve kişiyi yönetiyorum',knowledge:'Müşteri, dosya, ekip, onay, standart ve tekrarlanan süreçlerle çalışıyorsunuz.',expectation:'Kontrol, ölçeklenebilirlik, ekip akışları ve profesyonel süreç yönetimi bekliyorsunuz.'}
  },
  pl:{
    free:{stage:'Poziom 1 · Poznanie',headline:'Po prostu wypróbuj',knowledge:'Nie musisz nic przygotowywać ani znać metod analizy.',expectation:'Chcesz zobaczyć, co AS Gold potrafi zrobić z Twoimi dokumentami.'},
    start:{stage:'Poziom 2 · Porządek',headline:'Najpierw potrzebuję przeglądu',knowledge:'Znasz swoją sprawę, ale nie chcesz samodzielnie wszystkiego porządkować.',expectation:'Oczekujesz zrozumiałego podsumowania i uporządkowanych dokumentów.'},
    klar:{stage:'Poziom 3 · Jasność',headline:'Czego brakuje i co jest ważne?',knowledge:'Masz już dokumenty i chcesz wykryć braki, sprzeczności oraz terminy.',expectation:'Oczekujesz jasnych priorytetów, a nie tylko podsumowania.'},
    analyse:{stage:'Poziom 4 · Ocena',headline:'Jaka jest moja sytuacja?',knowledge:'Chcesz zrozumieć zależności, ryzyka i możliwe działania.',expectation:'Oczekujesz pogłębionej oceny i konkretnych kolejnych kroków.'},
    komplett:{stage:'Poziom 5 · Opracowanie',headline:'Chcę kompleksowo opracować sprawę',knowledge:'Sprawa jest złożona i powinna być uporządkowana oraz opracowana jako całość.',expectation:'Oczekujesz analizy, rekomendacji i przygotowanych pism w jednym procesie.'},
    business:{stage:'Poziom 6 · Business',headline:'Zarządzam wieloma sprawami i osobami',knowledge:'Pracujesz z klientami, sprawami, zespołami, akceptacjami, standardami i procesami.',expectation:'Oczekujesz kontroli, skalowalności, pracy zespołowej i profesjonalnego zarządzania procesami.'}
  },
  ru:{
    free:{stage:'Уровень 1 · Знакомство',headline:'Просто попробуйте',knowledge:'Не нужно ничего готовить или разбираться в методах анализа.',expectation:'Вы хотите увидеть, что AS Gold может сделать с вашими документами.'},
    start:{stage:'Уровень 2 · Порядок',headline:'Сначала мне нужен обзор',knowledge:'Вы знаете свою ситуацию, но не хотите самостоятельно всё сортировать.',expectation:'Вы ожидаете понятное резюме и упорядоченные документы.'},
    klar:{stage:'Уровень 3 · Ясность',headline:'Чего не хватает и что важно?',knowledge:'У вас уже есть документы, и вы хотите увидеть пробелы, противоречия и сроки.',expectation:'Вы ожидаете ясные приоритеты, а не только резюме.'},
    analyse:{stage:'Уровень 4 · Оценка',headline:'Каково моё положение?',knowledge:'Вы хотите понять связи, риски и варианты действий.',expectation:'Вы ожидаете углублённую оценку с конкретными следующими шагами.'},
    komplett:{stage:'Уровень 5 · Обработка',headline:'Я хочу комплексно обработать дело',knowledge:'Ситуация сложная и должна быть структурирована и обработана как единое целое.',expectation:'Вы ожидаете анализ, рекомендации и подготовленные письма в одном процессе.'},
    business:{stage:'Уровень 6 · Business',headline:'Я управляю несколькими делами и людьми',knowledge:'Вы работаете с клиентами, делами, командами, согласованиями, стандартами и процессами.',expectation:'Вы ожидаете контроль, масштабируемость, командную работу и профессиональное управление процессами.'}
  },
  ar:{
    free:{stage:'المستوى 1 · التعرّف',headline:'جرّبه ببساطة',knowledge:'لا تحتاج إلى تحضير مسبق أو معرفة بأساليب التحليل.',expectation:'تريد أن ترى ما الذي يستطيع AS Gold استخراجه من مستنداتك.'},
    start:{stage:'المستوى 2 · التنظيم',headline:'أحتاج أولاً إلى نظرة عامة',knowledge:'تعرف موضوعك لكنك لا تريد ترتيب كل شيء بنفسك.',expectation:'تتوقع ملخصاً واضحاً ومستندات منظمة.'},
    klar:{stage:'المستوى 3 · الوضوح',headline:'ما الناقص وما المهم؟',knowledge:'لديك مستندات وتريد اكتشاف النواقص والتناقضات والمواعيد.',expectation:'تتوقع أولويات واضحة، وليس مجرد ملخص.'},
    analyse:{stage:'المستوى 4 · التقييم',headline:'ما هو موقفي؟',knowledge:'تريد فهم الروابط والمخاطر وخيارات التصرف.',expectation:'تتوقع تقييماً أعمق مع خطوات تالية محددة.'},
    komplett:{stage:'المستوى 5 · المعالجة',headline:'أريد معالجة الحالة بشكل شامل',knowledge:'حالتك معقدة ويجب تنظيمها ومعالجتها كوحدة متكاملة.',expectation:'تتوقع تحليلاً وتوصيات وخطابات مُعدة ضمن سير عمل واحد.'},
    business:{stage:'المستوى 6 · Business',headline:'أدير عدة حالات وأشخاص',knowledge:'تعمل مع عملاء وحالات وفرق وموافقات ومعايير وعمليات متكررة.',expectation:'تتوقع التحكم وقابلية التوسع وسير عمل الفرق وإدارة احترافية للعمليات.'}
  }
}

const planText = {"de":{},"en":{"free":["For a no-obligation introduction.","Up to 3 documents are read, organized and presented clearly.","You see how AS Gold structures documents and combines information clearly.","No full case analysis, comprehensive risk assessment or finished letters."],"start":["For simple matters and initial structured organization.","Documents are organized, summarized and assigned to the case.","A clear overview of the situation, documents and key information.","No in-depth risk analysis or comprehensive review of complex contradictions."],"klar":["For users who want to know what is missing or contradictory.","Missing documents, contradictions, open points and important deadlines are identified.","A clear gap and deadline overview with understandable prioritization.","No complete strategic overall analysis of complex cases."],"analyse":["For cases where risks and next steps should be assessed.","Facts, risks, priorities, contradictions and options are reviewed in depth.","A structured risk and priority assessment with concrete next steps.","No complete end-to-end handling including all letters and follow-up processes."],"komplett":["For complex matters requiring comprehensive processing.","The case is fully structured and analyzed for gaps, risks, deadlines and action needs.","Detailed case analysis, recommendations and prepared drafts for suitable letters.","No external representation, binding legal advice or automatic sending without approval."],"business":["For companies, teams and multiple parallel matters.","Multiple cases, documents, clients, approvals and workflows are managed in a structured way.","Extended use for recurring and larger business processes with team support.","No individual special integrations or external services unless separately agreed."]},"tr":{"free":["Ürünü risksiz tanımak için.","En fazla 3 belge okunur, düzenlenir ve anlaşılır biçimde gösterilir.","AS Gold’un belgeleri nasıl yapılandırdığını ve bilgileri nasıl birleştirdiğini görürsünüz.","Tam dosya analizi, kapsamlı risk değerlendirmesi ve hazır yazılar dahil değildir."],"start":["Basit işlemler ve ilk yapılandırılmış düzen için.","Belgeler düzenlenir, özetlenir ve dosyaya atanır.","Durum, belgeler ve önemli bilgiler için anlaşılır bir genel bakış.","Derin risk analizi ve karmaşık çelişkilerin kapsamlı incelemesi dahil değildir."],"klar":["Nelerin eksik veya çelişkili olduğunu görmek isteyenler için.","Eksik belgeler, çelişkiler, açık noktalar ve önemli süreler belirlenir.","Anlaşılır önceliklendirmeli eksik ve süre özeti.","Karmaşık dosyaların tam stratejik genel analizi dahil değildir."],"analyse":["Risklerin ve sonraki adımların değerlendirilmesi gereken dosyalar için.","Olay, riskler, öncelikler, çelişkiler ve seçenekler ayrıntılı incelenir.","Somut sonraki adımlarla yapılandırılmış risk ve öncelik değerlendirmesi.","Tüm yazılar ve takip süreçleri dahil tam kapsamlı işlem yoktur."],"komplett":["Kapsamlı işlem gerektiren karmaşık dosyalar için.","Dosya eksikler, riskler, süreler ve işlem ihtiyacı açısından kapsamlı biçimde yapılandırılır ve analiz edilir.","Ayrıntılı dosya analizi, öneriler ve uygun yazılar için hazırlanmış taslaklar.","Dış temsil, bağlayıcı hukuki danışmanlık veya onaysız otomatik gönderim yoktur."],"business":["Şirketler, ekipler ve paralel çok sayıda dosya için.","Birden fazla dosya, belge, müşteri, onay ve iş akışı yapılandırılmış biçimde yönetilir.","Tekrarlanan ve daha kapsamlı iş süreçleri için ekip destekli genişletilmiş kullanım.","Ayrıca kararlaştırılmadıkça özel entegrasyonlar veya dış hizmetler dahil değildir."]},"pl":{"free":["Do niezobowiązującego poznania systemu.","Do 3 dokumentów jest odczytywanych, porządkowanych i przedstawianych w przejrzysty sposób.","Widzisz, jak AS Gold strukturyzuje dokumenty i łączy informacje.","Bez pełnej analizy sprawy, kompleksowej oceny ryzyka i gotowych pism."],"start":["Do prostych spraw i pierwszego uporządkowania.","Dokumenty są porządkowane, streszczane i przypisywane do sprawy.","Czytelny przegląd stanu, dokumentów i najważniejszych informacji.","Bez pogłębionej analizy ryzyka i pełnego badania złożonych sprzeczności."],"klar":["Dla osób chcących wiedzieć, czego brakuje lub co jest sprzeczne.","Wykrywane są brakujące dokumenty, sprzeczności, otwarte kwestie i ważne terminy.","Jasny przegląd braków i terminów z priorytetami.","Bez pełnej strategicznej analizy całościowej złożonych spraw."],"analyse":["Dla spraw wymagających oceny ryzyk i kolejnych kroków.","Stan faktyczny, ryzyka, priorytety, sprzeczności i opcje są analizowane szczegółowo.","Ustrukturyzowana ocena ryzyka i priorytetów z konkretnymi krokami.","Bez pełnej obsługi obejmującej wszystkie pisma i dalsze procesy."],"komplett":["Dla złożonych spraw wymagających kompleksowego opracowania.","Sprawa jest kompleksowo strukturyzowana i analizowana pod kątem braków, ryzyk, terminów i działań.","Szczegółowa analiza, zalecenia i przygotowane projekty odpowiednich pism.","Bez reprezentacji zewnętrznej, wiążącej porady prawnej i automatycznej wysyłki bez zgody."],"business":["Dla firm, zespołów i wielu równoległych spraw.","Wiele spraw, dokumentów, klientów, zatwierdzeń i procesów jest zarządzanych w sposób uporządkowany.","Rozszerzone wykorzystanie w powtarzalnych i większych procesach biznesowych z pracą zespołową.","Bez indywidualnych integracji specjalnych lub usług zewnętrznych, jeśli nie uzgodniono osobno."]},"ru":{"free":["Для бесплатного знакомства без обязательств.","До 3 документов считываются, упорядочиваются и понятно отображаются.","Вы видите, как AS Gold структурирует документы и объединяет информацию.","Без полного анализа дела, комплексной оценки рисков и готовых писем."],"start":["Для простых вопросов и первичного структурирования.","Документы упорядочиваются, резюмируются и привязываются к делу.","Понятный обзор ситуации, документов и ключевой информации.","Без углублённого анализа рисков и полной проверки сложных противоречий."],"klar":["Для тех, кто хочет знать, чего не хватает или что противоречиво.","Выявляются недостающие документы, противоречия, открытые вопросы и важные сроки.","Чёткий обзор пробелов и сроков с понятными приоритетами.","Без полного стратегического общего анализа сложных дел."],"analyse":["Для дел, где нужно оценить риски и следующие шаги.","Факты, риски, приоритеты, противоречия и варианты действий анализируются углублённо.","Структурированная оценка рисков и приоритетов с конкретными следующими шагами.","Без полного сопровождения со всеми письмами и последующими процессами."],"komplett":["Для сложных дел, требующих комплексной обработки.","Дело комплексно структурируется и анализируется на пробелы, риски, сроки и необходимость действий.","Подробный анализ, рекомендации и подготовленные проекты подходящих писем.","Без внешнего представительства, обязательной юридической консультации и автоматической отправки без согласования."],"business":["Для компаний, команд и нескольких параллельных дел.","Несколько дел, документов, клиентов, согласований и процессов управляются структурировано.","Расширенное использование для повторяющихся и более крупных бизнес-процессов с командной работой.","Без индивидуальных специальных интеграций или внешних услуг, если они не согласованы отдельно."]},"ar":{"free":["للتعرّف على النظام مجاناً ومن دون التزام.","تتم قراءة ما يصل إلى 3 مستندات وتنظيمها وعرضها بوضوح.","ترى كيف ينظم AS Gold المستندات ويجمع المعلومات بشكل مفهوم.","لا يشمل تحليلاً كاملاً للحالة أو تقييماً شاملاً للمخاطر أو خطابات جاهزة."],"start":["للمعاملات البسيطة والتنظيم الأولي المنهجي.","يتم تنظيم المستندات وتلخيصها وربطها بالحالة.","نظرة واضحة على الوضع والمستندات وأهم المعلومات.","لا يشمل تحليلاً معمقاً للمخاطر أو مراجعة شاملة للتناقضات المعقدة."],"klar":["لمن يريد معرفة ما هو مفقود أو متناقض.","يتم اكتشاف المستندات الناقصة والتناقضات والنقاط المفتوحة والمواعيد المهمة.","نظرة واضحة على النواقص والمواعيد مع ترتيب الأولويات.","لا يشمل تحليلاً استراتيجياً شاملاً للحالات المعقدة."],"analyse":["للحالات التي تتطلب تقييم المخاطر والخطوات التالية.","تتم مراجعة الوقائع والمخاطر والأولويات والتناقضات وخيارات التصرف بعمق.","تقييم منظم للمخاطر والأولويات مع خطوات تالية محددة.","لا يشمل معالجة شاملة كاملة لكل الخطابات والعمليات اللاحقة."],"komplett":["للحالات المعقدة التي تحتاج إلى معالجة شاملة.","تتم هيكلة الحالة وتحليلها بشكل شامل من حيث النواقص والمخاطر والمواعيد والحاجة إلى الإجراء.","تحليل مفصل وتوصيات ومسودات معدّة لخطابات مناسبة.","لا يشمل التمثيل الخارجي أو الاستشارة القانونية الملزمة أو الإرسال التلقائي دون موافقة."],"business":["للشركات والفرق وعدة حالات تعمل بالتوازي.","تتم إدارة عدة حالات ومستندات وعملاء وموافقات ومسارات عمل بشكل منظم.","استخدام موسع للعمليات التجارية المتكررة والأكبر مع العمل الجماعي.","لا يشمل تكاملات خاصة فردية أو خدمات خارجية ما لم يتم الاتفاق عليها بشكل منفصل."]}}

const notices = {
  de:{pwMin:'Das Passwort muss mindestens 12 Zeichen sowie Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.',pwMismatch:'Die Passwörter stimmen nicht überein.',registered:'Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail und melden Sie sich danach an.',upgradeReserved:'Upgrade vorgemerkt.',selected:'Gewählt',monthOne:'Monat',monthMany:'Monate',chooseFile:'Bitte wählen Sie eine Datei aus.',docLimit:'Ihr aktueller Tarif erlaubt maximal {limit} Dokumente. Bitte wählen Sie ein Upgrade.',exportLocked:'Dieses Exportformat ist in Ihrem aktuellen Tarif nicht enthalten. Bitte wählen Sie ein Upgrade.',pptxLoad:'PowerPoint-Modul konnte nicht geladen werden.'},
  en:{pwMin:'The password must contain at least 12 characters, uppercase and lowercase letters, a number, and a symbol.',pwMismatch:'The passwords do not match.',registered:'Registration successful. Please confirm your email address and then sign in.',upgradeReserved:'Upgrade reserved.',selected:'Selected',monthOne:'month',monthMany:'months',chooseFile:'Please select a file.',docLimit:'Your current plan allows a maximum of {limit} documents. Please choose an upgrade.',exportLocked:'This export format is not included in your current plan. Please choose an upgrade.',pptxLoad:'The PowerPoint module could not be loaded.'},
  tr:{pwMin:'Parola en az 12 karakter, büyük ve küçük harf, bir sayı ve bir özel karakter içermelidir.',pwMismatch:'Parolalar eşleşmiyor.',registered:'Kayıt başarılı. Lütfen e-posta adresinizi doğrulayın ve ardından giriş yapın.',upgradeReserved:'Yükseltme kaydedildi.',selected:'Seçilen',monthOne:'ay',monthMany:'ay',chooseFile:'Lütfen bir dosya seçin.',docLimit:'Mevcut tarifeniz en fazla {limit} belgeye izin veriyor. Lütfen bir yükseltme seçin.',exportLocked:'Bu dışa aktarma biçimi mevcut tarifenize dahil değildir. Lütfen bir yükseltme seçin.',pptxLoad:'PowerPoint modülü yüklenemedi.'},
  pl:{pwMin:'Hasło musi mieć co najmniej 12 znaków oraz zawierać wielką i małą literę, cyfrę i znak specjalny.',pwMismatch:'Hasła nie są zgodne.',registered:'Rejestracja zakończona pomyślnie. Potwierdź adres e-mail, a następnie zaloguj się.',upgradeReserved:'Podwyższenie planu zapisane.',selected:'Wybrano',monthOne:'miesiąc',monthMany:'miesiące',chooseFile:'Wybierz plik.',docLimit:'Twój obecny plan pozwala na maksymalnie {limit} dokumentów. Wybierz wyższy plan.',exportLocked:'Ten format eksportu nie jest dostępny w Twoim obecnym planie. Wybierz wyższy plan.',pptxLoad:'Nie udało się załadować modułu PowerPoint.'},
  ru:{pwMin:'Пароль должен содержать не менее 12 символов, прописные и строчные буквы, цифру и специальный символ.',pwMismatch:'Пароли не совпадают.',registered:'Регистрация прошла успешно. Подтвердите адрес электронной почты, затем войдите.',upgradeReserved:'Повышение тарифа зарезервировано.',selected:'Выбрано',monthOne:'месяц',monthMany:'месяцев',chooseFile:'Пожалуйста, выберите файл.',docLimit:'Ваш текущий тариф позволяет максимум {limit} документов. Выберите повышение тарифа.',exportLocked:'Этот формат экспорта не входит в ваш текущий тариф. Выберите повышение тарифа.',pptxLoad:'Не удалось загрузить модуль PowerPoint.'},
  ar:{pwMin:'يجب أن تتكون كلمة المرور من 12 رمزاً على الأقل وأن تتضمن أحرفاً كبيرة وصغيرة ورقماً ورمزاً خاصاً.',pwMismatch:'كلمتا المرور غير متطابقتين.',registered:'تم التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.',upgradeReserved:'تم حجز الترقية.',selected:'تم الاختيار',monthOne:'شهر',monthMany:'أشهر',chooseFile:'يرجى اختيار ملف.',docLimit:'تسمح خطتك الحالية بحد أقصى {limit} مستندات. يرجى اختيار ترقية.',exportLocked:'صيغة التصدير هذه غير مشمولة في خطتك الحالية. يرجى اختيار ترقية.',pptxLoad:'تعذر تحميل وحدة PowerPoint.'}
}



const journeyLabels = {
  de:{knowledge:'Ihr Kenntnisstand',expectation:'Ihre Erwartung',choose:'Welche Stufe passt zu mir?',chooseLead:'Beginnen Sie dort, wo Ihr Bedarf heute liegt. Sie müssen keine Fachbegriffe kennen und können später jederzeit höher wechseln.',less:'Einfacher Einstieg',more:'Mehr Tiefe & Steuerung'},
  en:{knowledge:'Your starting point',expectation:'What you expect',choose:'Which level fits me?',chooseLead:'Start where your needs are today. You do not need specialist terms and can move up later.',less:'Simple entry',more:'More depth & control'},
  tr:{knowledge:'Bilgi düzeyiniz',expectation:'Beklentiniz',choose:'Hangi seviye bana uygun?',chooseLead:'Bugünkü ihtiyacınıza göre başlayın. Uzmanlık terimleri bilmeniz gerekmez; daha sonra yükseltebilirsiniz.',less:'Kolay başlangıç',more:'Daha fazla derinlik ve kontrol'},
  pl:{knowledge:'Twój punkt wyjścia',expectation:'Twoje oczekiwanie',choose:'Który poziom jest dla mnie?',chooseLead:'Zacznij tam, gdzie dziś jest Twoja potrzeba. Nie musisz znać fachowych pojęć i możesz później przejść wyżej.',less:'Prosty start',more:'Więcej głębi i kontroli'},
  ru:{knowledge:'Ваш уровень',expectation:'Ваше ожидание',choose:'Какой уровень мне подходит?',chooseLead:'Начните с уровня, который соответствует вашей сегодняшней потребности. Специальные термины знать не нужно; позже можно перейти выше.',less:'Простой старт',more:'Больше глубины и контроля'},
  ar:{knowledge:'مستوى خبرتك',expectation:'ما تتوقعه',choose:'أي مستوى يناسبني؟',chooseLead:'ابدأ من المستوى الذي يناسب احتياجك اليوم. لا تحتاج إلى معرفة المصطلحات المتخصصة ويمكنك الانتقال لاحقاً إلى مستوى أعلى.',less:'بداية بسيطة',more:'عمق وتحكم أكبر'}
}


const dashboardGuide = {
  de:{
    free:{title:'Willkommen – starten Sie ganz einfach',lead:'Sie müssen nichts vorbereiten. Laden Sie zuerst ein Dokument hoch; AS Gold zeigt Ihnen anschließend verständlich, was daraus erkannt wurde.',steps:['1. Dokument hochladen','2. Ergebnis ansehen','3. Entscheiden, ob Sie mehr Tiefe benötigen'],next:'Erstes Dokument hochladen',nextSection:'documents',mode:'Geführter Einstieg'},
    start:{title:'Bringen Sie zuerst Ordnung in Ihren Vorgang',lead:'Erfassen Sie den Kunden oder Vorgang und ordnen Sie anschließend die vorhandenen Unterlagen zu.',steps:['1. Kunde anlegen','2. Fall erfassen','3. Unterlagen zuordnen'],next:'Kunden anlegen',nextSection:'clients',mode:'Strukturierter Einstieg'},
    klar:{title:'Jetzt Lücken und wichtige Punkte sichtbar machen',lead:'Arbeiten Sie fallbezogen. Prüfen Sie vorhandene Dokumente, offene Punkte und den aktuellen Status.',steps:['1. Fall öffnen','2. Dokumente prüfen','3. Offene Punkte priorisieren'],next:'Fälle prüfen',nextSection:'cases',mode:'Klarheitsmodus'},
    analyse:{title:'Bewerten Sie Lage, Risiken und nächste Schritte',lead:'Nutzen Sie die Fallübersicht als Arbeitszentrale. Ampelstatus, Zusammenhänge und Handlungsoptionen stehen im Vordergrund.',steps:['1. Fall auswählen','2. Risiken und Ampeln prüfen','3. Nächste Schritte festlegen'],next:'Fallanalyse öffnen',nextSection:'cases',mode:'Analysemodus'},
    komplett:{title:'Bearbeiten Sie den Vorgang als vollständigen Workflow',lead:'Kunden, Fälle, Dokumente, Ergebnisse und Freigaben werden als zusammenhängender Arbeitsprozess geführt.',steps:['1. Sachstand prüfen','2. Schreiben und Ergebnisse vorbereiten','3. Freigaben kontrollieren'],next:'Arbeitsfälle öffnen',nextSection:'cases',mode:'Bearbeitungsmodus'},
    business:{title:'Ihre Business-Steuerzentrale',lead:'Steuern Sie mehrere Kunden und Fälle parallel. Nutzen Sie Status, Dokumente und Freigaben als operative Übersicht für wiederkehrende Prozesse.',steps:['Kunden- und Fallbestand steuern','Offene Freigaben überwachen','Dokument- und Prozessstatus kontrollieren'],next:'Business-Fälle steuern',nextSection:'cases',mode:'Business-Steuerung'}
  },
  en:{
    free:{title:'Welcome – start simply',lead:'You do not need to prepare anything. Upload one document first and AS Gold will show you clearly what it can identify.',steps:['1. Upload a document','2. Review the result','3. Decide whether you need more depth'],next:'Upload first document',nextSection:'documents',mode:'Guided entry'},
    start:{title:'Organize your matter first',lead:'Create the client or matter first, then assign the available documents.',steps:['1. Add client','2. Create case','3. Assign documents'],next:'Add client',nextSection:'clients',mode:'Structured entry'},
    klar:{title:'Make gaps and priorities visible',lead:'Work case by case. Review available documents, open points and current status.',steps:['1. Open case','2. Review documents','3. Prioritize open points'],next:'Review cases',nextSection:'cases',mode:'Clarity mode'},
    analyse:{title:'Assess position, risks and next steps',lead:'Use the case overview as your working hub. Traffic lights, connections and options come first.',steps:['1. Select case','2. Review risks and status','3. Define next steps'],next:'Open case analysis',nextSection:'cases',mode:'Analysis mode'},
    komplett:{title:'Process the matter as one workflow',lead:'Clients, cases, documents, results and approvals are managed as one connected process.',steps:['1. Review status','2. Prepare outputs and letters','3. Check approvals'],next:'Open working cases',nextSection:'cases',mode:'Processing mode'},
    business:{title:'Your Business control center',lead:'Manage multiple clients and cases in parallel. Use status, documents and approvals as your operational overview.',steps:['Manage client and case portfolio','Monitor pending approvals','Control document and process status'],next:'Manage Business cases',nextSection:'cases',mode:'Business control'}
  },
  tr:{free:{title:'Hoş geldiniz – kolayca başlayın',lead:'Hazırlık yapmanız gerekmez. Önce bir belge yükleyin; AS Gold ne tespit ettiğini anlaşılır şekilde gösterir.',steps:['1. Belge yükleyin','2. Sonucu inceleyin','3. Daha fazla derinliğe ihtiyacınız olup olmadığına karar verin'],next:'İlk belgeyi yükle',nextSection:'documents',mode:'Yönlendirmeli başlangıç'},start:{title:'Önce dosyanızı düzenleyin',lead:'Önce müşteriyi veya konuyu oluşturun, ardından belgeleri ilişkilendirin.',steps:['1. Müşteri ekle','2. Dosya oluştur','3. Belgeleri ata'],next:'Müşteri ekle',nextSection:'clients',mode:'Yapılandırılmış başlangıç'},klar:{title:'Eksikleri ve öncelikleri görünür yapın',lead:'Dosya bazında çalışın; belgeleri, açık noktaları ve durumu kontrol edin.',steps:['1. Dosyayı aç','2. Belgeleri kontrol et','3. Açık noktaları önceliklendir'],next:'Dosyaları kontrol et',nextSection:'cases',mode:'Netlik modu'},analyse:{title:'Durumu, riskleri ve sonraki adımları değerlendirin',lead:'Dosya özetini çalışma merkezi olarak kullanın. Riskler ve seçenekler öne çıkar.',steps:['1. Dosya seç','2. Riskleri kontrol et','3. Sonraki adımları belirle'],next:'Analizi aç',nextSection:'cases',mode:'Analiz modu'},komplett:{title:'Konuyu tam bir iş akışı olarak yönetin',lead:'Müşteriler, dosyalar, belgeler, sonuçlar ve onaylar tek süreçte yönetilir.',steps:['1. Durumu incele','2. Sonuç ve yazıları hazırla','3. Onayları kontrol et'],next:'Çalışma dosyalarını aç',nextSection:'cases',mode:'İşleme modu'},business:{title:'Business kontrol merkeziniz',lead:'Birden çok müşteri ve dosyayı paralel yönetin; durum, belgeler ve onayları operasyonel görünüm olarak kullanın.',steps:['Müşteri ve dosyaları yönet','Bekleyen onayları izle','Belge ve süreç durumunu kontrol et'],next:'Business dosyalarını yönet',nextSection:'cases',mode:'Business kontrolü'}},
  pl:{free:{title:'Witamy – zacznij prosto',lead:'Nie musisz nic przygotowywać. Najpierw prześlij dokument, a AS Gold pokaże zrozumiale, co zostało rozpoznane.',steps:['1. Prześlij dokument','2. Zobacz wynik','3. Zdecyduj, czy potrzebujesz większej głębi'],next:'Prześlij pierwszy dokument',nextSection:'documents',mode:'Prowadzony start'},start:{title:'Najpierw uporządkuj sprawę',lead:'Utwórz klienta lub sprawę, a następnie przypisz dostępne dokumenty.',steps:['1. Dodaj klienta','2. Utwórz sprawę','3. Przypisz dokumenty'],next:'Dodaj klienta',nextSection:'clients',mode:'Uporządkowany start'},klar:{title:'Pokaż braki i priorytety',lead:'Pracuj na konkretnej sprawie. Sprawdź dokumenty, otwarte punkty i aktualny status.',steps:['1. Otwórz sprawę','2. Sprawdź dokumenty','3. Ustal priorytety'],next:'Sprawdź sprawy',nextSection:'cases',mode:'Tryb jasności'},analyse:{title:'Oceń sytuację, ryzyka i kolejne kroki',lead:'Używaj przeglądu sprawy jako centrum pracy. Najważniejsze są statusy, ryzyka i opcje działania.',steps:['1. Wybierz sprawę','2. Sprawdź ryzyka','3. Ustal kolejne kroki'],next:'Otwórz analizę',nextSection:'cases',mode:'Tryb analizy'},komplett:{title:'Prowadź sprawę jako pełny proces',lead:'Klienci, sprawy, dokumenty, wyniki i akceptacje są prowadzone jako jeden proces.',steps:['1. Sprawdź stan','2. Przygotuj wyniki i pisma','3. Sprawdź akceptacje'],next:'Otwórz sprawy robocze',nextSection:'cases',mode:'Tryb opracowania'},business:{title:'Twoje centrum sterowania Business',lead:'Zarządzaj równolegle wieloma klientami i sprawami. Statusy, dokumenty i akceptacje tworzą widok operacyjny.',steps:['Zarządzaj portfelem klientów i spraw','Monitoruj akceptacje','Kontroluj status dokumentów i procesów'],next:'Zarządzaj sprawami Business',nextSection:'cases',mode:'Sterowanie Business'}},
  ar:{free:{title:'مرحباً — ابدأ ببساطة',lead:'لا تحتاج إلى تحضير شيء. حمّل مستنداً أولاً وسيعرض AS Gold النتيجة بوضوح.',steps:['1. حمّل مستنداً','2. راجع النتيجة','3. قرر إن كنت تحتاج إلى مستوى أعمق'],next:'تحميل أول مستند',nextSection:'documents',mode:'بداية موجّهة'},start:{title:'نظّم حالتك أولاً',lead:'أنشئ العميل أو الحالة ثم اربط المستندات المتوفرة.',steps:['1. إضافة عميل','2. إنشاء حالة','3. ربط المستندات'],next:'إضافة عميل',nextSection:'clients',mode:'بداية منظمة'},klar:{title:'أظهر النواقص والأولويات',lead:'اعمل حسب الحالة وراجع المستندات والنقاط المفتوحة والحالة الحالية.',steps:['1. فتح الحالة','2. مراجعة المستندات','3. ترتيب الأولويات'],next:'مراجعة الحالات',nextSection:'cases',mode:'وضع الوضوح'},analyse:{title:'قيّم الوضع والمخاطر والخطوات التالية',lead:'استخدم نظرة الحالة كمركز عمل مع التركيز على المخاطر والخيارات.',steps:['1. اختيار الحالة','2. مراجعة المخاطر','3. تحديد الخطوات التالية'],next:'فتح التحليل',nextSection:'cases',mode:'وضع التحليل'},komplett:{title:'عالج الحالة كسير عمل كامل',lead:'تتم إدارة العملاء والحالات والمستندات والنتائج والموافقات ضمن عملية واحدة.',steps:['1. مراجعة الوضع','2. إعداد النتائج والخطابات','3. مراجعة الموافقات'],next:'فتح حالات العمل',nextSection:'cases',mode:'وضع المعالجة'},business:{title:'مركز تحكم Business الخاص بك',lead:'أدر عدة عملاء وحالات بالتوازي واستخدم الحالات والمستندات والموافقات كنظرة تشغيلية.',steps:['إدارة العملاء والحالات','مراقبة الموافقات المعلقة','التحكم في حالة المستندات والعمليات'],next:'إدارة حالات Business',nextSection:'cases',mode:'تحكم Business'}}
}
const recommendationText = {
  de:{title:'Was möchten Sie erreichen?',lead:'Wählen Sie Ihr Ziel. AS Gold empfiehlt die günstigste Stufe, die dafür ausreicht – nicht automatisch die teuerste.',goals:[['overview','Nur einen ersten Überblick bekommen'],['organize','Unterlagen und Vorgang ordentlich strukturieren'],['gaps','Fehlende Unterlagen, Widersprüche und Fristen erkennen'],['risks','Risiken und nächste Schritte bewerten'],['full','Einen komplexen Fall umfassend bearbeiten'],['business','Mehrere Kunden, Fälle oder Teamabläufe steuern']],recommended:'Unsere Empfehlung',enough:'Ihre aktuelle Stufe reicht dafür aus.',upgradeReason:'Für dieses Ziel bringt Ihnen die empfohlene Stufe zusätzlich:',freeNote:'Sie können kostenlos bleiben. Ein Upgrade ist nur sinnvoll, wenn Sie mehr Tiefe oder Funktionen benötigen.',showBenefit:'Mehrwert ansehen',chooseGoal:'Ziel auswählen'},
  en:{title:'What do you want to achieve?',lead:'Choose your goal. AS Gold recommends the lowest-priced level that is sufficient – not automatically the most expensive.',goals:[['overview','Get a first overview only'],['organize','Organize documents and the matter clearly'],['gaps','Identify missing documents, contradictions and deadlines'],['risks','Assess risks and next steps'],['full','Handle a complex matter comprehensively'],['business','Manage multiple clients, cases or team workflows']],recommended:'Our recommendation',enough:'Your current level is sufficient for this goal.',upgradeReason:'For this goal, the recommended level additionally gives you:',freeNote:'You can stay on Free. Upgrade only if you need more depth or functions.',showBenefit:'See added value',chooseGoal:'Choose a goal'},
  tr:{title:'Ne elde etmek istiyorsunuz?',lead:'Hedefinizi seçin. AS Gold otomatik olarak en pahalıyı değil, yeterli olan en uygun fiyatlı seviyeyi önerir.',goals:[['overview','Sadece ilk genel görünümü almak'],['organize','Belgeleri ve konuyu düzenlemek'],['gaps','Eksik belge, çelişki ve süreleri görmek'],['risks','Riskleri ve sonraki adımları değerlendirmek'],['full','Karmaşık bir dosyayı kapsamlı işlemek'],['business','Birden çok müşteri, dosya veya ekip sürecini yönetmek']],recommended:'Önerimiz',enough:'Mevcut seviyeniz bu hedef için yeterli.',upgradeReason:'Bu hedef için önerilen seviye size ayrıca şunları sağlar:',freeNote:'Ücretsiz kalabilirsiniz. Yükseltme yalnızca daha fazla derinlik veya işlev istiyorsanız anlamlıdır.',showBenefit:'Ek değeri gör',chooseGoal:'Hedef seçin'},
  pl:{title:'Co chcesz osiągnąć?',lead:'Wybierz cel. AS Gold poleca najtańszy poziom, który wystarczy – nie automatycznie najdroższy.',goals:[['overview','Uzyskać tylko pierwszy przegląd'],['organize','Uporządkować dokumenty i sprawę'],['gaps','Wykryć braki, sprzeczności i terminy'],['risks','Ocenić ryzyka i kolejne kroki'],['full','Kompleksowo opracować złożoną sprawę'],['business','Zarządzać wieloma klientami, sprawami lub zespołem']],recommended:'Nasza rekomendacja',enough:'Twój obecny poziom wystarcza do tego celu.',upgradeReason:'Dla tego celu rekomendowany poziom daje dodatkowo:',freeNote:'Możesz pozostać przy wersji bezpłatnej. Upgrade ma sens tylko, gdy potrzebujesz większej głębi lub funkcji.',showBenefit:'Zobacz korzyść',chooseGoal:'Wybierz cel'},
  ru:{title:'Чего вы хотите достичь?',lead:'Выберите цель. AS Gold рекомендует самый доступный достаточный уровень, а не автоматически самый дорогой.',goals:[['overview','Получить только первый обзор'],['organize','Упорядочить документы и дело'],['gaps','Найти пробелы, противоречия и сроки'],['risks','Оценить риски и следующие шаги'],['full','Комплексно обработать сложное дело'],['business','Управлять несколькими клиентами, делами или командой']],recommended:'Наша рекомендация',enough:'Вашего текущего уровня достаточно для этой цели.',upgradeReason:'Для этой цели рекомендуемый уровень дополнительно даёт:',freeNote:'Вы можете остаться на бесплатном уровне. Повышение имеет смысл только если нужна большая глубина или функции.',showBenefit:'Показать преимущества',chooseGoal:'Выберите цель'},
  ar:{title:'ما الذي تريد تحقيقه؟',lead:'اختر هدفك. يوصي AS Gold بأقل مستوى سعراً يكفي لهدفك، وليس بالأغلى تلقائياً.',goals:[['overview','الحصول على نظرة أولية فقط'],['organize','تنظيم المستندات والحالة'],['gaps','اكتشاف النواقص والتناقضات والمواعيد'],['risks','تقييم المخاطر والخطوات التالية'],['full','معالجة حالة معقدة بشكل شامل'],['business','إدارة عدة عملاء أو حالات أو سير عمل فريق']],recommended:'توصيتنا',enough:'مستواك الحالي يكفي لهذا الهدف.',upgradeReason:'لهذا الهدف يمنحك المستوى الموصى به أيضاً:',freeNote:'يمكنك البقاء على المستوى المجاني. الترقية مفيدة فقط إذا احتجت عمقاً أو وظائف إضافية.',showBenefit:'عرض القيمة الإضافية',chooseGoal:'اختر هدفاً'}
}


const transparencyText = {
  de:{eyebrow:'Unser Transparenzversprechen',title:'Bevor Sie sich entscheiden, wissen Sie genau, woran Sie sind.',lead:'AS Gold arbeitet ohne Abo-Fallen und ohne automatische Verlängerung. Sie sehen Leistung, Laufzeit, Kosten und Ende immer vor Ihrer Entscheidung.',items:[['Keine automatische Verlängerung','Eine neue kostenpflichtige Laufzeit beginnt nur, wenn Sie sie ausdrücklich auswählen.'],['Keine versteckten Kosten','Vor jeder kostenpflichtigen Entscheidung sehen Sie den heute fälligen Betrag, den regulären Preis und die gewählte Laufzeit.'],['Faire Tarifempfehlung','AS Gold empfiehlt die günstigste Stufe, die für Ihr gewünschtes Ziel ausreicht. Wenn kein Upgrade nötig ist, sagen wir das ausdrücklich.'],['Klare Erinnerung vor Ablauf','Bei 30 Tagen erinnern wir nach 20 Tagen und nochmals zwei Tage vor Ablauf. Ohne aktive Verlängerung endet die kostenpflichtige Nutzung.'],['Faire Upgrades','Während einer laufenden Periode zahlen Sie beim Upgrade nur die anteilige Differenz für die Restzeit.'],['Sie entscheiden selbst','Kein Kaufzwang, keine vorangekreuzte Verlängerung und keine stillschweigende Fortsetzung.']],registerTitle:'Ihre Registrierung startet kostenlos.',registerNote:'Mit der kostenlosen Registrierung entsteht keine kostenpflichtige Laufzeit. Kosten entstehen erst, wenn Sie später selbst eine kostenpflichtige Stufe auswählen und die Preisübersicht ausdrücklich bestätigen.'},
  en:{eyebrow:'Our transparency promise',title:'Before you decide, you know exactly where you stand.',lead:'AS Gold has no subscription traps and no automatic renewal. You always see scope, term, price and end date before making a decision.',items:[['No automatic renewal','A new paid term starts only when you explicitly choose it.'],['No hidden costs','Before any paid decision you see the amount due today, the regular price and the selected term.'],['Fair plan recommendation','AS Gold recommends the lowest-priced level that is sufficient for your goal. If no upgrade is needed, we say so.'],['Clear expiry reminders','For 30 days we remind you after 20 days and again two days before expiry. Without active renewal, paid access ends.'],['Fair upgrades','During an active period you only pay the prorated difference for the remaining time.'],['You decide','No forced purchase, no preselected renewal and no silent continuation.']],registerTitle:'Your registration starts free.',registerNote:'Free registration does not start a paid term. Costs arise only if you later choose a paid level yourself and explicitly confirm the price overview.'},
  tr:{eyebrow:'Şeffaflık sözümüz',title:'Karar vermeden önce tüm koşulları net olarak bilirsiniz.',lead:'AS Gold abonelik tuzağı ve otomatik yenileme kullanmaz. Kararınızdan önce kapsamı, süreyi, fiyatı ve bitişi görürsünüz.',items:[['Otomatik yenileme yok','Yeni ücretli süre yalnızca açıkça seçerseniz başlar.'],['Gizli maliyet yok','Ücretli karardan önce bugün ödenecek tutarı, normal fiyatı ve seçilen süreyi görürsünüz.'],['Adil tarife önerisi','AS Gold hedefiniz için yeterli olan en uygun fiyatlı seviyeyi önerir. Yükseltme gerekmiyorsa bunu açıkça söyler.'],['Bitişten önce hatırlatma','30 günlük kullanımda 20. günde ve bitişten iki gün önce tekrar hatırlatırız. Aktif uzatma olmazsa ücretli kullanım biter.'],['Adil yükseltme','Devam eden dönemde yalnızca kalan süre için oransal farkı ödersiniz.'],['Karar sizin','Zorunlu satın alma, önceden seçilmiş yenileme veya sessiz devam yok.']],registerTitle:'Kaydınız ücretsiz başlar.',registerNote:'Ücretsiz kayıt ücretli bir süre başlatmaz. Ücret yalnızca daha sonra kendiniz ücretli bir seviye seçip fiyat özetini açıkça onaylarsanız oluşur.'},
  pl:{eyebrow:'Nasza obietnica przejrzystości',title:'Zanim zdecydujesz, dokładnie wiesz, na czym stoisz.',lead:'AS Gold nie stosuje pułapek abonamentowych ani automatycznego przedłużania. Przed decyzją widzisz zakres, okres, cenę i datę końca.',items:[['Bez automatycznego przedłużenia','Nowy płatny okres zaczyna się tylko po Twoim wyraźnym wyborze.'],['Bez ukrytych kosztów','Przed każdą płatną decyzją widzisz kwotę do zapłaty dziś, cenę regularną i wybrany okres.'],['Uczciwa rekomendacja planu','AS Gold poleca najtańszy poziom wystarczający do Twojego celu. Jeśli upgrade nie jest potrzebny, mówimy to wprost.'],['Przypomnienie przed końcem','Przy 30 dniach przypominamy po 20 dniach i ponownie dwa dni przed końcem. Bez aktywnego przedłużenia płatny dostęp się kończy.'],['Uczciwy upgrade','W trwającym okresie płacisz tylko proporcjonalną różnicę za pozostały czas.'],['Ty decydujesz','Bez przymusu zakupu, wstępnie zaznaczonego przedłużenia i cichej kontynuacji.']],registerTitle:'Rejestracja zaczyna się bezpłatnie.',registerNote:'Bezpłatna rejestracja nie uruchamia płatnego okresu. Koszty powstają dopiero, gdy później sam wybierzesz płatny poziom i wyraźnie potwierdzisz podsumowanie ceny.'},
  ru:{eyebrow:'Наше обещание прозрачности',title:'До решения вы точно знаете все условия.',lead:'AS Gold не использует ловушки подписки и автоматическое продление. До решения вы видите объём, срок, цену и дату окончания.',items:[['Без автоматического продления','Новый платный срок начинается только после вашего явного выбора.'],['Без скрытых расходов','Перед платным решением вы видите сумму к оплате сегодня, обычную цену и выбранный срок.'],['Честная рекомендация тарифа','AS Gold рекомендует самый доступный уровень, достаточный для вашей цели. Если повышение не нужно, мы прямо об этом говорим.'],['Напоминание до окончания','Для 30 дней напоминаем через 20 дней и ещё раз за два дня до окончания. Без активного продления платный доступ завершается.'],['Честное повышение','В действующем периоде вы платите только пропорциональную разницу за оставшееся время.'],['Решаете вы','Без принудительной покупки, заранее отмеченного продления и молчаливого продолжения.']],registerTitle:'Регистрация начинается бесплатно.',registerNote:'Бесплатная регистрация не запускает платный срок. Расходы возникают только если позже вы сами выберете платный уровень и явно подтвердите обзор цены.'},
  ar:{eyebrow:'وعدنا بالشفافية',title:'قبل أن تقرر، تعرف جميع الشروط بوضوح.',lead:'لا يستخدم AS Gold فخاخ الاشتراك أو التجديد التلقائي. ترى النطاق والمدة والسعر وتاريخ الانتهاء قبل أي قرار.',items:[['لا تجديد تلقائي','تبدأ مدة مدفوعة جديدة فقط إذا اخترتها صراحة.'],['لا تكاليف مخفية','قبل أي قرار مدفوع ترى المبلغ المستحق اليوم والسعر العادي والمدة المختارة.'],['توصية عادلة بالخطة','يوصي AS Gold بأقل مستوى سعراً يكفي لهدفك. وإذا لم تكن الترقية ضرورية نقول ذلك صراحة.'],['تذكير قبل الانتهاء','في مدة 30 يوماً نذكرك بعد 20 يوماً ومرة أخرى قبل الانتهاء بيومين. من دون تجديد صريح ينتهي الوصول المدفوع.'],['ترقية عادلة','خلال فترة سارية تدفع فقط الفرق النسبي للمدة المتبقية.'],['القرار لك','لا شراء إجباري ولا تجديد محدد مسبقاً ولا استمرار صامت.']],registerTitle:'يبدأ تسجيلك مجاناً.',registerNote:'التسجيل المجاني لا يبدأ مدة مدفوعة. لا تنشأ تكاليف إلا إذا اخترت لاحقاً بنفسك مستوى مدفوعاً وأكدت ملخص السعر صراحة.'}
}

const caseDiscoveryText = {
  de:{nav:'Fallarten',chooseCase:'Passende Fallart auswählen',freeHint:'Kostenlos starten: bis zu 3 Dokumente · keine Zahlung · keine automatische Verlängerung',eyebrow:'Für wen & wobei',title:'Wobei brauchen Sie gerade Klarheit?',lead:'Wählen Sie die Art Ihres Vorgangs. Sie sehen sofort typische Fälle, wobei AS Gold unterstützt und welches Ergebnis Sie erhalten.',typical:'Typische Fälle',support:'Dabei unterstützt AS Gold',result:'Sie erhalten',results:['eine geordnete Fallübersicht','sichtbare Lücken, Widersprüche und Fristen','eine nachvollziehbare Ampelbewertung','konkrete nächste Schritte und passende Entwürfe'],start:'Diesen Fall kostenlos starten',stepsTitle:'In drei Schritten zur klaren Fallakte',steps:[['01','Fallart wählen','Sie wählen den Bereich, der Ihrem Vorgang am nächsten kommt.'],['02','Unterlagen hinzufügen','Briefe, Verträge, E-Mails, Rechnungen oder Fotos werden dem Fall zugeordnet.'],['03','Ergebnis prüfen','Sie sehen Sachstand, fehlende Grundlagen, Ampel und den nächsten sinnvollen Schritt.']],transparencyDetails:'Alle Transparenzregeln ansehen',cases:[
    {key:'insurance',title:'Versicherung & Schaden',short:'Deckung, Schaden, Nachweise',examples:'Sach-, Kfz-, Reise-, Kranken- oder Betriebsschäden sowie abgelehnte oder gekürzte Leistungen.',help:'Unterlagen und Versicherungsantworten ordnen, fehlende Nachweise erkennen, Forderungen gegenüberstellen und das weitere Vorgehen vorbereiten.'},
    {key:'property',title:'Miete, Pacht & Immobilie',short:'Rückstände, Schäden, Übergabe',examples:'Miet- oder Pachtrückstände, Kündigung, Schäden, Übergabe, Betriebskosten und Reparaturpflichten.',help:'Verträge, Zahlungen, Zustände, Verantwortlichkeiten, Fristen und Beweise zu einer nachvollziehbaren Akte verbinden.'},
    {key:'contract',title:'Vertrag & Forderung',short:'Rechnung, Leistung, Kündigung',examples:'Falsche Rechnungen, offene Forderungen, nicht erbrachte Leistungen, Vertragsänderungen und Kündigungen.',help:'Vertrag und tatsächlichen Ablauf vergleichen, Abweichungen sichtbar machen und eine begründete Reaktion vorbereiten.'},
    {key:'authority',title:'Behörde & Sozialversicherung',short:'Bescheid, Frist, Nachweis',examples:'Vorgänge mit Krankenkasse, DRV, Zoll, Verwaltung, Gewerbe- oder Führerscheinstelle.',help:'Bescheide und Schreiben verständlich zusammenfassen, Fristen sichern und fehlende Angaben oder Nachweise benennen.'},
    {key:'work',title:'Arbeit & Abrechnung',short:'Lohn, Krankheit, Beschäftigung',examples:'Lohnabrechnung, Krankengeld, Arbeitszeiten, Zuschläge, Beschäftigungsstatus und Arbeitgeberkorrespondenz.',help:'Abrechnungen, Zeiträume und Aussagen abgleichen, Unstimmigkeiten markieren und ein sachliches Schreiben vorbereiten.'},
    {key:'business',title:'Unternehmen & Kunden',short:'Kundenakte, Projekt, Freigabe',examples:'Kundenfälle, Beschwerden, Projekte, Lieferantenprobleme, wiederkehrende Vorgänge und interne Freigaben.',help:'Mehrere Beteiligte, Dokumente, Aufgaben und Entscheidungen in einem kontrollierten Arbeitsablauf zusammenführen.'},
    {key:'dispute',title:'Konflikt & Beweislage',short:'Chronologie, Anspruch, Beweis',examples:'Länger laufende Auseinandersetzungen mit widersprüchlichen Angaben, Forderungen und umfangreichem Schriftverkehr.',help:'Eine Chronologie, Beweisübersicht, offene Punkte und Unterlagen für Verhandlung, Anwalt oder Gericht vorbereiten.'},
    {key:'private',title:'Privater komplexer Vorgang',short:'Reise, Fahrzeug, Vertrag, Alltag',examples:'Reiseprobleme, Fahrzeugangelegenheiten, private Verträge oder andere dokumentenreiche Vorgänge.',help:'Ungeordnete Informationen verständlich bündeln und zeigen, was belegt ist, was fehlt und was als Nächstes sinnvoll ist.'}
  ]},
  en:{nav:'Case types',chooseCase:'Choose a suitable case type',freeHint:'Start free: up to 3 documents · no payment · no automatic renewal',eyebrow:'Who it is for & when it helps',title:'Where do you need clarity right now?',lead:'Choose the type of matter. You will immediately see typical cases, how AS Gold helps and what result you receive.',typical:'Typical cases',support:'How AS Gold helps',result:'You receive',results:['an organized case overview','visible gaps, contradictions and deadlines','a traceable traffic-light assessment','clear next steps and suitable drafts'],start:'Start this case for free',stepsTitle:'Three steps to a clear case file',steps:[['01','Choose a case type','Select the area that best matches your matter.'],['02','Add documents','Letters, contracts, emails, invoices or photos are assigned to the case.'],['03','Review the result','See the status, missing evidence, traffic light and the next sensible step.']],transparencyDetails:'View all transparency rules',cases:[
    {key:'insurance',title:'Insurance & damage',short:'Coverage, loss, evidence',examples:'Property, motor, travel, health or business losses and rejected or reduced benefits.',help:'Organize documents and insurer responses, identify missing evidence, compare claims and prepare the next action.'},
    {key:'property',title:'Rent, lease & property',short:'Arrears, damage, handover',examples:'Rent or lease arrears, termination, damage, handover, service charges and repair duties.',help:'Connect contracts, payments, conditions, responsibilities, deadlines and evidence in one traceable file.'},
    {key:'contract',title:'Contract & claim',short:'Invoice, performance, termination',examples:'Incorrect invoices, unpaid claims, non-performance, contract changes and termination.',help:'Compare the contract with what actually happened, show deviations and prepare a reasoned response.'},
    {key:'authority',title:'Authorities & social insurance',short:'Decision, deadline, evidence',examples:'Matters involving health insurance, pension authorities, customs, administration or licensing offices.',help:'Summarize official letters clearly, secure deadlines and identify missing information or evidence.'},
    {key:'work',title:'Employment & payroll',short:'Pay, illness, employment',examples:'Payroll, sick pay, working time, supplements, employment status and employer correspondence.',help:'Compare calculations, periods and statements, flag inconsistencies and prepare a factual letter.'},
    {key:'business',title:'Business & customers',short:'Client file, project, approval',examples:'Customer matters, complaints, projects, supplier disputes, recurring work and internal approvals.',help:'Bring people, documents, tasks and decisions together in one controlled workflow.'},
    {key:'dispute',title:'Dispute & evidence',short:'Timeline, claim, proof',examples:'Long-running disputes involving contradictory statements, claims and extensive correspondence.',help:'Prepare a timeline, evidence overview and open points for negotiation, counsel or court.'},
    {key:'private',title:'Complex personal matter',short:'Travel, vehicle, contract, daily life',examples:'Travel issues, vehicle matters, private contracts or other document-heavy situations.',help:'Turn scattered information into a clear picture of what is proven, what is missing and what to do next.'}
  ]},
  tr:{nav:'Dosya türleri',chooseCase:'Uygun dosya türünü seçin',freeHint:'Ücretsiz başlayın: en fazla 3 belge · ödeme yok · otomatik yenileme yok',eyebrow:'Kimler için & hangi durumda',title:'Şu anda hangi konuda netlik istiyorsunuz?',lead:'Dosya türünü seçin. Tipik örnekleri, AS Gold’un nasıl yardımcı olduğunu ve hangi sonucu alacağınızı hemen görün.',typical:'Tipik dosyalar',support:'AS Gold nasıl yardımcı olur',result:'Elde edeceğiniz sonuç',results:['düzenli bir dosya özeti','görünür eksikler, çelişkiler ve süreler','izlenebilir bir trafik ışığı değerlendirmesi','net sonraki adımlar ve uygun taslaklar'],start:'Bu dosyayı ücretsiz başlat',stepsTitle:'Net bir dosyaya üç adımda',steps:[['01','Dosya türünü seçin','Konunuza en yakın alanı seçin.'],['02','Belgeleri ekleyin','Mektup, sözleşme, e-posta, fatura veya fotoğrafları ekleyin.'],['03','Sonucu inceleyin','Durumu, eksikleri, değerlendirmeyi ve sonraki adımı görün.']],transparencyDetails:'Tüm şeffaflık kurallarını göster',cases:[
    {key:'insurance',title:'Sigorta & hasar',short:'Teminat, hasar, kanıt',examples:'Mal, araç, seyahat, sağlık veya işletme hasarları ve reddedilen ödemeler.',help:'Belgeleri düzenler, eksik kanıtları ve talepleri görünür kılar, sonraki adımı hazırlar.'},
    {key:'property',title:'Kira & taşınmaz',short:'Borç, hasar, teslim',examples:'Kira borcu, fesih, hasar, teslim, giderler ve onarım yükümlülükleri.',help:'Sözleşme, ödeme, durum, sorumluluk, süre ve kanıtları tek dosyada birleştirir.'},
    {key:'contract',title:'Sözleşme & alacak',short:'Fatura, hizmet, fesih',examples:'Yanlış faturalar, açık alacaklar, eksik hizmetler, değişiklikler ve fesihler.',help:'Sözleşme ile gerçekleşen durumu karşılaştırır ve gerekçeli yanıt hazırlar.'},
    {key:'authority',title:'Kurum & sosyal sigorta',short:'Karar, süre, kanıt',examples:'Sağlık sigortası, emeklilik kurumu, gümrük, idare veya ruhsat işlemleri.',help:'Resmî yazıları özetler, süreleri ve eksik bilgileri görünür kılar.'},
    {key:'work',title:'İş & ücret hesabı',short:'Ücret, hastalık, çalışma',examples:'Ücret bordrosu, hastalık parası, çalışma süresi, ek ödemeler ve işveren yazışmaları.',help:'Hesapları ve dönemleri karşılaştırır, tutarsızlıkları işaretler ve yazı hazırlar.'},
    {key:'business',title:'İşletme & müşteriler',short:'Müşteri, proje, onay',examples:'Müşteri dosyaları, şikâyetler, projeler, tedarikçi sorunları ve onaylar.',help:'Kişileri, belgeleri, görevleri ve kararları kontrollü bir iş akışında toplar.'},
    {key:'dispute',title:'Uyuşmazlık & kanıt',short:'Kronoloji, talep, kanıt',examples:'Çelişkili beyanlar, talepler ve kapsamlı yazışmalar içeren uyuşmazlıklar.',help:'Görüşme, avukat veya mahkeme için kronoloji ve kanıt özeti hazırlar.'},
    {key:'private',title:'Karmaşık özel işlem',short:'Seyahat, araç, sözleşme',examples:'Seyahat, araç, özel sözleşme veya belge yoğun diğer konular.',help:'Dağınık bilgileri düzenler; kanıtlanan, eksik ve yapılması gerekenleri gösterir.'}
  ]},
  pl:{nav:'Rodzaje spraw',chooseCase:'Wybierz rodzaj sprawy',freeHint:'Zacznij bezpłatnie: do 3 dokumentów · bez płatności · bez automatycznego przedłużenia',eyebrow:'Dla kogo & w czym pomaga',title:'W jakiej sprawie potrzebujesz teraz jasności?',lead:'Wybierz rodzaj sprawy. Od razu zobaczysz przykłady, sposób pomocy AS Gold i oczekiwany wynik.',typical:'Typowe sprawy',support:'Jak pomaga AS Gold',result:'Otrzymujesz',results:['uporządkowany przegląd sprawy','widoczne braki, sprzeczności i terminy','uzasadnioną ocenę sygnalizacyjną','konkretne kolejne kroki i odpowiednie projekty'],start:'Rozpocznij tę sprawę bezpłatnie',stepsTitle:'Trzy kroki do jasnej akt sprawy',steps:[['01','Wybierz rodzaj sprawy','Wybierz obszar najlepiej pasujący do sytuacji.'],['02','Dodaj dokumenty','Dodaj pisma, umowy, e-maile, faktury lub zdjęcia.'],['03','Sprawdź wynik','Zobacz stan, braki, ocenę i następny krok.']],transparencyDetails:'Pokaż wszystkie zasady przejrzystości',cases:[
    {key:'insurance',title:'Ubezpieczenie & szkoda',short:'Zakres, szkoda, dowody',examples:'Szkody majątkowe, komunikacyjne, podróżne, zdrowotne lub firmowe oraz odmowy wypłaty.',help:'Porządkuje dokumenty, wskazuje brakujące dowody i przygotowuje dalsze działanie.'},
    {key:'property',title:'Najem, dzierżawa & nieruchomość',short:'Zaległości, szkody, przekazanie',examples:'Zaległości, wypowiedzenie, szkody, przekazanie, koszty i obowiązki naprawcze.',help:'Łączy umowy, płatności, stan, odpowiedzialność, terminy i dowody.'},
    {key:'contract',title:'Umowa & roszczenie',short:'Faktura, wykonanie, wypowiedzenie',examples:'Błędne faktury, niezapłacone roszczenia, brak wykonania i zmiany umów.',help:'Porównuje umowę z przebiegiem zdarzeń i przygotowuje rzeczową odpowiedź.'},
    {key:'authority',title:'Urząd & ubezpieczenie społeczne',short:'Decyzja, termin, dowód',examples:'Sprawy z kasą chorych, emerytalną, celną, administracją lub urzędem zezwoleń.',help:'Wyjaśnia pisma, zabezpiecza terminy i wskazuje brakujące informacje.'},
    {key:'work',title:'Praca & rozliczenie',short:'Płaca, choroba, zatrudnienie',examples:'Lista płac, zasiłek chorobowy, czas pracy, dodatki i korespondencja pracownicza.',help:'Porównuje obliczenia i okresy, oznacza rozbieżności i przygotowuje pismo.'},
    {key:'business',title:'Firma & klienci',short:'Klient, projekt, akceptacja',examples:'Sprawy klientów, skargi, projekty, dostawcy, procesy cykliczne i akceptacje.',help:'Łączy osoby, dokumenty, zadania i decyzje w kontrolowanym procesie.'},
    {key:'dispute',title:'Spór & dowody',short:'Chronologia, roszczenie, dowód',examples:'Długotrwałe spory ze sprzecznymi informacjami i obszerną korespondencją.',help:'Przygotowuje chronologię i przegląd dowodów do rozmów, prawnika lub sądu.'},
    {key:'private',title:'Złożona sprawa prywatna',short:'Podróż, pojazd, umowa',examples:'Problemy podróżne, pojazdowe, prywatne umowy i inne sprawy dokumentowe.',help:'Porządkuje informacje i pokazuje, co jest udowodnione, czego brakuje i co dalej.'}
  ]},
  ru:{nav:'Виды дел',chooseCase:'Выбрать подходящий вид дела',freeHint:'Начните бесплатно: до 3 документов · без оплаты · без автопродления',eyebrow:'Для кого & в каких случаях',title:'В каком вопросе вам сейчас нужна ясность?',lead:'Выберите вид дела. Вы сразу увидите примеры, помощь AS Gold и ожидаемый результат.',typical:'Типичные дела',support:'Как помогает AS Gold',result:'Вы получите',results:['упорядоченный обзор дела','видимые пробелы, противоречия и сроки','понятную оценку светофором','конкретные следующие шаги и подходящие проекты'],start:'Начать это дело бесплатно',stepsTitle:'Три шага к понятному делу',steps:[['01','Выберите вид дела','Выберите категорию, наиболее близкую к вашей ситуации.'],['02','Добавьте документы','Добавьте письма, договоры, электронные письма, счета или фото.'],['03','Проверьте результат','Посмотрите статус, пробелы, оценку и следующий шаг.']],transparencyDetails:'Показать все правила прозрачности',cases:[
    {key:'insurance',title:'Страхование & ущерб',short:'Покрытие, ущерб, доказательства',examples:'Имущественные, автомобильные, туристические, медицинские и бизнес-убытки, отказы в выплате.',help:'Упорядочивает документы, показывает недостающие доказательства и готовит дальнейшие действия.'},
    {key:'property',title:'Аренда & недвижимость',short:'Долг, ущерб, передача',examples:'Задолженность, расторжение, ущерб, передача, расходы и обязанности по ремонту.',help:'Объединяет договоры, платежи, состояние, ответственность, сроки и доказательства.'},
    {key:'contract',title:'Договор & требование',short:'Счёт, исполнение, расторжение',examples:'Ошибочные счета, открытые требования, неисполнение, изменения и расторжение.',help:'Сравнивает договор с фактическими событиями и готовит обоснованный ответ.'},
    {key:'authority',title:'Ведомство & соцстрахование',short:'Решение, срок, доказательство',examples:'Дела с больничной кассой, пенсионным органом, таможней или администрацией.',help:'Понятно объясняет письма, контролирует сроки и показывает недостающие сведения.'},
    {key:'work',title:'Работа & расчёт',short:'Зарплата, болезнь, занятость',examples:'Расчёт зарплаты, больничные, рабочее время, доплаты и переписка.',help:'Сверяет расчёты и периоды, отмечает расхождения и готовит письмо.'},
    {key:'business',title:'Бизнес & клиенты',short:'Клиент, проект, согласование',examples:'Клиентские дела, жалобы, проекты, поставщики, повторяющиеся процессы и согласования.',help:'Объединяет людей, документы, задачи и решения в контролируемом процессе.'},
    {key:'dispute',title:'Спор & доказательства',short:'Хронология, требование, доказательство',examples:'Длительные споры с противоречивыми заявлениями и большой перепиской.',help:'Готовит хронологию и обзор доказательств для переговоров, адвоката или суда.'},
    {key:'private',title:'Сложное личное дело',short:'Поездка, авто, договор',examples:'Проблемы с поездками, автомобилями, частными договорами и другие документные вопросы.',help:'Упорядочивает информацию и показывает, что доказано, чего не хватает и что делать дальше.'}
  ]},
  ar:{nav:'أنواع الحالات',chooseCase:'اختر نوع الحالة المناسب',freeHint:'ابدأ مجاناً: حتى 3 مستندات · بلا دفع · بلا تجديد تلقائي',eyebrow:'لمن & متى يساعد',title:'في أي موضوع تحتاج إلى الوضوح الآن؟',lead:'اختر نوع الحالة. سترى فوراً أمثلة وطريقة مساعدة AS Gold والنتيجة المتوقعة.',typical:'حالات نموذجية',support:'كيف يساعد AS Gold',result:'ستحصل على',results:['نظرة مرتبة على الحالة','نواقص وتناقضات ومواعيد ظاهرة','تقييم واضح بإشارة المرور','خطوات تالية محددة ومسودات مناسبة'],start:'ابدأ هذه الحالة مجاناً',stepsTitle:'ثلاث خطوات إلى حالة واضحة',steps:[['01','اختر نوع الحالة','اختر الفئة الأقرب إلى موضوعك.'],['02','أضف المستندات','أضف الرسائل والعقود والبريد والفواتير أو الصور.'],['03','راجع النتيجة','راجع الوضع والنواقص والتقييم والخطوة التالية.']],transparencyDetails:'عرض جميع قواعد الشفافية',cases:[
    {key:'insurance',title:'التأمين & الضرر',short:'التغطية، الضرر، الأدلة',examples:'أضرار الممتلكات أو المركبات أو السفر أو الصحة أو الأعمال ورفض التعويض.',help:'ينظم المستندات ويظهر الأدلة الناقصة ويجهز الخطوة التالية.'},
    {key:'property',title:'الإيجار & العقار',short:'متأخرات، ضرر، تسليم',examples:'متأخرات الإيجار والفسخ والأضرار والتسليم والتكاليف والتزامات الإصلاح.',help:'يجمع العقود والمدفوعات والحالة والمسؤوليات والمواعيد والأدلة.'},
    {key:'contract',title:'العقد & المطالبة',short:'فاتورة، تنفيذ، فسخ',examples:'فواتير خاطئة ومطالبات مفتوحة وعدم تنفيذ وتعديلات وفسخ.',help:'يقارن العقد بما حدث فعلاً ويجهز رداً مبرراً.'},
    {key:'authority',title:'الجهة الرسمية & الضمان',short:'قرار، مهلة، دليل',examples:'قضايا التأمين الصحي والتقاعد والجمارك والإدارة وجهات الترخيص.',help:'يلخص الخطابات الرسمية ويحمي المواعيد ويظهر البيانات الناقصة.'},
    {key:'work',title:'العمل & الحساب',short:'أجر، مرض، توظيف',examples:'كشف الراتب وبدل المرض وساعات العمل والبدلات ومراسلات صاحب العمل.',help:'يقارن الحسابات والفترات ويحدد التناقضات ويجهز خطاباً.'},
    {key:'business',title:'الأعمال & العملاء',short:'عميل، مشروع، موافقة',examples:'حالات العملاء والشكاوى والمشاريع والموردون والإجراءات المتكررة والموافقات.',help:'يجمع الأشخاص والمستندات والمهام والقرارات في سير عمل مضبوط.'},
    {key:'dispute',title:'النزاع & الأدلة',short:'تسلسل، مطالبة، دليل',examples:'نزاعات طويلة مع أقوال متناقضة ومطالبات ومراسلات كثيرة.',help:'يجهز تسلسلاً زمنياً وملخص أدلة للتفاوض أو المحامي أو المحكمة.'},
    {key:'private',title:'حالة شخصية معقدة',short:'سفر، مركبة، عقد',examples:'مشكلات السفر والمركبات والعقود الخاصة وغيرها من الحالات كثيرة المستندات.',help:'ينظم المعلومات ويبين ما هو مثبت وما ينقص وما الخطوة التالية.'}
  ]}
}


const publicAudienceText = {
  de:{label:'Geeignet für',items:['Privatpersonen','Selbstständige & kleine Unternehmen','Teams mit dokumentenreichen Kundenfällen'],scope:'AS Gold strukturiert und bereitet Vorgänge vor. Es ersetzt keine individuelle Rechts- oder Steuerberatung.'},
  en:{label:'Designed for',items:['Private individuals','Self-employed people & small businesses','Teams handling document-heavy client matters'],scope:'AS Gold structures and prepares matters. It does not replace individual legal or tax advice.'},
  tr:{label:'Kimler için',items:['Bireyler','Serbest çalışanlar ve küçük işletmeler','Belge yoğun müşteri dosyalarıyla çalışan ekipler'],scope:'AS Gold işlemleri düzenler ve hazırlar. Bireysel hukuk veya vergi danışmanlığının yerini almaz.'},
  pl:{label:'Dla kogo',items:['Osoby prywatne','Samozatrudnieni i małe firmy','Zespoły prowadzące sprawy klientów z wieloma dokumentami'],scope:'AS Gold porządkuje i przygotowuje sprawy. Nie zastępuje indywidualnej porady prawnej ani podatkowej.'},
  ru:{label:'Для кого',items:['Частные лица','Самозанятые и малый бизнес','Команды с документоёмкими клиентскими делами'],scope:'AS Gold структурирует и подготавливает дела. Он не заменяет индивидуальную юридическую или налоговую консультацию.'},
  ar:{label:'مناسب لـ',items:['الأفراد','العاملون لحسابهم الخاص والشركات الصغيرة','الفرق التي تدير ملفات عملاء كثيرة المستندات'],scope:'ينظم AS Gold المعاملات ويجهزها، لكنه لا يحل محل الاستشارة القانونية أو الضريبية الفردية.'}
}

const testerLinkText = {
  de:'Sicher testen mit Musterdatei',
  en:'Test safely with a sample file',
  tr:'Örnek dosyayla güvenli test',
  pl:'Bezpieczny test z plikiem wzorcowym',
  ru:'Безопасный тест с примером файла',
  ar:'اختبار آمن بملف نموذجي',
}

const goalTier = {overview:'free',organize:'start',gaps:'klar',risks:'analyse',full:'komplett',business:'business'}
const tierRank = {free:1,start:2,klar:3,analyse:4,komplett:5,business:6}

const periodText = {"de":{"once":"einmalig","d30":"/30 Tage","day30":"30 Tage"},"en":{"once":"one-time","d30":"/30 days","day30":"30 days"},"tr":{"once":"tek sefer","d30":"/30 gün","day30":"30 gün"},"pl":{"once":"jednorazowo","d30":"/30 dni","day30":"30 dni"},"ru":{"once":"однократно","d30":"/30 дней","day30":"30 дней"},"ar":{"once":"مرة واحدة","d30":"/30 يوماً","day30":"30 يوماً"}}

const eur = v => `${Number(v || 0).toFixed(2).replace('.', ',')} €`
const statusText = s => s === 'open' ? 'Offen' : s === 'closed' ? 'Geschlossen' : s || '—'

const launchTrustText = {
  de:{control:'Transparenz & Kontrolle',contract:'Ihr Tarifstatus',contractFree:'Kostenlos · keine Zahlungspflicht · keine automatische Verlängerung',contractPaid:'Kostenpflichtige Nutzung nur für die ausdrücklich gewählte Laufzeit · keine automatische Verlängerung',paymentState:'Zahlungsstatus',paymentOff:'Bezahlfunktion noch deaktiviert',dataTitle:'Ihre Daten',dataNote:'Dokumente und Falldaten bleiben Ihrem Zugang zugeordnet. Vor dem Marktstart werden Datenexport, Löschanfrage und Aufbewahrungsstatus als eigene Kontofunktionen aktiviert.',auditTitle:'Nachvollziehbarkeit',auditNote:'Wichtige Änderungen, Freigaben, Exporte und Versandvorgänge werden mit Status und Zeitpunkt nachvollziehbar geführt. Wo noch kein belastbarer Audit-Eintrag vorliegt, wird kein Erfolg vorgetäuscht.',why:'Warum dieses Ergebnis?',basis:'Berücksichtigte Grundlage',basisDocs:'{n} zugeordnete Dokumente',finding:'Festgestellter Sachstand',missing:'Fehlt noch / kann Bewertung ändern',missingDocs:'Es sind noch keine Dokumente zugeordnet. Eine belastbare Bewertung ist daher nicht möglich.',missingOpen:'Prüfen Sie, ob weitere Unterlagen, Fristen oder Angaben fehlen. Fehlende Informationen müssen vor einer sicheren Bewertung sichtbar bleiben.',assessment:'Bewertung',assessmentNote:'Die Ampel zeigt den derzeit gespeicherten Fallstatus. Sie ist keine versteckte Black-Box-Entscheidung und muss bei neuen Informationen aktualisiert werden.',next:'Nächster Schritt',nextDocs:'Unterlagen ergänzen und Bewertung danach erneut prüfen.',nextReview:'Grundlagen prüfen und bei neuen Informationen die Bewertung aktualisieren.',notFinal:'Nicht sicher bewertbar',notFinalNote:'Wenn die Grundlage nicht ausreicht, darf AS Gold keine scheinbar sichere Aussage erzeugen.',dataExport:'Meine Daten exportieren',dataExportHelp:'Erstellt sofort eine lokale JSON-Datei mit den aktuell geladenen Kunden-, Fall-, Dokument- und Freigabedaten. Es wird keine Zahlung ausgelöst.',historyTitle:'Aktuelle Gerätehistorie',historyHelp:'Diese Liste zeigt wichtige Aktionen dieses Geräts. Sie ist bewusst als lokale Gerätehistorie gekennzeichnet und ersetzt noch kein serverseitiges Audit-Protokoll.',noHistory:'Auf diesem Gerät sind noch keine Aktionen protokolliert.',passwordReset:'Passwort zurücksetzen',passwordResetHelp:'Wir senden einen sicheren Link an die eingegebene E-Mail-Adresse.',passwordSent:'Wenn die Adresse registriert ist, wurde ein Link zum Zurücksetzen gesendet.'},
  en:{control:'Transparency & control',contract:'Your plan status',contractFree:'Free · no payment obligation · no automatic renewal',contractPaid:'Paid use only for the explicitly selected term · no automatic renewal',paymentState:'Payment status',paymentOff:'Payment still disabled',dataTitle:'Your data',dataNote:'Documents and case data remain assigned to your account. Before launch, data export, deletion requests and retention status will be activated as dedicated account functions.',auditTitle:'Traceability',auditNote:'Important changes, approvals, exports and sending actions are tracked with status and time. Where no reliable audit entry exists, success is not pretended.',why:'Why this result?',basis:'Basis considered',basisDocs:'{n} assigned documents',finding:'Established case status',missing:'Missing / may change assessment',missingDocs:'No documents are assigned yet. A reliable assessment is therefore not possible.',missingOpen:'Check whether further documents, deadlines or information are missing. Missing information must remain visible before a firm assessment.',assessment:'Assessment',assessmentNote:'The traffic light reflects the currently stored case status. It is not a hidden black-box decision and must be updated when new information arrives.',next:'Next step',nextDocs:'Add documents and review the assessment again afterwards.',nextReview:'Review the basis and update the assessment when new information arrives.',notFinal:'Not reliably assessable',notFinalNote:'If the basis is insufficient, AS Gold must not produce a seemingly certain statement.',dataExport:'Export my data',dataExportHelp:'Immediately creates a local JSON file containing the currently loaded client, case, document and approval data. No payment is triggered.',historyTitle:'Current device history',historyHelp:'This list shows important actions on this device. It is deliberately labelled as local device history and does not yet replace a server-side audit log.',noHistory:'No actions have been logged on this device yet.',passwordReset:'Reset password',passwordResetHelp:'We will send a secure reset link to the email address entered above.',passwordSent:'If the address is registered, a password reset link has been sent.'}
}

const serverControlText = {
  de:{serverAudit:'Server-Audit',serverAuditHelp:'Diese Einträge werden serverseitig in Ihrem Konto gespeichert und können von normalen Nutzern weder geändert noch gelöscht werden.',noServerAudit:'Noch keine serverseitigen Audit-Einträge vorhanden.',deletion:'Löschanfrage',deletionHelp:'Eine Löschanfrage entfernt Daten nicht sofort. Zuerst werden Abhängigkeiten und mögliche gesetzliche Aufbewahrungspflichten geprüft.',requestDeletion:'Kontolöschung anfragen',cancelDeletion:'Löschanfrage zurücknehmen',deletionPending:'Löschanfrage eingegangen · Prüfung ausstehend',deletionCancelled:'Löschanfrage zurückgenommen',deletionRequested:'Ihre Löschanfrage wurde protokolliert. Bis zur Prüfung wird nichts automatisch gelöscht.',auditFailed:'Die Aktion wurde ausgeführt, aber der serverseitige Audit-Eintrag konnte nicht gespeichert werden.'},
  en:{serverAudit:'Server audit',serverAuditHelp:'These entries are stored server-side in your account and cannot be changed or deleted by normal users.',noServerAudit:'No server-side audit entries yet.',deletion:'Deletion request',deletionHelp:'A deletion request does not remove data immediately. Dependencies and possible legal retention duties are checked first.',requestDeletion:'Request account deletion',cancelDeletion:'Cancel deletion request',deletionPending:'Deletion request received · review pending',deletionCancelled:'Deletion request cancelled',deletionRequested:'Your deletion request has been recorded. Nothing is deleted automatically before review.',auditFailed:'The action succeeded, but the server-side audit entry could not be saved.'},
  tr:{serverAudit:'Sunucu denetim kaydı',serverAuditHelp:'Bu kayıtlar hesabınızda sunucu tarafında saklanır ve normal kullanıcılar tarafından değiştirilemez veya silinemez.',noServerAudit:'Henüz sunucu tarafı denetim kaydı yok.',deletion:'Silme talebi',deletionHelp:'Silme talebi verileri hemen silmez. Önce bağımlılıklar ve olası yasal saklama yükümlülükleri kontrol edilir.',requestDeletion:'Hesap silme talebi oluştur',cancelDeletion:'Silme talebini geri çek',deletionPending:'Silme talebi alındı · inceleme bekliyor',deletionCancelled:'Silme talebi geri çekildi',deletionRequested:'Silme talebiniz kaydedildi. İnceleme öncesinde hiçbir veri otomatik olarak silinmez.',auditFailed:'İşlem tamamlandı ancak sunucu denetim kaydı kaydedilemedi.'},
  pl:{serverAudit:'Audyt serwerowy',serverAuditHelp:'Te wpisy są przechowywane po stronie serwera na Twoim koncie i zwykły użytkownik nie może ich zmieniać ani usuwać.',noServerAudit:'Brak wpisów audytu serwerowego.',deletion:'Wniosek o usunięcie',deletionHelp:'Wniosek nie usuwa danych natychmiast. Najpierw sprawdzane są zależności i możliwe obowiązki przechowywania.',requestDeletion:'Poproś o usunięcie konta',cancelDeletion:'Wycofaj wniosek',deletionPending:'Wniosek o usunięcie przyjęty · oczekuje na weryfikację',deletionCancelled:'Wniosek o usunięcie wycofany',deletionRequested:'Wniosek został zapisany. Do czasu weryfikacji nic nie zostanie automatycznie usunięte.',auditFailed:'Operacja się powiodła, ale wpis audytu serwerowego nie został zapisany.'},
  ru:{serverAudit:'Серверный аудит',serverAuditHelp:'Эти записи хранятся на сервере в вашей учетной записи и не могут быть изменены или удалены обычным пользователем.',noServerAudit:'Серверных записей аудита пока нет.',deletion:'Запрос на удаление',deletionHelp:'Запрос не удаляет данные сразу. Сначала проверяются зависимости и возможные обязанности по хранению.',requestDeletion:'Запросить удаление аккаунта',cancelDeletion:'Отозвать запрос',deletionPending:'Запрос получен · ожидает проверки',deletionCancelled:'Запрос отозван',deletionRequested:'Запрос на удаление сохранен. До проверки ничего автоматически не удаляется.',auditFailed:'Действие выполнено, но серверную запись аудита сохранить не удалось.'},
  ar:{serverAudit:'سجل تدقيق على الخادم',serverAuditHelp:'تُحفظ هذه السجلات على الخادم ضمن حسابك ولا يستطيع المستخدم العادي تعديلها أو حذفها.',noServerAudit:'لا توجد سجلات تدقيق على الخادم حتى الآن.',deletion:'طلب حذف',deletionHelp:'طلب الحذف لا يحذف البيانات فوراً. يتم أولاً فحص الارتباطات وأي التزامات قانونية محتملة للاحتفاظ.',requestDeletion:'طلب حذف الحساب',cancelDeletion:'سحب طلب الحذف',deletionPending:'تم استلام طلب الحذف · قيد المراجعة',deletionCancelled:'تم سحب طلب الحذف',deletionRequested:'تم تسجيل طلب الحذف. لن يُحذف شيء تلقائياً قبل المراجعة.',auditFailed:'تم تنفيذ الإجراء، لكن تعذر حفظ سجل التدقيق على الخادم.'}
}

const pageCatalogs = {
  passwordUi,uploadUi,ui,exportUi,appText,planJourney,planText,notices,
  journeyLabels,dashboardGuide,recommendationText,transparencyText,
  caseDiscoveryText,publicAudienceText,testerLinkText,periodText,
  launchTrustText,serverControlText
}

for (const [catalogName, translations] of Object.entries(pageTranslations)) {
  Object.assign(pageCatalogs[catalogName], translations)
}

const lightText = s => s === 'yellow' ? '🟡 Gelb' : s === 'green' ? '🟢 Grün' : s === 'red' ? '🔴 Rot' : s || '—'
const accessPendingMessages = {
  de:'Zugang noch nicht freigegeben.',en:'Access not yet approved.',fr:'Accès pas encore validé.',
  tr:'Erişim henüz onaylanmadı.',pl:'Dostęp nie został jeszcze zatwierdzony.',
  ru:'Доступ ещё не подтверждён.',ar:'لم تتم الموافقة على الوصول بعد.',fa:'دسترسی هنوز تأیید نشده است.',
  vi:'Quyền truy cập chưa được phê duyệt.'
}

function Logo(){ return <div className="logo">AS</div> }

function PasswordField({id,label,value,onChange,visible,onToggle,labels,autoComplete,describedBy}){
  const actionLabel = visible ? labels.hide : labels.show
  return <div className="authField"><label htmlFor={id}>{label}</label><div className="passwordControl"><input id={id} type={visible?'text':'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-describedby={describedBy} required/><button type="button" className="passwordToggle" onClick={onToggle} aria-label={`${actionLabel}: ${label}`} aria-pressed={visible}>{actionLabel}</button></div></div>
}

export default function Home(){
  const [screen,setScreen] = useState('loading')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [password2,setPassword2] = useState('')
  const [showPassword,setShowPassword] = useState(false)
  const [showPassword2,setShowPassword2] = useState(false)
  const [displayName,setDisplayName] = useState('')
  const [acceptedLegal,setAcceptedLegal] = useState(false)
  const [confirmedTestData,setConfirmedTestData] = useState(false)
  const [message,setMessage] = useState('')
  const [user,setUser] = useState(null)
  const [privacySettings,setPrivacySettings] = useState(null)
  const [privacyBusy,setPrivacyBusy] = useState(false)
  const [data,setData] = useState(emptyData)
  const [section,setSection] = useState('dashboard')
  const [selectedCase,setSelectedCase] = useState(null)
  const [selectedClient,setSelectedClient] = useState(null)
  const [selectedDocument,setSelectedDocument] = useState(null)
  const [selectedApproval,setSelectedApproval] = useState(null)
  const [approvalDefaults,setApprovalDefaults] = useState({caseId:'',documentId:''})
  const [access,setAccess] = useState(null)
  const [upgrades,setUpgrades] = useState([])
  const [termMonths,setTermMonths] = useState(1)
  const [quotes,setQuotes] = useState({})
  const [quoteLoading,setQuoteLoading] = useState(false)
  const [promoCode,setPromoCode] = useState('')
  const [appliedPromoCode,setAppliedPromoCode] = useState('')
  const [promoRevision,setPromoRevision] = useState(0)
  const [newClient,setNewClient] = useState({name:'',email:'',phone:'',notes:''})
  const [showClientForm,setShowClientForm] = useState(false)
  const [newCase,setNewCase] = useState(emptyCase)
  const [showCaseForm,setShowCaseForm] = useState(false)
  const [documentMode,setDocumentMode] = useState('upload')
  const [uploadCaseId,setUploadCaseId] = useState('')
  const [uploading,setUploading] = useState(false)
  const [exportType,setExportType] = useState('pdf')
  const [language,setLanguage] = useState('de')
  const [outputLanguage,setOutputLanguage] = useState('de')
  const [selectedGoal,setSelectedGoal] = useState('overview')
  const [showRecommendation,setShowRecommendation] = useState(false)
  const [selectedPublicCase,setSelectedPublicCase] = useState('work')
  const [activityLog,setActivityLog] = useState([])
  const [serverAudit,setServerAudit] = useState([])
  const [deletionRequests,setDeletionRequests] = useState([])
  const [deletionBusy,setDeletionBusy] = useState(false)
  const t = ui[language] || ui.de
  const a = appText[language] || appText.de
  const n = notices[language] || notices.de
  const pui = passwordUi[language] || passwordUi.de
  const uui = uploadUi[language] || uploadUi.de
  const v28 = getV28PrivacyCopy(language)
  const v29Password = getV29PasswordCopy(language)
  const passwordPolicy = validateV29Password(password,{email,displayName})
  const passwordMatches = password.length>0&&password===password2
  const registerReady = acceptedLegal&&confirmedTestData&&passwordPolicy.valid&&passwordMatches
  const localizedPlans = plans.map((p,index)=>{ const v=(planText[language]||{})[p.key]; const j=(planJourney[language]||planJourney.de)[p.key] || {}; const base=v?{...p,audience:v[0],checks:v[1],result:v[2],excluded:v[3]}:p; return {...base,...j,level:index+1} })
  const period = periodText[language] || periodText.de
  const jl = journeyLabels[language] || journeyLabels.de
  const eui = exportUi[language] || exportUi.de
  const statusLabel = s => s === 'open' ? eui.open : s === 'closed' ? eui.closed : s || '—'
  const lightLabel = s => s === 'yellow' ? `🟡 ${eui.yellow}` : s === 'green' ? `🟢 ${eui.green}` : s === 'red' ? `🔴 ${eui.red}` : s || '—'
  const monthsLabel = value => a.months.replace('{n}',value).replace('{plural}', value>1 ? (language==='de'?'e':language==='en'?'s':'') : '')

  useEffect(()=>{
    const queryLanguage = new URLSearchParams(window.location.search).get('lang')
    const savedLanguage = localStorage.getItem('asgold-language')
    const savedOutput = localStorage.getItem('asgold-output-language')
    if(queryLanguage && languages.some(l=>l.key===queryLanguage)) setLanguage(queryLanguage)
    else if(savedLanguage && languages.some(l=>l.key===savedLanguage)) setLanguage(savedLanguage)
    if(savedOutput && languages.some(l=>l.key===savedOutput)) setOutputLanguage(savedOutput)
  },[])

  useEffect(()=>{
    const visibleLanguage=screen==='public'?outputLanguage:language
    document.documentElement.lang = visibleLanguage
    document.documentElement.dir = rtlLanguages.has(visibleLanguage) ? 'rtl' : 'ltr'
    localStorage.setItem('asgold-language',language)
    return ()=>{ document.documentElement.dir = 'ltr' }
  },[language,outputLanguage,screen])

  useEffect(()=>{
    localStorage.setItem('asgold-output-language',outputLanguage)
    document.documentElement.dataset.outputLanguage=outputLanguage
    document.dispatchEvent(new CustomEvent('asgold:output-language',{detail:{language:outputLanguage}}))
  },[outputLanguage])

  const currentTier = access?.permissions?.tier || 'free'
  const currentPlan = useMemo(() => plans.find(p=>p.key===currentTier) || plans[0],[currentTier])
  const dg = (dashboardGuide[language] || dashboardGuide.de)[currentTier] || dashboardGuide.de.free
  const rt = recommendationText[language] || recommendationText.de
  const tt = transparencyText[language] || transparencyText.de
  const cd = caseDiscoveryText[language] || caseDiscoveryText.de
  const orderedPublicCases = orderCasesByResearch(cd.cases)
  const pa = publicAudienceText[language] || publicAudienceText.de
  const activePublicCase = orderedPublicCases.find(item=>item.key===selectedPublicCase) || orderedPublicCases[0]
  const lt = launchTrustText[language] || launchTrustText.de
  const sct = serverControlText[language] || serverControlText.de
  const promo = promoTranslations[language] || promoTranslations.de
  const problemUi = getProblemLanguageProfile(language).ui
  const core = getV24Copy(language)
  const approvalUi = getV25ApprovalCopy(language)
  const analysisUi = getV26AnalysisCopy(language)
  const privacyCurrent = privacySettings?.privacy_notice_version===PRIVACY_NOTICE_VERSION && privacySettings?.terms_version===TERMS_VERSION && !!privacySettings?.privacy_notice_acknowledged_at && !!privacySettings?.terms_acknowledged_at
  const recommendedTier = goalTier[selectedGoal] || 'free'
  const recommendedPlan = localizedPlans.find(p=>p.key===recommendedTier) || localizedPlans[0]
  const currentSufficient = (tierRank[currentTier]||1) >= (tierRank[recommendedTier]||1)
  const deadlineCases = useMemo(()=>data.cases.filter(item=>item.deadline_at).sort((left,right)=>new Date(left.deadline_at)-new Date(right.deadline_at)),[data.cases])
  const promoQuotes = Object.values(quotes).filter(Boolean)
  const promoAnyValid = !!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='valid')
  const promoAllInvalid = !!appliedPromoCode&&promoQuotes.length===upgrades.length&&promoQuotes.every(quote=>quote.promo_code_state==='invalid')
  const promoSomeInvalid = !!appliedPromoCode&&promoQuotes.some(quote=>quote.promo_code_state==='invalid')
  useEffect(()=>{
    if(!user?.id) return
    try{
      const storageKey=`asgold-activity-${user.id}`
      const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
      const sanitized=Array.isArray(stored)?stored.filter(entry=>entry?.at&&entry?.kind).map(entry=>({at:entry.at,kind:entry.kind,detail:'✓'})).slice(0,50):[]
      localStorage.setItem(storageKey,JSON.stringify(sanitized))
      setActivityLog(sanitized)
    }catch{ setActivityLog([]) }
  },[user?.id])

  function recordLocalAction(kind){
    if(!user?.id) return
    const entry={at:new Date().toISOString(),kind,detail:'✓'}
    setActivityLog(prev=>{
      const next=[entry,...prev].slice(0,50)
      localStorage.setItem(`asgold-activity-${user.id}`,JSON.stringify(next))
      return next
    })
  }

  async function recordServerAudit(eventType,metadata={},entityType=null,entityId=null){
    if(!user?.id) return false
    const {error}=await supabase.rpc('record_gold_audit_event',{p_event_type:eventType,p_entity_type:entityType,p_entity_id:entityId,p_metadata:metadata})
    if(error){ console.error('record_gold_audit_event',error); return false }
    const {data:rows}=await supabase.from('audit_events').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(20)
    setServerAudit(rows||[])
    return true
  }

  async function requestAccountDeletion(){
    if(!user?.id || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await supabase.from('deletion_requests').insert({owner_id:user.id,scope:'account',reason:'requested_in_app'})
    if(error){ setDeletionBusy(false); return setMessage(error.code==='23505'?sct.deletionPending:error.message) }
    await recordServerAudit('account_deletion_requested',{status:'requested'},'account',null)
    const {data:rows}=await supabase.from('deletion_requests').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionRequested)
  }

  async function cancelAccountDeletion(){
    const pending=deletionRequests.find(r=>r.scope==='account'&&r.status==='requested')
    if(!pending || deletionBusy) return
    setDeletionBusy(true); setMessage('')
    const {error}=await supabase.from('deletion_requests').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',pending.id).eq('owner_id',user.id)
    if(error){setDeletionBusy(false);return setMessage(error.message)}
    await recordServerAudit('account_deletion_cancelled',{status:'cancelled'},'account',null)
    const {data:rows}=await supabase.from('deletion_requests').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
    setDeletionRequests(rows||[]); setDeletionBusy(false); setMessage(sct.deletionCancelled)
  }

  async function loadApp(session){
    setMessage('')
    const { data: accessRows, error: accessError } = await supabase.rpc('current_gold_access')
    if(accessError){ setMessage(accessError.message); setScreen('login'); return }
    const row = accessRows?.[0]
    if(!row?.active || row?.status !== 'approved') { setMessage(accessPendingMessages[language]||accessPendingMessages.de); setScreen('login'); return }
    setAccess(row)
    const { data: upgradeRows } = await supabase.rpc('gold_available_upgrades')
    setUpgrades(upgradeRows || [])
    const ownerId = session.user.id
    const [cases,clients,documents,approvals,assessments,sourceStatus,auditRows,deletionRows,privacyRow] = await Promise.all([
      supabase.from('cases').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('clients').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('documents').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('approvals').select('*').eq('owner_id',ownerId).order('updated_at',{ascending:false}),
      supabase.from('assessments').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
      supabase.from('source_status').select('*').eq('owner_id',ownerId).order('checked_at',{ascending:false}),
      supabase.from('audit_events').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}).limit(20),
      supabase.from('deletion_requests').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false}),
      supabase.from('account_privacy_settings').select('*').eq('owner_id',ownerId).maybeSingle()
    ])
    const firstDataError=[cases,clients,documents,approvals,assessments,sourceStatus,auditRows,deletionRows,privacyRow].find(result=>result.error)?.error
    if(firstDataError) setMessage(firstDataError.message)
    let nextPrivacy=privacyRow.data||null
    const registrationMeta=session.user?.user_metadata||{}
    if(!nextPrivacy && registrationMeta.privacy_notice_version===PRIVACY_NOTICE_VERSION && registrationMeta.terms_version===TERMS_VERSION && registrationMeta.test_data_only===true){
      const acknowledgedAt=registrationMeta.legal_acknowledged_at||new Date().toISOString()
      const createdPrivacy=await supabase.from('account_privacy_settings').insert({owner_id:ownerId,privacy_notice_version:PRIVACY_NOTICE_VERSION,privacy_notice_acknowledged_at:acknowledgedAt,terms_version:TERMS_VERSION,terms_acknowledged_at:acknowledgedAt,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}).select().single()
      if(!createdPrivacy.error) nextPrivacy=createdPrivacy.data
    }
    setData({cases:cases.data||[],clients:clients.data||[],documents:documents.data||[],approvals:approvals.data||[],assessments:assessments.data||[],sourceStatus:sourceStatus.data||[]})
    setServerAudit(auditRows.data||[])
    setDeletionRequests(deletionRows.data||[])
    setPrivacySettings(nextPrivacy)
    setUser(session.user)
    setScreen('app')
  }

  async function refresh(){ const {data:{session}} = await supabase.auth.getSession(); if(session) await loadApp(session) }

  useEffect(()=>{
    let alive = true
    supabase.auth.getSession().then(({data:{session}})=>{ if(alive) session ? loadApp(session) : setScreen(new URLSearchParams(window.location.search).get('start')==='register'?'register':'public') })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session)=>{
      if(!alive) return
      if(event==='SIGNED_IN' && session) loadApp(session)
      if(event==='SIGNED_OUT'){ setUser(null); setAccess(null); setPrivacySettings(null); setData(emptyData); setSelectedCase(null); setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null); setApprovalDefaults({caseId:'',documentId:''}); setServerAudit([]); setDeletionRequests([]); setActivityLog([]); setSection('dashboard'); setScreen('public') }
    })
    return ()=>{ alive=false; subscription.unsubscribe() }
  },[])

  useEffect(()=>{
    if(screen!=='app' || !upgrades.length) return
    let cancelled=false
    ;(async()=>{
      setQuoteLoading(true)
      const pairs = await Promise.all(upgrades.map(async u=>{
        const args={p_to_plan:u.plan_key,p_term_months:termMonths}
        if(appliedPromoCode) args.p_promo_code=appliedPromoCode
        const {data,error}=await supabase.rpc('gold_upgrade_quote',args)
        return [u.plan_key,error?null:data]
      }))
      if(!cancelled){ setQuotes(Object.fromEntries(pairs)); setQuoteLoading(false) }
    })()
    return ()=>{cancelled=true}
  },[screen,termMonths,upgrades.length,appliedPromoCode,promoRevision])

  async function acknowledgeCurrentLegal(){
    if(!user?.id||privacyBusy) return false
    setPrivacyBusy(true);setMessage('')
    const now=new Date().toISOString()
    const payload={owner_id:user.id,privacy_notice_version:PRIVACY_NOTICE_VERSION,privacy_notice_acknowledged_at:now,terms_version:TERMS_VERSION,terms_acknowledged_at:now,real_data_authorized:false,ai_processing_enabled:false,special_categories_authorized:false,retention_days:90}
    const {data:stored,error}=await supabase.from('account_privacy_settings').upsert(payload,{onConflict:'owner_id'}).select().single()
    if(error){setPrivacyBusy(false);setMessage(error.message);return false}
    setPrivacySettings(stored)
    await recordServerAudit('legal_notices_acknowledged',{},'account',null)
    setPrivacyBusy(false);setMessage(v28.saved)
    return true
  }

  async function signIn(e){
    e.preventDefault(); setMessage('')
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password})
    if(error) return setMessage(error.message)
    await loadApp(data.session)
  }
  async function resetPassword(){
    setMessage('')
    if(!email.trim()) return setMessage(language==='de'?'Bitte zuerst Ihre E-Mail-Adresse eingeben.':'Please enter your email address first.')
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin})
    if(error) return setMessage(error.message)
    setMessage(lt.passwordSent)
  }
  async function register(e){
    e.preventDefault(); setMessage('')
    if(!acceptedLegal||!confirmedTestData) return setMessage(v28.required)
    if(!validateV29Password(password,{email,displayName}).valid) return setMessage(v29Password.invalid)
    if(password!==password2) return setMessage(n.pwMismatch)
    const legalAcknowledgedAt=new Date().toISOString()
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim(),privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION,legal_acknowledged_at:legalAcknowledgedAt,test_data_only:true},emailRedirectTo:'https://app-gold-workspace.vercel.app'}})
    if(error) return setMessage(error.message)
    if(data.session) await loadApp(data.session)
    else { setAcceptedLegal(false);setConfirmedTestData(false);setMessage(n.registered); setScreen('login') }
  }
  function applyPromo(event){
    event.preventDefault()
    const next=promoCode.trim()
    if(!next) return clearPromo()
    setQuotes({})
    setAppliedPromoCode(next)
    setPromoRevision(value=>value+1)
  }
  function clearPromo(){
    setPromoCode('')
    setQuotes({})
    setAppliedPromoCode('')
    setPromoRevision(value=>value+1)
  }
  async function requestUpgrade(plan){
    setMessage('')
    const selectedQuote=quotes[plan.plan_key]
    if(appliedPromoCode&&selectedQuote?.promo_code_state!=='valid') return setMessage(promo.invalid)
    const args={p_to_plan:plan.plan_key,p_term_months:termMonths}
    if(appliedPromoCode) args.p_promo_code=appliedPromoCode
    const {data,error}=await supabase.rpc('gold_request_upgrade',args)
    if(error) return setMessage(appliedPromoCode?promo.invalid:error.message)
    await recordServerAudit('upgrade_requested',{plan_key:plan.plan_key,term_months:Number(termMonths),promo_applied:data?.promo_code_state==='valid'},'account',null)
    setMessage(`${n.upgradeReserved} ${n.selected}: ${data?.to_plan_name || plan.plan_name}, ${termMonths} ${termMonths===1?n.monthOne:n.monthMany}.`)
  }
  async function createClient(e){
    e.preventDefault(); setMessage('')
    const payload={owner_id:user.id,name:newClient.name.trim(),email:newClient.email.trim()||null,phone:newClient.phone.trim()||null,notes:newClient.notes.trim()||null}
    const {data:created,error}=await supabase.from('clients').insert(payload).select().single()
    if(error) return setMessage(error.message)
    recordLocalAction('client_created'); await recordServerAudit('client_created',{},'client',created.id); setData(previous=>({...previous,clients:[created,...previous.clients]})); setNewClient({name:'',email:'',phone:'',notes:''}); setShowClientForm(false); setSection('clients')
  }
  function cleanCasePayload(draft){
    return {
      client_id:draft.client_id||null,
      title:draft.title.trim(),
      reference_no:draft.reference_no.trim()||null,
      goal:draft.goal.trim()||null,
      summary:draft.summary.trim()||null,
      deadline_at:draft.deadline_at?new Date(draft.deadline_at).toISOString():null,
      next_action:draft.next_action.trim()||null,
      status:draft.status||'open'
    }
  }
  async function createCase(e){
    e.preventDefault(); setMessage('')
    const payload={...cleanCasePayload(newCase),owner_id:user.id,traffic_light:'yellow'}
    const {data:created,error}=await supabase.from('cases').insert(payload).select().single()
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_created'); await recordServerAudit('case_created',{},'case',created.id)
    setData(previous=>({...previous,cases:[created,...previous.cases]})); setNewCase(emptyCase); setShowCaseForm(false); setSelectedCase(created)
    return true
  }
  async function updateCase(caseId,draft){
    setMessage('')
    const payload={...cleanCasePayload(draft),updated_at:new Date().toISOString()}
    const {data:updated,error}=await supabase.from('cases').update(payload).eq('id',caseId).eq('owner_id',user.id).select().single()
    if(error){setMessage(error.message);return false}
    recordLocalAction('case_updated'); await recordServerAudit('case_updated',{},'case',updated.id)
    setData(previous=>({...previous,cases:previous.cases.map(item=>item.id===updated.id?updated:item)})); setSelectedCase(updated)
    return true
  }
  async function createAssessment(caseId,draft){
    setMessage('')
    const payload={owner_id:user.id,case_id:caseId,title:draft.title.trim(),traffic_light:draft.traffic_light,reasoning:draft.reasoning.trim()||null,next_step:draft.next_step.trim()||null}
    const {data:created,error}=await supabase.from('assessments').insert(payload).select().single()
    if(error){setMessage(error.message);return false}
    const ranking={green:1,yellow:2,red:3}
    const current=data.cases.find(item=>item.id===caseId)?.traffic_light||'green'
    const overall=ranking[created.traffic_light]>ranking[current]?created.traffic_light:current
    const {data:updatedCase,error:caseError}=await supabase.from('cases').update({traffic_light:overall,updated_at:new Date().toISOString()}).eq('id',caseId).eq('owner_id',user.id).select().single()
    if(caseError){setMessage(caseError.message);return false}
    recordLocalAction('assessment_created'); await recordServerAudit('assessment_created',{},'case',caseId)
    setData(previous=>({...previous,assessments:[created,...previous.assessments],cases:previous.cases.map(item=>item.id===caseId?updatedCase:item)})); setSelectedCase(updatedCase)
    return true
  }
  async function functionErrorMessage(error,fallback){
    if(!error) return fallback
    try{
      if(typeof error.context?.json==='function'){
        const payload=await error.context.json()
        return payload?.error||payload?.message||payload?.detail||error.message||fallback
      }
    }catch{}
    return error.message||fallback
  }
  async function analyzeDocument(document){
    if(!document?.file_path) return false
    setMessage('')
    if(!privacyCurrent){setMessage(v28.required);return false}
    if(!['synthetic','anonymized'].includes(document.data_classification)){setMessage(v28.uploadRequired);return false}
    const enabled=await supabase.from('account_privacy_settings').update({ai_processing_enabled:true,updated_at:new Date().toISOString()}).eq('owner_id',user.id).eq('privacy_notice_version',PRIVACY_NOTICE_VERSION).eq('terms_version',TERMS_VERSION).select().single()
    if(enabled.error){setMessage(enabled.error.message);return false}
    const allowed=await supabase.from('documents').update({ai_processing_allowed:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,ai_notice_version:PRIVACY_NOTICE_VERSION,updated_at:new Date().toISOString()}).eq('id',document.id).eq('owner_id',user.id).in('data_classification',['synthetic','anonymized']).select().single()
    if(allowed.error){setMessage(allowed.error.message);return false}
    setPrivacySettings(enabled.data)
    await recordServerAudit('document_ai_transfer_authorized',{classification:document.data_classification},'document',document.id)
    const {data:result,error}=await supabase.functions.invoke('gold-ocr-v28',{body:{file_path:document.file_path,document_id:document.id,output_language:outputLanguage,acknowledged:true,privacy_notice_version:PRIVACY_NOTICE_VERSION,terms_version:TERMS_VERSION}})
    if(error){setMessage(await functionErrorMessage(error,analysisUi.failed));return false}
    if(result?.status==='configuration_required'){setMessage(result.message||analysisUi.failed);return false}
    const suggestedCase=data.cases.some(item=>item.id===result?.suggested_case_id)?result.suggested_case_id:null
    const generated={
      fields:{
        extracted_text:result?.extracted_text||'',
        document_type:result?.document_type||document.document_type||'',
        document_date:/^\d{4}-\d{2}-\d{2}$/.test(result?.document_date||'')?result.document_date:(document.document_date||''),
        case_id:suggestedCase||document.case_id||'',
        analysis_summary:result?.summary||'',
        analysis_next_step:result?.next_step||''
      },
      facts:{
        sender_or_author:result?.sender_or_author||null,
        recipient:result?.recipient||null,
        reference_numbers:Array.isArray(result?.reference_numbers)?result.reference_numbers:[],
        deadlines:Array.isArray(result?.deadlines)?result.deadlines:[],
        monetary_amounts:Array.isArray(result?.monetary_amounts)?result.monetary_amounts:[],
        confidence:result?.confidence||null
      }
    }
    recordLocalAction('document_analysis_generated')
    const auditSaved=await recordServerAudit('document_analysis_generated',{status:'provisional'},'document',document.id)
    setMessage(auditSaved?analysisUi.ready:`${analysisUi.ready} · ${sct.auditFailed}`)
    return generated
  }
  async function updateDocument(documentId,draft){
    setMessage('')
    const payload={title:String(draft.title||'').trim(),case_id:draft.case_id||null,document_type:String(draft.document_type||'').trim()||null,document_date:draft.document_date||null,extracted_text:String(draft.extracted_text||'').trim()||null,analysis_summary:String(draft.analysis_summary||'').trim()||null,analysis_next_step:String(draft.analysis_next_step||'').trim()||null,updated_at:new Date().toISOString()}
    const {data:updated,error}=await supabase.from('documents').update(payload).eq('id',documentId).eq('owner_id',user.id).select().single()
    if(error){setMessage(error.message);return false}
    const eventType=draft.analysis_generated?'document_analysis_saved':'document_reviewed'
    recordLocalAction(eventType)
    const auditSaved=await recordServerAudit(eventType,{status:'saved'},'document',updated.id)
    setData(previous=>({...previous,documents:previous.documents.map(item=>item.id===updated.id?updated:item)})); setSelectedDocument(updated)
    setMessage(auditSaved?(draft.analysis_generated?analysisUi.savedMessage:`${core.documentReview} ✓`):sct.auditFailed)
    return true
  }
  async function createApproval(draft){
    setMessage('')
    if(!draft.case_id){setMessage(approvalUi.caseRequired);return false}
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(draft.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const linkedDocument=draft.document_id?data.documents.find(item=>item.id===draft.document_id):null
    if(linkedDocument?.case_id!==draft.case_id&&draft.document_id){setMessage(approvalUi.documentMismatch);return false}
    const payload={
      owner_id:user.id,
      case_id:draft.case_id,
      document_id:draft.document_id||null,
      approval_type:draft.approval_type,
      status:'pending',
      recipient:draft.recipient.trim()||null,
      subject:draft.subject.trim(),
      body:draft.body.trim(),
      attachment_names:linkedDocument?[linkedDocument.title]:[],
      preview_required:true
    }
    const {data:created,error}=await supabase.from('approvals').insert(payload).select().single()
    if(error){setMessage(error.message);return false}
    recordLocalAction('approval_created')
    await recordServerAudit('approval_created',{revision:Number(created.preview_revision)},'approval',created.id)
    setData(previous=>({...previous,approvals:[created,...previous.approvals]}))
    setApprovalDefaults({caseId:'',documentId:''})
    setSelectedApproval(created)
    setMessage(approvalUi.created)
    return created
  }
  async function updateApproval(approvalId,draft){
    setMessage('')
    const current=data.approvals.find(item=>item.id===approvalId)
    if(!current) return false
    if(!draft.subject.trim()||!draft.body.trim()){setMessage(approvalUi.contentRequired);return false}
    if(current.approval_type==='send'&&!draft.recipient.trim()){setMessage(approvalUi.recipientRequired);return false}
    const next={recipient:draft.recipient.trim()||null,subject:draft.subject.trim(),body:draft.body.trim()}
    const contentChanged=(current.recipient||null)!==next.recipient||(current.subject||'')!==next.subject||(current.body||'')!==next.body
    const payload={...next}
    if(contentChanged&&current.status==='rejected') Object.assign(payload,{status:'pending',approved_at:null,approved_revision:null})
    const {data:updated,error}=await supabase.from('approvals').update(payload).eq('id',approvalId).eq('owner_id',user.id).eq('preview_revision',current.preview_revision).select().maybeSingle()
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    const invalidated=current.status==='approved'&&updated.status==='pending'
    recordLocalAction(invalidated?'approval_invalidated':'approval_updated')
    await recordServerAudit(invalidated?'approval_invalidated':'approval_updated',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(item=>item.id===updated.id?updated:item)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.saved)
    return updated
  }
  async function approveApproval(item){
    setMessage('')
    const approvedAt=new Date().toISOString()
    const {data:updated,error}=await supabase.from('approvals').update({status:'approved',approved_at:approvedAt,approved_revision:item.preview_revision,invalidated_at:null}).eq('id',item.id).eq('owner_id',user.id).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_approved')
    await recordServerAudit('approval_approved',{revision:Number(updated.approved_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.approvedMessage)
    return updated
  }
  async function rejectApproval(item){
    setMessage('')
    const {data:updated,error}=await supabase.from('approvals').update({status:'rejected',approved_at:null,approved_revision:null}).eq('id',item.id).eq('owner_id',user.id).eq('status','pending').eq('preview_revision',item.preview_revision).select().maybeSingle()
    if(error){setMessage(error.message);return false}
    if(!updated){setMessage(approvalUi.stale);return false}
    recordLocalAction('approval_rejected')
    await recordServerAudit('approval_rejected',{revision:Number(updated.preview_revision)},'approval',updated.id)
    setData(previous=>({...previous,approvals:previous.approvals.map(entry=>entry.id===updated.id?updated:entry)}))
    setSelectedApproval(updated)
    setMessage(approvalUi.rejectedMessage)
    return updated
  }
  function prepareDocumentApproval(document){
    setSelectedDocument(null);setSelectedCase(null);setSelectedApproval(null)
    setApprovalDefaults({caseId:document.case_id||'',documentId:document.id})
    setSection('approvals')
  }
  async function uploadDocument(e){
    e.preventDefault(); setMessage('')
    const form=e.currentTarget
    const file=form.elements.file.files[0], caseId=form.elements.case_id.value||null
    if(!file) return setMessage(n.chooseFile)
    const dataClassification=form.elements.data_classification?.value
    const testDataConfirmed=!!form.elements.test_data_confirmed?.checked
    if(!['synthetic','anonymized'].includes(dataClassification)||!testDataConfirmed) return setMessage(v28.uploadRequired)
    if(!privacyCurrent) return setMessage(v28.required)
    const extension=file.name.includes('.')?file.name.split('.').pop().toLowerCase():''
    if(!allowedUploadExtensions.has(extension)) return setMessage(uui.unsupported)
    if(file.size>maxUploadBytes) return setMessage(uui.tooLarge)
    const limit=Number(access?.permissions?.document_limit||0)
    if(access?.app_role!=='owner' && limit>0 && data.documents.length>=limit) return setMessage(n.docLimit.replace('{limit}',limit))
    setUploading(true)
    const path=`${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const upload=await supabase.storage.from('goldstandard-private').upload(path,file,{upsert:false})
    if(upload.error){setUploading(false);return setMessage(upload.error.message)}
    let extractedText=null
    if(['txt','csv'].includes(extension) && file.size<=2*1024*1024){
      try{extractedText=(await file.text()).trim()||null}catch{extractedText=null}
    }
    const documentType=form.elements.document_type?.value.trim()||extension.toUpperCase()
    const documentDate=form.elements.document_date?.value||null
    const source=form.elements.source?.value||'upload'
    const insert=await supabase.from('documents').insert({owner_id:user.id,title:file.name,file_path:path,case_id:caseId,document_type:documentType,document_date:documentDate,source,extracted_text:extractedText,data_classification:dataClassification,privacy_notice_version:PRIVACY_NOTICE_VERSION,ai_processing_allowed:false}).select().single()
    if(insert.error){await supabase.storage.from('goldstandard-private').remove([path]);setUploading(false);return setMessage(insert.error.message)}
    recordLocalAction('document_uploaded'); await recordServerAudit('document_uploaded',{classification:dataClassification},'document',insert.data.id); setData(previous=>({...previous,documents:[insert.data,...previous.documents]})); setUploading(false); form.reset(); setSection('documents'); setSelectedDocument(insert.data)
  }
  async function openDocument(doc){
    if(!doc.file_path) return
    const {data:signed,error}=await supabase.storage.from('goldstandard-private').createSignedUrl(doc.file_path,300)
    if(error) return setMessage(error.message)
    recordLocalAction('document_opened'); await recordServerAudit('document_opened',{},'document',doc.id); window.open(signed.signedUrl,'_blank','noopener')
  }
  function canExport(type){
    if(access?.app_role==='owner') return true
    const p=access?.permissions||{}
    return type==='docx'?!!p.export_word:type==='pdf'?!!p.export_pdf:type==='xlsx'?!!p.export_excel:type==='pptx'?!!p.export_pptx:type==='csv'?!!p.export_csv:type==='txt'?!!p.export_txt:false
  }
  async function doExport(ref,type){
    if(!canExport(type)) return setMessage(n.exportLocked)
    const ex=exportUi[outputLanguage]||exportUi.de
    const outputCore=getV24Copy(outputLanguage)
    const outputApprovalUi=getV25ApprovalCopy(outputLanguage)
    const localStatus=s=>s==='open'?ex.open:s==='closed'?ex.closed:s||'—'
    const localLight=s=>s==='yellow'?`🟡 ${ex.yellow}`:s==='green'?`🟢 ${ex.green}`:s==='red'?`🔴 ${ex.red}`:s||'—'
    const caseDocuments=ref.kind==='case'?data.documents.filter(item=>item.case_id===ref.item.id):[]
    const caseAssessments=ref.kind==='case'?data.assessments.filter(item=>item.case_id===ref.item.id):[]
    const caseSources=ref.kind==='case'?data.sourceStatus.filter(item=>item.case_id===ref.item.id):[]
    const caseApprovals=ref.kind==='case'?data.approvals.filter(item=>item.case_id===ref.item.id):[]
    const rows=ref.kind==='case'
      ? [[ex.caseTitle,''],[ex.case,ref.item.title||ex.case],[ex.status,localStatus(ref.item.status)],[ex.traffic,localLight(ref.item.traffic_light)],[outputCore.goal,ref.item.goal||''],[ex.summary,ref.item.summary||''],[outputCore.deadline,ref.item.deadline_at?new Date(ref.item.deadline_at).toLocaleString():''],[outputCore.nextAction,ref.item.next_action||''],[ex.documents,caseDocuments.map(item=>item.title).join(', ')||ex.none],[outputCore.currentAssessments,caseAssessments.map(item=>`${localLight(item.traffic_light)} · ${item.title}: ${item.reasoning||''}${item.next_step?` · ${outputCore.nextAction}: ${item.next_step}`:''}`).join('\n')||ex.none],[outputCore.sourceBasis,caseSources.map(item=>`${item.source_label||item.source_kind}: ${item.status}${item.details?` · ${item.details}`:''}`).join('\n')||ex.none],[outputApprovalUi.title,caseApprovals.map(item=>`${item.subject||item.approval_type} · ${outputApprovalUi[item.status]||item.status} · ${outputApprovalUi.revision} ${item.preview_revision}`).join('\n')||ex.none]]
      : [[ex.documentTitle,''],[ex.document,ref.item.title||ex.document],[ex.documentType,ref.item.document_type||''],[ex.documentDate,ref.item.document_date||''],[ex.analysis,ref.item.analysis_summary||ex.noAnalysis],[ex.nextStep,ref.item.analysis_next_step||''],[ex.extracted,ref.item.extracted_text||'']]
    const base=(ref.item.title||(ref.kind==='case'?'Fall':'Dokument')).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,'_').slice(0,80)
    try{
      if(type==='docx'){
        const {Document,Packer,Paragraph,TextRun}=await import('docx')
        const children=rows.flatMap((r,i)=>i===0?[new Paragraph({children:[new TextRun({text:r[0],bold:true,size:32})]})]:[new Paragraph({children:[new TextRun({text:`${r[0]}: `,bold:true}),new TextRun(String(r[1]||''))]})])
        const blob=await Packer.toBlob(new Document({sections:[{children}]})); downloadBlob(blob,`${base}.docx`)
      } else if(type==='pdf'){
        const {jsPDF}=await import('jspdf'); const pdf=new jsPDF(); let y=18
        rows.forEach((r,i)=>{const line=i===0?r[0]:`${r[0]}: ${r[1]||''}`;const split=pdf.splitTextToSize(String(line),175);if(y+7*split.length>280){pdf.addPage();y=18}pdf.setFont(undefined,i===0?'bold':'normal');pdf.text(split,18,y);y+=7*split.length+4}); pdf.save(`${base}.pdf`)
      } else if(type==='xlsx'){
        const {createXlsxBlob}=await import('./lib/officeExports')
        downloadBlob(await createXlsxBlob(rows),`${base}.xlsx`)
      } else if(type==='pptx'){
        const {createPptxBlob}=await import('./lib/officeExports')
        downloadBlob(await createPptxBlob(rows),`${base}.pptx`)
      } else if(type==='csv'){
        const q=v=>`"${String(v??'').replace(/"/g,'""')}"`; downloadBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),`${base}.csv`)
      } else if(type==='txt') downloadBlob(new Blob([rows.map((r,i)=>i===0?r[0]:`${r[0]}: ${r[1]||''}`).join('\r\n\r\n')],{type:'text/plain;charset=utf-8'}),`${base}.txt`)
      const {error:exportLogError}=await supabase.from('exports').insert({case_id:ref.kind==='case'?ref.item.id:ref.item.case_id||null,document_id:ref.kind==='document'?ref.item.id:null,export_type:type,title:`${ref.item.title||'AS Gold Export'} (${type.toUpperCase()})`,status:'ready'})
      if(exportLogError) throw exportLogError
      recordLocalAction('export_created')
      const auditSaved=await recordServerAudit('export_created',{format:type.toUpperCase()},ref.kind,ref.item.id)
      setMessage(auditSaved?`${a.export}: ${type.toUpperCase()} ✓`:`${a.export}: ${type.toUpperCase()} ✓ · ${sct.auditFailed}`)
    } catch(err){ setMessage(`${a.export}: ${err.message}`) }
  }
  async function exportMyData(){
    const packageData={
      product:'AS Gold',
      exported_at:new Date().toISOString(),
      account:{email:user?.email||null,user_id:user?.id||null},
      access:{tier:currentTier,plan:currentPlan.name,status:access?.status||null,active:!!access?.active,payment:'disabled'},
      privacy_settings:privacySettings,
      retention_note:a.pauseInfo,
      data:{cases:data.cases,clients:data.clients,documents:data.documents,assessments:data.assessments,source_status:data.sourceStatus,approvals:data.approvals}
    }
    const blob=new Blob([JSON.stringify(packageData,null,2)],{type:'application/json;charset=utf-8'})
    downloadBlob(blob,`AS_Gold_Datenexport_${new Date().toISOString().slice(0,10)}.json`)
    recordLocalAction('account_data_export')
    await recordServerAudit('account_data_export',{format:'JSON'},'account',null)
    setMessage(`${lt.dataExport} ✓`)
  }
  function downloadBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}

  function handleQuickAction(action,item=null){
    setSelectedClient(null); setSelectedDocument(null); setSelectedApproval(null)
    if(action==='open-case'&&item){setSelectedCase(item);return}
    setSelectedCase(null)
    if(action==='case'){setSection('cases');setShowCaseForm(true);return}
    if(action==='scan'||action==='upload'){setDocumentMode(action);setUploadCaseId('');setSection('documents');return}
    if(action==='clients'){setSection('clients');return}
    if(action==='deadlines'){setSection('cases');return}
    if(action==='approvals'){setApprovalDefaults({caseId:'',documentId:''});setSection('approvals')}
  }

  function startProblemVoice(){
    const problem=document.getElementById('asgold-problem-navigator-react')
    const microphone=problem?.querySelector('[data-problem-voice]')
    if(!problem||!microphone)return
    problem.scrollIntoView({behavior:'smooth',block:'center'})
    setTimeout(()=>microphone.click(),350)
  }

  function protectedWorkspace(content){
    return <><header className="appTop"><div className="brand"><Logo/><b>AS Gold</b></div><div className="appHeaderTools"><span className="legalChip">{t.legal}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language} showLabel/><LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage} showLabel/><button className="secondary" onClick={()=>supabase.auth.signOut()}>{a.logout}</button></div></header><main className="appMain">{message&&<div className="note">{message}</div>}{content}</main><LegalFooter language={language}/></>
  }

  if(screen==='loading') return <><main className="center"><section className="card"><Logo/><h1>AS Gold</h1><p>{a.checking}</p></section></main><LegalFooter language={language}/></>
  if(screen==='login'||screen==='register') return <><main className="center"><section className="card authCard"><Logo/><h1>AS Gold</h1><div className="languageSwitch"><span>{t.language}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language}/></div><p className="muted">{screen==='register'?a.registerTitle:a.protected}</p>{screen==='register'&&<div className="registerTransparency"><b>{tt.registerTitle}</b><p>{tt.registerNote}</p><span>✓ {a.noSubscription}</span></div>}{screen==='register'?<form onSubmit={register}><label>{a.name}<input value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" required/></label><label>{a.email}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><PasswordField id="register-password" label={a.password} value={password} onChange={e=>setPassword(e.target.value)} visible={showPassword} onToggle={()=>setShowPassword(v=>!v)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/><PasswordField id="register-password-repeat" label={a.passwordAgain} value={password2} onChange={e=>setPassword2(e.target.value)} visible={showPassword2} onToggle={()=>setShowPassword2(v=>!v)} labels={pui} autoComplete="new-password" describedBy="v29-password-policy"/><PasswordPolicyChecklist language={language} password={password} passwordRepeat={password2} email={email} displayName={displayName}/><RegistrationLegalFields copy={v28} accepted={acceptedLegal} onAccepted={setAcceptedLegal} testOnly={confirmedTestData} onTestOnly={setConfirmedTestData}/><button className="primary full" disabled={!registerReady}>{a.registerFree}</button></form>:<form onSubmit={signIn}><label>{a.email}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label><PasswordField id="login-password" label={a.password} value={password} onChange={e=>setPassword(e.target.value)} visible={showPassword} onToggle={()=>setShowPassword(v=>!v)} labels={pui} autoComplete="current-password"/><button className="primary full">{t.login}</button><button type="button" className="linkBtn full" onClick={resetPassword}>{lt.passwordReset}</button><small className="authHelp">{lt.passwordResetHelp}</small></form>}{message&&<div className="note">{message}</div>}<button className="linkBtn full" onClick={()=>{setShowPassword(false);setShowPassword2(false);setAcceptedLegal(false);setConfirmedTestData(false);setScreen(screen==='register'?'login':'register')}}>{screen==='register'?a.already:a.newHere}</button><button className="backBtn full authBackBtn" onClick={()=>{setShowPassword(false);setShowPassword2(false);setAcceptedLegal(false);setConfirmedTestData(false);setScreen('public')}}>{a.backExplanation}</button></section></main><LegalFooter language={language}/></>

  if(screen==='app'&&!privacyCurrent) return protectedWorkspace(<LegalAcceptance copy={v28} onAccept={acknowledgeCurrentLegal} busy={privacyBusy}/>)

  if(screen==='app'&&selectedApproval) return protectedWorkspace(<ApprovalDetail key={`${selectedApproval.id}-${selectedApproval.preview_revision}-${selectedApproval.status}`} copy={approvalUi} item={selectedApproval} cases={data.cases} documents={data.documents} onBack={()=>setSelectedApproval(null)} onSave={updateApproval} onApprove={approveApproval} onReject={rejectApproval}/>)
  if(screen==='app'&&selectedDocument) return protectedWorkspace(<DocumentDetail key={selectedDocument.id} copy={core} analysis={analysisUi} item={selectedDocument} cases={data.cases} onBack={()=>setSelectedDocument(null)} onSave={updateDocument} onAnalyze={analyzeDocument} onOpen={openDocument} onPrepareApproval={prepareDocumentApproval} approvalLabel={approvalUi.prepareFromDocument}/>)
  if(screen==='app'&&selectedCase){
    const caseDocs=data.documents.filter(document=>document.case_id===selectedCase.id)
    const caseAssessments=data.assessments.filter(assessment=>assessment.case_id===selectedCase.id)
    return protectedWorkspace(<><CaseDetail key={selectedCase.id} copy={core} analysis={analysisUi} item={selectedCase} clients={data.clients} documents={caseDocs} assessments={caseAssessments} onBack={()=>setSelectedCase(null)} onSave={updateCase} onAddAssessment={createAssessment} onAddDocument={caseId=>{setUploadCaseId(caseId);setDocumentMode('upload');setSelectedCase(null);setSection('documents')}} onOpenDocument={setSelectedDocument}/><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={e=>setExportType(e.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div></>)
  }
  if(screen==='app'&&!selectedClient&&section==='cases') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections.cases}</h2></div><CaseSection copy={core} clients={data.clients} cases={data.cases} newCase={newCase} setNewCase={setNewCase} showForm={showCaseForm} setShowForm={setShowCaseForm} onSubmit={createCase} onSelect={setSelectedCase}/></>)
  if(screen==='app'&&!selectedClient&&section==='documents') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections.documents}</h2></div>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',data.documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<DocumentSection copy={core} privacy={v28} cases={data.cases} documents={data.documents} mode={documentMode} setMode={setDocumentMode} defaultCaseId={uploadCaseId} onSubmit={uploadDocument} uploading={uploading} accept={allowedUploadAccept} onSelect={setSelectedDocument}/></>)
  if(screen==='app'&&!selectedClient&&section==='approvals') return protectedWorkspace(<><div className="sectionHead"><button className="backBtn" onClick={()=>{setApprovalDefaults({caseId:'',documentId:''});setSection('dashboard')}}>{a.backOverview}</button><h2>{approvalUi.title}</h2></div><ApprovalSection copy={approvalUi} cases={data.cases} documents={data.documents} approvals={data.approvals} defaults={approvalDefaults} onCreate={createApproval} onSelect={setSelectedApproval}/></>)

  if(screen==='app'){
    const caseDocs=selectedCase?data.documents.filter(d=>d.case_id===selectedCase.id):[]
    return <><header className="appTop"><div className="brand"><Logo/><b>AS Gold</b></div><div className="appHeaderTools"><span className="legalChip">{t.legal}</span><LanguageSwitcher value={language} onChange={setLanguage} label={t.language} showLabel/><LanguageSwitcher value={outputLanguage} onChange={setOutputLanguage} label={t.outputLanguage} showLabel/><button className="secondary" onClick={()=>supabase.auth.signOut()}>{a.logout}</button></div></header><main className="appMain">{message&&<div className="note">{message}</div>}
      {selectedCase?<><button className="backBtn" onClick={()=>setSelectedCase(null)}>{a.backCases}</button><h2>{selectedCase.title}</h2><div className="detailCard"><p><b>{eui.status}:</b> {statusLabel(selectedCase.status)}</p><p><b>{eui.traffic}:</b> {lightLabel(selectedCase.traffic_light)}</p><p><b>{a.summary}:</b> {selectedCase.summary||a.noSummary}</p></div><section className="whyResult"><div className="whyHeader"><span className="modeBadge">{lt.control}</span><h3>{lt.why}</h3></div><div className="whyGrid"><div><b>{lt.basis}</b><p>{lt.basisDocs.replace('{n}',caseDocs.length)}</p></div><div><b>{lt.finding}</b><p>{selectedCase.summary||a.noSummary}</p></div><div className={caseDocs.length?'':'attentionBox'}><b>{lt.missing}</b><p>{caseDocs.length?lt.missingOpen:lt.missingDocs}</p></div><div><b>{lt.assessment}</b><p>{caseDocs.length?`${lightLabel(selectedCase.traffic_light)} · ${lt.assessmentNote}`:`${lt.notFinal}: ${lt.notFinalNote}`}</p></div><div><b>{lt.next}</b><p>{caseDocs.length?lt.nextReview:lt.nextDocs}</p></div></div></section><div className="exportBar"><b>{a.exportResult}</b><select value={exportType} onChange={e=>setExportType(e.target.value)}><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="xlsx">Excel (.xlsx)</option><option value="pptx">PowerPoint (.pptx)</option><option value="csv">CSV (.csv)</option><option value="txt">Text (.txt)</option></select><button className="primary" onClick={()=>doExport({kind:'case',item:selectedCase},exportType)}>{a.export}</button></div><h3>{a.relatedDocs}</h3>{caseDocs.length?caseDocs.map(d=><button className="itemRow buttonRow" onClick={()=>openDocument(d)} key={d.id}><span>{d.title}</span><span>›</span></button>):<div className="emptyState">{a.noAssignedDocs}</div>}</>
      :selectedClient?<><button className="backBtn" onClick={()=>setSelectedClient(null)}>{a.backClients}</button><h2>{selectedClient.name}</h2><div className="detailCard"><p><b>E-Mail:</b> {selectedClient.email||'—'}</p><p><b>{a.phone}:</b> {selectedClient.phone||'—'}</p><p><b>{a.note}:</b> {selectedClient.notes||'—'}</p></div></>
      :section==='dashboard'?<><QuickActions copy={core} onAction={handleQuickAction} deadlineCases={deadlineCases}/><h2>{a.overview}</h2><p className="muted">{a.signedInAs} {user?.email}</p><section className={`dashboardGuide dash-${currentTier}`}><div className="dashboardGuideMain"><span className="modeBadge">{dg.mode}</span><h3>{dg.title}</h3><p>{dg.lead}</p><button className="primary nextAction" onClick={()=>setSection(dg.nextSection)}>{dg.next} →</button></div><div className="dashboardSteps">{dg.steps.map((step,i)=><div className="dashboardStep" key={step}><span>{i+1}</span><b>{step.replace(/^\d+\.\s*/,'')}</b></div>)}</div></section><section className="recommendationBox"><div><span className="modeBadge">{rt.recommended}</span><h3>{rt.title}</h3><p>{rt.lead}</p></div><select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}} aria-label={rt.chooseGoal}>{rt.goals.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>{showRecommendation&&<div className="recommendationResult"><div><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{currentSufficient?rt.enough:rt.upgradeReason}</p>{!currentSufficient&&<p className="benefitText">{recommendedPlan.expectation}</p>}{recommendedTier==='free'&&<p className="freeFairNote">{rt.freeNote}</p>}</div>{!currentSufficient&&<button className="secondary" onClick={()=>document.querySelector('.upgradeBox')?.scrollIntoView({behavior:'smooth'})}>{rt.showBenefit}</button>}</div>}</section><div className="trialPromise"><b>{currentTier==='free'?a.freeActive:a.planActive.replace('{plan}',currentPlan.name)}</b><span>{currentTier==='free'?a.freePromise.replace('{limit}',access?.permissions?.document_limit||3):a.paidPromise}</span></div><section className="accountControl"><div className="accountControlHead"><span className="modeBadge">{lt.control}</span><h3>{lt.contract}</h3></div><div className="controlGrid"><div><b>{currentPlan.name}</b><p>{currentTier==='free'?lt.contractFree:lt.contractPaid}</p></div><div><b>{lt.paymentState}</b><p>{lt.paymentOff}</p></div><div><b>{lt.dataTitle}</b><p>{lt.dataNote}</p><button className="secondary controlAction" onClick={exportMyData}>{lt.dataExport}</button><small>{lt.dataExportHelp}</small></div><div><b>{lt.auditTitle}</b><p>{lt.auditNote}</p><div className="deviceHistory"><strong>{lt.historyTitle}</strong><small>{lt.historyHelp}</small>{activityLog.length?<ul>{activityLog.slice(0,5).map((e,i)=><li key={`${e.at}-${i}`}><time>{new Date(e.at).toLocaleString(localeForLanguage[language]||localeForLanguage.de)}</time><span>{e.kind.replaceAll('_',' ')} · {e.detail}</span></li>)}</ul>:<em>{lt.noHistory}</em>}</div></div><div><b>{sct.serverAudit}</b><p>{sct.serverAuditHelp}</p><div className="deviceHistory serverHistory">{serverAudit.length?<ul>{serverAudit.slice(0,8).map(e=><li key={e.id}><time>{new Date(e.created_at).toLocaleString(localeForLanguage[language]||localeForLanguage.de)}</time><span>{e.event_type.replaceAll('_',' ')}{e.event_data?.detail?` · ${e.event_data.detail}`:''}</span></li>)}</ul>:<em>{sct.noServerAudit}</em>}</div></div><div><b>{sct.deletion}</b><p>{sct.deletionHelp}</p>{deletionRequests.some(r=>r.scope==='account'&&r.status==='requested')?<><div className="retentionStatus">{sct.deletionPending}</div><button className="secondary controlAction" disabled={deletionBusy} onClick={cancelAccountDeletion}>{sct.cancelDeletion}</button></>:<button className="secondary controlAction dangerSoft" disabled={deletionBusy} onClick={requestAccountDeletion}>{sct.requestDeletion}</button>}</div></div></section><div className="stats">{[['cases',a.sections.cases],['clients',a.sections.clients],['documents',a.sections.documents],['approvals',a.sections.approvals]].map(([k,l])=><button className="stat statButton" onClick={()=>setSection(k)} key={k}><b>{data[k].length}</b><span>{l}</span><small>{a.open}</small></button>)}</div>{upgrades.length>0&&<div className="detailCard upgradeBox"><div className="upgradeHeader"><div><h3>{a.upgrade}</h3><p className="muted">{a.upgradeInfo}</p></div><span className="testBadge">{a.paymentOff}</span></div><PromoCodeControl copy={promo} code={promoCode} setCode={setPromoCode} applied={appliedPromoCode} onApply={applyPromo} onClear={clearPromo} loading={quoteLoading} quotes={quotes} anyValid={promoAnyValid} allInvalid={promoAllInvalid} someInvalid={promoSomeInvalid} formatMoney={eur}/><div className="termChooser">{terms.map(t=><button key={t.months} className={termMonths===t.months?'term active':'term'} onClick={()=>setTermMonths(t.months)}><b>{monthsLabel(t.months)}</b><small>{t.discount?a.discount.replace('{discount}',t.discount):a.regular}</small></button>)}</div><div className="upgradeGrid">{upgrades.map(u=>{const q=quotes[u.plan_key];return <article className="upgradeCard" key={u.plan_key}><div className="upgradeTitle"><b>{u.plan_name}</b><strong>{eur(u.price_eur)}<small>{period.d30}</small></strong></div>{quoteLoading&&!q?<p className="muted">{a.priceCalc}</p>:q?<><div className="quoteRow"><span>{a.dueNow}</span><b>{eur(q.upgrade_due_now)}</b></div><small className="quoteHelp">{a.prorataHelp}</small><div className="quoteRow"><span>{monthsLabel(termMonths)}</span><b>{eur(q.package_total)}</b></div>{Number(q.savings)>0&&<div className="saving">{a.youSave.replace('{amount}',eur(q.savings)).replace('{discount}',Number(q.discount_percent).toFixed(0))}</div>}<div className="quoteRow mutedRow"><span>{a.regularAfter}</span><b>{eur(q.next_regular_price)} {period.d30}</b></div><div className="noRenew">{a.noRenew}</div></>:<p className="muted">{a.quoteUnavailable}</p>}<button className="primary full" disabled={!!appliedPromoCode&&q?.promo_code_state!=='valid'} onClick={()=>requestUpgrade(u)}>{a.requestUpgrade}</button></article>})}</div><p className="testNotice"><b>{a.testPhase}</b> {a.testPhaseInfo}</p></div>}</>
      :<><div className="sectionHead"><button className="backBtn" onClick={()=>setSection('dashboard')}>{a.backOverview}</button><h2>{a.sections[section]}</h2></div>{section==='clients'&&<><button className="primary actionBtn" onClick={()=>setShowClientForm(v=>!v)}>{showClientForm?a.cancel:a.addClient}</button>{showClientForm&&<form className="actionCard" onSubmit={createClient}><label>{a.name}<input value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})} required/></label><label>{a.email}<input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/></label><label>{a.phone}<input value={newClient.phone} onChange={e=>setNewClient({...newClient,phone:e.target.value})}/></label><label>{a.note}<textarea value={newClient.notes} onChange={e=>setNewClient({...newClient,notes:e.target.value})}/></label><button className="primary full">{a.saveClient}</button></form>}</>}{section==='documents'&&<form className="actionCard" onSubmit={uploadDocument}><h3>{a.uploadDoc}</h3>{access?.app_role!=='owner'&&Number(access?.permissions?.document_limit||0)>0&&<p className="muted">{a.used.replace('{used}',data.documents.length).replace('{limit}',access.permissions.document_limit)}</p>}<label>{a.file}<input name="file" type="file" accept={allowedUploadAccept} required/></label><small className="authHelp">{uui.testLimit}</small><label>{a.case}<select name="case_id"><option value="">{a.withoutCase}</option>{data.cases.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label><label>{v28.classification}<select name="data_classification" defaultValue="" required><option value="" disabled>—</option><option value="synthetic">{v28.synthetic}</option><option value="anonymized">{v28.anonymized}</option></select></label><label className="documentPrivacyConfirm"><input name="test_data_confirmed" type="checkbox" required/><span>{v28.uploadConfirm}</span></label><button className="primary full" disabled={uploading}>{uploading?a.uploading:a.uploadDoc}</button></form>}{data[section].length?<div className="itemList">{data[section].map((item,i)=>section==='cases'?<button className="itemRow buttonRow" onClick={()=>setSelectedCase(item)} key={item.id||i}><div><b>{item.title||a.case}</b><div className="pills"><span className="pill">{statusLabel(item.status)}</span><span className={`pill ${item.traffic_light||''}`}>{lightLabel(item.traffic_light)}</span></div></div><span className="chev">›</span></button>:section==='clients'?<button className="itemRow buttonRow" onClick={()=>setSelectedClient(item)} key={item.id||i}><div><b>{item.name}</b>{item.email&&<p>{item.email}</p>}</div><span className="chev">›</span></button>:section==='documents'?<article className="itemRow documentRow" key={item.id||i}><button className="documentOpen" onClick={()=>openDocument(item)}><div><b>{item.title}</b></div><span className="chev">›</span></button><div className="miniExport"><select defaultValue="pdf"><option value="pdf">PDF</option><option value="docx">Word</option><option value="xlsx">Excel</option><option value="pptx">PowerPoint</option><option value="csv">CSV</option><option value="txt">Text</option></select><button className="secondary" onClick={e=>doExport({kind:'document',item},e.currentTarget.previousElementSibling?.value||'pdf')}>{a.export}</button></div></article>:<article className="itemRow" key={item.id||i}><b>{item.title||item.subject||item.id}</b></article>)}</div>:<div className="emptyState"><b>{a.noneYet.replace('{section}',a.sections[section].toLowerCase())}</b><p>{section==='clients'?a.firstClient:section==='documents'?a.firstDoc:a.appearsHere}</p></div>}</>}</main><LegalFooter language={language}/></>
  }

  {
  const contentLanguage=outputLanguage
  const t=ui[contentLanguage]||ui.de
  const a=appText[contentLanguage]||appText.de
  const localizedPlans=plans.map((p,index)=>{const v=(planText[contentLanguage]||{})[p.key];const j=(planJourney[contentLanguage]||planJourney.de)[p.key]||{};const base=v?{...p,audience:v[0],checks:v[1],result:v[2],excluded:v[3]}:p;return{...base,...j,level:index+1}})
  const period=periodText[contentLanguage]||periodText.de
  const jl=journeyLabels[contentLanguage]||journeyLabels.de
  const rt=recommendationText[contentLanguage]||recommendationText.de
  const tt=transparencyText[contentLanguage]||transparencyText.de
  const cd=caseDiscoveryText[contentLanguage]||caseDiscoveryText.de
  const orderedPublicCases=orderCasesByResearch(cd.cases)
  const pa=publicAudienceText[contentLanguage]||publicAudienceText.de
  const activePublicCase=orderedPublicCases.find(item=>item.key===selectedPublicCase)||orderedPublicCases[0]
  const problemUi=getProblemLanguageProfile(contentLanguage).ui
  const recommendedPlan=localizedPlans.find(p=>p.key===recommendedTier)||localizedPlans[0]
  const monthsLabel=value=>a.months.replace('{n}',value).replace('{plural}',value>1?(contentLanguage==='de'?'e':contentLanguage==='en'?'s':''):'')

  return <>
    <header className="publicTop">
      <div className="wrap publicHeader">
        <div className="brand publicBrand"><Logo/><b>AS Gold</b></div>
        <PublicLanguageModules language={language} onLanguageChange={setLanguage} outputLanguage={outputLanguage} onOutputLanguageChange={setOutputLanguage}/>
        <nav className="publicActions">
          <a href="#fallarten">{cd.nav}</a>
          <a href="#preise">{t.prices}</a>
          <button className="secondary" onClick={()=>setScreen('register')}>{t.register}</button>
          <button className="primary" onClick={()=>setScreen('login')}>{t.login}</button>
        </nav>
      </div>
    </header>
    <main>
      <div className="legalMarketBar">
        <div className="wrap">
          <b>{t.legal}</b><span>{t.marketNote}</span>
        </div>
      </div>

      <section className="hero">
        <div className="wrap heroLayout">
          <div>
            <div className="eyebrow">{a.eyebrow}</div>
            <h1>{t.hero}</h1>
            <p className="lead">{t.lead}</p>
            <section className="heroCapabilities" aria-labelledby="asgold-what-does-title">
              <h2 id="asgold-what-does-title">{a.whatDoes}</h2>
              <button type="button" className="secondary heroVoiceShortcut" aria-controls="asgold-problem-navigator-react" onClick={startProblemVoice}>🎙 {problemUi.voice}</button>
              <div className="capGrid">{a.caps.map(([title,description])=><article className="capCard" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
            </section>
            <div className="actions">
              <a className="primary btn" href="#fallarten">{cd.chooseCase}</a>
              <button className="secondary btn" onClick={()=>setScreen('register')}>{t.freeCta}</button>
            </div>
            <p className="freeHint">✓ {cd.freeHint}</p>
            <a className="testerSafeLink" href={`/testen${contentLanguage==='de'?'':`?lang=${contentLanguage}`}`}>{testerLinkText[contentLanguage]||testerLinkText.de} →</a>
          </div>
          <aside className="heroOutcome" aria-label={cd.result}>
            <span className="modeBadge">{cd.result}</span>
            <ol>{cd.results.slice(0,3).map(item=><li key={item}>{item}</li>)}</ol>
          </aside>
        </div>
      </section>

      <section id="fallarten" className="caseDiscovery section">
        <div className="wrap">
          <div className="caseIntro"><div className="eyebrow">{cd.eyebrow}</div><h2>{cd.title}</h2><p className="lead">{cd.lead}</p></div>
          <div className="audienceStrip" aria-label={pa.label}><b>{pa.label}</b><div>{pa.items.map(item=><span key={item}>✓ {item}</span>)}</div></div>
          <div className="caseChooser" aria-label={cd.title}>
            {orderedPublicCases.map((item,index)=><button type="button" aria-pressed={activePublicCase.key===item.key} className={`caseChoice ${activePublicCase.key===item.key?'active':''}`} onClick={()=>setSelectedPublicCase(item.key)} key={item.key}><span>{String(index+1).padStart(2,'0')}</span><b>{item.title}</b><small>{item.short}</small></button>)}
          </div>
          <article className="caseResult" aria-live="polite">
            <div className="caseResultTitle"><span>{String(orderedPublicCases.findIndex(item=>item.key===activePublicCase.key)+1).padStart(2,'0')}</span><div><small>{cd.typical}</small><h3>{activePublicCase.title}</h3></div></div>
            <div className="caseResultGrid">
              <div><b>{cd.typical}</b><p>{activePublicCase.examples}</p></div>
              <div><b>{cd.support}</b><p>{activePublicCase.help}</p></div>
              <div className="caseDeliverables"><b>{cd.result}</b><ul>{cd.results.map(item=><li key={item}>✓ {item}</li>)}</ul></div>
            </div>
            <button className="primary btn" onClick={()=>setScreen('register')}>{cd.start}</button>
            <p className="scopeNote">{pa.scope}</p>
          </article>

          <div className="processBlock">
            <h3>{cd.stepsTitle}</h3>
            <div className="processSteps">{cd.steps.map(([number,title,description])=><article key={number}><span>{number}</span><div><b>{title}</b><p>{description}</p></div></article>)}</div>
          </div>
        </div>
      </section>

      <section className="transparencyHero">
        <div className="wrap">
          <div className="eyebrow">{tt.eyebrow}</div><h2>{tt.title}</h2><p className="lead">{tt.lead}</p>
          <details className="transparencyDetails">
            <summary>{cd.transparencyDetails}</summary>
            <div className="transparencyGrid">{tt.items.map(([h,d])=><article className="transparencyCard" key={h}><span className="checkMark">✓</span><div><h3>{h}</h3><p>{d}</p></div></article>)}</div>
          </details>
        </div>
      </section>

      <section id="preise" className="section alt">
        <div className="wrap">
          <div className="eyebrow">{a.pricingEyebrow}</div><h2>{a.pricingTitle}</h2><p className="lead pricingLead">{a.pricingLead}</p>
          <div className="levelGuide"><div><h3>{jl.choose}</h3><p>{jl.chooseLead}</p></div><div className="levelScale"><span>{jl.less}</span><div className="levelTrack">{localizedPlans.map(p=><a key={p.key} href={`#plan-${p.key}`} title={p.stage}>{p.level}</a>)}</div><span>{jl.more}</span></div></div>
          <div className="publicRecommendation"><div><h3>{rt.title}</h3><p>{rt.lead}</p></div><select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}}><option value="" disabled>{rt.chooseGoal}</option>{rt.goals.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{showRecommendation&&<div className="recommendationResult"><div><span className="tierBadge">{rt.recommended}</span><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{recommendedTier==='free'?rt.freeNote:recommendedPlan.expectation}</p></div><a className="secondary btn" href={`#plan-${recommendedTier}`}>{rt.showBenefit}</a></div>}</div>
          <div className="prices">{localizedPlans.map(p=><article id={`plan-${p.key}`} className={`priceCard tier-${p.level}`} key={p.name}><div className="tierBadge">{p.stage}</div><h3 className="tierHeadline">{p.headline}</h3><div className="priceHead"><span>{p.name}</span><strong>{eur(p.price)}<small>{p.key==='free'?period.once:period.d30}</small></strong></div><div className="journeyBox"><div><b>{jl.knowledge}</b><p>{p.knowledge}</p></div><div><b>{jl.expectation}</b><p>{p.expectation}</p></div></div><p className="planAudience"><b>{a.suitable}</b> {p.audience}</p><div className="planDetail"><b>{a.whatDone}</b><p>{p.checks}</p></div><div className="planDetail"><b>{a.yourResult}</b><p>{p.result}</p></div><div className="planDetail excluded"><b>{a.notIncluded}</b><p>{p.excluded}</p></div><button className="secondary btn full" onClick={()=>setScreen('register')}>{p.key==='free'?a.registerFree:a.testRegister}</button></article>)}</div>
          <div className="termPublic"><h3>{a.longTerms}</h3><div className="publicTermGrid">{terms.map(term=><div className="publicTerm" key={term.months}><b>{monthsLabel(term.months)}</b><span>{term.discount?a.discount.replace('{discount}',term.discount):a.noDiscount}</span></div>)}</div><p>{a.termInfo}</p></div>
          <div className="priceTransparency"><h3>{a.noSubscription}</h3><p>{a.renewInfo}</p><p>{a.upgradeFair}</p><p>{a.pauseInfo}</p><p className="testNotice"><b>{a.currentTest}</b> {a.currentTestInfo}</p></div>
        </div>
      </section>
    </main>
    <LegalFooter language={contentLanguage}/>
  </>
  }
}
