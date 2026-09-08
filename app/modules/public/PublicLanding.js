'use client'

import { useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'
import { supportedLanguages } from '../language/v36Languages.mjs'
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
    title:'Sie schildern den Fall. AS Workspace zeigt, was jetzt wichtig ist.',
    lead:'Vom ersten Dokument bis zum nächsten Schritt: ein klarer Arbeitsablauf statt vieler einzelner Werkzeuge.',
    cta:'Fall starten',
    explainer:'▶ Kurz erklären lassen',
    journey:[
      ['1','Jetzt tun','Fall schildern oder Unterlagen hochladen. AS Workspace ordnet den Vorgang automatisch ein.'],
      ['2','Status sehen','Ampel, fehlende Unterlagen, Fristen und Risiken werden auf einen Blick sichtbar.'],
      ['3','Weiterarbeiten','Schreiben, Übersetzungen, Rechtsraumvergleich und Ausgaben werden fallbezogen vorbereitet.']
    ],
    features:[
      ['📄','Dokumente & Fotos','Unterlagen erkennen, strukturieren und dem richtigen Fall zuordnen.'],
      ['🌍','Sprachen & Länder','Oberfläche und Ausgabe getrennt steuern; zweisprachige Ergebnisse erzeugen.'],
      ['⚖️','Rechtsraumvergleich','Relevante Rechtsräume und Zielländer für den konkreten Einzelfall verständlich gegenüberstellen.'],
      ['🚦','Ampelanalyse','Risiken, Beweislage, fehlende Angaben und nächste Schritte sofort sichtbar machen.'],
      ['⏱️','Fristen & Verlauf','Offene Fristen und notwendige Reaktionen fallbezogen im Blick behalten.'],
      ['📤','Ausgabe & Freigabe','PDF und Word vorbereiten, Vorschau prüfen und erst nach Freigabe weitergeben.']
    ]
  },
  en:{
    eyebrow:'AS Workspace · Version 131',
    title:'Describe the case. AS Workspace shows what matters next.',
    lead:'From the first document to the next action: one clear workflow instead of many separate tools.',
    cta:'Start a case',
    explainer:'▶ View short explanation',
    journey:[
      ['1','Do now','Describe the case or upload documents. AS Workspace organises the matter automatically.'],
      ['2','See status','Traffic lights, missing information, deadlines and risks are visible at a glance.'],
      ['3','Continue','Letters, translations, legal comparisons and exports are prepared in the case context.']
    ],
    features:[
      ['📄','Documents & photos','Recognise, structure and assign files to the correct case.'],
      ['🌍','Languages & countries','Control interface and output languages independently and create bilingual results.'],
      ['⚖️','Legal comparison','Compare relevant jurisdictions and target countries for the individual case clearly.'],
      ['🚦','Traffic-light analysis','Make risks, evidence, missing information and next steps immediately visible.'],
      ['⏱️','Deadlines & progress','Keep unresolved deadlines and required reactions visible by case.'],
      ['📤','Export & approval','Prepare PDF and Word outputs, review the preview and continue only after approval.']
    ]
  }
}

const uxStyles=`
.heroV131{padding:72px 0 58px}.heroV131 .heroLayout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr);gap:46px;align-items:center}.heroV131 h1{max-width:860px;font-size:clamp(38px,6vw,68px);letter-spacing:-.035em}.heroPrimaryActions{margin-top:24px}.heroMainCta{min-width:180px;padding:13px 20px}.heroStatusCard{background:#fff;border:1px solid #e3e5e9;border-radius:20px;padding:24px;box-shadow:0 18px 45px #11182712}.heroStatusCard ol{margin:18px 0 0;padding-left:22px;display:grid;gap:12px;line-height:1.5}.heroMore{margin-top:18px;max-width:760px;border-top:1px solid #e7e0d1;padding-top:14px}.heroMore summary{cursor:pointer;font-weight:750;color:#6b5420}.heroMore[open] summary{margin-bottom:14px}.v131Journey{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:-22px;position:relative;z-index:2}.journeyCard{background:#fff;border:1px solid #e3e5e9;border-radius:18px;padding:20px;display:grid;grid-template-columns:38px 1fr;gap:12px;box-shadow:0 10px 30px #1118270d}.journeyNumber{width:34px;height:34px;border-radius:999px;background:#8f6e25;color:#fff;display:grid;place-items:center;font-weight:850}.journeyCard h2{font-size:18px;margin:2px 0 7px}.journeyCard p{margin:0;color:#65707d;line-height:1.48}.v131FeatureSection{padding:64px 0 52px}.v131FeatureSection>h2{font-size:clamp(28px,4vw,42px);max-width:760px;margin:10px 0 26px}.featureGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.featureCard{background:#fff;border:1px solid #e3e5e9;border-radius:18px;padding:20px;min-height:180px}.featureCard h3{margin:12px 0 8px;font-size:18px}.featureCard p{margin:0;color:#65707d;line-height:1.5}.featureIcon{font-size:26px}.freeHint{margin-top:12px}.testerSafeLink{display:inline-block;margin-top:14px}
@media(max-width:900px){.heroV131 .heroLayout{grid-template-columns:1fr}.heroStatusCard{max-width:620px}.v131Journey,.featureGrid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.heroV131{padding-top:48px}.heroV131 h1{font-size:40px}.heroPrimaryActions{display:grid}.heroPrimaryActions .btn{width:100%;text-align:center}.v131Journey,.featureGrid{grid-template-columns:1fr}.v131Journey{margin-top:-10px}.journeyCard,.featureCard{min-height:0}.v131FeatureSection{padding-top:48px}}
`

export function PublicLanding({t,a,payment,paymentConfig,language,setLanguage,outputLanguage,setOutputLanguage,setScreen,cd,testerLinkText,pa,activePublicCase,setSelectedPublicCase,tt,jl,localizedPlans,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,recommendedTier,eur,period,terms,monthsLabel}){
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
    <style>{uxStyles}</style>
    <PublicHeader t={t} caseNavLabel={cd.nav} language={language} onLanguageChange={setLanguage} outputLanguage={outputLanguage} onOutputLanguageChange={setOutputLanguage} onScreenChange={setScreen} onPlayExplainer={()=>setExplainerSignal(value=>value+1)}/>
    <button className="publicPageBackButton" data-persistent-back type="button" onClick={returnToPublicStart} aria-label={backCopy.aria}>{backCopy.label}</button>
    <main>
      <div className="legalMarketBar"><div className="wrap"><b>{t.legal}</b><span>{t.marketNote}</span><strong className="legalChip" data-output-language-status aria-live="polite">{t.outputLanguage}: {outputLanguageLabel}</strong></div></div>

      <section className="hero heroV131">
        <div className="wrap heroLayout">
          <div>
            <div className="eyebrow">{v131.eyebrow}</div>
            <h1>{v131.title}</h1>
            <p className="lead">{v131.lead}</p>
            <div className="actions heroPrimaryActions">
              <button className="primary btn heroMainCta" onClick={()=>setScreen('register')}>{v131.cta}</button>
              <button className="secondary btn" onClick={()=>setExplainerSignal(value=>value+1)}>{v131.explainer}</button>
            </div>
            <p className="freeHint">✓ {cd.freeHint}</p>
            <details className="heroMore"><summary>{language==='de'?'Weitere Möglichkeiten ansehen':'View more options'}</summary><ProductIntroCompact language={language}/><ProblemNavigator outputLanguage={outputLanguage} language={language} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/><a className="testerSafeLink" href={language==='de'?'/testen':`/testen?lang=${language}`}>{testerLinkText[language]||testerLinkText.de} →</a></details>
            <ExplainerVideo key={language} language={language} openSignal={explainerSignal}/>
          </div>
          <aside className="heroOutcome heroStatusCard" aria-label={cd.result}>
            <span className="modeBadge">{language==='de'?'Ihr Ergebnis':'Your result'}</span>
            <ol>{cd.results.slice(0,3).map(item=><li key={item}>{item}</li>)}</ol>
          </aside>
        </div>
      </section>

      <section className="wrap v131Journey" aria-label={language==='de'?'So funktioniert AS Workspace':'How AS Workspace works'}>
        {v131.journey.map(([step,title,body])=><article className="journeyCard" key={step}><span className="journeyNumber">{step}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}
      </section>

      <section className="wrap" id="v131-funktionen" aria-labelledby="v131-title">
        <div className="v131FeatureSection">
          <div className="eyebrow">{language==='de'?'Weitere Möglichkeiten':'More capabilities'}</div>
          <h2 id="v131-title">{language==='de'?'Alles bleibt verfügbar – aber erst, wenn Sie es brauchen.':'Everything stays available — when you need it.'}</h2>
          <div className="featureGrid">
            {v131.features.map(([icon,title,body])=><article className="featureCard" key={title}><div className="featureIcon" aria-hidden="true">{icon}</div><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <PublicCaseDiscoverySection cd={cd} pa={pa} audience={audience} orderedPublicCases={orderedPublicCases} activePublicCase={activePublicCase} onSelectCase={setSelectedPublicCase} onRegister={()=>setScreen('register')}/>
      <PublicTrustSections tt={tt} cd={cd} a={a}/>
      <PublicPricingSection a={a} payment={payment} paymentConfig={paymentConfig} jl={jl} localizedPlans={localizedPlans} rt={rt} selectedGoal={selectedGoal} onGoalChange={value=>{setSelectedGoal(value);setShowRecommendation(true)}} showRecommendation={showRecommendation} recommendedPlan={recommendedPlan} recommendedTier={recommendedTier} eur={eur} period={period} terms={terms} monthsLabel={monthsLabel} onRegister={()=>setScreen('register')}/>
    </main>
    <LegalFooter language={language}/>
  </>
}
