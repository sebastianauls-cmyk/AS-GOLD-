import { LegalFooter } from '../compliance/LegalFooter'
import { AppLogo } from './AppLogo'

export function LoadingSurface({language,checking}){
  return <><main className="center"><section className="card"><AppLogo/><h1>AS Gold</h1><p>{checking}</p></section></main><LegalFooter language={language}/></>
}
