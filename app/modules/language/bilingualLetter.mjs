import { normalizeOutputLanguage, outputLanguageLabels } from './outputLanguage.js'

export const BILINGUAL_LETTER_SEPARATOR='\n\n────────────────────────\n\n'

export function bilingualLetterLabels(outputLanguage='de'){
  const language=normalizeOutputLanguage(outputLanguage)
  return {
    language,
    german:'VERSANDFASSUNG – DEUTSCH',
    customer:`KUNDENFASSUNG / ÜBERSETZUNG – ${outputLanguageLabels[language]||outputLanguageLabels.de}`
  }
}

function clean(value){ return String(value||'').trim() }

export function bilingualLetterStatus(document={},requestedOutputLanguage){
  const requested=normalizeOutputLanguage(requestedOutputLanguage||document.customer_copy_language||'de')
  const stored=document.customer_copy_language?normalizeOutputLanguage(document.customer_copy_language):null
  const german=clean(document.response_letter_de)
  const customer=clean(document.customer_copy)
  return {
    complete:Boolean(german&&customer&&stored),
    language:stored||requested,
    matchesRequestedLanguage:Boolean(stored&&stored===requested),
    german,
    customer
  }
}

export function composeBilingualLetter(document={},outputLanguage){
  const status=bilingualLetterStatus(document,outputLanguage)
  const labels=bilingualLetterLabels(status.language)
  return [
    status.german?`${labels.german}\n${status.german}`:'',
    status.customer?`${labels.customer}\n${status.customer}`:''
  ].filter(Boolean).join(BILINGUAL_LETTER_SEPARATOR)
}

export function isCompleteBilingualLetterBody(body='',outputLanguage='de'){
  const text=clean(body)
  const labels=bilingualLetterLabels(outputLanguage)
  const germanStart=text.indexOf(labels.german)
  const customerStart=text.indexOf(labels.customer)
  if(germanStart<0||customerStart<=germanStart) return false
  const german=text.slice(germanStart+labels.german.length,customerStart).replace(/[─\s]+$/u,'').trim()
  const customer=text.slice(customerStart+labels.customer.length).trim()
  return Boolean(german&&customer)
}

const ui={
  de:{german:'Versandfertiger Entwurf – Deutsch',customer:'Kundenfassung / Übersetzung',language:'Sprache der Kundenfassung',choose:'Sprache wählen',note:'Beide Fassungen müssen vor der Freigabe vollständig geprüft werden.'},
  en:{german:'Ready-to-send draft – German',customer:'Customer copy / translation',language:'Customer-copy language',choose:'Choose language',note:'Both versions must be fully reviewed before approval.'},
  fr:{german:'Projet prêt à envoyer – allemand',customer:'Copie client / traduction',language:'Langue de la copie client',choose:'Choisir la langue',note:'Les deux versions doivent être entièrement vérifiées avant approbation.'},
  tr:{german:'Gönderime hazır taslak – Almanca',customer:'Müşteri nüshası / çeviri',language:'Müşteri nüshasının dili',choose:'Dil seçin',note:'Onaydan önce her iki metin de tamamen kontrol edilmelidir.'},
  pl:{german:'Projekt gotowy do wysłania – niemiecki',customer:'Kopia dla klienta / tłumaczenie',language:'Język kopii dla klienta',choose:'Wybierz język',note:'Przed zatwierdzeniem należy dokładnie sprawdzić obie wersje.'},
  ru:{german:'Готовый к отправке проект – немецкий',customer:'Копия для клиента / перевод',language:'Язык копии для клиента',choose:'Выберите язык',note:'Перед согласованием необходимо полностью проверить обе версии.'},
  ar:{german:'مسودة جاهزة للإرسال – بالألمانية',customer:'نسخة العميل / الترجمة',language:'لغة نسخة العميل',choose:'اختر اللغة',note:'يجب مراجعة النسختين بالكامل قبل الموافقة.'},
  fa:{german:'پیش‌نویس آماده ارسال – آلمانی',customer:'نسخه مشتری / ترجمه',language:'زبان نسخه مشتری',choose:'زبان را انتخاب کنید',note:'هر دو نسخه باید پیش از تأیید به‌طور کامل بررسی شوند.'},
  ro:{german:'Proiect gata de expediere – germană',customer:'Copie pentru client / traducere',language:'Limba copiei pentru client',choose:'Alegeți limba',note:'Ambele versiuni trebuie verificate integral înainte de aprobare.'},
  bg:{german:'Готов проект за изпращане – немски',customer:'Копие за клиента / превод',language:'Език на копието за клиента',choose:'Изберете език',note:'И двете версии трябва да бъдат проверени изцяло преди одобрение.'},
  vi:{german:'Bản dự thảo sẵn sàng gửi – tiếng Đức',customer:'Bản dành cho khách hàng / bản dịch',language:'Ngôn ngữ bản dành cho khách hàng',choose:'Chọn ngôn ngữ',note:'Cả hai bản phải được kiểm tra đầy đủ trước khi phê duyệt.'}
}

export function bilingualLetterUi(language='de'){ return ui[language]||ui.de }
