'use client'

import { useState } from 'react'
import { SYNTHETIC_TESTERS } from './syntheticTesterRegistry.mjs'

const COPY={
  de:{button:'Synthetische Tester',title:'12 erfundene Testfälle',lead:'Testen Sie AS Workspace Gold mit vollständig synthetischen Personen und realistischen Fällen.',close:'Schließen',start:'Testfall öffnen',language:'Sprache',home:'Heimatland',target:'Zielland',complexity:'Schwierigkeit',problem:'Problem',documents:'Dokumente',expected:'Erwartete Ampel',actions:'Erwartete nächste Schritte'},
  en:{button:'Synthetic testers',title:'12 fictional test cases',lead:'Test AS Workspace Gold with fully synthetic people and realistic cases.',close:'Close',start:'Open test case',language:'Language',home:'Home country',target:'Target country',complexity:'Complexity',problem:'Problem',documents:'Documents',expected:'Expected traffic light',actions:'Expected next steps'},
  fr:{button:'Testeurs synthétiques',title:'12 cas de test fictifs',lead:'Testez AS Workspace Gold avec des personnes entièrement fictives et des cas réalistes.',close:'Fermer',start:'Ouvrir le cas test',language:'Langue',home:'Pays d’origine',target:'Pays cible',complexity:'Complexité',problem:'Problème',documents:'Documents',expected:'Feu attendu',actions:'Étapes suivantes attendues'},
  tr:{button:'Sentetik test kullanıcıları',title:'12 kurgusal test vakası',lead:'AS Workspace Gold’u tamamen sentetik kişiler ve gerçekçi vakalarla test edin.',close:'Kapat',start:'Test vakasını aç',language:'Dil',home:'Ana ülke',target:'Hedef ülke',complexity:'Zorluk',problem:'Sorun',documents:'Belgeler',expected:'Beklenen trafik ışığı',actions:'Beklenen sonraki adımlar'},
  pl:{button:'Testerzy syntetyczni',title:'12 fikcyjnych przypadków testowych',lead:'Testuj AS Workspace Gold na całkowicie syntetycznych osobach i realistycznych sprawach.',close:'Zamknij',start:'Otwórz przypadek testowy',language:'Język',home:'Kraj ojczysty',target:'Kraj docelowy',complexity:'Trudność',problem:'Problem',documents:'Dokumenty',expected:'Oczekiwana sygnalizacja',actions:'Oczekiwane następne kroki'},
  ru:{button:'Синтетические тестеры',title:'12 вымышленных тестовых дел',lead:'Проверяйте AS Workspace Gold на полностью синтетических пользователях и реалистичных делах.',close:'Закрыть',start:'Открыть тестовое дело',language:'Язык',home:'Страна происхождения',target:'Целевая страна',complexity:'Сложность',problem:'Проблема',documents:'Документы',expected:'Ожидаемый светофор',actions:'Ожидаемые следующие шаги'},
  ar:{button:'مختبرون اصطناعيون',title:'12 حالة اختبار خيالية',lead:'اختبر AS Workspace Gold باستخدام أشخاص اصطناعيين بالكامل وحالات واقعية.',close:'إغلاق',start:'فتح حالة الاختبار',language:'اللغة',home:'بلد الأصل',target:'البلد المستهدف',complexity:'درجة الصعوبة',problem:'المشكلة',documents:'المستندات',expected:'إشارة المرور المتوقعة',actions:'الخطوات التالية المتوقعة'},
  fa:{button:'آزمایش‌کنندگان مصنوعی',title:'۱۲ پرونده آزمایشی ساختگی',lead:'AS Workspace Gold را با افراد کاملاً مصنوعی و پرونده‌های واقع‌گرایانه آزمایش کنید.',close:'بستن',start:'باز کردن پرونده آزمایشی',language:'زبان',home:'کشور مبدأ',target:'کشور مقصد',complexity:'پیچیدگی',problem:'مسئله',documents:'مدارک',expected:'چراغ مورد انتظار',actions:'گام‌های بعدی مورد انتظار'},
  ro:{button:'Testeri sintetici',title:'12 cazuri de test fictive',lead:'Testați AS Workspace Gold cu persoane complet sintetice și cazuri realiste.',close:'Închide',start:'Deschide cazul de test',language:'Limbă',home:'Țara de origine',target:'Țara țintă',complexity:'Complexitate',problem:'Problemă',documents:'Documente',expected:'Semafor așteptat',actions:'Pași următori așteptați'},
  bg:{button:'Синтетични тестери',title:'12 измислени тестови случая',lead:'Тествайте AS Workspace Gold с изцяло синтетични лица и реалистични случаи.',close:'Затвори',start:'Отвори тестовия случай',language:'Език',home:'Родна държава',target:'Целева държава',complexity:'Сложност',problem:'Проблем',documents:'Документи',expected:'Очакван светофар',actions:'Очаквани следващи стъпки'},
  vi:{button:'Người kiểm thử tổng hợp',title:'12 tình huống kiểm thử giả lập',lead:'Kiểm thử AS Workspace Gold bằng người dùng hoàn toàn giả lập và các tình huống thực tế.',close:'Đóng',start:'Mở tình huống kiểm thử',language:'Ngôn ngữ',home:'Quốc gia gốc',target:'Quốc gia đích',complexity:'Độ phức tạp',problem:'Vấn đề',documents:'Tài liệu',expected:'Đèn dự kiến',actions:'Các bước tiếp theo dự kiến'}
}

export function SyntheticTesterPanel({language='de',onOpenCase}){
  const [open,setOpen]=useState(false)
  const [selected,setSelected]=useState(null)
  const c=COPY[language]||COPY.de
  const rtl=language==='ar'||language==='fa'

  function openTester(tester){
    setSelected(tester)
    if(onOpenCase) onOpenCase(tester)
  }

  return <section className="recommendationBox syntheticTesterPanel" dir={rtl?'rtl':'ltr'}>
    <button className="primary full" type="button" onClick={()=>setOpen(value=>!value)}>🧪 {c.button}</button>
    {open&&<div className="syntheticTesterBody">
      <div className="sectionHead"><div><h3>{c.title}</h3><p>{c.lead}</p></div><button className="secondary" type="button" onClick={()=>{setOpen(false);setSelected(null)}}>{c.close}</button></div>
      <div className="itemList">{SYNTHETIC_TESTERS.map(tester=><button className="itemRow buttonRow" type="button" key={tester.id} onClick={()=>openTester(tester)}><div><b>{tester.expected_ampel} {tester.id} · {tester.name}</b><p>{tester.language.toUpperCase()} · {tester.home_country} → {tester.target_country} · {tester.complexity}</p><small>{tester.problem}</small></div><span className="chev">›</span></button>)}</div>
      {selected&&<article className="detailCard syntheticTesterDetail">
        <div className="detailCardHead"><h3>{selected.expected_ampel} {selected.name}</h3><span className="modeBadge">{selected.id}</span></div>
        <p><b>{c.language}:</b> {selected.language.toUpperCase()}</p>
        <p><b>{c.home}:</b> {selected.home_country}</p>
        <p><b>{c.target}:</b> {selected.target_country}</p>
        <p><b>{c.complexity}:</b> {selected.complexity}</p>
        <p><b>{c.problem}:</b> {selected.problem}</p>
        <p><b>{c.documents}:</b> {selected.documents.join(' · ')}</p>
        <p><b>{c.expected}:</b> {selected.expected_ampel}</p>
        <p><b>{c.actions}:</b> {selected.expected_actions.join(' → ')}</p>
        <button className="secondary full" type="button" onClick={()=>openTester(selected)}>{c.start}</button>
      </article>}
    </div>}
  </section>
}

export const SYNTHETIC_TESTER_PANEL_COPY=COPY
