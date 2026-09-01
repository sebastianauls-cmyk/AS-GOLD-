'use client'

export function PublicTrustSections({tt,cd,a}){
  return <>
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
  </>
}
