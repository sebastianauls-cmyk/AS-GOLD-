'use client'

import { AppLogo } from '../workspace/AppLogo'
import { PublicLanguageModules } from './PublicLanguageModules'

export function PublicHeader({
  t,
  caseNavLabel,
  language,
  onLanguageChange,
  outputLanguage,
  onOutputLanguageChange,
  onScreenChange,
  onPlayExplainer
}){
  return <header className="publicTop">
    <div className="wrap nav publicHeader">
      <div className="brand publicBrand"><AppLogo/><b>AS Gold</b></div>
      <nav className="publicActions publicNavActions">
        <a href="#fallarten">{caseNavLabel}</a>
        <a href="#preise">{t.prices}</a>
        <button className="secondary" onClick={()=>onScreenChange('register')}>{t.register}</button>
        <button className="primary" onClick={()=>onScreenChange('login')}>{t.login}</button>
      </nav>
      <PublicLanguageModules
        language={language}
        onLanguageChange={onLanguageChange}
        outputLanguage={outputLanguage}
        onOutputLanguageChange={onOutputLanguageChange}
        onPlayExplainer={onPlayExplainer}
      />
    </div>
  </header>
}
