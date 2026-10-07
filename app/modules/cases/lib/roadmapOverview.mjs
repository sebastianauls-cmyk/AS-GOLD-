import {roadmapSteps} from '../../../../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapUi} from './customerRoadmapCopy.mjs'
import {roadmapCurrentCopy,roadmapCurrentStatus} from './roadmapCurrentStatus.mjs'

const keys=['title','red','yellow','green','white','next','deadline','noDate','details','asOf']
const rows={
  de:['Ihr Fall auf einen Blick','Rot · Dringende Schritte','Gelb · Offen oder zu klären','Grün · Erledigt und bestätigt','Grau · Grundlage noch zu prüfen','Die nächsten Schritte','Nächster belegter Termin','Kein konkreter Termin hinterlegt; mögliche Fristen bleiben zu klären.','Die vollständige Erklärung mit allen Schritten, Berechnungen und Belegen folgt ab der nächsten Seite.','Stand'],
  en:['Your case at a glance','Red · Urgent steps','Yellow · Open or to be clarified','Green · Completed and confirmed','Grey · Basis still to be checked','Next steps','Next documented date','No specific date recorded; possible deadlines still need clarification.','The full explanation with all steps, calculations and evidence starts on the next page.','As of'],
  fr:['Votre dossier en bref','Rouge · Étapes urgentes','Jaune · Ouvert ou à clarifier','Vert · Terminé et confirmé','Gris · Bases à vérifier','Prochaines étapes','Prochaine date documentée','Aucune date précise enregistrée ; les délais éventuels restent à clarifier.','Les explications complètes, les étapes, les calculs et les justificatifs commencent à la page suivante.','Au'],
  tr:['Dosyanıza genel bakış','Kırmızı · Acil adımlar','Sarı · Açık veya netleştirilecek','Yeşil · Tamamlandı ve onaylandı','Gri · Dayanak kontrol edilmeli','Sonraki adımlar','Belgelenmiş sonraki tarih','Belirli bir tarih kayıtlı değil; olası süreler hâlâ netleştirilmeli.','Tüm adımlar, hesaplamalar ve kanıtları içeren açıklama sonraki sayfada başlar.','Tarih'],
  pl:['Twoja sprawa w skrócie','Czerwony · Pilne kroki','Żółty · Otwarte lub do wyjaśnienia','Zielony · Wykonane i potwierdzone','Szary · Podstawa do sprawdzenia','Następne kroki','Najbliższa udokumentowana data','Nie zapisano konkretnej daty; możliwe terminy wymagają wyjaśnienia.','Pełne wyjaśnienie ze wszystkimi krokami, obliczeniami i dowodami zaczyna się na następnej stronie.','Stan na'],
  ru:['Ваше дело кратко','Красный · Срочные шаги','Жёлтый · Открыто или требует уточнения','Зелёный · Выполнено и подтверждено','Серый · Основания требуют проверки','Следующие шаги','Ближайшая подтверждённая дата','Конкретная дата не указана; возможные сроки ещё нужно уточнить.','Полное объяснение со всеми шагами, расчётами и подтверждениями начинается на следующей странице.','По состоянию на'],
  ar:['قضيتك في لمحة','أحمر · خطوات عاجلة','أصفر · مفتوح أو يحتاج إلى توضيح','أخضر · منجز ومؤكد','رمادي · الأساس يحتاج إلى مراجعة','الخطوات التالية','الموعد الموثق التالي','لم يُسجل موعد محدد؛ لا تزال المهل المحتملة بحاجة إلى توضيح.','يبدأ الشرح الكامل مع جميع الخطوات والحسابات والأدلة في الصفحة التالية.','الحالة بتاريخ'],
  fa:['پرونده شما در یک نگاه','قرمز · گام‌های فوری','زرد · باز یا نیازمند روشن‌سازی','سبز · انجام‌شده و تأییدشده','خاکستری · مبنا نیازمند بررسی','گام‌های بعدی','موعد مستند بعدی','تاریخ مشخصی ثبت نشده است؛ مهلت‌های احتمالی هنوز باید روشن شوند.','شرح کامل همراه با همه گام‌ها، محاسبات و مدارک از صفحه بعد آغاز می‌شود.','وضعیت در تاریخ'],
  ro:['Cazul dumneavoastră pe scurt','Roșu · Pași urgenți','Galben · Deschis sau de clarificat','Verde · Finalizat și confirmat','Gri · Baza trebuie verificată','Pașii următori','Următoarea dată documentată','Nu este înregistrată o dată concretă; eventualele termene trebuie clarificate.','Explicația completă cu toți pașii, calculele și dovezile începe pe pagina următoare.','Situația la'],
  bg:['Вашият случай накратко','Червено · Спешни стъпки','Жълто · Отворено или за изясняване','Зелено · Изпълнено и потвърдено','Сиво · Основанието е за проверка','Следващи стъпки','Следваща документирана дата','Няма записана конкретна дата; възможните срокове остават за изясняване.','Пълното обяснение с всички стъпки, изчисления и доказателства започва на следващата страница.','Към'],
  vi:['Tổng quan hồ sơ của bạn','Đỏ · Các bước khẩn cấp','Vàng · Còn mở hoặc cần làm rõ','Xanh · Đã hoàn thành và xác nhận','Xám · Cần kiểm tra căn cứ','Các bước tiếp theo','Ngày được ghi nhận tiếp theo','Chưa ghi nhận ngày cụ thể; các thời hạn có thể có vẫn cần được làm rõ.','Phần giải thích đầy đủ cùng mọi bước, phép tính và bằng chứng bắt đầu từ trang tiếp theo.','Tính đến']
}
export function roadmapOverviewCopy(language='de') {
  return Object.fromEntries(keys.map((key,index)=>[key,(rows[language]||rows.de)[index]]))
}

// This is a reading aid over the reviewed result and confirmed progress, not
// another model assessment. Never shorten source sentences or infer completion.
export function roadmapOverviewBlocks(record,{today=new Date().toISOString().slice(0,10),stale=false}={}) {
  const language=record.output_language,copy=roadmapOverviewCopy(language),ui=roadmapUi(language)
  const currentCopy=roadmapCurrentCopy(language),current=roadmapCurrentStatus(record,{today,stale})
  const steps=roadmapSteps(record,{today,stale}),blocks=[]
  const date=value=>new Intl.DateTimeFormat(language||'de',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'))
  const add=(text,kind='body',light=null)=>blocks.push({text,kind,light,compact:true})
  add(copy.title,'title')
  add(record.result.title,'heading')
  add(`${copy.asOf} ${date(today)} · ${ui.draft}`,'meta')
  for(const light of ['red','yellow','green','white']) {
    const count=steps.filter(step=>step.light===light).length
    if(light!=='white'||count)add(`${copy[light]}: ${count}`,'heading',light)
  }
  if(stale)add(ui.stale,'body','white')
  add(currentCopy.original,'heading')
  add(record.result.opening)
  for(const point of record.result.key_points)add(point,'bullet')
  add(copy.next,'heading')
  const next=stale?[]:steps.filter(step=>!step.done&&!step.blocked)
    .sort((a,b)=>Number(b.light==='red')-Number(a.light==='red')||Number(a.phase==='waiting')-Number(b.phase==='waiting')).slice(0,3)
  for(const step of next) {
    const index=steps.findIndex(entry=>entry.id===step.id)+1
    add(`${index}. ${step.title} · ${ui.owner}: ${step.owner}${step.phase==='waiting'?' · '+ui.waiting:''}`)
  }
  if(!next.length)add(current.next)
  const dated=steps.filter(step=>!step.done&&step.deadline?.date).sort((a,b)=>a.deadline.date.localeCompare(b.deadline.date))
  add(copy.deadline,'heading')
  add(dated.length?`${date(dated[0].deadline.date)} · ${dated[0].title}`:copy.noDate)
  add(copy.details,'meta')
  return blocks
}
