// ASH Workspace Gold is operated on the German business day. The edge runtime
// is UTC, so ISO slicing would still report yesterday during the first hours
// after local midnight and could misclassify date-based urgency.
export function caseReviewDate(now=Date.now()){
  const instant=now instanceof Date?now:new Date(now)
  if(!Number.isFinite(instant.getTime()))throw new TypeError('Invalid review instant')
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(instant).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
