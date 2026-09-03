export const PRODUCT_BRAND=Object.freeze({
  name:'AS Workspace Gold',
  workspace:'Workspace',
  edition:'Gold',
  descriptor:'Der digitale Fall- und Dokumentenmanager',
  promise:'Dokumente erfassen · Fälle analysieren · Fristen erkennen · Schreiben erstellen'
})

export const PRODUCT_DESCRIPTORS=Object.freeze({
  de:'Der digitale Fall- und Dokumentenmanager',
  en:'The digital case and document manager',
  fr:'Le gestionnaire numérique de dossiers et de documents',
  tr:'Dijital dosya ve belge yöneticisi',
  pl:'Cyfrowy menedżer spraw i dokumentów',
  ru:'Цифровой менеджер дел и документов',
  ar:'المدير الرقمي للقضايا والمستندات',
  fa:'مدیر دیجیتال پرونده‌ها و اسناد',
  ro:'Managerul digital de cazuri și documente',
  bg:'Дигиталният мениджър на случаи и документи',
  vi:'Trình quản lý hồ sơ và tài liệu số'
})

export const PRODUCT_NAME=PRODUCT_BRAND.name
export const PRODUCT_DESCRIPTOR=PRODUCT_BRAND.descriptor
export const PRODUCT_PROMISE=PRODUCT_BRAND.promise

export function productDescriptor(language='de'){
  return PRODUCT_DESCRIPTORS[language]||PRODUCT_DESCRIPTORS.de
}
