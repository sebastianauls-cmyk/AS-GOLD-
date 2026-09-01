'use client'

import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { outputLanguageNames } from '../language/v36Languages.mjs'

const copy={
  de:{interfaceTitle:'1. Sprache der Oberfläche',interfaceLabel:'Oberfläche',outputTitle:'2. Sprache für Ausgabe & Kunden',outputLabel:'Ausgabesprache',outputHelp:'Dokumente, Ergebnisse und Schreiben erscheinen für Kunden oder andere Personen in {language}. Die Oberfläche bleibt davon unabhängig.',presenter:'Wer soll AS Gold erklären?',female:'Frau erklärt',male:'Mann erklärt',play:'Erklärvideo abspielen',back:'Zurück'},
  en:{interfaceTitle:'1. Interface language',interfaceLabel:'Interface',outputTitle:'2. Language for output & customers',outputLabel:'Output language',outputHelp:'Documents, results and letters are created for customers or other people in {language}. The interface remains independent.',presenter:'Who should explain AS Gold?',female:'Woman explains',male:'Man explains',play:'Play explainer video',back:'Back'},
  fr:{interfaceTitle:'1. Langue de l’interface',interfaceLabel:'Interface',outputTitle:'2. Langue des résultats et des clients',outputLabel:'Langue de sortie',outputHelp:'Les documents, résultats et courriers destinés aux clients ou à d’autres personnes sont créés en {language}. L’interface reste indépendante.',presenter:'Qui doit expliquer AS Gold ?',female:'Explication par une femme',male:'Explication par un homme',play:'Lire la vidéo explicative',back:'Retour'},
  tr:{interfaceTitle:'1. Arayüz dili',interfaceLabel:'Arayüz',outputTitle:'2. Çıktı ve müşteri dili',outputLabel:'Çıktı dili',outputHelp:'Belgeler, sonuçlar ve yazılar müşteriler veya diğer kişiler için {language} dilinde oluşturulur. Arayüz bundan bağımsız kalır.',presenter:'AS Gold’u kim anlatsın?',female:'Kadın anlatsın',male:'Erkek anlatsın',play:'Tanıtım videosunu oynat',back:'Geri'},
  pl:{interfaceTitle:'1. Język interfejsu',interfaceLabel:'Interfejs',outputTitle:'2. Język wyników i klientów',outputLabel:'Język wyniku',outputHelp:'Dokumenty, wyniki i pisma dla klientów lub innych osób są tworzone w języku {language}. Język interfejsu pozostaje niezależny.',presenter:'Kto ma wyjaśnić AS Gold?',female:'Wyjaśnia kobieta',male:'Wyjaśnia mężczyzna',play:'Odtwórz film objaśniający',back:'Wstecz'},
  ru:{interfaceTitle:'1. Язык интерфейса',interfaceLabel:'Интерфейс',outputTitle:'2. Язык результата и клиента',outputLabel:'Язык результата',outputHelp:'Документы, результаты и письма для клиентов или других лиц создаются на языке: {language}. Язык интерфейса выбирается независимо.',presenter:'Кто объяснит AS Gold?',female:'Объясняет женщина',male:'Объясняет мужчина',play:'Воспроизвести видео',back:'Назад'},
  ar:{interfaceTitle:'1. لغة الواجهة',interfaceLabel:'الواجهة',outputTitle:'2. لغة النتائج والعملاء',outputLabel:'لغة الإخراج',outputHelp:'تُنشأ المستندات والنتائج والخطابات للعملاء أو للأشخاص الآخرين باللغة {language}. وتبقى لغة الواجهة مستقلة.',presenter:'من يشرح AS Gold؟',female:'تشرح امرأة',male:'يشرح رجل',play:'تشغيل الفيديو التوضيحي',back:'رجوع'},
  fa:{interfaceTitle:'1. زبان رابط',interfaceLabel:'رابط',outputTitle:'2. زبان خروجی و مشتری',outputLabel:'زبان خروجی',outputHelp:'اسناد، نتایج و نامه‌ها برای مشتریان یا افراد دیگر به زبان {language} ایجاد می‌شوند. زبان رابط مستقل می‌ماند.',presenter:'چه کسی AS Gold را توضیح دهد؟',female:'توضیح با صدای زن',male:'توضیح با صدای مرد',play:'پخش ویدیوی توضیحی',back:'بازگشت'},
  ro:{interfaceTitle:'1. Limba interfeței',interfaceLabel:'Interfață',outputTitle:'2. Limba rezultatelor și a clienților',outputLabel:'Limba rezultatului',outputHelp:'Documentele, rezultatele și scrisorile pentru clienți sau alte persoane sunt create în {language}. Interfața rămâne independentă.',presenter:'Cine să explice AS Gold?',female:'Explică o femeie',male:'Explică un bărbat',play:'Redă videoclipul explicativ',back:'Înapoi'},
  bg:{interfaceTitle:'1. Език на интерфейса',interfaceLabel:'Интерфейс',outputTitle:'2. Език на резултатите и клиентите',outputLabel:'Език на резултата',outputHelp:'Документите, резултатите и писмата за клиенти или други лица се създават на {language}. Интерфейсът остава независим.',presenter:'Кой да обясни AS Gold?',female:'Обяснява жена',male:'Обяснява мъж',play:'Пусни обяснителното видео',back:'Назад'}
}

const useCustomerText={de:'In dieser Sprache nutzen',en:'Use in this language',fr:'Utiliser dans cette langue',tr:'Bu dilde kullan',pl:'Użyj w tym języku',ru:'Использовать на этом языке',ar:'استخدم بهذه اللغة',fa:'استفاده به این زبان',ro:'Folosește în această limbă',bg:'Използвай на този език'}

export function PublicLanguageModules({language,onLanguageChange,outputLanguage,onOutputLanguageChange,onPlayExplainer}){
  const [presenter,setPresenter]=useState('female')
  const text=copy[language]||copy.de
  const outputName=(outputLanguageNames[language]||outputLanguageNames.de)?.[outputLanguage]||outputLanguage

  useEffect(()=>{
    const saved=localStorage.getItem('asgold-video-presenter')
    if(saved==='female'||saved==='male')setPresenter(saved)
  },[])

  function choosePresenter(value){
    setPresenter(value)
    localStorage.setItem('asgold-video-presenter',value)
  }

  function playVideo(){
    onPlayExplainer?.({language,presenter})
  }

  function returnToStart(){
    const cleanUrl=`${window.location.pathname}${window.location.search}`
    if(window.location.hash)window.history.replaceState(window.history.state,'',cleanUrl)
    window.scrollTo({top:0,left:0,behavior:'instant'})
  }

  function openCustomerUse(){
    const target=document.getElementById('asgold-problem-navigator-react')
    if(!target)return
    target.scrollIntoView({behavior:'smooth',block:'center'})
    setTimeout(()=>target.querySelector('textarea')?.focus({preventScroll:true}),350)
  }

  return <section className="publicLanguageModules" aria-label={`${text.interfaceTitle}; ${text.outputTitle}`}>
    <div className="publicLanguageModule interfaceModule">
      <strong className="publicLanguageTitle">{text.interfaceTitle}</strong>
      <div className="publicLanguageMainRow">
        <LanguageSwitcher value={language} onChange={onLanguageChange} label={text.interfaceLabel}/>
        <button type="button" className="publicBackButton" onClick={returnToStart}>{language==='ar'||language==='fa'?'→':'←'} {text.back}</button>
      </div>
      <span className="publicPresenterLabel">{text.presenter}</span>
      <div className="publicPresenterRow" role="group" aria-label={text.presenter}>
        <button type="button" className={presenter==='female'?'active':''} aria-pressed={presenter==='female'} onClick={()=>choosePresenter('female')}>👩 {text.female}</button>
        <button type="button" className={presenter==='male'?'active':''} aria-pressed={presenter==='male'} onClick={()=>choosePresenter('male')}>👨 {text.male}</button>
        <button type="button" className="publicVideoButton" onClick={playVideo}>▶ {text.play}</button>
      </div>
    </div>
    <div className="publicLanguageModule outputModule">
      <strong className="publicLanguageTitle">{text.outputTitle}</strong>
      <LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={text.outputLabel}/>
      <p>{text.outputHelp.replace('{language}',outputName)}</p>
      <span className="outputLanguageStatus" data-output-language-status aria-live="polite">✓ {text.outputLabel}: <b>{outputName}</b></span>
      <button type="button" className="outputCustomerButton" aria-controls="asgold-problem-navigator-react" onClick={openCustomerUse}>→ {useCustomerText[outputLanguage]||useCustomerText.en}</button>
    </div>
  </section>
}
