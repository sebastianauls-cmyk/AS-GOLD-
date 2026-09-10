import { getTeamAccountCopy } from './teamAccountConfig.mjs'

export function TeamAccountSettingsCard({language,onOpenChangeControl}){
  const copy=getTeamAccountCopy(language)
  return <div>
    <b>{copy.settingsTitle}</b>
    <p>{copy.settingsLead}</p>
    <button type="button" className="secondary controlAction" onClick={onOpenChangeControl}>{copy.settingsAction}</button>
  </div>
}
