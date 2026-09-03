'use client'

import { ProductBrand } from '../brand/ProductBrand'
import { PublicLanguageModules } from './PublicLanguageModules'
import { InstallAppButton } from './InstallAppButton'

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
      <ProductBrand showDescriptor className="publicBrand" language={language}/>
      <nav className="publicActions publicNavActions">
        <a href="#fallarten">{caseNavLabel}</a>
        <a href="#preise">{t.prices}</a>
        <InstallAppButton language={language}/>
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
