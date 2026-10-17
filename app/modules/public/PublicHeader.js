'use client'

import { ProductBrand } from '../brand/ProductBrand'
import { PublicLanguageModules } from './PublicLanguageModules'
import { publicNavigationCopy, workspaceEntryHref } from './publicNavigation.mjs'

export function PublicHeader({
  t,
  c,
  caseNavLabel,
  language,
  onLanguageChange,
  outputLanguage,
  onOutputLanguageChange,
  onScreenChange,
  onPlayExplainer,
  hasWorkspaceSession=false
}){
  return <header className="publicTop">
    <div className="wrap nav publicHeader">
      <ProductBrand showDescriptor className="publicBrand" language={language}/>
      {hasWorkspaceSession
        ?<a className="secondary btn publicSignIn" href={workspaceEntryHref(language)}>{publicNavigationCopy(language).workspace}</a>
        :<button type="button" className="secondary publicSignIn" onClick={()=>onScreenChange('login')}>{t.login}</button>}
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
