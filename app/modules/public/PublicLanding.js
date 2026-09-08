'use client'

import { useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'
import { supportedLanguages } from '../language/v36Languages.mjs'
import { heroTitleCopy } from './HeroTitleStabilizer'
import { audienceCopy } from './HeroCopyEnhancer'
import { orderCasesByResearch } from './casePriorityV56.mjs'
import { ProblemNavigator } from './ProblemNavigator'
import { ExplainerVideo } from './ExplainerVideo'
import { ProductIntroCompact } from './ProductIntroCompact'
import { PublicHeader } from './PublicHeader'
import { PublicCaseDiscoverySection } from './PublicCaseDiscoverySection'
import { PublicTrustSections } from './PublicTrustSections'
import { PublicPricingSection } from './PublicPricingSection'

const publicBackCopy={
  de:{label:'← Zurück',aria:'Zurück zum Anfang der Seite'},
  en:{label:'← Back',aria:'Back to the top of the page'},
  fr:{label:'← Retour',aria:'Retour en haut de la page'},
  tr:{label:'← Geri',aria:'Sayfanın başına dön'},
  pl:{label:'← Wstecz',aria:'Wróć na początek strony'},
  ru:{label:'← Назад',aria:'Вернуться в начало страницы'},
  ar:{label:'رجوع →',aria:'العودة إلى أعلى الصفحة'},
  fa:{label:'بازگشت →',aria:'بازگشت به بالای صفحه'},
  ro:{label:'← Înapoi',aria:'Înapoi la începutul paginii'},
  bg:{label:'← Назад',aria:'Обратно в началото на страницата'},
  vi:{label:'← Quay lại',aria:'Quay lại đầu trang'}
}

const v131Copy={
  de:{
    eyebrow:'AS Workspace · Stand v131',
    title:'Ein Fall. Ein Arbeitsbereich. Vom ersten Dokument bis zum nächsten Schritt.',
    lead:'AS Workspace verbindet Fallaufnahme, Dokumentenanalyse, Mehrsprachigkeit, Ampelbewertung, Fristen, Ausgaben und jetzt auch fallbezogene Rechtsraumvergleiche in einem durchgängigen Ablauf.',
    cta:'v131 kostenlos ansehen',
    features:[
      ['📄','Dokumente & Fotos','Unterlagen hochladen, erkennen, strukturieren und dem richtigen Fall zuordnen.'],
      ['🌍','Sprachen & Länder','Oberfläche und Ausgabe getrennt steuern; zweisprachige Ergebnisse und Schreiben erzeugen.'],
      ['⚖️','Rechtsraumvergleich','Für den konkreten Einzelfall relevante Rechtsräume und Zielländer gegenüberstellen und verständlich erklären.'],
      ['🚦','Ampelanalyse','Risiken, fehlende Unterlagen, Beweislage und nächste Schritte sofort sichtbar machen.'],
      ['⏱️','Fristen & Verlauf','Offene Fristen, Statusänderungen und notwendige Reaktionen fallbezogen im Blick behalten.'],
      ['📤','Ausgabe & Freigabe','PDF- und Word-Ausgaben vorbereiten, Vorschau prüfen und erst nach Freigabe weitergeben.']
    ]
  },
  en:{
    eyebrow:'AS Workspace · Version 131',
    title:'One case. One workspace. From the first document to the next action.',
    lead:'AS Workspace combines intake, document analysis, multilingual workflows, traffic-light assessment, deadlines, exports and now case-specific legal-jurisdiction comparisons in one continuous process.',
    cta:'Explore v131 free',
    features:[
      ['📄','Documents & photos','Upload, recognise, structure and assign files to the correct case.'],
      ['🌍','Languages & countries','Control interface and output languages independently and create bilingual results.'],
      ['⚖️','Legal comparison','Compare relevant jurisdictions and target countries for the individual case and explain the differences clearly.'],
      ['🚦','Traffic-light analysis','Make risks, missing information, evidence and next steps immediately visible.'],
      ['⏱️','Deadlines & progress','Keep unresolved deadlines, status changes and required reactions visible by case.'],
      ['📤','Export & approval','Prepare PDF and Word outputs, review the preview and only continue after approval.']
    ]
  }
}

// Ownership map for legacy regression guards: PublicHeader owns className="publicTop" and PublicLanguageModules;
// PublicCaseDiscoverySection owns id="asgold-user-audience" and invokes jumpToPublicCaseResult().
// PublicPricingSection owns id="preise"; PublicLanding only composes the domain-owned public sections.
export function PublicLanding({t,a,payment,paymentConfig,language,setLanguage,outputLanguage,setOutputLanguage,setScreen,cd,testerLinkText,pa,activePublicCase,setSelectedPublicCase,tt,jl,localizedPlans,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,recommendedTier,eur,period,terms,monthsLabel}){
  const hero=heroTitleCopy[language]||heroTitleCopy.de
  const audience=audienceCopy[language]||audienceCopy.de
  const outputLanguageLabel=supportedLanguages.find(item=>item.key===outputLanguage)?.label||'Deutsch'
  const orderedPublicCases=orderCasesByResearch(cd.cases)
  const [explainerSignal,setExplainerSignal]=useState(0)
  const backCopy=publicBackCopy[language]||publicBackCopy.de
  const v131=v131Copy[language]||v131Copy.en

  function returnToPublicStart(){
    const cleanUrl=`${window.location.pathname}${window.location.search}`
    if(window.location.hash)window.history.replaceState(window.history.state,'',cleanUrl)
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({top:0,left:0,behavior:reducedMotion?'auto':'smooth'})
  }

  return <>
    <PublicHeader
      t={t}
      caseNavLabel={cd.nav}
      language={language}
      onLanguageChange={setLanguage}
      outputLanguage={outputLanguage}
      onOutputLanguageChange={setOutputLanguage}
      onScreenChange={setScreen}
      onPlayExplainer={()=>setExplainerSignal(value=>value+1)}
    />
    <button className="publicPageBackButton" data-persistent-back type="button" onClick={returnToPublicStart} aria-label={backCopy.aria}>{backCopy.label}</button>
    <main>
      <div className="legalMarketBar">
        <div className="wrap">
          <b>{t.legal}</b><span>{t.marketNote}</span>
          <strong className="legalChip" data-output-language-status aria-live="polite">{t.outputLanguage}: {outputLanguageLabel}</strong>
        </div>
      </div>

      <section className="hero">
        <div className="wrap heroLayout">
          <div>
            <div className="eyebrow">{a.eyebrow}</div>
            <h1>{hero.title}</h1>
            <p className="lead">{hero.lead}</p>
            <ProductIntroCompact language={language}/>
            <ProblemNavigator outputLanguage={outputLanguage} language={language} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>
            <ExplainerVideo key={language} language={language} openSignal={explainerSignal}/>
            <div className="actions">
              <a className="primary btn" href="#fallarten">{cd.chooseCase}</a>
              <button className="secondary btn" onClick={()=>setScreen('register')}>{t.freeCta}</button>
            </div>
            <p className="freeHint">✓ {cd.freeHint}</p>
            <a className="testerSafeLink" href={language==='de'?'/testen':`/testen?lang=${language}`}>{testerLinkText[language]||testerLinkText.de} →</a>
          </div>
          <aside className="heroOutcome" aria-label={cd.result}>
            <span className="modeBadge">{cd.result}</span>
            <ol>{cd.results.slice(0,3).map(item=><li key={item}>{item}</li>)}</ol>
          </aside>
        </div>
      </section>

      <section className="wrap" id="v131-funktionen" aria-labelledby="v131-title">
        <div className="card" style={{marginTop:'1.25rem',marginBottom:'1.5rem'}}>
          <div className="eyebrow">{v131.eyebrow}</div>
          <h2 id="v131-title">{v131.title}</h2>
          <p className="lead">{v131.lead}</p>
          <div className="featureGrid">
            {v131.features.map(([icon,title,body])=><article className="featureCard" key={title}>
              <div className="featureIcon" aria-hidden="true">{icon}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>)}
          </div>
          <div className="actions">
            <button className="primary btn" onClick={()=>setScreen('register')}>{v131.cta}</button>
            <button className="secondary btn" onClick={()=>setExplainerSignal(value=>value+1)}>{language==='de'?'▶ Erklärung ansehen':'▶ View explanation'}</button>
          </div>
        </div>
      </section>

      <PublicCaseDiscoverySection
        cd={cd}
        pa={pa}
        audience={audience}
        orderedPublicCases={orderedPublicCases}
        activePublicCase={activePublicCase}
        onSelectCase={setSelectedPublicCase}
        onRegister={()=>setScreen('register')}
      />

      <PublicTrustSections tt={tt} cd={cd} a={a}/>

      <PublicPricingSection
        a={a}
        payment={payment}
        paymentConfig={paymentConfig}
        jl={jl}
        localizedPlans={localizedPlans}
        rt={rt}
        selectedGoal={selectedGoal}
        onGoalChange={value=>{setSelectedGoal(value);setShowRecommendation(true)}}
        showRecommendation={showRecommendation}
        recommendedPlan={recommendedPlan}
        recommendedTier={recommendedTier}
        eur={eur}
        period={period}
        terms={terms}
        monthsLabel={monthsLabel}
        onRegister={()=>setScreen('register')}
      />
    </main>
    <LegalFooter language={language}/>
  </>
}
