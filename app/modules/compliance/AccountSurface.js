import { AccountControlPanel } from './AccountControlPanel'

export function AccountSurface({a,onBack,...accountProps}){
  return <>
    <div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button></div>
    <AccountControlPanel {...accountProps}/>
  </>
}
