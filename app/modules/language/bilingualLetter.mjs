import { normalizeOutputLanguage, outputLanguageLabels } from './outputLanguage.js'

export const BILINGUAL_LETTER_SEPARATOR='\n\n────────────────────────\n\n'

function clean(value){ return String(value||'').trim() }

function requestedLanguages(value={}){
  if(typeof value==='string') return {customerLanguage:normalizeOutputLanguage(value)}
  return {
    referenceLanguage:value?.referenceLanguage?normalizeOutputLanguage(value.referenceLanguage):null,
    customerLanguage:value?.customerLanguage?normalizeOutputLanguage(value.customerLanguage):null
  }
}

export function bilingualLetterLabels(languages={}){
  const requested=requestedLanguages(languages)
  const referenceLanguage=requested.referenceLanguage||'de'
  const customerLanguage=requested.customerLanguage||referenceLanguage
  return {
    referenceLanguage,
    customerLanguage,
    reference:`REFERENZFASSUNG / REFERENCE VERSION – ${outputLanguageLabels[referenceLanguage]||outputLanguageLabels.de}`,
    customer:`KUNDENFASSUNG / CUSTOMER VERSION – ${outputLanguageLabels[customerLanguage]||outputLanguageLabels.de}`
  }
}

export function bilingualLetterStatus(document={},requested={}){
  const expected=requestedLanguages(requested)
  const legacyGerman=clean(document.response_letter_de)
  const reference=clean(document.reference_copy)||legacyGerman
  const referenceLanguage=document.reference_copy_language
    ?normalizeOutputLanguage(document.reference_copy_language)
    :legacyGerman?'de':expected.referenceLanguage
  const customer=clean(document.customer_copy)
  const customerLanguage=document.customer_copy_language
    ?normalizeOutputLanguage(document.customer_copy_language)
    :expected.customerLanguage
  const sameLanguage=Boolean(referenceLanguage&&customerLanguage&&referenceLanguage===customerLanguage)
  const matchesRequestedLanguages=Boolean(
    referenceLanguage&&customerLanguage&&
    (!expected.referenceLanguage||expected.referenceLanguage===referenceLanguage)&&
    (!expected.customerLanguage||expected.customerLanguage===customerLanguage)
  )
  return {
    complete:Boolean(reference&&referenceLanguage&&customerLanguage&&(sameLanguage||customer)),
    sameLanguage,
    languages:{reference:referenceLanguage||'de',customer:customerLanguage||referenceLanguage||'de'},
    matchesRequestedLanguages,
    matchesRequestedLanguage:matchesRequestedLanguages,
    reference,
    customer
  }
}

export function composeBilingualLetter(document={},languages={}){
  const status=bilingualLetterStatus(document,languages)
  const labels=bilingualLetterLabels({referenceLanguage:status.languages.reference,customerLanguage:status.languages.customer})
  const sections=[status.reference?`${labels.reference}\n${status.reference}`:'']
  if(!status.sameLanguage&&status.customer) sections.push(`${labels.customer}\n${status.customer}`)
  return sections.filter(Boolean).join(BILINGUAL_LETTER_SEPARATOR)
}

export function isCompleteBilingualLetterBody(body='',languages={}){
  const text=clean(body)
  const labels=bilingualLetterLabels(languages)
  const referenceStart=text.indexOf(labels.reference)
  if(referenceStart<0) return false
  if(labels.referenceLanguage===labels.customerLanguage){
    return Boolean(text.slice(referenceStart+labels.reference.length).trim())
  }
  const customerStart=text.indexOf(labels.customer)
  if(customerStart<=referenceStart) return false
  const reference=text.slice(referenceStart+labels.reference.length,customerStart).replace(/[─\s]+$/u,'').trim()
  const customer=text.slice(customerStart+labels.customer.length).trim()
  return Boolean(reference&&customer)
}

const ui={
  de:{reference:'Referenzfassung',customer:'Kundenfassung / Übersetzung',referenceLanguage:'Referenzsprache',customerLanguage:'Kundensprache',choose:'Sprache wählen',sameLanguage:'Sind beide Sprachen gleich, wird das Anschreiben nur einmal ausgegeben.',note:'Alle ausgegebenen Fassungen müssen vor der Freigabe vollständig geprüft werden.'},
  en:{reference:'Reference version',customer:'Customer version / translation',referenceLanguage:'Reference language',customerLanguage:'Customer language',choose:'Choose language',sameLanguage:'If both languages are the same, the letter is output only once.',note:'Every output version must be fully reviewed before approval.'},
  fr:{reference:'Version de référence',customer:'Version client / traduction',referenceLanguage:'Langue de référence',customerLanguage:'Langue du client',choose:'Choisir la langue',sameLanguage:'Si les deux langues sont identiques, le courrier n’est produit qu’une seule fois.',note:'Toutes les versions produites doivent être entièrement vérifiées avant approbation.'},
  tr:{reference:'Referans sürüm',customer:'Müşteri sürümü / çeviri',referenceLanguage:'Referans dili',customerLanguage:'Müşteri dili',choose:'Dil seçin',sameLanguage:'İki dil aynıysa yazı yalnızca bir kez oluşturulur.',note:'Oluşturulan tüm sürümler onaydan önce tamamen kontrol edilmelidir.'},
  pl:{reference:'Wersja referencyjna',customer:'Wersja dla klienta / tłumaczenie',referenceLanguage:'Język referencyjny',customerLanguage:'Język klienta',choose:'Wybierz język',sameLanguage:'Jeśli oba języki są takie same, pismo jest wyświetlane tylko raz.',note:'Przed zatwierdzeniem należy dokładnie sprawdzić wszystkie wersje.'},
  ru:{reference:'Эталонная версия',customer:'Версия для клиента / перевод',referenceLanguage:'Язык эталонной версии',customerLanguage:'Язык клиента',choose:'Выберите язык',sameLanguage:'Если языки совпадают, письмо выводится только один раз.',note:'Перед согласованием необходимо полностью проверить все версии.'},
  ar:{reference:'النسخة المرجعية',customer:'نسخة العميل / الترجمة',referenceLanguage:'اللغة المرجعية',customerLanguage:'لغة العميل',choose:'اختر اللغة',sameLanguage:'إذا كانت اللغتان متماثلتين، تُعرض الرسالة مرة واحدة فقط.',note:'يجب مراجعة جميع النسخ المعروضة بالكامل قبل الموافقة.'},
  fa:{reference:'نسخه مرجع',customer:'نسخه مشتری / ترجمه',referenceLanguage:'زبان مرجع',customerLanguage:'زبان مشتری',choose:'زبان را انتخاب کنید',sameLanguage:'اگر دو زبان یکسان باشند، نامه فقط یک بار نمایش داده می‌شود.',note:'همه نسخه‌های خروجی باید پیش از تأیید به‌طور کامل بررسی شوند.'},
  ro:{reference:'Versiune de referință',customer:'Versiune pentru client / traducere',referenceLanguage:'Limba de referință',customerLanguage:'Limba clientului',choose:'Alegeți limba',sameLanguage:'Dacă ambele limbi sunt identice, scrisoarea este afișată o singură dată.',note:'Toate versiunile generate trebuie verificate integral înainte de aprobare.'},
  bg:{reference:'Референтна версия',customer:'Версия за клиента / превод',referenceLanguage:'Референтен език',customerLanguage:'Език на клиента',choose:'Изберете език',sameLanguage:'Ако двата езика са еднакви, писмото се извежда само веднъж.',note:'Всички изведени версии трябва да бъдат проверени изцяло преди одобрение.'},
  vi:{reference:'Bản tham chiếu',customer:'Bản dành cho khách hàng / bản dịch',referenceLanguage:'Ngôn ngữ tham chiếu',customerLanguage:'Ngôn ngữ khách hàng',choose:'Chọn ngôn ngữ',sameLanguage:'Nếu hai ngôn ngữ giống nhau, thư chỉ được xuất một lần.',note:'Mọi phiên bản được xuất phải được kiểm tra đầy đủ trước khi phê duyệt.'}
}

export function bilingualLetterUi(language='de'){ return ui[language]||ui.de }
