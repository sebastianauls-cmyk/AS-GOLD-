'use client'

import { jumpToPublicCaseResult } from './caseNavigation'

export function PublicCaseDiscoverySection({
  cd,
  pa,
  audience,
  orderedPublicCases,
  activePublicCase,
  onSelectCase,
  onRegister
}){
  return <section id="fallarten" className="caseDiscovery section">
    <div className="wrap">
      <div className="caseIntro"><div className="eyebrow">{cd.eyebrow}</div><h2>{cd.title}</h2><p className="lead">{cd.lead}</p></div>
      <div className="caseChooser" aria-label={cd.title}>
        {orderedPublicCases.map((item,index)=><button type="button" aria-pressed={activePublicCase.key===item.key} className={`caseChoice ${activePublicCase.key===item.key?'active':''}`} onClick={()=>{onSelectCase(item.key);jumpToPublicCaseResult()}} key={item.key}><span>{String(index+1).padStart(2,'0')}</span><b>{item.title}</b><small>{item.short}</small></button>)}
      </div>
      <article id="asgold-public-case-result" className="caseResult" aria-live="polite">
        <div className="caseResultTitle"><span>{String(orderedPublicCases.findIndex(item=>item.key===activePublicCase.key)+1).padStart(2,'0')}</span><div><small>{cd.typical}</small><h3>{activePublicCase.title}</h3></div></div>
        <div className="caseResultGrid">
          <div><b>{cd.typical}</b><p>{activePublicCase.examples}</p></div>
          <div><b>{cd.support}</b><p>{activePublicCase.help}</p></div>
          <div className="caseDeliverables"><b>{cd.result}</b><ul>{cd.results.map(item=><li key={item}>✓ {item}</li>)}</ul></div>
        </div>
        <button className="primary btn" onClick={onRegister}>{cd.start}</button>
        <p className="scopeNote">{pa.scope}</p>
      </article>

      <details id="asgold-user-audience" className="publicAudience"><summary>{audience.title}</summary><p>{audience.lead}</p><div className="publicAudienceGrid">{audience.items.map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></details>
    </div>
  </section>
}
