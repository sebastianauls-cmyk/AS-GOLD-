export const deadlineUi={
  de:{title:'Fristen & ungeklärte Termine',dated:'Feste Fristen',unresolved:'Fristen noch ungeklärt',noneDated:'Keine festen Fristen eingetragen.',noneUnresolved:'Keine ungeklärten Fristen.',button:'Fristen',datedShort:'terminiert',unresolvedShort:'ungeklärt',unresolvedBadge:'Frist ungeklärt'},
  en:{title:'Deadlines & unresolved dates',dated:'Confirmed deadlines',unresolved:'Deadlines still unresolved',noneDated:'No confirmed deadlines entered.',noneUnresolved:'No unresolved deadlines.',button:'Deadlines',datedShort:'dated',unresolvedShort:'unresolved',unresolvedBadge:'Deadline unresolved'},
  tr:{title:'Süreler ve belirsiz tarihler',dated:'Belirlenmiş süreler',unresolved:'Henüz belirsiz süreler',noneDated:'Belirlenmiş süre yok.',noneUnresolved:'Belirsiz süre yok.',button:'Süreler',datedShort:'tarihli',unresolvedShort:'belirsiz',unresolvedBadge:'Süre belirsiz'},
  pl:{title:'Terminy i niewyjaśnione daty',dated:'Ustalone terminy',unresolved:'Terminy nadal niewyjaśnione',noneDated:'Brak ustalonych terminów.',noneUnresolved:'Brak niewyjaśnionych terminów.',button:'Terminy',datedShort:'ustalone',unresolvedShort:'niewyjaśnione',unresolvedBadge:'Termin niewyjaśniony'},
  ru:{title:'Сроки и неуточнённые даты',dated:'Установленные сроки',unresolved:'Сроки ещё не уточнены',noneDated:'Установленных сроков нет.',noneUnresolved:'Неуточнённых сроков нет.',button:'Сроки',datedShort:'установлено',unresolvedShort:'не уточнено',unresolvedBadge:'Срок не уточнён'},
  ar:{title:'المواعيد والمواعيد غير المحسومة',dated:'مواعيد محددة',unresolved:'مواعيد لم تُحسم بعد',noneDated:'لا توجد مواعيد محددة.',noneUnresolved:'لا توجد مواعيد غير محسومة.',button:'المواعيد',datedShort:'محدد',unresolvedShort:'غير محسوم',unresolvedBadge:'الموعد غير محسوم'},
  fa:{title:'مهلت‌ها و تاریخ‌های نامشخص',dated:'مهلت‌های مشخص',unresolved:'مهلت‌های هنوز نامشخص',noneDated:'مهلت مشخصی ثبت نشده است.',noneUnresolved:'مهلت نامشخصی وجود ندارد.',button:'مهلت‌ها',datedShort:'مشخص',unresolvedShort:'نامشخص',unresolvedBadge:'مهلت نامشخص'},
  fr:{title:'Délais et dates non clarifiées',dated:'Délais confirmés',unresolved:'Délais encore non clarifiés',noneDated:'Aucun délai confirmé.',noneUnresolved:'Aucun délai non clarifié.',button:'Délais',datedShort:'datés',unresolvedShort:'non clarifiés',unresolvedBadge:'Délai non clarifié'},
  ro:{title:'Termene și date neclarificate',dated:'Termene stabilite',unresolved:'Termene încă neclarificate',noneDated:'Nu există termene stabilite.',noneUnresolved:'Nu există termene neclarificate.',button:'Termene',datedShort:'stabilite',unresolvedShort:'neclarificate',unresolvedBadge:'Termen neclarificat'},
  bg:{title:'Срокове и неизяснени дати',dated:'Определени срокове',unresolved:'Все още неизяснени срокове',noneDated:'Няма определени срокове.',noneUnresolved:'Няма неизяснени срокове.',button:'Срокове',datedShort:'определени',unresolvedShort:'неизяснени',unresolvedBadge:'Неизяснен срок'},
  vi:{title:'Thời hạn và ngày chưa rõ',dated:'Thời hạn đã xác định',unresolved:'Thời hạn vẫn chưa rõ',noneDated:'Chưa có thời hạn đã xác định.',noneUnresolved:'Không có thời hạn chưa rõ.',button:'Thời hạn',datedShort:'đã định',unresolvedShort:'chưa rõ',unresolvedBadge:'Thời hạn chưa rõ'}
}

export function getDeadlineUi(language='de'){
  return deadlineUi[language]||deadlineUi.de
}
