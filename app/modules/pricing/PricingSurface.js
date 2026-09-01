import { UpgradePanel } from './UpgradePanel'

export function PricingSurface({a,onBack,...upgradeProps}){
  return <>
    <div className="sectionHead"><button className="backBtn" onClick={onBack}>{a.backOverview}</button><h2>{a.upgrade}</h2></div>
    <UpgradePanel a={a} {...upgradeProps}/>
  </>
}
