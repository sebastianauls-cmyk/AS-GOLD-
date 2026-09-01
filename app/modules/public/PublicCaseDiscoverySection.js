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
      <section id="asgold-user-audience" style={{margin:'0 0 34px',padding:'24px',border:'1px solid #e2d6b7',borderRadius:'20px',background:'linear-gradient(135deg,#fffaf0,#fff)'}}>
        <h2 style={{margin:'8px 0 8px',fontSize:'clamp(1.7rem,5vw,2.5rem)'}}>{audience.title}</h2><p style={{margin:'0 0 18px',color:'#5f6976',lineHeight:1.5}}>{audience.lead}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'12px'}}>{audience.items.map(([title,text])=><article key={title} style={{background:'#fff',border:'1px solid #e3e5e9',borderRadius:'14px',padding:'16px'}}><b style={{display:'block',marginBottom:'7px',color:'#5e4818'}}>{title}</b><span style={{color:'#626c78',lineHeight:1.45}}>{text}</span></article>)}</div>
      </section>
      <div className="audienceStrip" aria-label={pa.label}><b>{pa.label}</b><div>{pa.items.map(item=><span key={item}>✓ {item}</span>)}</div></div>
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

      <div className="processBlock">
        <h3>{cd.stepsTitle}</h3>
        <div className="processSteps">{cd.steps.map(([number,title,description])=><article key={number}><span>{number}</span><div><b>{title}</b><p>{description}</p></div></article>)}</div>
      </div>
    </div>
  </section>
}
