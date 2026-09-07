import { AccountControlPanel } from './AccountControlPanel'

export function AccountSurface({a,onBack,...accountProps}){
  return <>
    <div className="sectionHead"><button className="backBtn" data-persistent-back type="button" onClick={onBack}>{a.backOverview}</button></div>
    <AccountControlPanel {...accountProps}/>
  </>
}
