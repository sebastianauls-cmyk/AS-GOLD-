'use client'

export function PublicPricingSection({
  a,
  payment,
  paymentConfig,
  jl,
  localizedPlans,
  rt,
  selectedGoal,
  onGoalChange,
  showRecommendation,
  recommendedPlan,
  recommendedTier,
  eur,
  period,
  terms,
  monthsLabel,
  onRegister
}){
  return <section id="preise" className="section alt">
    <div className="wrap">
      <div className="eyebrow">{a.pricingEyebrow}</div><h2>{a.pricingTitle}</h2><p className="lead pricingLead">{a.pricingLead}</p>
      <div className="levelGuide"><div><h3>{jl.choose}</h3><p>{jl.chooseLead}</p></div><div className="levelScale"><span>{jl.less}</span><div className="levelTrack">{localizedPlans.map(p=><a key={p.key} href={`#plan-${p.key}`} title={p.stage}>{p.level}</a>)}</div><span>{jl.more}</span></div></div>
      <div className="publicRecommendation"><div><h3>{rt.title}</h3><p>{rt.lead}</p></div><select className="goalSelect" value={selectedGoal} onChange={event=>onGoalChange(event.target.value)}><option value="" disabled>{rt.chooseGoal}</option>{rt.goals.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>{showRecommendation&&<div className="recommendationResult"><div><span className="tierBadge">{rt.recommended}</span><b>{recommendedPlan.stage} · {recommendedPlan.name}</b><p>{recommendedTier==='free'?rt.freeNote:recommendedPlan.expectation}</p></div><a className="secondary btn" href={`#plan-${recommendedTier}`}>{rt.showBenefit}</a></div>}</div>
      <div className="prices">{localizedPlans.map(p=><article id={`plan-${p.key}`} className={`priceCard tier-${p.level}`} key={p.name}><div className="tierBadge">{p.stage}</div><h3 className="tierHeadline">{p.headline}</h3><div className="priceHead"><span>{p.name}</span><strong>{eur(p.price)}<small>{p.key==='free'?period.once:period.d30}</small></strong></div><div className="journeyBox"><div><b>{jl.knowledge}</b><p>{p.knowledge}</p></div><div><b>{jl.expectation}</b><p>{p.expectation}</p></div></div><p className="planAudience"><b>{a.suitable}</b> {p.audience}</p><div className="planDetail"><b>{a.whatDone}</b><p>{p.checks}</p></div><div className="planDetail"><b>{a.yourResult}</b><p>{p.result}</p></div><div className="planDetail excluded"><b>{a.notIncluded}</b><p>{p.excluded}</p></div><button className="secondary btn full" onClick={onRegister}>{p.key==='free'?a.registerFree:a.testRegister}</button></article>)}</div>
      <div className="termPublic"><h3>{a.longTerms}</h3><div className="publicTermGrid">{terms.map(term=><div className="publicTerm" key={term.months}><b>{monthsLabel(term.months)}</b><span>{term.discount?a.discount.replace('{discount}',term.discount):a.noDiscount}</span></div>)}</div><p>{a.termInfo}</p></div>
      <div className="priceTransparency"><h3>{a.noSubscription}</h3><p>{a.renewInfo}</p><p>{a.upgradeFair}</p><p>{a.pauseInfo}</p><p className="testNotice"><b>{paymentConfig?.enabled?payment.testModeBadge:a.currentTest}</b> {paymentConfig?.enabled?payment.testModeInfo:payment.unavailable}</p></div>
    </div>
  </section>
}
