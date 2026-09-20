const guest={
 de:'Der Gasttest erlaubt höchstens {limit} Dokumente. Das ist ein Testlimit, kein Hinweis auf ein höheres Produkt. Du kannst mit den vorhandenen Dokumenten weiterarbeiten.',
 en:'The guest test allows up to {limit} documents. This is a test limit, not a request to upgrade. You can continue with the existing documents.',
 fr:'Le test invité permet {limit} documents. Cette limite de test ne demande pas de changer de produit. Continuez avec les documents existants.',
 tr:'Misafir testi en fazla {limit} belgeye izin verir. Bu bir test sınırıdır, yükseltme talebi değildir. Mevcut belgelerle devam edebilirsiniz.',
 pl:'Test gościa pozwala na {limit} dokumenty. To limit testu, nie prośba o zmianę produktu. Możesz pracować na istniejących dokumentach.',
 ru:'Гостевой тест допускает до {limit} документов. Это ограничение теста, а не предложение повысить тариф. Продолжайте с имеющимися документами.',
 ar:'يسمح اختبار الضيف بحد أقصى {limit} مستندات. هذا حد للاختبار وليس طلب ترقية. يمكنك متابعة العمل بالمستندات الحالية.',
 fa:'آزمایش مهمان حداکثر {limit} سند را می‌پذیرد. این محدودیت آزمایش است، نه درخواست ارتقا. با اسناد موجود ادامه دهید.',
 ro:'Testul pentru oaspeți permite {limit} documente. Este o limită de test, nu o cerere de upgrade. Continuați cu documentele existente.',
 bg:'Тестът за гости допуска до {limit} документа. Това е тестово ограничение, не искане за надграждане. Продължете със съществуващите документи.',
 vi:'Bản thử khách cho phép tối đa {limit} tài liệu. Đây là giới hạn thử nghiệm, không phải yêu cầu nâng cấp. Bạn có thể tiếp tục với tài liệu hiện có.'
}
export function documentLimitMessage(access,language,limit,fallback){
 const isGuest=!!access?.permissions?.guest_access_ends_at
 return (isGuest?(guest[language]||guest.de):fallback).replace('{limit}',limit)
}
