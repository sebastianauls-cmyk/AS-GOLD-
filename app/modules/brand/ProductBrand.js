import { AppLogo } from '../workspace/AppLogo'
import { PRODUCT_BRAND, productDescriptor } from './productBrand.mjs'

export function ProductBrand({showDescriptor=false,className='',language='de'}){
  return <div className={`brand brandLockup ${className}`.trim()} aria-label={PRODUCT_BRAND.name}>
    <AppLogo/>
    <span className="brandCopy">
      <span className="brandName" aria-hidden="true">
        <strong>{PRODUCT_BRAND.workspace}</strong>
        <span className="brandEdition">{PRODUCT_BRAND.edition}</span>
      </span>
      {showDescriptor&&<span className="brandDescriptor">{productDescriptor(language)}</span>}
    </span>
  </div>
}
