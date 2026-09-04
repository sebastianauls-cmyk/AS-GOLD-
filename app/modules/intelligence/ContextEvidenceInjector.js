'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../services/supabaseClient'
import { buildEvidenceActionResult } from './evidenceActionLayer.mjs'
import { EVIDENCE_PANEL_COPY } from './EvidenceActionPanel'

const VIEW_COPY={
  de:{case:'Fallprüfung',document:'Dokumentenprüfung',comparison:'Ländervergleich',checking:'Länderprofil wird geprüft …',actionCase:'Fall mit dem geprüften Länderprofil abgleichen.',actionDocument:'Dokument gegen das geprüfte Länderprofil und die Fristen prüfen.',actionComparison:'Unterschiede zwischen Heimat- und Zielland anhand geprüfter Quellen vergleichen.',unavailable:'Für dieses Land ist noch keine vollständig geprüfte Grundlage verfügbar.'},
  en:{case:'Case review',document:'Document review',comparison:'Country comparison',checking:'Checking country profile …',actionCase:'Check the case against the verified country profile.',actionDocument:'Check the document against the verified country profile and deadlines.',actionComparison:'Compare home and target country differences using verified sources.',unavailable:'No fully verified basis is available for this country yet.'},
  fr:{case:'Vérification du dossier',document:'Vérification du document',comparison:'Comparaison des pays',checking:'Vérification du profil du pays …',actionCase:'Comparer le dossier au profil pays vérifié.',actionDocument:'Vérifier le document par rapport au profil pays et aux délais.',actionComparison:'Comparer les différences entre pays d’origine et pays cible à partir de sources vérifiées.',unavailable:'Aucune base entièrement vérifiée n’est encore disponible pour ce pays.'},
  tr:{case:'Dosya incelemesi',document:'Belge incelemesi',comparison:'Ülke karşılaştırması',checking:'Ülke profili kontrol ediliyor …',actionCase:'Dosyayı doğrulanmış ülke profiliyle karşılaştırın.',actionDocument:'Belgeyi doğrulanmış ülke profili ve sürelerle karşılaştırın.',actionComparison:'Ana ülke ile hedef ülke arasındaki farkları doğrulanmış kaynaklarla karşılaştırın.',unavailable:'Bu ülke için henüz tamamen doğrulanmış bir temel yok.'},
  pl:{case:'Weryfikacja sprawy',document:'Weryfikacja dokumentu',comparison:'Porównanie krajów',checking:'Trwa sprawdzanie profilu kraju …',actionCase:'Porównaj sprawę ze zweryfikowanym profilem kraju.',actionDocument:'Sprawdź dokument względem zweryfikowanego profilu kraju i terminów.',actionComparison:'Porównaj różnice między krajem pochodzenia i krajem docelowym na podstawie zweryfikowanych źródeł.',unavailable:'Dla tego kraju nie ma jeszcze w pełni zweryfikowanej podstawy.'},
  ru:{case:'Проверка дела',document:'Проверка документа',comparison:'Сравнение стран',checking:'Проверяется профиль страны …',actionCase:'Сопоставить дело с проверенным профилем страны.',actionDocument:'Проверить документ по профилю страны и срокам.',actionComparison:'Сравнить различия между страной происхождения и целевой страной по проверенным источникам.',unavailable:'Для этой страны пока нет полностью проверенной основы.'},
  ar:{case:'مراجعة الحالة',document:'مراجعة المستند',comparison:'مقارنة الدول',checking:'جارٍ التحقق من ملف الدولة …',actionCase:'قارن الحالة بملف الدولة الموثق.',actionDocument:'تحقق من المستند وفق ملف الدولة الموثق والمواعيد.',actionComparison:'قارن الفروق بين بلد المنشأ والبلد المستهدف باستخدام مصادر موثقة.',unavailable:'لا توجد بعد قاعدة مكتملة وموثقة لهذه الدولة.'},
  fa:{case:'بررسی پرونده',document:'بررسی سند',comparison:'مقایسه کشورها',checking:'در حال بررسی پروفایل کشور …',actionCase:'پرونده را با پروفایل تأییدشده کشور تطبیق دهید.',actionDocument:'سند را با پروفایل تأییدشده کشور و مهلت‌ها بررسی کنید.',actionComparison:'تفاوت‌های کشور مبدأ و مقصد را با منابع تأییدشده مقایسه کنید.',unavailable:'برای این کشور هنوز مبنای کاملاً تأییدشده‌ای وجود ندارد.'},
  ro:{case:'Verificarea cazului',document:'Verificarea documentului',comparison:'Comparație între țări',checking:'Se verifică profilul țării …',actionCase:'Comparați cazul cu profilul de țară verificat.',actionDocument:'Verificați documentul față de profilul țării și termene.',actionComparison:'Comparați diferențele dintre țara de origine și țara țintă pe baza surselor verificate.',unavailable:'Nu există încă o bază complet verificată pentru această țară.'},
  bg:{case:'Проверка на случая',document:'Проверка на документа',comparison:'Сравнение на държави',checking:'Проверява се профилът на държавата …',actionCase:'Сравнете случая с проверения профил на държавата.',actionDocument:'Проверете документа спрямо профила на държавата и сроковете.',actionComparison:'Сравнете разликите между държавата на произход и целевата държава чрез проверени източници.',unavailable:'Все още няма напълно проверена основа за тази държава.'},
  vi:{case:'Kiểm tra hồ sơ',document:'Kiểm tra tài liệu',comparison:'So sánh quốc gia',checking:'Đang kiểm tra hồ sơ quốc gia …',actionCase:'Đối chiếu hồ sơ với hồ sơ quốc gia đã xác minh.',actionDocument:'Kiểm tra tài liệu theo hồ sơ quốc gia đã xác minh và thời hạn.',actionComparison:'So sánh khác biệt giữa quốc gia gốc và quốc gia đích bằng các nguồn đã xác minh.',unavailable:'Quốc gia này chưa có cơ sở được xác minh đầy đủ.'}
}

const SELECTORS={
  case:'.caseTitleRow',
  document:'.documentReviewHead',
  comparison:'.countryComparison, .countryComparisonPanel, [data-country-comparison]'
}

function panelCopy(language){return EVIDENCE_PANEL_COPY[language]||EVIDENCE_PANEL_COPY.de}
function viewCopy(language){return VIEW_COPY[language]||VIEW_COPY.de}

export function ContextEvidencePanel({language='de',countryCode='DE',view='case',record=null,loading=false}){
  const c=panelCopy(language)
  const v=viewCopy(language)
  const action=view==='document'?v.actionDocument:view==='comparison'?v.actionComparison:v.actionCase
  const result=useMemo(()=>buildEvidenceActionResult({
    language,
    targetCountry:countryCode,
    topic:view,
    targetRecord:record||{},
    nextActions:[action]
  }),[language,countryCode,view,record,action])
  const dir=language==='ar'||language==='fa'?'rtl':'ltr'
  if(loading) return <section className="recommendationBox evidenceActionPanel contextEvidencePanel" dir={dir}><div><span className="modeBadge">⚪ {c.review}</span><h3>{v[view]}</h3><p>{v.checking}</p></div></section>
  return <section className="recommendationBox evidenceActionPanel contextEvidencePanel" dir={dir} data-v95-evidence-surface={view}>
    <div><span className="modeBadge">{result.ampel} {result.verified?c.verified:c.review}</span><h3>{v[view]}</h3></div>
    <p><b>{c.confidence}:</b> {c[result.confidence.level]||result.confidence.level} ({result.confidence.score}%)</p>
    <p><b>{c.meaning}:</b> {result.verified?c.noGaps:v.unavailable}</p>
    <p><b>{c.source}:</b> {result.source_provenance.length?result.source_provenance.length:c.noSources}</p>
    <p><b>{c.next}:</b> {action}</p>
    <p><b>{c.gaps}:</b> {result.gaps.length?result.gaps.join(' · '):c.noGaps}</p>
  </section>
}

export function ContextEvidenceInjector({language='de',countryCode='DE'}){
  const [record,setRecord]=useState(null)
  const [loading,setLoading]=useState(true)
  const [targets,setTargets]=useState({case:null,document:null,comparison:null})

  useEffect(()=>{
    let cancelled=false
    setLoading(true)
    supabase.from('country_legal_modules').select('country_code,status,official_sources,court_sources,authority_sources,covered_topics,source_reviewed_at,baseline_checked_at,entry_requirements_verified,entry_sources,residence_requirements_verified,residence_sources').eq('country_code',countryCode).maybeSingle().then(({data})=>{
      if(cancelled)return
      setRecord(data||null)
      setLoading(false)
    }).catch(()=>{if(!cancelled){setRecord(null);setLoading(false)}})
    return()=>{cancelled=true}
  },[countryCode])

  useEffect(()=>{
    const update=()=>setTargets(Object.fromEntries(Object.entries(SELECTORS).map(([key,selector])=>[key,document.querySelector(selector)])))
    update()
    const observer=new MutationObserver(update)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  return <>{Object.entries(targets).map(([view,target])=>target?createPortal(<ContextEvidencePanel language={language} countryCode={countryCode} view={view} record={record} loading={loading}/>,target):null)}</>
}

export const CONTEXT_EVIDENCE_LANGUAGES=Object.freeze(Object.keys(VIEW_COPY))
export const CONTEXT_EVIDENCE_SELECTORS=Object.freeze({...SELECTORS})
