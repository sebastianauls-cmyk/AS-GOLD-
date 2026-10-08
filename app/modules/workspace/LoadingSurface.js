import { LegalFooter } from '../compliance/LegalFooter'
import { ProductBrand } from '../brand/ProductBrand'

export function LoadingSurface({language,checking,retryLabel,onRetry}){
  return <><main className="center"><section className="card"><ProductBrand showDescriptor language={language}/><p role={onRetry?'alert':'status'}>{checking}</p>{onRetry&&<button className="primary full" type="button" onClick={onRetry}>{retryLabel}</button>}</section></main><LegalFooter language={language}/></>
}
