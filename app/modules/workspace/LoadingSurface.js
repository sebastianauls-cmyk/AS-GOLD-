import { LegalFooter } from '../compliance/LegalFooter'
import { ProductBrand } from '../brand/ProductBrand'

export function LoadingSurface({language,checking}){
  return <><main className="center"><section className="card"><ProductBrand showDescriptor language={language}/><p>{checking}</p></section></main><LegalFooter language={language}/></>
}
