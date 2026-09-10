import { getTeamAccountCopy } from './teamAccountConfig.mjs'

export function TeamAccountLoginNotice({language}){
  const copy=getTeamAccountCopy(language)
  return <div className="teamLoginNotice">
    <span>{copy.badge}</span>
    <p>{copy.lead}</p>
    <strong>✓ {copy.rights}</strong>
    <small>{copy.approvalRule}</small>
  </div>
}
