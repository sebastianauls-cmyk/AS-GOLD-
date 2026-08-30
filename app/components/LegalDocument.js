import { LegalFooter } from './LegalFooter'

export function LegalSection({title,children,id}){
  return <section className="legalSection" id={id}><h2>{title}</h2>{children}</section>
}

export function LegalNotice({children,tone='info'}){
  return <div className={`legalNotice legalNotice-${tone}`}>{children}</div>
}

export function LegalDocument({eyebrow='AS Gold · Rechtliches',title,intro,children,updated='30. August 2026'}){
  return <div className="legalSite">
    <header className="legalHeader"><div className="wrap legalHeaderInner"><a className="brand legalHome" href="/"><span className="logo">AS</span><b>AS Gold</b></a><a className="secondary btn" href="/">Zur App</a></div></header>
    <main className="legalMain wrap">
      <div className="legalTitle"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{intro&&<p className="lead">{intro}</p>}<p className="legalUpdated">Stand: {updated} · Verbindliche Fassung: Deutsch</p></div>
      <div className="legalBody">{children}</div>
    </main>
    <LegalFooter language="de"/>
  </div>
}
