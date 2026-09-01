'use client'

import { useState } from 'react'
import { LegalFooter } from '../compliance/LegalFooter'
import { AppLogo } from '../workspace/AppLogo'
import { heroTitleCopy } from './HeroTitleStabilizer'
import { audienceCopy } from './HeroCopyEnhancer'
import { jumpToPublicCaseResult } from './caseNavigation'
import { orderCasesByResearch } from './casePriorityV56.mjs'
import { getProblemLanguageProfile } from './problemNavigatorLanguagesV36.mjs'
import { V37FirstAction } from './V37FirstAction'
import { ProblemNavigator } from './ProblemNavigator'
import { ExplainerVideo } from './ExplainerVideo'
import { ProductIntroCompact } from './ProductIntroCompact'
import { PublicLanguageModules } from './PublicLanguageModules'

export function PublicLanding({t,a,language,setLanguage,outputLanguage,setOutputLanguage,setScreen,cd,testerLinkText,pa,activePublicCase,setSelectedPublicCase,tt,jl,localizedPlans,rt,selectedGoal,setSelectedGoal,setShowRecommendation,showRecommendation,recommendedPlan,recommendedTier,eur,period,terms,monthsLabel}){
  const hero=heroTitleCopy[language]||heroTitleCopy.de
  const audience=audienceCopy[language]||audienceCopy.de
  const outputLanguageLabel=({de:'Deutsch',en:'English',fr:'Français',tr:'Türkçe',pl:'Polski',ru:'Русский',ar:'العربية',fa:'فارسی',ro:'Română',bg:'Български'})[outputLanguage]||'Deutsch'
  const orderedPublicCases=orderCasesByResearch(cd.cases)
  const problemUi=getProblemLanguageProfile(outputLanguage).ui
  const [explainerSignal,setExplainerSignal]=useState(0)

  function startProblemVoice(){
    const microphone=document.querySelector('#asgold-problem-navigator-react [data-problem-voice]')
    if(!microphone)return
    microphone.scrollIntoView({behavior:'smooth',block:'center'})
    setTimeout(()=>microphone.click(),350)
  }

  const customerModule=<ProblemNavigator outputLanguage={outputLanguage} onRegister={()=>setScreen('register')} onSelectCase={setSelectedPublicCase}/>

  return <>
    <header className="publicTop">
      <div className="wrap nav publicHeader">
        <div className="brand publicBrand"><AppLogo/><b>AS Gold</b></div>
        <nav className="publicActions publicNavActions">
          <a href="#fallarten">{cd.nav}</a>
          <a href="#preise">{t.prices}</a>
          <button className="secondary" onClick={()=>setScreen('register')}>{t.register}</button>
          <button className="primary" onClick={()=>setScreen('login')}>{t.login}</button>
        </nav>
        <PublicLanguageModules language={language} onLanguageChange={setLanguage} outputLanguage={outputLanguage} onOutputLanguageChange={setOutputLanguage} onPlayExplainer={()=>setExplainerSignal(value=>value+1)} customerModule={customerModule}/>
      </div>
    </header>
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
            <V37FirstAction language={language} onRegister={()=>setScreen('register')}/>
            <button type="button" className="secondary heroVoiceShortcut" aria-controls="asgold-problem-navigator-react" onClick={startProblemVoice}>🎙 {problemUi.voice}</button>
            <ExplainerVideo key={`${language}-${explainerSignal}`} language={language} openSignal={explainerSignal}/>
            <ProductIntroCompact language={language}/>
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

      <section id="fallarten" className="caseDiscovery section">
        <div className="wrap">
          <div className="caseIntro"><div className="eyebrow">{cd.eyebrow}</div><h2>{cd.title}</h2><p className="lead">{cd.lead}</p></div>
          <section id="asgold-user-audience" style={{margin:'0 0 34px',padding:'24px',border:'1px solid #e2d6b7',borderRadius:'20px',background:'linear-gradient(135deg,#fffaf0,#fff)'}}>
            <div className="eyebrow">{audience.title}</div><h2 style={{margin:'8px 0 8px',fontSize:'clamp(1.7rem,5vw,2.5rem)'}}>{audience.title}</h2><p style={{margin:'0 0 18px',color:'#5f6976',lineHeight:1.5}}>{audience.lead}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'12px'}}>{audience.items.map(([title,text])=><article key={title} style={{background:'#fff',border:'1px solid #e3e5e9',borderRadius:'14px',padding:'16px'}}><b style={{display:'block',marginBottom:'7px',color:'#5e4818'}}>{title}</b><span style={{color:'#626c78',lineHeight:1.45}}>{text}</span></article>)}</div>
          </section>
          <div className="audienceStrip" aria-label={pa.label}><b>{pa.label}</b><div>{pa.items.map(item=><span key={item}>✓ {item}</span>)}</div></div>
          <div className="caseChooser" aria-label={cd.title}>
            {orderedPublicCases.map((item,index)=><button type="button" aria-pressed={activePublicCase.key===item.key} className={`caseChoice ${activePublicCase.key===item.key?'active':''}`} onClick={()=>{setSelectedPublicCase(item.key);jumpToPublicCaseResult()}} key={item.key}><span>{String(index+1).padStart(2,'0')}</span><b>{item.title}</b><small>{item.short}</small></button>)}
          </div>
          <article id="asgold-public-case-result" className="caseResult" aria-live="polite">
            <div className="caseResultTitle"><span>{String(orderedPublicCases.findIndex(item=>item.key===activePublicCase.key)+1).padStart(2,'0')}</span><div><small>{cd.typical}</small><h3>{activePublicCase.title}</h3></div></div>
            <div className="caseResultGrid">
              <div><b>{cd.typical}</b><p>{activePublicCase.examples}</p></div>
              <div><b>{cd.support}</b><p>{activePublicCase.help}</p></div>
              <div className="caseDeliverables"><b>{cd.result}</b><ul>{cd.results.map(item=><li key={item}>✓ {item}</li>)}</ul></div>
            </div>
            <button className="primary btn" onClick={()=>setScreen('register')}>{cd.start}</button>
            <p className="scopeNote">{pa.scope}</p>
          </article>

          <div className="processBlock">
            <h3>{cd.stepsTitle}</h3>
            <div className="processSteps">{cd.steps.map(([number,title,description])=><article key={number}><span>{number}</span><div><b>{title}</b><p>{description}</p></div></article>)}</div>
          </div>
        </div>
      </section>

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
    <LegalFooter language={language}/>
  </>
}
