import assert from 'node:assert/strict'
import { recommendProblem } from '../app/modules/public/problemRecommendationV74.mjs'
import { getProblemLanguageProfile } from '../app/modules/public/problemNavigatorLanguagesV36.mjs'
import { supportedLanguages, rtlLanguages } from '../app/modules/language/v36Languages.mjs'
import { OUTPUT_LANGUAGES } from '../app/modules/language/outputLanguage.js'

const levels=['start','klar','analyse','komplett','business']
const expectedLanguages=['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi']

const matrix={
  de:[
    ['Eine Rechnung enthält eine doppelte Position. Ich habe den Beleg und möchte eine kurze Antwort vorbereiten.','start','contract'],
    ['Zu einer Rechnung kam eine Mahnung mit Frist. Der Liefernachweis fehlt und ich brauche den nächsten Schritt.','klar','contract'],
    ['Zu einer Rechnung gibt es eine Bonitätsmeldung, eine gekürzte Kreditlinie und widersprüchliche Unterlagen. Das erfordert eine Risikobewertung.','analyse','contract'],
    ['Nach einem Betriebsausfall lehnt die Versicherung ab. Ich brauche eine vollständige Fallakte und mehrere vorbereitete Schreiben.','komplett','insurance'],
    ['Unser Team verwaltet mehrere Kunden und Fälle mit Rollen, Rechten, Freigaben und Audit-Protokoll.','business','business']
  ],
  en:[
    ['An invoice contains a duplicate item. I have the receipt and want to prepare a short reply.','start','contract'],
    ['A dunning notice sets a deadline. The delivery document is missing and I need the next step.','klar','contract'],
    ['An invoice led to a credit report, a reduced credit line and contradictory documents. This requires a risk assessment.','analyse','contract'],
    ['After a business interruption the insurance was denied. I need a complete case file and multiple prepared letters.','komplett','insurance'],
    ['Our team manages multiple clients and cases with roles, rights, approvals and an audit log.','business','business']
  ],
  fr:[
    ['Une facture contient un poste en double. J’ai le justificatif et je souhaite préparer une réponse courte.','start','contract'],
    ['Une mise en demeure fixe un délai. Un document manque et j’ai besoin de la prochaine étape.','klar','contract'],
    ['Une facture a entraîné un signalement de solvabilité, une ligne de crédit réduite et des documents contradictoires. Une évaluation des risques est nécessaire.','analyse','contract'],
    ['Après une interruption d’activité, l’assurance refuse. Je veux un dossier complet et plusieurs courriers préparés.','komplett','insurance'],
    ['Notre équipe gère plusieurs clients et dossiers avec rôles, validations et journal d’audit.','business','business']
  ],
  tr:[
    ['Bir faturada aynı kalem iki kez yer alıyor. Belge bende ve kısa bir yanıt hazırlamak istiyorum.','start','contract'],
    ['Fatura için ihtar ve bir süre geldi. Eksik belgeyi ve sonraki adımı bilmek istiyorum.','klar','contract'],
    ['Bir fatura nedeniyle kredi notu, düşürülen kredi limiti ve çelişkili belgeler oluştu. Ayrıntılı risk değerlendirmesi gerekiyor.','analyse','contract'],
    ['İşletme kesintisinden sonra sigorta reddetti. Dosyanın tamamı ve birden fazla yazı hazırlanmalı.','komplett','insurance'],
    ['Ekibimiz birden fazla müşteri ve dosyayı roller, haklar, onaylar ve denetim kaydıyla yönetiyor.','business','business']
  ],
  pl:[
    ['Faktura zawiera podwójną pozycję. Mam dokument i chcę przygotować krótką odpowiedź.','start','contract'],
    ['Do faktury przyszło wezwanie do zapłaty z terminem. Brakuje dokumentu i potrzebuję kolejnego kroku.','klar','contract'],
    ['Faktura spowodowała informację kredytową, obniżoną linię kredytową i sprzeczne dokumenty. Potrzebna jest ocena ryzyka.','analyse','contract'],
    ['Po przerwie w działalności ubezpieczyciel odmówił. Potrzebuję pełnej dokumentacji i wielu przygotowanych pism.','komplett','insurance'],
    ['Zespół obsługuje wielu klientów i wiele spraw z rolami, uprawnieniami, akceptacjami i dziennikiem audytu.','business','business']
  ],
  ru:[
    ['В счете дважды указана одна позиция. У меня есть документ, и я хочу подготовить краткий ответ.','start','contract'],
    ['По счету пришло требование об оплате со сроком. Документа не хватает, нужен следующий шаг.','klar','contract'],
    ['Счет привел к кредитному рейтингу, сокращенной кредитной линии и противоречивым документам. Нужна оценка рисков.','analyse','contract'],
    ['После остановки деятельности страховая отказала. Нужны полное дело и несколько подготовленных писем.','komplett','insurance'],
    ['Команда ведет несколько клиентов и дел с ролями, правами, согласованиями и журналом аудита.','business','business']
  ],
  ar:[
    ['تحتوي الفاتورة على بند مكرر. لدي المستند وأريد إعداد رد قصير.','start','contract'],
    ['وصل إنذار بالدفع مع موعد نهائي. هناك مستندات مفقودة وأحتاج إلى الخطوة التالية.','klar','contract'],
    ['أدت فاتورة إلى التصنيف الائتماني وحد ائتمان منخفض ومستندات متناقضة. يلزم تقييم المخاطر.','analyse','contract'],
    ['بعد توقف العمل رفض التأمين. أحتاج إلى ملف كامل ورسائل متعددة جاهزة.','komplett','insurance'],
    ['يدير فريقنا عدة عملاء وقضايا مع الأدوار والحقوق والموافقات وسجل تدقيق.','business','business']
  ],
  fa:[
    ['یک فاکتور دارای یک مورد تکراری است. مدرک را دارم و می‌خواهم پاسخ کوتاهی آماده کنم.','start','contract'],
    ['برای فاکتور اخطار پرداخت با مهلت آمده است. مدارک ناقص است و گام بعدی را می‌خواهم.','klar','contract'],
    ['یک فاکتور باعث اعتبارسنجی، خط اعتباری کاهش‌یافته و اسناد متناقض شده است. ارزیابی ریسک لازم است.','analyse','contract'],
    ['پس از توقف کسب و کار، بیمه رد کرد. به پرونده کامل و نامه‌های متعدد آماده نیاز دارم.','komplett','insurance'],
    ['تیم ما چند مشتری و پرونده را با نقش‌ها، حقوق دسترسی، تأییدها و گزارش ممیزی مدیریت می‌کند.','business','business']
  ],
  ro:[
    ['O factură conține o poziție dublă. Am documentul și vreau să pregătesc un răspuns scurt.','start','contract'],
    ['A sosit o somație de plată cu termen. Lipsește un document și am nevoie de pasul următor.','klar','contract'],
    ['O factură a dus la un raport de credit, o linie de credit redusă și documente contradictorii. Este necesară evaluarea riscului.','analyse','contract'],
    ['După întreruperea activității, asigurarea a refuzat. Am nevoie de un dosar complet și mai multe scrisori pregătite.','komplett','insurance'],
    ['Echipa gestionează mai mulți clienți și mai multe cazuri cu roluri, drepturi, aprobări și jurnal de audit.','business','business']
  ],
  bg:[
    ['Една фактура съдържа дублирана позиция. Имам документа и искам да подготвя кратък отговор.','start','contract'],
    ['Има покана за плащане със срок. Липсва документ и ми трябва следващата стъпка.','klar','contract'],
    ['Една фактура доведе до кредитен рейтинг, намалена кредитна линия и противоречиви документи. Нужна е оценка на риска.','analyse','contract'],
    ['След прекъсване на дейността застрахователят отказа. Нужни са пълно досие и няколко подготвени писма.','komplett','insurance'],
    ['Екипът управлява няколко клиента и случая с роли, права, одобрения и одитен дневник.','business','business']
  ],
  vi:[
    ['Một hóa đơn có một mục bị lặp. Tôi có chứng từ và muốn chuẩn bị câu trả lời ngắn.','start','contract'],
    ['Có thư nhắc nợ với thời hạn. Tài liệu còn thiếu và tôi cần biết bước tiếp theo.','klar','contract'],
    ['Một hóa đơn dẫn đến xếp hạng tín dụng, hạn mức tín dụng bị giảm và tài liệu mâu thuẫn. Cần đánh giá rủi ro.','analyse','contract'],
    ['Sau gián đoạn kinh doanh, bảo hiểm từ chối. Tôi cần hồ sơ đầy đủ và nhiều thư đã chuẩn bị.','komplett','insurance'],
    ['Đội nhóm quản lý nhiều khách hàng và hồ sơ với vai trò, quyền, phê duyệt và nhật ký kiểm toán.','business','business']
  ]
}

assert.deepEqual(supportedLanguages.map(item=>item.key),expectedLanguages)
assert.deepEqual(OUTPUT_LANGUAGES,expectedLanguages)
assert.deepEqual([...rtlLanguages].sort(),['ar','fa'])

let total=0
const failures=[]
for(const language of expectedLanguages){
  const profile=getProblemLanguageProfile(language)
  assert.equal(matrix[language]?.length,levels.length,`${language}: five Min-to-Max cases required`)
  for(const [index,[text,planKey,caseKey]] of matrix[language].entries()){
    const actual=recommendProblem(text,profile)
    if(actual.planKey!==planKey) failures.push(`${language}/${levels[index]}: level ${actual.planKey} instead of ${planKey}`)
    if(actual.caseKey!==caseKey) failures.push(`${language}/${levels[index]}: case ${actual.caseKey} instead of ${caseKey}`)
    if(actual.reason!==profile.reasons[planKey]) failures.push(`${language}/${levels[index]}: reason is not localized`)
    total+=1
  }
}

assert.equal(total,55)
assert.deepEqual(failures,[],failures.join('\n'))
console.log(`V75 language Min-to-Max matrix passed: ${total}/55 recommendations across 11 languages and five levels.`)
