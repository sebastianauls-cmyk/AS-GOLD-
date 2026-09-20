import {roadmapSteps} from '../../../../supabase/functions/_shared/customerRoadmap.mjs'
import {roadmapUi} from './customerRoadmapCopy.mjs'
import {roadmapStepReference,readableStepText} from './roadmapDisplay.mjs'

const keys=['current','confirmed','original','completed','observe','refresh','blocked','open','waitingAdvice']
const rows={
  de:['Aktueller Bearbeitungsstand','Bestätigte Schritte','Einordnung bei Erstellung','Alle Schritte als erledigt bestätigt.','Belege aufbewahren. Neue Unterlagen zum Fall hinzufügen und den Fahrplan erneut prüfen.','Neue oder geänderte Unterlagen vollständig einlesen und den Fahrplan neu erstellen.','Zuerst die erforderlichen Voraussetzungen prüfen.','Diesen Schritt öffnen','Eingehende Antworten zum Fall hinzufügen und anschließend prüfen.'],
  en:['Current progress','Confirmed steps','Assessment when created','All steps confirmed complete.','Keep the evidence. Add new documents to the case and review the roadmap again.','Read all new or changed documents in full and create a new roadmap.','Check the required prerequisites first.','Open this step','Add incoming replies to the case, then review them.'],
  fr:['Avancement actuel','Étapes confirmées','Analyse lors de la création','Toutes les étapes sont confirmées comme terminées.','Conservez les justificatifs. Ajoutez les nouveaux documents au dossier et réexaminez le plan.','Lisez intégralement les documents nouveaux ou modifiés et créez un nouveau plan.','Vérifiez d’abord les prérequis nécessaires.','Ouvrir cette étape','Ajoutez les réponses reçues au dossier, puis vérifiez-les.'],
  tr:['Güncel ilerleme','Onaylanan adımlar','Oluşturulma anındaki değerlendirme','Tüm adımların tamamlandığı onaylandı.','Kanıtları saklayın. Yeni belgeleri dosyaya ekleyin ve yol haritasını yeniden inceleyin.','Yeni veya değişen belgeleri tamamen okuyun ve yeni bir yol haritası oluşturun.','Önce gerekli ön koşulları kontrol edin.','Bu adımı aç','Gelen yanıtları dosyaya ekleyin, ardından kontrol edin.'],
  pl:['Aktualny postęp','Potwierdzone kroki','Ocena w chwili utworzenia','Potwierdzono wykonanie wszystkich kroków.','Zachowaj dowody. Dodaj nowe dokumenty do sprawy i ponownie sprawdź plan.','Odczytaj w całości nowe lub zmienione dokumenty i utwórz nowy plan.','Najpierw sprawdź wymagane warunki wstępne.','Otwórz ten krok','Dodaj otrzymane odpowiedzi do sprawy, a następnie je sprawdź.'],
  ru:['Текущий ход работы','Подтверждённые шаги','Оценка на момент создания','Выполнение всех шагов подтверждено.','Сохраните подтверждающие документы. Добавьте новые материалы в дело и проверьте план заново.','Полностью прочитайте новые или изменённые документы и создайте новый план.','Сначала проверьте необходимые предварительные условия.','Открыть этот шаг','Добавьте полученные ответы в дело, затем проверьте их.'],
  ar:['التقدم الحالي','الخطوات المؤكدة','التقييم عند الإنشاء','تم تأكيد إنجاز جميع الخطوات.','احتفظ بالأدلة. أضف المستندات الجديدة إلى الملف وراجع الخطة مجدداً.','اقرأ المستندات الجديدة أو المعدلة كاملة وأنشئ خطة جديدة.','تحقق أولاً من المتطلبات السابقة اللازمة.','فتح هذه الخطوة','أضف الردود الواردة إلى الملف ثم راجعها.'],
  fa:['پیشرفت فعلی','گام‌های تأییدشده','ارزیابی هنگام ایجاد','انجام همه گام‌ها تأیید شده است.','مدارک را نگه دارید. اسناد جدید را به پرونده اضافه کنید و برنامه را دوباره بررسی کنید.','اسناد جدید یا تغییریافته را کامل بخوانید و برنامه تازه‌ای ایجاد کنید.','ابتدا پیش‌نیازهای لازم را بررسی کنید.','باز کردن این گام','پاسخ‌های دریافتی را به پرونده اضافه کنید و سپس بررسی کنید.'],
  ro:['Progresul actual','Pași confirmați','Evaluarea la creare','Toți pașii sunt confirmați ca finalizați.','Păstrați dovezile. Adăugați documentele noi la dosar și verificați din nou planul.','Citiți integral documentele noi sau modificate și creați un plan nou.','Verificați mai întâi condițiile prealabile necesare.','Deschide acest pas','Adăugați răspunsurile primite la dosar, apoi verificați-le.'],
  bg:['Текущ напредък','Потвърдени стъпки','Оценка при създаването','Всички стъпки са потвърдени като изпълнени.','Запазете доказателствата. Добавете новите документи към случая и проверете плана отново.','Прочетете изцяло новите или променените документи и създайте нов план.','Първо проверете необходимите предварителни условия.','Отвори тази стъпка','Добавете получените отговори към случая и след това ги проверете.'],
  vi:['Tiến độ hiện tại','Các bước đã xác nhận','Đánh giá lúc tạo','Tất cả các bước đã được xác nhận hoàn thành.','Lưu giữ bằng chứng. Thêm tài liệu mới vào hồ sơ và kiểm tra lại lộ trình.','Đọc đầy đủ tài liệu mới hoặc đã thay đổi và tạo lộ trình mới.','Trước tiên hãy kiểm tra các điều kiện cần thiết.','Mở bước này','Thêm phản hồi nhận được vào hồ sơ rồi kiểm tra.']
}
export function roadmapCurrentCopy(language='de') {
  return Object.fromEntries(keys.map((key,index)=>[key,(rows[language]||rows.de)[index]]))
}

// Derive navigation from confirmed progress, never by rewriting the reviewed
// assessment, its evidence or its letters. UI and exports use the same result.
export function roadmapCurrentStatus(record,{stale=false,today}={}) {
  const ui=roadmapUi(record.output_language),copy=roadmapCurrentCopy(record.output_language)
  const steps=roadmapSteps(record,{stale,today})
  const completed=steps.filter(step=>step.done).length
  const historical=stale||Object.keys(record.progress||{}).length>0||(record.events||[]).length>0
  const result={completed,total:steps.length,historical,step:null}
  if(stale)return {...result,state:'stale',light:'white',label:ui.sourceChanged,next:ui.stale,action:copy.refresh}
  if(steps.length&&completed===steps.length)return {...result,state:'completed',light:'green',label:ui.green,next:copy.completed,action:copy.observe}
  // Unfinished prerequisites can never become the suggested action. Prefer
  // urgent work, then ready actions before waiting; keep the reviewed order
  // within those groups. Do not infer that a reply arrived from elapsed time.
  const available=steps.filter(step=>!step.done&&!step.blocked)
    .sort((a,b)=>Number(b.light==='red')-Number(a.light==='red')||Number(a.phase==='waiting')-Number(b.phase==='waiting'))
  const step=available[0]
  if(!step)return {...result,state:'blocked',light:'white',label:ui.white,next:ui.blocked,action:copy.blocked}
  const waiting=step.phase==='waiting'
  const action=waiting?[
    step.waiting_for&&`${ui.waitFor}: ${step.waiting_for}`,
    step.follow_up?`${ui.followUp}: ${step.follow_up}`:copy.waitingAdvice
  ].filter(Boolean).join('\n'):step.action
  return {...result,step,state:waiting?'waiting':'ready',light:step.light,label:waiting?ui.waiting:ui[step.light],
    next:roadmapStepReference(step.id,steps),action:readableStepText(action,steps,record.result.letters)}
}
