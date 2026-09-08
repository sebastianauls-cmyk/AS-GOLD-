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
