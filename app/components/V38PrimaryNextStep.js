'use client'

import { useEffect } from 'react'

const labels={
  de:{title:'Ihr nächster Schritt',why:'Warum jetzt?',when:'Wann?',fallback:'Fallangaben und Unterlagen prüfen.',today:'Jetzt / heute',soon:'Zeitnah',normal:'Als Nächstes',missing:'Zuerst fehlende Unterlagen oder Informationen ergänzen.',deadline:'Die Frist hat Vorrang vor nachgeordneten Arbeitsschritten.',assessment:'Die dokumentierte Bewertung enthält einen konkreten Folgeschritt.',case:'Dieser Schritt ist im Fall als nächste Aktion hinterlegt.',uncertain:'Die Datenlage reicht noch nicht für eine belastbare Handlungsempfehlung.'},
  en:{title:'Your next step',why:'Why now?',when:'When?',fallback:'Review the case details and documents.',today:'Now / today',soon:'Soon',normal:'Next',missing:'First add missing documents or information.',deadline:'The deadline takes priority over lower-priority work.',assessment:'The documented assessment contains a concrete follow-up step.',case:'This step is stored as the next action in the case.',uncertain:'There is not enough reliable information for a firm recommendation yet.'},
  fr:{title:'Votre prochaine étape',why:'Pourquoi maintenant ?',when:'Quand ?',fallback:'Vérifier les informations du dossier et les documents.',today:'Maintenant / aujourd’hui',soon:'Rapidement',normal:'Ensuite',missing:'Compléter d’abord les documents ou informations manquants.',deadline:'Le délai est prioritaire sur les tâches secondaires.',assessment:'L’évaluation documentée contient une étape suivante concrète.',case:'Cette étape est enregistrée comme prochaine action du dossier.',uncertain:'Les informations ne suffisent pas encore pour une recommandation fiable.'},
  tr:{title:'Sonraki adımınız',why:'Neden şimdi?',when:'Ne zaman?',fallback:'Dosya bilgilerini ve belgeleri kontrol edin.',today:'Şimdi / bugün',soon:'Yakında',normal:'Sıradaki',missing:'Önce eksik belge veya bilgileri tamamlayın.',deadline:'Süre, ikincil işlerden önce gelir.',assessment:'Belgelenmiş değerlendirmede somut bir sonraki adım var.',case:'Bu adım dosyada sonraki işlem olarak kayıtlıdır.',uncertain:'Güvenilir bir öneri için bilgi henüz yeterli değil.'},
  pl:{title:'Twój następny krok',why:'Dlaczego teraz?',when:'Kiedy?',fallback:'Sprawdź dane sprawy i dokumenty.',today:'Teraz / dziś',soon:'Wkrótce',normal:'Następnie',missing:'Najpierw uzupełnij brakujące dokumenty lub informacje.',deadline:'Termin ma pierwszeństwo przed mniej pilnymi czynnościami.',assessment:'Udokumentowana ocena zawiera konkretny kolejny krok.',case:'Ten krok jest zapisany w sprawie jako następna czynność.',uncertain:'Brakuje jeszcze wystarczającej podstawy do pewnej rekomendacji.'},
  ru:{title:'Ваш следующий шаг',why:'Почему сейчас?',when:'Когда?',fallback:'Проверьте данные дела и документы.',today:'Сейчас / сегодня',soon:'В ближайшее время',normal:'Далее',missing:'Сначала дополните недостающие документы или сведения.',deadline:'Срок имеет приоритет над второстепенными действиями.',assessment:'В документированной оценке указан конкретный следующий шаг.',case:'Этот шаг сохранён в деле как следующее действие.',uncertain:'Данных пока недостаточно для надёжной рекомендации.'},
  ar:{title:'خطوتك التالية',why:'لماذا الآن؟',when:'متى؟',fallback:'راجع بيانات الحالة والمستندات.',today:'الآن / اليوم',soon:'قريبًا',normal:'التالي',missing:'أكمل أولًا المستندات أو المعلومات الناقصة.',deadline:'الموعد النهائي له الأولوية على الخطوات الأقل إلحاحًا.',assessment:'التقييم الموثق يتضمن خطوة متابعة واضحة.',case:'هذه الخطوة مسجلة في الحالة كالإجراء التالي.',uncertain:'المعلومات الحالية لا تكفي بعد لتوصية موثوقة.'},
  fa:{title:'گام بعدی شما',why:'چرا اکنون؟',when:'چه زمانی؟',fallback:'اطلاعات پرونده و مدارک را بررسی کنید.',today:'اکنون / امروز',soon:'به‌زودی',normal:'مرحله بعد',missing:'ابتدا مدارک یا اطلاعات ناقص را تکمیل کنید.',deadline:'مهلت بر کارهای کم‌اولویت‌تر مقدم است.',assessment:'ارزیابی ثبت‌شده یک گام بعدی مشخص دارد.',case:'این گام به‌عنوان اقدام بعدی پرونده ثبت شده است.',uncertain:'اطلاعات فعلی هنوز برای توصیه قابل اتکا کافی نیست.'},
  ro:{title:'Următorul pas',why:'De ce acum?',when:'Când?',fallback:'Verificați datele cazului și documentele.',today:'Acum / astăzi',soon:'În curând',normal:'În continuare',missing:'Completați mai întâi documentele sau informațiile lipsă.',deadline:'Termenul are prioritate față de activitățile secundare.',assessment:'Evaluarea documentată conține un pas următor concret.',case:'Acest pas este salvat în caz ca următoarea acțiune.',uncertain:'Informațiile nu sunt încă suficiente pentru o recomandare sigură.'},
  bg:{title:'Следващата ви стъпка',why:'Защо сега?',when:'Кога?',fallback:'Проверете данните по случая и документите.',today:'Сега / днес',soon:'Скоро',normal:'Следващо',missing:'Първо допълнете липсващите документи или информация.',deadline:'Срокът има предимство пред по-маловажните действия.',assessment:'Документираната оценка съдържа конкретна следваща стъпка.',case:'Тази стъпка е записана в случая като следващо действие.',uncertain:'Информацията все още не е достатъчна за надеждна препоръка.'}
}
const languageByName={Deutsch:'de',English:'en','Français':'fr','Türkçe':'tr',Polski:'pl','Русский':'ru','العربية':'ar','فارسی':'fa','Română':'ro','Български':'bg'}
function language(){return languageByName[document.querySelector('.flagLanguageTrigger strong')?.textContent?.trim()]||'de'}
function text(el){return el?.textContent?.trim()||''}
function choose(lang){
  const t=labels[lang]||labels.de
  const readiness=document.querySelector('.readinessCard')
  if(readiness?.classList.contains('attentionBox')) return {action:t.missing,when:t.today,why:t.uncertain,kind:'missing'}
  const deadline=document.querySelector('[data-v38-deadline-card="true"]')
  if(deadline){
    const strong=text(deadline.querySelector('.detailCardHead strong')).toLowerCase()
    const action=[...deadline.querySelectorAll('p')].find(p=>text(p.querySelector('b')).includes((labels[lang]||labels.de).action))
    const actionText=text(action).replace(/^.*?:\s*/,'')
    if(/sofort|act now|immédiatement|hemen|natychmiast|немедленно|فور|imediat|веднага|abgelaufen|passed|dépassé|geçmiş|upł|ист|انقض|گذشته|depășit|изтек/i.test(strong)) return {action:actionText||t.fallback,when:t.today,why:t.deadline,kind:'deadline'}
    if(/hohe|high|élevée|yüksek|wysoki|высок|عالية|بالا|ridicată|висок/i.test(strong)) return {action:actionText||t.fallback,when:t.soon,why:t.deadline,kind:'deadline'}
  }
  const assessments=[...document.querySelectorAll('.assessment')]
  const prioritized=assessments.find(a=>a.classList.contains('red'))||assessments.find(a=>a.classList.contains('yellow'))||assessments[0]
  if(prioritized){
    const small=text(prioritized.querySelector('small'))
    const next=small.includes(':')?small.slice(small.indexOf(':')+1).trim():small
    if(next&&next!=='—') return {action:next,when:prioritized.classList.contains('red')?t.today:t.soon,why:t.assessment,kind:'assessment'}
  }
  const grid=document.querySelector('.caseCoreGrid')
  const caseNext=text(grid?.querySelectorAll(':scope > article')[3]?.querySelector('p'))
  if(caseNext&&caseNext!=='—') return {action:caseNext,when:t.normal,why:t.case,kind:'case'}
  return {action:t.fallback,when:t.normal,why:t.uncertain,kind:'uncertain'}
}
function card(result,lang){
  const t=labels[lang]||labels.de
  const el=document.createElement('section')
  el.className='detailCard v38PrimaryNextStep'
  el.dataset.v38PrimaryNextStep='true'
  el.style.border='2px solid #b89242'
  el.style.background='linear-gradient(135deg,#fffaf0,#fff)'
  el.innerHTML=`<div class="detailCardHead"><div><span class="modeBadge">V38</span><h3 style="margin:.55rem 0 .2rem">${t.title}</h3></div><strong>1</strong></div><p style="font-size:1.16rem;font-weight:900;line-height:1.45;margin:.8rem 0">${result.action}</p><p><b>${t.when}</b> ${result.when}</p><p><b>${t.why}</b> ${result.why}</p>`
  return el
}
export function V38PrimaryNextStep(){
  useEffect(()=>{
    let signature=''
    function render(){
      const grid=document.querySelector('.caseCoreGrid')
      if(!grid){document.querySelector('[data-v38-primary-next-step="true"]')?.remove();signature='';return}
      const lang=language();const result=choose(lang);const nextSig=`${lang}|${result.kind}|${result.action}|${result.when}`
      if(nextSig===signature&&document.querySelector('[data-v38-primary-next-step="true"]')) return
      document.querySelector('[data-v38-primary-next-step="true"]')?.remove()
      const deadline=document.querySelector('[data-v38-deadline-card="true"]')
      const anchor=deadline||grid
      anchor.insertAdjacentElement('afterend',card(result,lang));signature=nextSig
    }
    render();const observer=new MutationObserver(render);observer.observe(document.body,{subtree:true,childList:true,characterData:true});return()=>observer.disconnect()
  },[])
  return null
}
