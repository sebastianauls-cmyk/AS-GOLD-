import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { CountrySwitcher } from '../country/CountrySwitcher'
import { LegalFooter } from '../compliance/LegalFooter'
import { ProductBrand } from '../brand/ProductBrand'

export function ProtectedWorkspaceShell({language,outputLanguage,countryContext,onLanguageChange,onOutputLanguageChange,onCountryContextChange,legalLabel,languageLabel,outputLanguageLabel,countryContextLabel='Land / Rechtsraum',logoutLabel,onLogout,message,children}){
  return <>
    <header className="appTop"><ProductBrand/><div className="appHeaderTools"><span className="legalChip">{legalLabel}</span><LanguageSwitcher value={language} onChange={onLanguageChange} label={languageLabel} showLabel/><LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={outputLanguageLabel} showLabel/><CountrySwitcher value={countryContext} onChange={onCountryContextChange} label={countryContextLabel}/><button className="secondary" onClick={onLogout}>{logoutLabel}</button></div></header>
    <main className="appMain">{message&&<div className="note">{message}</div>}{children}</main>
    <LegalFooter language={language}/>
  </>
}
