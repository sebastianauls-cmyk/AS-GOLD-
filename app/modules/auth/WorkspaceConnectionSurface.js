import { ProductBrand } from '../brand/ProductBrand'
import { LegalFooter } from '../compliance/LegalFooter'
import { getWorkspaceConnectionCopy } from './workspaceConnectionCopy.mjs'

export function WorkspaceConnectionSurface({language,busy,onRetry,onSignOut}){
  const copy=getWorkspaceConnectionCopy(language)
  return <><main className="center" dir={['ar','fa'].includes(language)?'rtl':'ltr'}><section className="card" aria-busy={busy}>
    <ProductBrand showDescriptor language={language}/>
    <h1>{copy.title}</h1>
    <p role="status" aria-live="polite">{busy?copy.connecting:copy.unavailable}</p>
    {!busy&&<button className="primary full" type="button" onClick={onRetry}>{copy.retry}</button>}
    <button className="linkBtn full" type="button" onClick={onSignOut}>{copy.signOut}</button>
  </section></main><LegalFooter language={language}/></>
}
