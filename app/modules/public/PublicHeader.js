'use client'

import { ProductBrand } from '../brand/ProductBrand'
import { PublicLanguageModules } from './PublicLanguageModules'

export function PublicHeader({
  t,
  c,
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
      <ProductBrand showDescriptor className="publicBrand" language={language}/>
      <nav className="publicActions publicNavActions" aria-label={c.features}>
        <a href="#funktionen">{c.features}</a>
        <a href="#ablauf">{c.how}</a>
        <a href="#fallarten">{caseNavLabel}</a>
        <a href="#preise">{t.prices}</a>
      </nav>
      <button type="button" className="secondary publicSignIn" onClick={()=>onScreenChange('login')}>{t.login}</button>
      <PublicLanguageModules
        compact
        language={language}
        onLanguageChange={onLanguageChange}
        outputLanguage={outputLanguage}
        onOutputLanguageChange={onOutputLanguageChange}
        onPlayExplainer={onPlayExplainer}
      />
    </div>
  </header>
}
