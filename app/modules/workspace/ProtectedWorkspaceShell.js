import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { LegalFooter } from '../compliance/LegalFooter'
import { AppLogo } from './AppLogo'

export function ProtectedWorkspaceShell({language,outputLanguage,onLanguageChange,onOutputLanguageChange,legalLabel,languageLabel,outputLanguageLabel,logoutLabel,onLogout,message,children}){
  return <>
    <header className="appTop"><div className="brand"><AppLogo/><b>AS Gold</b></div><div className="appHeaderTools"><span className="legalChip">{legalLabel}</span><LanguageSwitcher value={language} onChange={onLanguageChange} label={languageLabel} showLabel/><LanguageSwitcher value={outputLanguage} onChange={onOutputLanguageChange} label={outputLanguageLabel} showLabel/><button className="secondary" onClick={onLogout}>{logoutLabel}</button></div></header>
    <main className="appMain">{message&&<div className="note">{message}</div>}{children}</main>
    <LegalFooter language={language}/>
  </>
}
