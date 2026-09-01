'use client'

import { useEffect } from 'react'
import { analyzeDeadlines } from '../lib/v38DeadlineIntelligence.mjs'

const labels={
  de:{title:'Fristen-Warnung',none:'Keine sichere Frist',basis:'Grundlage',caseBasis:'Im Fall hinterlegte Frist',documentBasis:'Expliziter Fristbezug im Dokument',documentMixedBasis:'Fristbezug erkannt – möglichen Terminbezug zusätzlich prüfen',consequence:'Mögliche Folge',action:'Jetzt tun',verify:'Fristgrundlage und Originaldokument prüfen.',immediate:'Sofort handeln',high:'Hohe Priorität',normal:'Vormerken',overdue:'Frist möglicherweise abgelaufen',uncertain:'Nicht sicher ableitbar',cOverdue:'Die Frist scheint bereits abgelaufen. Mögliche Rechtsfolgen müssen anhand des konkreten Vorgangs geprüft werden.',cImmediate:'Sehr kurzfristiger Handlungsbedarf. Mögliche Versäumnisfolgen müssen am konkreten Vorgang geprüft werden.',cHigh:'Zeitnah handeln und die Fristgrundlage prüfen. Mögliche Versäumnisfolgen hängen vom Vorgang ab.',cNormal:'Frist vormerken und rechtzeitig Grundlage sowie mögliche Folgen prüfen.',cUncertain:'Keine Rechtsfolge wird behauptet, solange die Fristgrundlage nicht verifiziert ist.'},
  en:{title:'Deadline warning',none:'No reliable deadline',basis:'Basis',caseBasis:'Deadline stored in the case',documentBasis:'Explicit deadline context in the document',documentMixedBasis:'Deadline context detected — also verify possible appointment context',consequence:'Possible consequence',action:'Do now',verify:'Verify the deadline basis and original document.',immediate:'Act now',high:'High priority',normal:'Schedule',overdue:'Deadline may have passed',uncertain:'Not reliably derivable',cOverdue:'The deadline appears to have passed. Possible legal consequences must be checked against the specific matter.',cImmediate:'Very short-term action is required. Possible consequences of missing the deadline must be checked for the specific matter.',cHigh:'Act promptly and verify the deadline basis. Possible consequences depend on the specific matter.',cNormal:'Record the deadline and verify its basis and possible consequences in good time.',cUncertain:'No legal consequence is asserted until the deadline basis has been verified.'},
  fr:{title:'Alerte de délai',none:'Aucun délai fiable',basis:'Base',caseBasis:'Délai enregistré dans le dossier',documentBasis:'Contexte de délai explicite dans le document',documentMixedBasis:'Contexte de délai détecté — vérifier aussi un éventuel contexte de rendez-vous',consequence:'Conséquence possible',action:'À faire maintenant',verify:'Vérifier la base du délai et le document original.',immediate:'Agir immédiatement',high:'Priorité élevée',normal:'À planifier',overdue:'Délai peut-être dépassé',uncertain:'Non déterminable avec certitude',cOverdue:'Le délai semble déjà dépassé. Les conséquences juridiques éventuelles doivent être vérifiées selon le dossier concret.',cImmediate:'Une action très rapide est nécessaire. Les conséquences d’un dépassement doivent être vérifiées selon le dossier.',cHigh:'Agir rapidement et vérifier la base du délai. Les conséquences éventuelles dépendent du dossier.',cNormal:'Noter le délai et vérifier à temps sa base ainsi que les conséquences possibles.',cUncertain:'Aucune conséquence juridique n’est affirmée tant que la base du délai n’est pas vérifiée.'},
  tr:{title:'Süre uyarısı',none:'Güvenilir süre yok',basis:'Dayanak',caseBasis:'Dosyada kayıtlı süre',documentBasis:'Belgede açık süre bağlamı',documentMixedBasis:'Süre bağlamı algılandı — olası randevu bağlamını da kontrol edin',consequence:'Olası sonuç',action:'Şimdi yapılacak',verify:'Süre dayanağını ve orijinal belgeyi kontrol edin.',immediate:'Hemen harekete geçin',high:'Yüksek öncelik',normal:'Planlayın',overdue:'Süre geçmiş olabilir',uncertain:'Güvenilir şekilde çıkarılamıyor',cOverdue:'Süre geçmiş görünüyor. Olası hukuki sonuçlar somut dosyaya göre kontrol edilmelidir.',cImmediate:'Çok kısa sürede hareket etmek gerekir. Sürenin kaçırılmasının olası sonuçları somut dosyaya göre kontrol edilmelidir.',cHigh:'Zamanında harekete geçin ve süre dayanağını doğrulayın. Olası sonuçlar dosyaya bağlıdır.',cNormal:'Süreyi kaydedin ve dayanağı ile olası sonuçları zamanında kontrol edin.',cUncertain:'Süre dayanağı doğrulanana kadar herhangi bir hukuki sonuç ileri sürülmez.'},
  pl:{title:'Ostrzeżenie o terminie',none:'Brak pewnego terminu',basis:'Podstawa',caseBasis:'Termin zapisany w sprawie',documentBasis:'Wyraźny kontekst terminu w dokumencie',documentMixedBasis:'Wykryto kontekst terminu — sprawdź też możliwy kontekst spotkania',consequence:'Możliwy skutek',action:'Co zrobić teraz',verify:'Sprawdź podstawę terminu i dokument źródłowy.',immediate:'Działaj natychmiast',high:'Wysoki priorytet',normal:'Zaplanuj',overdue:'Termin mógł upłynąć',uncertain:'Nie można ustalić pewnie',cOverdue:'Termin prawdopodobnie już upłynął. Ewentualne skutki prawne trzeba sprawdzić w konkretnej sprawie.',cImmediate:'Wymagane jest bardzo szybkie działanie. Skutki niedotrzymania terminu trzeba sprawdzić dla konkretnej sprawy.',cHigh:'Działaj szybko i sprawdź podstawę terminu. Możliwe skutki zależą od konkretnej sprawy.',cNormal:'Zapisz termin i odpowiednio wcześnie sprawdź jego podstawę oraz możliwe skutki.',cUncertain:'Nie stwierdza się żadnego skutku prawnego, dopóki podstawa terminu nie zostanie zweryfikowana.'},
  ru:{title:'Предупреждение о сроке',none:'Надёжный срок не установлен',basis:'Основание',caseBasis:'Срок, сохранённый в деле',documentBasis:'Явный контекст срока в документе',documentMixedBasis:'Обнаружен контекст срока — дополнительно проверьте возможный контекст встречи',consequence:'Возможное последствие',action:'Что сделать сейчас',verify:'Проверьте основание срока и оригинал документа.',immediate:'Действовать немедленно',high:'Высокий приоритет',normal:'Запланировать',overdue:'Срок мог истечь',uncertain:'Нельзя определить надёжно',cOverdue:'Срок, по-видимому, уже истёк. Возможные правовые последствия необходимо проверить применительно к конкретному делу.',cImmediate:'Требуется очень быстрое действие. Возможные последствия пропуска срока нужно проверить по конкретному делу.',cHigh:'Действуйте своевременно и проверьте основание срока. Возможные последствия зависят от конкретного дела.',cNormal:'Зафиксируйте срок и своевременно проверьте его основание и возможные последствия.',cUncertain:'До проверки основания срока никакие правовые последствия не утверждаются.'},
  ar:{title:'تنبيه الموعد النهائي',none:'لا يوجد موعد موثوق',basis:'الأساس',caseBasis:'مهلة مسجلة في الحالة',documentBasis:'سياق صريح لمهلة في المستند',documentMixedBasis:'تم رصد سياق مهلة — تحقّق أيضًا من احتمال كونه موعدًا للاجتماع',consequence:'النتيجة المحتملة',action:'ما يجب فعله الآن',verify:'تحقق من أساس الموعد والمستند الأصلي.',immediate:'تصرف فورًا',high:'أولوية عالية',normal:'جدولة',overdue:'قد يكون الموعد قد انقضى',uncertain:'لا يمكن تحديده بثقة',cOverdue:'يبدو أن المهلة قد انقضت. يجب التحقق من الآثار القانونية المحتملة وفق الحالة المحددة.',cImmediate:'يلزم التحرك خلال وقت قصير جدًا. يجب التحقق من آثار تفويت المهلة وفق الحالة المحددة.',cHigh:'تحرك في الوقت المناسب وتحقق من أساس المهلة. تعتمد الآثار المحتملة على الحالة.',cNormal:'سجّل المهلة وتحقق في الوقت المناسب من أساسها والآثار المحتملة.',cUncertain:'لا يتم الجزم بأي أثر قانوني قبل التحقق من أساس المهلة.'},
  fa:{title:'هشدار مهلت',none:'مهلت قابل اتکایی یافت نشد',basis:'مبنای تشخیص',caseBasis:'مهلت ثبت‌شده در پرونده',documentBasis:'زمینه صریح مهلت در سند',documentMixedBasis:'زمینه مهلت تشخیص داده شد — احتمال ارتباط با وقت ملاقات نیز بررسی شود',consequence:'پیامد احتمالی',action:'اقدام فعلی',verify:'مبنای مهلت و سند اصلی را بررسی کنید.',immediate:'فوراً اقدام کنید',high:'اولویت بالا',normal:'برنامه‌ریزی کنید',overdue:'ممکن است مهلت گذشته باشد',uncertain:'با اطمینان قابل تشخیص نیست',cOverdue:'به نظر می‌رسد مهلت گذشته است. پیامدهای حقوقی احتمالی باید بر اساس پرونده مشخص بررسی شوند.',cImmediate:'اقدام بسیار سریع لازم است. پیامدهای احتمالی از دست دادن مهلت باید برای پرونده مشخص بررسی شوند.',cHigh:'به‌موقع اقدام کنید و مبنای مهلت را بررسی کنید. پیامدهای احتمالی به پرونده بستگی دارد.',cNormal:'مهلت را ثبت کنید و مبنا و پیامدهای احتمالی آن را به‌موقع بررسی کنید.',cUncertain:'تا زمانی که مبنای مهلت تأیید نشده، هیچ پیامد حقوقی قطعی اعلام نمی‌شود.'},
  ro:{title:'Avertizare termen',none:'Niciun termen sigur',basis:'Bază',caseBasis:'Termen salvat în caz',documentBasis:'Context explicit de termen în document',documentMixedBasis:'Context de termen detectat — verificați și un posibil context de întâlnire',consequence:'Consecință posibilă',action:'Ce trebuie făcut acum',verify:'Verificați baza termenului și documentul original.',immediate:'Acționați imediat',high:'Prioritate ridicată',normal:'Planificați',overdue:'Termenul poate fi depășit',uncertain:'Nu poate fi stabilit sigur',cOverdue:'Termenul pare deja depășit. Posibilele consecințe juridice trebuie verificate pentru cazul concret.',cImmediate:'Este necesară o acțiune foarte rapidă. Posibilele efecte ale depășirii termenului trebuie verificate pentru cazul concret.',cHigh:'Acționați prompt și verificați baza termenului. Posibilele consecințe depind de caz.',cNormal:'Notați termenul și verificați din timp baza și posibilele consecințe.',cUncertain:'Nu se afirmă nicio consecință juridică până când baza termenului nu este verificată.'},
  bg:{title:'Предупреждение за срок',none:'Няма сигурен срок',basis:'Основание',caseBasis:'Срок, записан по случая',documentBasis:'Ясен контекст за срок в документа',documentMixedBasis:'Открит е контекст за срок — проверете и евентуален контекст на среща',consequence:'Възможна последица',action:'Какво да направите сега',verify:'Проверете основанието за срока и оригиналния документ.',immediate:'Действайте веднага',high:'Висок приоритет',normal:'Планирайте',overdue:'Срокът може да е изтекъл',uncertain:'Не може да се установи надеждно',cOverdue:'Срокът изглежда вече е изтекъл. Възможните правни последици трябва да се проверят според конкретния случай.',cImmediate:'Необходимо е много бързо действие. Възможните последици от пропускане на срока трябва да се проверят за конкретния случай.',cHigh:'Действайте своевременно и проверете основанието на срока. Възможните последици зависят от случая.',cNormal:'Отбележете срока и навреме проверете основанието и възможните последици.',cUncertain:'Не се твърди правна последица, докато основанието на срока не бъде проверено.'},
  vi:{title:'Cảnh báo thời hạn',none:'Không có thời hạn đáng tin cậy',basis:'Cơ sở',caseBasis:'Thời hạn được lưu trong hồ sơ',documentBasis:'Ngữ cảnh thời hạn rõ ràng trong tài liệu',documentMixedBasis:'Đã nhận diện ngữ cảnh thời hạn — cũng hãy kiểm tra xem có phải lịch hẹn hay không',consequence:'Hệ quả có thể xảy ra',action:'Việc cần làm ngay',verify:'Kiểm tra cơ sở thời hạn và tài liệu gốc.',immediate:'Hành động ngay',high:'Ưu tiên cao',normal:'Lên kế hoạch',overdue:'Thời hạn có thể đã qua',uncertain:'Không thể xác định đáng tin cậy',cOverdue:'Thời hạn có vẻ đã qua. Hệ quả pháp lý có thể xảy ra phải được kiểm tra theo từng trường hợp.',cImmediate:'Cần hành động rất nhanh. Hệ quả của việc bỏ lỡ thời hạn phải được kiểm tra theo từng trường hợp.',cHigh:'Hãy hành động kịp thời và kiểm tra cơ sở thời hạn. Hệ quả có thể xảy ra phụ thuộc vào hồ sơ.',cNormal:'Ghi lại thời hạn và kiểm tra kịp thời cơ sở cùng hệ quả có thể xảy ra.',cUncertain:'Không khẳng định hệ quả pháp lý trước khi cơ sở thời hạn được kiểm tra.'}
}

const languageByName={Deutsch:'de',English:'en','Français':'fr','Türkçe':'tr',Polski:'pl','Русский':'ru','العربية':'ar','فارسی':'fa','Română':'ro','Български':'bg'}

function detectLanguage(){
  const active=document.querySelector('.flagLanguageTrigger strong,.flagLanguagePublicPicker button strong')?.textContent?.trim()
  return languageByName[active]||'de'
}

function readCaseDeadline(){
  const grid=document.querySelector('.caseCoreGrid')
  if(!grid) return ''
  const cards=[...grid.querySelectorAll(':scope > article')]
  return cards[2]?.querySelector('p')?.textContent?.trim()||''
}

function readDocumentText(){
  const field=document.querySelector('.documentReviewForm textarea[id$="-extracted"],textarea[id*="extracted"]')
  return field?.value?.trim()||''
}

function consequenceText(result,t){
  if(result.status==='overdue') return t.cOverdue
  if(result.status==='immediate') return t.cImmediate
  if(result.status==='high') return t.cHigh
  if(result.status==='normal') return t.cNormal
  return t.cUncertain
}

function basisText(primary,t){
  if(!primary) return t.none
  if(primary.source==='case') return t.caseBasis
  return primary.confidence==='medium'?t.documentMixedBasis:t.documentBasis
}

function buildCard(result,lang,mode){
  const t=labels[lang]||labels.de
  const card=document.createElement('section')
  card.className='detailCard v38DeadlineWarningCard'
  card.setAttribute('data-v38-deadline-card','true')
  card.setAttribute('data-v38-deadline-mode',mode)
  card.style.borderWidth='2px'
  card.style.marginTop='14px'
  const status=t[result.status]||t.uncertain
  const primary=result.primary
  const deadlineText=primary?new Date(`${primary.date}T12:00:00Z`).toLocaleDateString(lang==='de'?'de-DE':undefined,{timeZone:'UTC'}):t.none
  card.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V38</span><h3 style="margin:.55rem 0 .2rem">${t.title}</h3></div><strong>${status}</strong></div><p style="font-size:1.1rem;font-weight:800;margin:.65rem 0">${deadlineText}</p><p><b>${t.basis}:</b> ${basisText(primary,t)}</p><p><b>${t.consequence}:</b> ${consequenceText(result,t)}</p><p><b>${t.action}:</b> ${t.verify}</p>`
  return card
}

export function V38DeadlineCardEnhancer(){
  useEffect(()=>{
    let lastSignature=''
    function render(){
      const grid=document.querySelector('.caseCoreGrid')
      const documentHead=document.querySelector('.documentReviewHead')
      if(!grid&&!documentHead){document.querySelector('[data-v38-deadline-card="true"]')?.remove();lastSignature='';return}
      const lang=detectLanguage()
      const mode=grid?'case':'document'
      const rawCase=grid?readCaseDeadline():''
      const rawText=!grid?readDocumentText():''
      const signature=`${mode}|${rawCase}|${rawText}|${lang}`
      if(signature===lastSignature&&document.querySelector('[data-v38-deadline-card="true"]')) return
      document.querySelector('[data-v38-deadline-card="true"]')?.remove()
      const result=analyzeDeadlines({caseDeadline:rawCase&&rawCase!=='—'?rawCase:'',text:rawText})
      const card=buildCard(result,lang,mode)
      if(grid) grid.insertAdjacentElement('afterend',card)
      else documentHead.insertAdjacentElement('afterend',card)
      lastSignature=signature
    }
    render()
    const observer=new MutationObserver(()=>render())
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value']})
    document.addEventListener('input',render)
    return ()=>{observer.disconnect();document.removeEventListener('input',render)}
  },[])
  return null
}
