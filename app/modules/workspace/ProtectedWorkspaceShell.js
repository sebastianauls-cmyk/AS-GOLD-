'use client'

import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { CountrySwitcher } from '../country/CountrySwitcher'
import { useCountryContext } from '../country/useCountryContext'
import { LegalFooter } from '../compliance/LegalFooter'
import { ProductBrand } from '../brand/ProductBrand'
import { ContextEvidenceInjector } from '../intelligence/ContextEvidenceInjector'

export function ProtectedWorkspaceShell({language,outputLanguage,onLanguageChange,onOutputLanguageChange,legalLabel,languageLabel,outputLanguageLabel,logoutLabel,onLogout,message,deadlineCopy,deadlineCount=0,unresolvedDeadlineCount=0,onOpenDeadlines,children}){
  const {countryContext,setCountryContext}=useCountryContext()
  return <>
    <header className="appTop"><ProductBrand/><div className="appHeaderTools"><span className="legalChip">{legalLabel}</span><LanguageSwitcher value={language} onChange={onLanguageChange} label={languageLabel} showLabel/><LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={outputLanguageLabel} showLabel/><CountrySwitcher value={countryContext} onChange={setCountryContext} label="Land / Rechtsraum"/><button className="secondary" onClick={onLogout}>{logoutLabel}</button></div></header>
    <main className="appMain">{message&&<div className="note">{message}</div>}{children}</main>
    {deadlineCopy&&onOpenDeadlines&&<button className={`persistentDeadlineButton ${unresolvedDeadlineCount?'hasUnresolved':''}`} type="button" onClick={onOpenDeadlines} aria-label={`${deadlineCopy.title}: ${deadlineCount} ${deadlineCopy.datedShort}, ${unresolvedDeadlineCount} ${deadlineCopy.unresolvedShort}`}><span aria-hidden="true">◷</span><span><b>{deadlineCopy.button}</b><small>{deadlineCount} {deadlineCopy.datedShort} · {unresolvedDeadlineCount} {deadlineCopy.unresolvedShort}</small></span></button>}
    <ContextEvidenceInjector language={language} countryCode={countryContext}/>
    <LegalFooter language={language}/>
  </>
}
