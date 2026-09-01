'use client'

import { useEffect } from 'react'

const copies={
  de:{why:'Warum?',basis:'Grundlage',uncertainty:'Unsicherheit',missing:'Fehlende Informationen',uncertaintyText:'Unsicherheit wurde in dieser Bewertung noch nicht separat dokumentiert. Prüfen Sie, ob neue oder widersprüchliche Unterlagen vorliegen.',missingText:'Noch nicht separat erfasst. Vor einer endgültigen Entscheidung prüfen, ob Unterlagen oder Angaben fehlen.'},
  en:{why:'Why?',basis:'Basis',uncertainty:'Uncertainty',missing:'Missing information',uncertaintyText:'Uncertainty has not yet been recorded separately for this assessment. Check for new or conflicting documents.',missingText:'Not recorded separately yet. Before a final decision, check whether documents or information are missing.'},
  fr:{why:'Pourquoi ?',basis:'Fondement',uncertainty:'Incertitude',missing:'Informations manquantes',uncertaintyText:'L’incertitude n’est pas encore documentée séparément pour cette évaluation. Vérifiez les documents nouveaux ou contradictoires.',missingText:'Pas encore saisi séparément. Avant une décision finale, vérifiez si des documents ou informations manquent.'},
  tr:{why:'Neden?',basis:'Dayanak',uncertainty:'Belirsizlik',missing:'Eksik bilgiler',uncertaintyText:'Bu değerlendirme için belirsizlik henüz ayrı olarak kaydedilmedi. Yeni veya çelişkili belgeleri kontrol edin.',missingText:'Henüz ayrı kaydedilmedi. Nihai karardan önce eksik belge veya bilgi olup olmadığını kontrol edin.'},
  pl:{why:'Dlaczego?',basis:'Podstawa',uncertainty:'Niepewność',missing:'Brakujące informacje',uncertaintyText:'Niepewność nie została jeszcze osobno udokumentowana. Sprawdź nowe lub sprzeczne dokumenty.',missingText:'Nie zapisano jeszcze osobno. Przed ostateczną decyzją sprawdź, czy brakuje dokumentów lub informacji.'},
  ru:{why:'Почему?',basis:'Основание',uncertainty:'Неопределённость',missing:'Недостающие сведения',uncertaintyText:'Неопределённость по этой оценке пока отдельно не зафиксирована. Проверьте новые или противоречивые документы.',missingText:'Пока отдельно не зафиксировано. Перед окончательным решением проверьте, не отсутствуют ли документы или сведения.'},
  ar:{why:'لماذا؟',basis:'الأساس',uncertainty:'عدم اليقين',missing:'المعلومات الناقصة',uncertaintyText:'لم يتم توثيق عدم اليقين بشكل منفصل لهذه المراجعة بعد. تحقّق من المستندات الجديدة أو المتعارضة.',missingText:'لم تُسجل بشكل منفصل بعد. قبل القرار النهائي تحقّق من وجود مستندات أو معلومات ناقصة.'},
  fa:{why:'چرا؟',basis:'مبنای ارزیابی',uncertainty:'عدم قطعیت',missing:'اطلاعات ناقص',uncertaintyText:'عدم قطعیت این ارزیابی هنوز جداگانه ثبت نشده است. اسناد جدید یا متناقض را بررسی کنید.',missingText:'هنوز جداگانه ثبت نشده است. پیش از تصمیم نهایی بررسی کنید آیا سند یا اطلاعاتی کم است.'},
  ro:{why:'De ce?',basis:'Bază',uncertainty:'Incertitudine',missing:'Informații lipsă',uncertaintyText:'Incertitudinea nu a fost încă documentată separat pentru această evaluare. Verificați documentele noi sau contradictorii.',missingText:'Nu este încă înregistrat separat. Înainte de o decizie finală, verificați dacă lipsesc documente sau informații.'},
  bg:{why:'Защо?',basis:'Основание',uncertainty:'Несигурност',missing:'Липсваща информация',uncertaintyText:'Несигурността за тази оценка все още не е документирана отделно. Проверете за нови или противоречиви документи.',missingText:'Все още не е записано отделно. Преди окончателно решение проверете дали липсват документи или информация.'},
  vi:{why:'Tại sao?',basis:'Cơ sở',uncertainty:'Điểm chưa chắc chắn',missing:'Thông tin còn thiếu',uncertaintyText:'Mức độ chưa chắc chắn của đánh giá này chưa được ghi riêng. Hãy kiểm tra tài liệu mới hoặc mâu thuẫn.',missingText:'Chưa được ghi riêng. Trước quyết định cuối cùng, hãy kiểm tra tài liệu hoặc thông tin còn thiếu.'}
}

const labels={Deutsch:'de',English:'en','Français':'fr','Türkçe':'tr',Polski:'pl','Русский':'ru','العربية':'ar','فارسی':'fa','Română':'ro','Български':'bg'}

function currentLanguage(){
  const trigger=document.querySelector('.flagLanguageTrigger strong,.flagLanguagePublicPicker button strong')
  return labels[trigger?.textContent?.trim()]||'de'
}

function decorate(){
  const c=copies[currentLanguage()]||copies.de
  document.querySelectorAll('.assessmentList .assessment').forEach(card=>{
    if(card.dataset.v38Explainability==='1') return
    const reasoning=card.querySelector('p')?.textContent?.trim()||'—'
    const next=card.querySelector('small')?.textContent?.trim()||''
    const details=document.createElement('details')
    details.className='v38AssessmentWhy'
    details.style.cssText='margin-top:12px;padding-top:10px;border-top:1px solid rgba(90,90,90,.18)'
    const summary=document.createElement('summary')
    summary.textContent=c.why
    summary.style.cssText='cursor:pointer;font-weight:850;color:#72591d;list-style-position:inside'
    const body=document.createElement('div')
    body.style.cssText='display:grid;gap:8px;margin-top:10px;padding:10px;border-radius:12px;background:#faf8f1'
    const rows=[
      [c.basis,reasoning],
      [c.uncertainty,c.uncertaintyText],
      [c.missing,c.missingText]
    ]
    if(next) rows.push(['→',next])
    rows.forEach(([label,text])=>{
      const p=document.createElement('p')
      p.style.cssText='margin:0;line-height:1.45'
      const b=document.createElement('b')
      b.textContent=`${label}: `
      p.append(b,document.createTextNode(text))
      body.appendChild(p)
    })
    details.append(summary,body)
    card.appendChild(details)
    card.dataset.v38Explainability='1'
  })
}

export function V38AssessmentExplainability(){
  useEffect(()=>{
    decorate()
    const observer=new MutationObserver(()=>decorate())
    observer.observe(document.body,{childList:true,subtree:true})
    return ()=>observer.disconnect()
  },[])
  return null
}
