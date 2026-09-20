'use client'

import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { CountrySwitcher } from '../country/CountrySwitcher'
import { useCountryContext } from '../country/useCountryContext'
import { LegalFooter } from '../compliance/LegalFooter'
import { ProductBrand } from '../brand/ProductBrand'
import { deadlineCandidateCopy } from '../cases/lib/deadlineCandidates.mjs'
import { countrySwitcherLabel } from '../country/countryLabels.mjs'
import { ContextEvidenceInjector } from '../intelligence/ContextEvidenceInjector'
import { workspaceOverviewCopy } from './workspaceOverviewCopy.mjs'
import { COUNTRY_CATALOG } from '../country/countryRegistry.mjs'
import { publicSummaryCopy } from '../public/publicSummaryCopy.mjs'

export function ProtectedWorkspaceShell({language,outputLanguage,onLanguageChange,onOutputLanguageChange,legalLabel,languageLabel,outputLanguageLabel,logoutLabel,onLogout,message,deadlineCopy,deadlineCount=0,detectedDeadlineCount=0,unresolvedDeadlineCount=0,onOpenDeadlines,children}){
  const {countryContext,setCountryContext}=useCountryContext()
  const ux=workspaceOverviewCopy(language)
  const activeCountry=COUNTRY_CATALOG.find(item=>item.key===countryContext)
  return <>
    <header className="appTop compactWorkspaceHeader">
      <div className="workspaceHeaderBrand"><ProductBrand/><span className="workspaceLegalContext">{countrySwitcherLabel(language)}: {activeCountry?.flag} {activeCountry?.label||countryContext}</span></div>
      <div className="workspaceHeaderActions">
        <a className="workspaceProductLink" href={`/entdecken?lang=${language}`}>{publicSummaryCopy(language).summaryLink}</a>
        {deadlineCopy&&onOpenDeadlines&&<button className={`persistentDeadlineButton workspaceDeadlineShortcut ${unresolvedDeadlineCount?'hasUnresolved':''}`} type="button" onClick={onOpenDeadlines} aria-label={`${deadlineCopy.title}: ${deadlineCount} ${deadlineCopy.datedShort}, ${unresolvedDeadlineCount} ${deadlineCopy.unresolvedShort}`}><span aria-hidden="true">◷</span><span><b>{deadlineCopy.button}</b><small>{deadlineCount} {deadlineCopy.datedShort} · {unresolvedDeadlineCount} {deadlineCopy.unresolvedShort}{detectedDeadlineCount?` · ${detectedDeadlineCount} ${deadlineCandidateCopy(language).short}`:''}</small></span></button>}
        <details className="workspaceSettings" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus()}}}>
          <summary><span aria-hidden="true">⚙</span> {ux.settings}</summary>
          <div className="appHeaderTools workspaceSettingsPanel"><LanguageSwitcher value={language} onChange={onLanguageChange} label={languageLabel} showLabel/><LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={outputLanguageLabel} showLabel/><CountrySwitcher value={countryContext} onChange={setCountryContext} label={countrySwitcherLabel(language)}/><button className="secondary" type="button" onClick={onLogout}>{logoutLabel}</button></div>
        </details>
      </div>
    </header>
    <main className="appMain">{message&&<div className="note">{message}</div>}{children}</main>
    <ContextEvidenceInjector language={language} countryCode={countryContext}/>
    <LegalFooter language={language}/>
  </>
}
