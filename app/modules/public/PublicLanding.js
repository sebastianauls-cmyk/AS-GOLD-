'use client'

import { useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'
import { heroTitleCopy } from './HeroTitleStabilizer'
import { audienceCopy } from './HeroCopyEnhancer'
import { orderCasesByResearch } from './casePriorityV56.mjs'
import { V37FirstAction } from './V37FirstAction'
import { ProblemNavigator } from './ProblemNavigator'
import { ExplainerVideo } from './ExplainerVideo'
import { ProductIntroCompact } from './ProductIntroCompact'
import { PublicHeader } from './PublicHeader'
import { PublicCaseDiscoverySection } from './PublicCaseDiscoverySection'

// Ownership map for legacy regression guards: PublicHeader owns className="publicTop" and PublicLanguageModules;
// PublicCaseDiscoverySection owns id="asgold-user-audience" and invokes jumpToPublicCaseResult().
export function PublicLanding({t,a,language,setLanguage,outputLanguage,setOutputLanguage,setScreen,cd,testerLinkText,pa,activePublicCase,setSelectedPublicCase,tt,jl,localizedPlans,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,recommendedTier,eur,period,terms,monthsLabel}){
  const hero=heroTitleCopy[outputLanguage]||heroTitleCopy.de
  const audience=audienceCopy[outputLanguage]||audienceCopy.de
  const outputLanguageLabel=({de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български'})[outputLanguage]||'Deutsch'
  const orderedPublicCases=orderCasesByResearch(cd.cases)
  const [explainerSignal,setExplainerSignal]=useState(0)
  const [problemVoiceSignal,setProblemVoiceSignal]=useState(0)
  const [problemFocusSignal,setProblemFocusSignal]=useState(0)

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
            <ProductIntroCompact language={outputLanguage}/>
            <V37FirstAction language={outputLanguage} onRegister={()=>setScreen('register')} onFocusProblem={()=>setProblemFocusSignal(value=>value+1)} onSpeakProblem={()=>setProblemVoiceSignal(value=>value+1)}/>
            <ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase} voiceSignal={problemVoiceSignal} focusSignal={problemFocusSignal}/>
            <ExplainerVideo key={`${outputLanguage}-${explainerSignal}`} language={outputLanguage} openSignal={explainerSignal}/>
            <div className="actions">
              <a className="primary btn" href="#fallarten">{cd.chooseCase}</a>
              <button className="secondary btn" onClick={()=>setScreen('register')}>{t.freeCta}</button>
            </div>
            <p className="freeHint">✓ {cd.freeHint}</p>
            <a className="testerSafeLink" href="/testen">{testerLinkText[language]||testerLinkText.de} →</a>
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

      <section className="transparencyHero">
        <div className="wrap">
          <div className="eyebrow">{tt.eyebrow}</div><h2>{tt.title}</h2><p className="lead">{tt.lead}</p>
          <details className="transparencyDetails">
            <summary>{cd.transparencyDetails}</summary>
            <div className="transparencyGrid">{tt.items.map(([h,d])=><article className="transparencyCard" key={h}><span className="checkMark">✓</span><div><h3>{h}</h3><p>{d}</p></div></article>)}</div>
          </details>
        </div>
      </section>

      <section className="section">
        <div className="wrap"><h2>{a.whatDoes}</h2><div className="capGrid">{a.caps.map(([title,description])=><article className="capCard" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></div>
      </section>

      <section id="preise" className="section alt">
        <div className="wrap">
          <div className="eyebrow">{a.pricingEyebrow}</div><h2>{a.pricingTitle}</h2><p className="lead pricingLead">{a.pricingLead}</p>
          <div className="levelGuide"><div><h3>{jl.choose}</h3><p>{jl.chooseLead}</p></div><div className="levelScale"><span>{jl.less}</span><div className="levelTrack">{localizedPlans.map(p=><a key={p.key} href={`#plan-${p.key}`} title={p.stage}>{p.level}</a>)}</div><span>{jl.more}</span></div></div>
          <div className="publicRecommendation"><div><h3>{rt.title}</h3><p>{rt.lead}</p></div><select className="goalSelect" value={selectedGoal} onChange={e=>{setSelectedGoal(e.target.value);setShowRecommendation(true)}}><option value="" disabled>{rt.chooseGoal}</option>{rt.goals.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{showRecommendation&&<div className="recommendationResult"><div><span className="tierBadge">{rt.recommended}</span><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{recommendedTier==='free'?rt.freeNote:recommendedPlan.expectation}</p></div><a className="secondary btn" href={`#plan-${recommendedTier}`}>{rt.showBenefit}</a></div>}</div>
          <div className="prices">{localizedPlans.map(p=><article id={`plan-${p.key}`} className={`priceCard tier-${p.level}`} key={p.name}><div className="tierBadge">{p.stage}</div><h3 className="tierHeadline">{p.headline}</h3><div className="priceHead"><span>{p.name}</span><strong>{eur(p.price)}<small>{p.key==='free'?period.once:period.d30}</small></strong></div><div className="journeyBox"><div><b>{jl.knowledge}</b><p>{p.knowledge}</p></div><div><b>{jl.expectation}</b><p>{p.expectation}</p></div></div><p className="planAudience"><b>{a.suitable}</b> {p.audience}</p><div className="planDetail"><b>{a.whatDone}</b><p>{p.checks}</p></div><div className="planDetail"><b>{a.yourResult}</b><p>{p.result}</p></div><div className="planDetail excluded"><b>{a.notIncluded}</b><p>{p.excluded}</p></div><button className="secondary btn full" onClick={()=>setScreen('register')}>{p.key==='free'?a.registerFree:a.testRegister}</button></article>)}</div>
          <div className="termPublic"><h3>{a.longTerms}</h3><div className="publicTermGrid">{terms.map(term=><div className="publicTerm" key={term.months}><b>{monthsLabel(term.months)}</b><span>{term.discount?a.discount.replace('{discount}',term.discount):a.noDiscount}</span></div>)}</div><p>{a.termInfo}</p></div>
          <div className="priceTransparency"><h3>{a.noSubscription}</h3><p>{a.renewInfo}</p><p>{a.upgradeFair}</p><p>{a.pauseInfo}</p><p className="testNotice"><b>{a.currentTest}</b> {a.currentTestInfo}</p></div>
        </div>
      </section>
    </main>
    <LegalFooter language={outputLanguage}/>
  </>
}
