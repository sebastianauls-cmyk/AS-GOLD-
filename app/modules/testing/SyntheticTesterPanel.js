'use client'

import { useState } from 'react'
import { SYNTHETIC_TESTERS } from './syntheticTesterRegistry.mjs'
import { LANGUAGE_CATALOG } from '../language/languageRegistry.mjs'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'

const COPY={
  de:{button:'Testfälle in verschiedenen Sprachen ausprobieren',title:'12 erfundene Testfälle zum Ausprobieren',lead:'Wählen Sie einen Beispiel-Fall aus und prüfen Sie Sprache, Heimatland, Zielland, Dokumente, Ampel und nächsten Schritt.',close:'Schließen',start:'Diesen Testfall ausprobieren',language:'Sprache',home:'Heimatland',target:'Zielland',complexity:'Schwierigkeit',problem:'Problem',documents:'Dokumente',expected:'Erwartete Ampel',actions:'Erwartete nächste Schritte'},
  en:{button:'Try test cases in different languages',title:'12 fictional test cases to try',lead:'Choose a sample case and review language, home country, target country, documents, traffic light and next step.',close:'Close',start:'Try this test case',language:'Language',home:'Home country',target:'Target country',complexity:'Complexity',problem:'Problem',documents:'Documents',expected:'Expected traffic light',actions:'Expected next steps'},
  fr:{button:'Essayer des cas de test dans plusieurs langues',title:'12 cas de test fictifs à essayer',lead:'Choisissez un cas exemple et vérifiez la langue, le pays d’origine, le pays cible, les documents, le feu et l’étape suivante.',close:'Fermer',start:'Essayer ce cas de test',language:'Langue',home:'Pays d’origine',target:'Pays cible',complexity:'Complexité',problem:'Problème',documents:'Documents',expected:'Feu attendu',actions:'Étapes suivantes attendues'},
  tr:{button:'Farklı dillerde test vakalarını deneyin',title:'Denemek için 12 kurgusal test vakası',lead:'Bir örnek vaka seçin ve dil, ana ülke, hedef ülke, belgeler, trafik ışığı ve sonraki adımı kontrol edin.',close:'Kapat',start:'Bu test vakasını dene',language:'Dil',home:'Ana ülke',target:'Hedef ülke',complexity:'Zorluk',problem:'Sorun',documents:'Belgeler',expected:'Beklenen trafik ışığı',actions:'Beklenen sonraki adımlar'},
  pl:{button:'Wypróbuj przypadki testowe w różnych językach',title:'12 fikcyjnych przypadków testowych do wypróbowania',lead:'Wybierz przykładową sprawę i sprawdź język, kraj ojczysty, kraj docelowy, dokumenty, sygnalizację i następny krok.',close:'Zamknij',start:'Wypróbuj ten przypadek',language:'Język',home:'Kraj ojczysty',target:'Kraj docelowy',complexity:'Trudność',problem:'Problem',documents:'Dokumenty',expected:'Oczekiwana sygnalizacja',actions:'Oczekiwane następne kroki'},
  ru:{button:'Попробовать тестовые дела на разных языках',title:'12 вымышленных тестовых дел для проверки',lead:'Выберите пример дела и проверьте язык, страну происхождения, целевую страну, документы, светофор и следующий шаг.',close:'Закрыть',start:'Попробовать это дело',language:'Язык',home:'Страна происхождения',target:'Целевая страна',complexity:'Сложность',problem:'Проблема',documents:'Документы',expected:'Ожидаемый светофор',actions:'Ожидаемые следующие шаги'},
  ar:{button:'جرّب حالات اختبار بلغات مختلفة',title:'12 حالة اختبار خيالية للتجربة',lead:'اختر حالة نموذجية وراجع اللغة وبلد الأصل والبلد المستهدف والمستندات وإشارة المرور والخطوة التالية.',close:'إغلاق',start:'تجربة حالة الاختبار هذه',language:'اللغة',home:'بلد الأصل',target:'البلد المستهدف',complexity:'درجة الصعوبة',problem:'المشكلة',documents:'المستندات',expected:'إشارة المرور المتوقعة',actions:'الخطوات التالية المتوقعة'},
  fa:{button:'پرونده‌های آزمایشی را به زبان‌های مختلف امتحان کنید',title:'۱۲ پرونده آزمایشی ساختگی برای امتحان',lead:'یک پرونده نمونه انتخاب کنید و زبان، کشور مبدأ، کشور مقصد، مدارک، چراغ وضعیت و گام بعدی را بررسی کنید.',close:'بستن',start:'این پرونده آزمایشی را امتحان کن',language:'زبان',home:'کشور مبدأ',target:'کشور مقصد',complexity:'پیچیدگی',problem:'مسئله',documents:'مدارک',expected:'چراغ مورد انتظار',actions:'گام‌های بعدی مورد انتظار'},
  ro:{button:'Încercați cazuri de test în diferite limbi',title:'12 cazuri de test fictive de încercat',lead:'Alegeți un caz exemplu și verificați limba, țara de origine, țara țintă, documentele, semaforul și pasul următor.',close:'Închide',start:'Încearcă acest caz de test',language:'Limbă',home:'Țara de origine',target:'Țara țintă',complexity:'Complexitate',problem:'Problemă',documents:'Documente',expected:'Semafor așteptat',actions:'Pași următori așteptați'},
  bg:{button:'Изпробвайте тестови случаи на различни езици',title:'12 измислени тестови случая за изпробване',lead:'Изберете примерен случай и проверете езика, родната държава, целевата държава, документите, светофара и следващата стъпка.',close:'Затвори',start:'Изпробвай този тестов случай',language:'Език',home:'Родна държава',target:'Целева държава',complexity:'Сложност',problem:'Проблем',documents:'Документи',expected:'Очакван светофар',actions:'Очаквани следващи стъпки'},
  vi:{button:'Thử các tình huống kiểm thử bằng nhiều ngôn ngữ',title:'12 tình huống kiểm thử giả lập để thử',lead:'Chọn một tình huống mẫu và kiểm tra ngôn ngữ, quốc gia gốc, quốc gia đích, tài liệu, đèn trạng thái và bước tiếp theo.',close:'Đóng',start:'Thử tình huống này',language:'Ngôn ngữ',home:'Quốc gia gốc',target:'Quốc gia đích',complexity:'Độ phức tạp',problem:'Vấn đề',documents:'Tài liệu',expected:'Đèn dự kiến',actions:'Các bước tiếp theo dự kiến'}
}

const LANG=Object.fromEntries(LANGUAGE_CATALOG.map(item=>[item.key,item]))
const COUNTRY=Object.fromEntries(COUNTRY_CATALOG.map(item=>[item.key,item]))

function languageLabel(key){
  const item=LANG[key]
  return item?`${item.flags} ${item.label}`:key.toUpperCase()
}
function countryLabel(key){
  const item=COUNTRY[key]
  return item?`${item.flag||''} ${item.label}`.trim():key
}

export function SyntheticTesterPanel({language='de',onOpenCase}){
  const [open,setOpen]=useState(true)
  const [selected,setSelected]=useState(null)
  const c=COPY[language]||COPY.de
  const rtl=language==='ar'||language==='fa'
  const allFlags=LANGUAGE_CATALOG.map(item=>item.flags.split(' ')[0]).join(' ')

  function selectTester(tester){
    setSelected(tester)
  }

  return <section className="recommendationBox syntheticTesterPanel" dir={rtl?'rtl':'ltr'}>
    {!open&&<button className="primary full" type="button" aria-expanded="false" onClick={()=>setOpen(true)}>🧪 {c.button}<span style={{display:'block',marginTop:6,fontSize:18}} aria-hidden="true">{allFlags}</span></button>}
    {open&&<div className="syntheticTesterBody">
      <div className="sectionHead"><div><h3>🧪 {c.title}</h3><p>{c.lead}</p><span className="syntheticTesterFlags" aria-hidden="true">{allFlags}</span></div><button className="secondary" type="button" aria-expanded="true" onClick={()=>{setOpen(false);setSelected(null)}}>{c.close}</button></div>
      <div className="itemList">{SYNTHETIC_TESTERS.map(tester=><div className="syntheticTesterEntry" key={tester.id}>
        <button className={`itemRow buttonRow ${selected?.id===tester.id?'selected':''}`} type="button" aria-pressed={selected?.id===tester.id} onClick={()=>selectTester(tester)}><div><b>{tester.expected_ampel} <span className="modeBadge">{tester.id}</span> {languageLabel(tester.language)} · {tester.name}</b><p>{countryLabel(tester.home_country)} → {countryLabel(tester.target_country)} · {tester.complexity}</p><small>{tester.problem}</small></div><span className="chev">›</span></button>
        {selected?.id===tester.id&&<article className="detailCard syntheticTesterDetail">
          <div className="detailCardHead"><h3>{selected.expected_ampel} {selected.name}</h3><span className="modeBadge">{selected.id}</span></div>
          <p><b>{c.language}:</b> {languageLabel(selected.language)}</p>
          <p><b>{c.home}:</b> {countryLabel(selected.home_country)}</p>
          <p><b>{c.target}:</b> {countryLabel(selected.target_country)}</p>
          <p><b>{c.complexity}:</b> {selected.complexity}</p>
          <p><b>{c.problem}:</b> {selected.problem}</p>
          <p><b>{c.documents}:</b> {selected.documents.join(' · ')}</p>
          <p><b>{c.expected}:</b> {selected.expected_ampel}</p>
          <p><b>{c.actions}:</b> {selected.expected_actions.join(' → ')}</p>
          <button className="secondary full" type="button" onClick={()=>onOpenCase?.(selected)}>{c.start}</button>
        </article>}
      </div>)}</div>
    </div>}
  </section>
}

export const SYNTHETIC_TESTER_PANEL_COPY=COPY
